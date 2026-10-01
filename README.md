# SkillTwin

SkillTwin is an evidence-based AI Developer Career Twin. It connects resume claims, GitHub implementation signals, target-role requirements, and practical next actions without presenting AI estimates as objective proficiency measurements.

## Run locally

From the repository root:

```powershell
npx --yes pnpm@9.15.4 install
npm run dev
```

The web app runs on Vite's available local port (normally `http://localhost:5173`) and the API runs at `http://localhost:4000`.

If dependencies are already installed, this also works directly:

```powershell
npx --yes pnpm@9.15.4 --parallel --filter @skilltwin/api --filter @skilltwin/web dev
```

## Validate

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

## Current product scope

The complete local demo includes:

- Developer Twin overview and interactive skill graph
- Evidence map with explainable estimates
- Resume PDF ingestion with claim-level evidence
- GitHub repository evidence adapter in safe demo mode
- Provider-neutral analysis boundary with a deterministic local provider
- Configurable target roles and gap analysis
- Evidence-producing roadmap
- Profile-specific interview simulator
- Evolution history and analysis snapshot history

GitHub OAuth, external AI credentials, and MongoDB persistence are deliberately behind adapters and remain disabled in local demo mode. The UI identifies seeded/demo data and the API never exposes credentials.
