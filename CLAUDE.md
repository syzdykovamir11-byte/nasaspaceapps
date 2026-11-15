@AGENTS.md

## Claude Code specifics
- Use plan mode for anything touching more than 3 files or the data pipeline.
- For independent review use a subagent that sees only the diff or file paths, not your reasoning.
- Keep answers short. Report: what changed, what was verified, what is still broken.
