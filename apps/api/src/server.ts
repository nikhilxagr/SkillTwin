import { app } from "./app.js";
import { config } from "./config.js";
import { dbService } from "./modules/database/database.service.js";

async function bootstrap() {
  await dbService.initialize();

  app.listen(config.API_PORT, () => {
    console.log(`SkillTwin API listening on http://localhost:${config.API_PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start SkillTwin API server:", err);
  process.exit(1);
});

