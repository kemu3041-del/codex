# Adaptive Superpowers Global Policy

## Goal

Make Superpowers an on-demand workflow layer for every Codex project. Preserve rigor for complex or risky work without forcing skill loading, planning, or TDD onto ordinary questions and small edits.

## Configuration Surface

Add one concise `Superpowers usage policy` section to `~/.codex/AGENTS.md`. Do not edit the versioned plugin cache or duplicate the plugin as a personal skill.

Global `AGENTS.md` is the correct layer because it applies across projects, survives plugin upgrades, and can still be overridden by a more specific project instruction or an explicit user request.

## Trigger Policy

| Task | Default behavior |
| --- | --- |
| Explanation, lookup, status, or small localized edit | Use Codex's native workflow; do not load Superpowers merely because it might apply. |
| Ambiguous product idea, new feature, or meaningful behavior/design change | Use `superpowers:brainstorming` when design choices materially affect the result. |
| Reproducible bug, test failure, or unexpected behavior | Use `superpowers:systematic-debugging`. |
| Feature or bug fix with practical automated-test support | Use `superpowers:test-driven-development`; otherwise use the narrowest proportionate verification. |
| Multi-file or long-running implementation with real dependencies | Use `superpowers:writing-plans`, then the appropriate execution workflow. |
| Completed code change | Use risk-proportionate verification before claiming success; invoke `superpowers:verification-before-completion` for substantial or high-risk work. |
| Parallelizable work | Use subagents only when the user or a more specific instruction explicitly requests delegation. |
| Explicit skill request | Use the named skill unless it conflicts with a higher-priority safety or user instruction. |

The global policy explicitly overrides `using-superpowers`' blanket "1% chance" rule. Skill selection must be based on a clear trigger and proportional value.

## Priority

Apply instructions in this order:

1. System, safety, and platform constraints.
2. Explicit instructions in the current user request.
3. The closest applicable project or subtree `AGENTS.md`.
4. Global `~/.codex/AGENTS.md`.
5. Skill defaults.

## Boundaries

- Keep the existing token-efficient inspection, editing, and verification rules unchanged.
- Do not disable or uninstall the Superpowers plugin.
- Do not edit cached plugin files because updates can replace them.
- Do not require design documents, commits, subagents, browser sessions, or exhaustive tests for small tasks unless the task itself requires them.

## Verification

After editing the global file:

1. Confirm the new section appears once and existing rules remain intact.
2. Confirm the policy covers simple tasks, design work, debugging, TDD, planning, verification, explicit requests, and delegation.
3. Review the final diff for contradictions with the existing token-efficient rules.

Success means future Codex tasks use native behavior by default and invoke individual Superpowers skills only when their concrete trigger is present.
