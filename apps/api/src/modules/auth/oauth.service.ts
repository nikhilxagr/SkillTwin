import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../../config.js";
import { dbService } from "../database/database.service.js";
import type { UserDoc, OAuthIdentityDoc, OAuthProviderType } from "../database/database.types.js";
import { createSessionJwt, toSafeUser } from "./auth.security.js";
import type { SafeUser } from "@skilltwin/contracts";

export interface NormalizedOAuthProfile {
  provider: OAuthProviderType;
  providerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl?: string;
}

export interface OAuthStatePayload {
  provider: OAuthProviderType;
  action: "login" | "link";
  userId?: string;
  nonce: string;
  timestamp: number;
}

export interface OAuthResult {
  success: boolean;
  message: string;
  user?: SafeUser;
  token?: string;
  action: "login" | "link" | "created" | "linked";
}

export class OAuthService {
  /**
   * Resolve callback URL for a given provider
   */
  getCallbackUrl(provider: OAuthProviderType): string {
    let url = "";
    if (provider === "google" && config.GOOGLE_CALLBACK_URL) {
      url = config.GOOGLE_CALLBACK_URL;
    } else if (provider === "github" && config.GITHUB_CALLBACK_URL) {
      url = config.GITHUB_CALLBACK_URL;
    } else if (provider === "linkedin" && config.LINKEDIN_CALLBACK_URL) {
      url = config.LINKEDIN_CALLBACK_URL;
    } else {
      url = `${config.API_BASE_URL}/api/auth/${provider}/callback`;
    }
    return url.trim().replace(/%20/g, "-").replace(/\s+/g, "-");
  }

