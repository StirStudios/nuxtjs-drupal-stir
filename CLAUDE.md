# CLAUDE.md

@AGENTS.md

## Claude Code notes

- `AGENTS.md` is the single source of truth for project rules and is shared with Codex. Add or change project rules there, not here. Keep this file for Claude-specific notes only.
- `.claude/skills` is a symlink to `.agents/skills`. Add or edit skills in `.agents/skills` so Claude and Codex stay in sync.
- The Nuxt UI MCP server is configured in `.mcp.json` as `nuxt-ui`. Use it first for Nuxt UI component APIs, props, slots, and theming.
- Commit and push changes to the current branch by default once they're complete. Hold off and let the user review first only when actively debugging/fixing something they want to inspect, or during POC/exploratory work — ask before committing in those cases. Still never open PRs, force-push, or push to `main` without being asked.
