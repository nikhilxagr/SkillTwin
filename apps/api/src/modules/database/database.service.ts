import { MongoClient, type Db } from "mongodb";
import { config } from "../../config.js";
import type {
  UserDoc,
  ResumeDoc,
  SkillProfileDoc,
  JobAnalysisDoc,
  GapAnalysisDoc,
  ResumeOptimizationDoc,
  PendingRegistrationDoc,
} from "./database.types.js";

export interface ICollection<T extends { _id: string }> {
  find(filter?: Partial<T>): Promise<T[]>;
  findOne(filter: Partial<T>): Promise<T | null>;
  insertOne(doc: T): Promise<T>;
  updateOne(filter: Partial<T>, update: Partial<T>): Promise<boolean>;
  deleteOne(filter: Partial<T>): Promise<boolean>;
  deleteMany(filter: Partial<T>): Promise<number>;
  countDocuments(filter?: Partial<T>): Promise<number>;
  clear(): Promise<void>;
}

/**
 * In-memory collection implementation that enforces MongoDB index rules
 */
export class InMemoryCollection<T extends { _id: string }> implements ICollection<T> {
  private items = new Map<string, T>();
  private uniqueKeys: (keyof T)[] = [];

  constructor(uniqueKeys: (keyof T)[] = []) {
    this.uniqueKeys = uniqueKeys;
  }

  private matches(item: T, filter: any): boolean {
    if (!filter || Object.keys(filter).length === 0) return true;

    // Check if there are nested "providers.xxx" query filters
    const providerFilterKeys = Object.keys(filter).filter((k) => k.startsWith("providers."));
    if (providerFilterKeys.length > 0) {
      const providers: any[] = (item as any).providers || [];
      const hasMatchingProvider = providers.some((p) => {
        return providerFilterKeys.every((k) => {
          const subKey = k.replace("providers.", "");
          return p && p[subKey] === filter[k];
        });
      });
      if (!hasMatchingProvider) return false;
    }

    for (const [key, value] of Object.entries(filter)) {
      if (key.startsWith("providers.")) continue;
      if ((item as any)[key] !== value) {
        return false;
      }
    }
    return true;
  }

  async find(filter?: Partial<T>): Promise<T[]> {
    if (!filter || Object.keys(filter).length === 0) {
      return Array.from(this.items.values());
    }
    return Array.from(this.items.values()).filter((item) => this.matches(item, filter));
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    for (const item of this.items.values()) {
      if (this.matches(item, filter)) {
        return { ...item };
      }
    }
    return null;
  }

  async insertOne(doc: T): Promise<T> {
    // Check unique constraints
    for (const key of this.uniqueKeys) {
      const val = doc[key];
      if (val !== undefined && val !== null) {
        for (const existing of this.items.values()) {
          if (existing[key] === val && existing._id !== doc._id) {
            const err: any = new Error(`E11000 duplicate key error collection: index on ${String(key)}`);
            err.code = 11000;
            throw err;
          }
        }
      }
    }

    this.items.set(doc._id, { ...doc });
    return { ...doc };
  }

  async updateOne(filter: Partial<T>, update: Partial<T>): Promise<boolean> {
    const existing = await this.findOne(filter);
    if (!existing) return false;

    // Check unique constraints on update
    for (const key of this.uniqueKeys) {
      const newVal = update[key];
      if (newVal !== undefined && newVal !== null && newVal !== existing[key]) {
        for (const other of this.items.values()) {
          if (other._id !== existing._id && other[key] === newVal) {
            const err: any = new Error(`E11000 duplicate key error collection: index on ${String(key)}`);
            err.code = 11000;
            throw err;
          }
        }
      }
    }

    const merged = { ...existing, ...update, updatedAt: new Date() };
    this.items.set(existing._id, merged as T);
    return true;
  }

  async deleteOne(filter: Partial<T>): Promise<boolean> {
    const existing = await this.findOne(filter);
    if (!existing) return false;
    return this.items.delete(existing._id);
  }

  async deleteMany(filter: Partial<T>): Promise<number> {
    const matches = await this.find(filter);
    let count = 0;
    for (const m of matches) {
      if (this.items.delete(m._id)) count++;
    }
    return count;
  }

  async countDocuments(filter?: Partial<T>): Promise<number> {
    if (!filter || Object.keys(filter).length === 0) return this.items.size;
    const matches = await this.find(filter);
    return matches.length;
  }

  async clear(): Promise<void> {
    this.items.clear();
  }
}

/**
 * Native MongoDB driver collection wrapper
 */
class MongoCollectionWrapper<T extends { _id: string }> implements ICollection<T> {
  private colName: string;
  private db: Db;

  constructor(db: Db, colName: string) {
    this.db = db;
    this.colName = colName;
  }

  private get col() {
    return this.db.collection<T>(this.colName);
  }

  async find(filter?: Partial<T>): Promise<T[]> {
    const mongoFilter = (filter ? { ...filter } : {}) as any;
    const results = await this.col.find(mongoFilter).toArray();
    return results as unknown as T[];
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    const mongoFilter = { ...filter } as any;
    const result = await this.col.findOne(mongoFilter);
    return (result as unknown as T) || null;
  }

  async insertOne(doc: T): Promise<T> {
    await this.col.insertOne(doc as any);
    return doc;
  }