  /**
   * Check if credentials are configured for a given provider
   */
  isConfigured(provider: OAuthProviderType): boolean {
    if (config.NODE_ENV === "test" || config.MOCK_OAUTH) {
      return true;
    }
    switch (provider) {
      case "google":
        return Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET);
      case "github":
        return Boolean(config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET);
      case "linkedin":
        return Boolean(config.LINKEDIN_CLIENT_ID && config.LINKEDIN_CLIENT_SECRET);
      default:
        return false;
    }
  }

  /**
   * Create a tamper-proof state parameter (signed JWT, expires in 15m)
   */
  createState(provider: OAuthProviderType, action: "login" | "link", userId?: string): string {
    const payload: OAuthStatePayload = {
      provider,
      action,
      userId,
      nonce: crypto.randomBytes(16).toString("hex"),
      timestamp: Date.now(),
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: "15m",
      algorithm: "HS256",
    });
  }

  /**
   * Verify and decode OAuth state parameter
   */
  verifyState(state: string): OAuthStatePayload {
    try {
      const decoded = jwt.verify(state, config.JWT_SECRET) as OAuthStatePayload;
      if (!decoded || !decoded.provider || !decoded.action) {
        throw new Error("Invalid OAuth state payload structure.");
      }
      return decoded;
    } catch (err: any) {
      throw new Error(`Invalid or expired OAuth state parameter: ${err?.message || "Verification failed"}`);
    }
  }

  /**
   * Build authorization URL for the requested provider
   */
  getAuthorizationUrl(provider: OAuthProviderType, action: "login" | "link", userId?: string): string {
    const state = this.createState(provider, action, userId);
    const callbackUrl = encodeURIComponent(this.getCallbackUrl(provider));

    switch (provider) {
      case "google": {
        const clientId = config.GOOGLE_CLIENT_ID;
        const scope = encodeURIComponent("openid email profile");
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${callbackUrl}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=select_account`;
      }
      case "github": {
        const clientId = config.GITHUB_CLIENT_ID;
        const scope = encodeURIComponent("read:user user:email");
        return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${callbackUrl}&scope=${scope}&state=${state}`;
      }
      case "linkedin": {
        const clientId = config.LINKEDIN_CLIENT_ID;
        const scope = encodeURIComponent("openid profile email");
        return `https://www.linkedin.com/oauth/v2/authorization?client_id=${clientId}&redirect_uri=${callbackUrl}&response_type=code&scope=${scope}&state=${state}`;
      }
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  /**
   * Exchange authorization code for user profile from Google
   */
  async fetchGoogleProfile(code: string): Promise<NormalizedOAuthProfile> {
    if ((config.NODE_ENV === "test" || config.MOCK_OAUTH) && code.startsWith("mock_")) {
      return this.generateMockProfile("google", code);
    }

    const callbackUrl = this.getCallbackUrl("google");
    const tokenParams = new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      throw new Error(`Google token exchange failed: ${errorText}`);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string; id_token?: string };
    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      throw new Error("Failed to fetch Google user profile");
    }

    const profile = (await userInfoRes.json()) as {
      sub: string;
      email: string;
      email_verified: boolean;
      name?: string;
      picture?: string;
    };

    return {
      provider: "google",
      providerId: profile.sub,
      email: (profile.email || "").toLowerCase().trim(),
      emailVerified: Boolean(profile.email_verified),
      name: profile.name || "Google User",
      avatarUrl: profile.picture || "",
    };
  }

  /**
   * Exchange authorization code for user profile from GitHub
   * NOTE: Authentication only. No repository sync or analysis in this phase.
   */
  async fetchGithubProfile(code: string): Promise<NormalizedOAuthProfile> {
    if ((config.NODE_ENV === "test" || config.MOCK_OAUTH) && code.startsWith("mock_")) {
      return this.generateMockProfile("github", code);
    }

    const callbackUrl = this.getCallbackUrl("github");
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: config.GITHUB_CLIENT_ID,
        client_secret: config.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      throw new Error(`GitHub token exchange failed: ${errorText}`);
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string };
    if (!tokenData.access_token) {
      throw new Error(`GitHub authentication error: ${tokenData.error_description || tokenData.error || "No access token"}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "SkillTwin-OAuth",
      },
    });

    if (!userRes.ok) {
      throw new Error("Failed to fetch GitHub profile details.");
    }

    const userProfile = (await userRes.json()) as {
      id: number;
      login: string;
      name?: string;
      email?: string;
      avatar_url?: string;
    };

    // Fetch verified emails from GitHub
    let email = userProfile.email || "";
    let emailVerified = false;

    try {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "SkillTwin-OAuth",
        },
      });

      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;

        const primaryVerified = emails.find((e) => e.primary && e.verified);
        const anyVerified = emails.find((e) => e.verified);

        if (primaryVerified) {
          email = primaryVerified.email;
          emailVerified = true;
        } else if (anyVerified) {
          email = anyVerified.email;
          emailVerified = true;
        } else if (emails.length > 0) {
          email = emails[0].email;
          emailVerified = Boolean(emails[0].verified);
        }
      }
    } catch {
      // Use profile email if available
    }

    if (!email) {
      email = `${userProfile.login}@users.noreply.github.com`;
    }

    return {
      provider: "github",
      providerId: String(userProfile.id),
      email: email.toLowerCase().trim(),
      emailVerified,
      name: userProfile.name || userProfile.login || "GitHub User",
      avatarUrl: userProfile.avatar_url || "",
    };
  }

  /**
   * Exchange authorization code for user profile from LinkedIn
   * NOTE: OpenID Connect authentication only. Separate from future profile data.
   */
  async fetchLinkedinProfile(code: string): Promise<NormalizedOAuthProfile> {
    if ((config.NODE_ENV === "test" || config.MOCK_OAUTH) && code.startsWith("mock_")) {
      return this.generateMockProfile("linkedin", code);
    }

    const callbackUrl = this.getCallbackUrl("linkedin");
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      client_id: config.LINKEDIN_CLIENT_ID,
      client_secret: config.LINKEDIN_CLIENT_SECRET,
    });

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      throw new Error(`LinkedIn token exchange failed: ${errorText}`);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      throw new Error("Failed to fetch LinkedIn user profile.");
    }

    const profile = (await userRes.json()) as {
      sub: string;
      name?: string;
      email?: string;
      email_verified?: boolean;
      picture?: string;
    };

    return {
      provider: "linkedin",
      providerId: profile.sub,
      email: (profile.email || "").toLowerCase().trim(),
      emailVerified: profile.email_verified !== false,
      name: profile.name || "LinkedIn User",
      avatarUrl: profile.picture || "",
    };
  }

  /**
   * Universal fetch profile dispatcher
   */
  async fetchProfile(provider: OAuthProviderType, code: string): Promise<NormalizedOAuthProfile> {
    switch (provider) {
      case "google":
        return this.fetchGoogleProfile(code);
      case "github":
        return this.fetchGithubProfile(code);
      case "linkedin":
        return this.fetchLinkedinProfile(code);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Handle the completed OAuth authentication:
   * - Map to ONE SkillTwin user account
   * - Prevent automatic merging on unverified emails
   * - Connect account if action is "link"
   */
  async handleOAuthCallback(
    profile: NormalizedOAuthProfile,
    state: OAuthStatePayload
  ): Promise<OAuthResult> {
    const { provider, providerId, email, emailVerified, name, avatarUrl } = profile;

    // SCENARIO 1: Explicit account linking by an authenticated user
    if (state.action === "link") {
      if (!state.userId) {
        return {
          success: false,
          message: "Account linking failed: active session user is required.",
          action: "link",
        };
      }

      const currentUser = await dbService.users.findOne({ _id: state.userId });
      if (!currentUser) {
        return {
          success: false,
          message: "Target user account not found.",
          action: "link",
        };
      }

      // Check if this provider identity is already connected to ANOTHER user
      const existingWithProvider = await dbService.users.findOne({
        "providers.provider": provider,
        "providers.providerId": providerId,
      } as any);

      if (existingWithProvider && existingWithProvider._id !== currentUser._id) {
        return {
          success: false,
          message: `This ${provider} account is already connected to another SkillTwin account.`,
          action: "link",
        };
      }

      // Check if current user already has this provider connected
      const existingProviders = currentUser.providers || [];
      const alreadyLinkedIndex = existingProviders.findIndex(
        (p) => p.provider === provider && p.providerId === providerId
      );

      const identityDoc: OAuthIdentityDoc = {
        provider,
        providerId,
        email,
        displayName: name,
        avatarUrl,
        connectedAt: new Date(),
      };

      let updatedProviders: OAuthIdentityDoc[];
      if (alreadyLinkedIndex >= 0) {
        updatedProviders = [...existingProviders];
        updatedProviders[alreadyLinkedIndex] = identityDoc;
      } else {
        // Disallow linking two different accounts of the same provider
        const otherOfSameProvider = existingProviders.find((p) => p.provider === provider);
        if (otherOfSameProvider) {
          return {
            success: false,
            message: `You already have a ${provider} account connected (${otherOfSameProvider.displayName || otherOfSameProvider.email || provider}). Disconnect it first to connect a different one.`,
            action: "link",
          };
        }
        updatedProviders = [...existingProviders, identityDoc];
      }

      // Update avatar if currently empty
      const updates: Partial<UserDoc> = {
        providers: updatedProviders,
        updatedAt: new Date(),
      };
      if (!currentUser.avatarUrl && avatarUrl) {
        updates.avatarUrl = avatarUrl;
      }

      await dbService.users.updateOne({ _id: currentUser._id }, updates);
      const updatedUser = await dbService.users.findOne({ _id: currentUser._id });
      const safe = toSafeUser(updatedUser!);
      const token = createSessionJwt(updatedUser!._id, updatedUser!.email);

      return {
        success: true,
        message: `Successfully connected ${provider.toUpperCase()} account to your SkillTwin profile.`,
        user: safe,
        token,
        action: "linked",
      };
    }

    // SCENARIO 2: Sign-in or Register via OAuth
    // Step A: Find existing user who already has this provider linked
    const userByProvider = await dbService.users.findOne({
      "providers.provider": provider,
      "providers.providerId": providerId,
    } as any);

    if (userByProvider) {
      await dbService.users.updateOne(
        { _id: userByProvider._id },
        {
          lastLoginAt: new Date(),
          ...(userByProvider.avatarUrl ? {} : avatarUrl ? { avatarUrl } : {}),
        }
      );
      const freshUser = await dbService.users.findOne({ _id: userByProvider._id });
      const safe = toSafeUser(freshUser!);
      const token = createSessionJwt(freshUser!._id, freshUser!.email);

      return {
        success: true,
        message: `Welcome back, ${freshUser!.name}!`,
        user: safe,
        token,
        action: "login",
      };
    }

    // Step B: If not matched by providerId, check if an existing account has this email
    const userByEmail = await dbService.users.findOne({ email });
    if (userByEmail) {
      // CRITICAL SECURITY RULE: Do NOT automatically merge accounts based only on an unverified email!
      if (!emailVerified) {
        return {
          success: false,
          message: `An account with email ${email} exists, but the ${provider} email is not verified. Please log in with your password first, then connect ${provider} from Profile Settings.`,
          action: "login",
        };
      }

      // Both the existing account and the OAuth provider have verified email ownership. Safe to link!
      const currentProviders = userByEmail.providers || [];
      const newIdentity: OAuthIdentityDoc = {
        provider,
        providerId,
        email,
        displayName: name,
        avatarUrl,
        connectedAt: new Date(),
      };

      const updates: Partial<UserDoc> = {
        providers: [...currentProviders, newIdentity],
        lastLoginAt: new Date(),
        // If the user's email was not verified yet, the trusted OAuth provider verified it!
        emailVerified: true,
        emailVerifiedAt: userByEmail.emailVerifiedAt || new Date(),
        ...(userByEmail.avatarUrl ? {} : avatarUrl ? { avatarUrl } : {}),
      };

      await dbService.users.updateOne({ _id: userByEmail._id }, updates);
      const freshUser = await dbService.users.findOne({ _id: userByEmail._id });
      const safe = toSafeUser(freshUser!);
      const token = createSessionJwt(freshUser!._id, freshUser!.email);

      return {
        success: true,
        message: `Linked your ${provider.toUpperCase()} account to your existing SkillTwin profile.`,
        user: safe,
        token,
        action: "linked",
      };
    }

    // Step C: No existing account found. Create a new SkillTwin account!
    const newUserId = `usr-${crypto.randomUUID()}`;
    const newIdentity: OAuthIdentityDoc = {
      provider,
      providerId,
      email,
      displayName: name,
      avatarUrl,
      connectedAt: new Date(),
    };

    const newUser: UserDoc = {
      _id: newUserId,
      name: name || "Developer",
      email,
      passwordHash: null, // No password set initially for OAuth signups
      emailVerified: Boolean(emailVerified),
      emailVerifiedAt: emailVerified ? new Date() : null,
      verificationTokenHash: null,
      verificationTokenExpiresAt: null,
      verificationOtpHash: null,
      verificationOtpExpiresAt: null,
      resetPasswordTokenHash: null,
      resetPasswordTokenExpiresAt: null,
      avatarUrl: avatarUrl || "",
      profile: {
        headline: "",
        targetRole: "Full Stack Developer",
        bio: "",
      },
      providers: [newIdentity],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    await dbService.users.insertOne(newUser);
    const safe = toSafeUser(newUser);
    const token = createSessionJwt(newUser._id, newUser.email);

    return {
      success: true,
      message: `Account created successfully via ${provider.toUpperCase()}! Welcome to SkillTwin.`,
      user: safe,
      token,
      action: "created",
    };
  }

  /**
   * Helper to generate mock OAuth profile in test / simulated environment
   */
  private generateMockProfile(provider: OAuthProviderType, code: string): NormalizedOAuthProfile {
    const id = code.replace("mock_code_", "").replace("mock_", "") || "123456";
    const email = `mock-${provider}-${id}@example.com`;
    return {
      provider,
      providerId: `${provider}-id-${id}`,
      email,
      emailVerified: true,
      name: `Mock ${provider.charAt(0).toUpperCase() + provider.slice(1)} Developer`,
      avatarUrl: `https://avatars.example.com/${provider}/${id}.png`,
    };
  }
}

export const oauthService = new OAuthService();
