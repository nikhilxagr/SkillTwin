# SkillTwin Copilot Instructions

SkillTwin is an evidence-based AI Developer Career Twin. The product distinguishes claimed skills from demonstrated skills and must explain every assessment with traceable evidence.

## Engineering rules

- Use strict TypeScript and shared Zod contracts for API boundaries.
- Keep integrations behind adapters; never put GitHub, resume parsing, or AI-provider logic directly in route handlers.
- Never fabricate repositories, skills, achievements, scores, or evidence.
- Treat confidence values as estimates based on available evidence.
- Do not expose OAuth tokens or personal data in browser state or logs.
- Preserve loading, empty, partial-data, and error states.
- Prefer small, tested, composable changes over generated boilerplate.

## Validation

Before considering a change complete, run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` when applicable.