  async updateOne(filter: Partial<T>, update: Partial<T>): Promise<boolean> {
    const res = await this.col.updateOne(filter as any, {
      $set: { ...update, updatedAt: new Date() },
    } as any);
    return res.matchedCount > 0;
  }

  async deleteOne(filter: Partial<T>): Promise<boolean> {
    const res = await this.col.deleteOne(filter as any);
    return res.deletedCount > 0;
  }

  async deleteMany(filter: Partial<T>): Promise<number> {
    const res = await this.col.deleteMany(filter as any);
    return res.deletedCount;
  }

  async countDocuments(filter?: Partial<T>): Promise<number> {
    const mongoFilter = (filter ? { ...filter } : {}) as any;
    return await this.col.countDocuments(mongoFilter);
  }

  async clear(): Promise<void> {
    await this.col.deleteMany({});
  }
}

export class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  // Collections
  public users: ICollection<UserDoc>;
  public pendingRegistrations: ICollection<PendingRegistrationDoc>;
  public resumes: ICollection<ResumeDoc>;
  public skillProfiles: ICollection<SkillProfileDoc>;
  public jobAnalyses: ICollection<JobAnalysisDoc>;
  public gapAnalyses: ICollection<GapAnalysisDoc>;
  public resumeOptimizations: ICollection<ResumeOptimizationDoc>;

  constructor() {
    // Default to in-memory collections initially with proper index constraints
    this.users = new InMemoryCollection<UserDoc>(["email"]);
    this.pendingRegistrations = new InMemoryCollection<PendingRegistrationDoc>(["email"]);
    this.resumes = new InMemoryCollection<ResumeDoc>();
    this.skillProfiles = new InMemoryCollection<SkillProfileDoc>(["userId"]);
    this.jobAnalyses = new InMemoryCollection<JobAnalysisDoc>();
    this.gapAnalyses = new InMemoryCollection<GapAnalysisDoc>();
    this.resumeOptimizations = new InMemoryCollection<ResumeOptimizationDoc>();
  }

  async initialize(): Promise<void> {
    if (!config.MONGODB_URI) {
      return;
    }

    try {
      this.client = new MongoClient(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      await this.client.connect();
      const dbName = this.client.options.dbName || "skilltwin";
      this.db = this.client.db(dbName);
      this.isConnected = true;
      console.log(`[DatabaseService] Successfully connected to MongoDB Atlas (${dbName})`);

      // Wrap collections with MongoDB collections
      this.users = new MongoCollectionWrapper<UserDoc>(this.db, "users");
      this.pendingRegistrations = new MongoCollectionWrapper<PendingRegistrationDoc>(this.db, "pendingRegistrations");
      this.resumes = new MongoCollectionWrapper<ResumeDoc>(this.db, "resumes");
      this.skillProfiles = new MongoCollectionWrapper<SkillProfileDoc>(this.db, "skillProfiles");
      this.jobAnalyses = new MongoCollectionWrapper<JobAnalysisDoc>(this.db, "jobAnalyses");
      this.gapAnalyses = new MongoCollectionWrapper<GapAnalysisDoc>(this.db, "gapAnalyses");
      this.resumeOptimizations = new MongoCollectionWrapper<ResumeOptimizationDoc>(this.db, "resumeOptimizations");

      // Ensure indexes
      await this.ensureIndexes();
    } catch (err: any) {
      console.warn(`[DatabaseService] MongoDB Atlas connection notice: ${err?.message || err}. Operating in-memory mode.`);
      this.isConnected = false;
    }
  }

  private async ensureIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // 1. User: unique email
      await this.db.collection("users").createIndex({ email: 1 }, { unique: true });
      await this.db.collection("users").createIndex({ verificationTokenHash: 1 }, { sparse: true });
      await this.db.collection("users").createIndex({ resetPasswordTokenHash: 1 }, { sparse: true });
      await this.db.collection("users").createIndex({ "providers.provider": 1, "providers.providerId": 1 }, { sparse: true });

      // 1b. Pending registrations: unique email + TTL index (auto-expire in 24 hours)
      await this.db.collection("pendingRegistrations").createIndex({ email: 1 }, { unique: true });
      await this.db.collection("pendingRegistrations").createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });

      // 2. Resume: userId + createdAt
      await this.db.collection("resumes").createIndex({ userId: 1, createdAt: -1 });

      // 3. JobAnalysis: userId + createdAt
      await this.db.collection("jobAnalyses").createIndex({ userId: 1, createdAt: -1 });

      // 4. SkillProfile: unique userId
      await this.db.collection("skillProfiles").createIndex({ userId: 1 }, { unique: true });

      // 5. GapAnalysis: userId + jobId
      await this.db.collection("gapAnalyses").createIndex({ userId: 1, jobId: 1 });

      // 6. ResumeOptimization: userId + resumeId + jobId
      await this.db.collection("resumeOptimizations").createIndex({ userId: 1, resumeId: 1, jobId: 1 });
    } catch (e) {
      // Ignore index setup warnings in restricted environments
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  async clearAll(): Promise<void> {
    await this.users.clear();
    await this.pendingRegistrations.clear();
    await this.resumes.clear();
    await this.skillProfiles.clear();
    await this.jobAnalyses.clear();
    await this.gapAnalyses.clear();
    await this.resumeOptimizations.clear();
  }
}

export const dbService = new DatabaseService();
