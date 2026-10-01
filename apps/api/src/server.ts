import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.API_PORT, () => {
  console.log(`SkillTwin API listening on http://localhost:${config.API_PORT}`);
});
