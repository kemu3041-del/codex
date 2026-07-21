# Adaptive Superpowers Global Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all Codex projects use native workflows by default and invoke individual Superpowers skills only for clear, proportionate triggers.

**Architecture:** Add a single policy section to the global `~/.codex/AGENTS.md`, which has higher priority than skill defaults and is inherited by all projects. Preserve the existing token-efficient rules and leave the versioned Superpowers plugin cache unchanged.

**Tech Stack:** Markdown, Codex global `AGENTS.md`

## Global Constraints

- Apply to all Codex projects.
- Do not disable or uninstall the Superpowers plugin.
- Do not edit cached plugin files.
- Preserve every existing global rule outside the new section.
- Allow explicit user requests and closer project-level instructions to override the global defaults.
- Do not use subagents unless the user or a more specific instruction explicitly requests delegation.

---

### Task 1: Add and verify the adaptive Superpowers policy

**Files:**
- Modify: `/Users/wangbin/.codex/AGENTS.md`
- Test: manual structural and contradiction checks against `/Users/wangbin/.codex/AGENTS.md`

**Interfaces:**
- Consumes: Codex instruction precedence and the existing global token-efficient workflow rules.
- Produces: A global `## Superpowers usage policy` section used by future Codex tasks.

- [ ] **Step 1: Record the pre-edit structure**

Run:

```bash
rg -n '^## ' /Users/wangbin/.codex/AGENTS.md
```

Expected: the existing execution-budget, verification, failure/communication, and shared front-end plugin sections appear once.

- [ ] **Step 2: Insert the policy after the failure and communication policy**

Add this exact section without changing surrounding content:

```markdown
## Superpowers usage policy

- Treat Superpowers as an on-demand workflow layer, not a mandatory wrapper around every response or action.
- Do not invoke `superpowers:using-superpowers` or another Superpowers skill for ordinary questions, explanations, lookups, status reports, or small localized edits merely because it might apply.
- Use `superpowers:brainstorming` for ambiguous product ideas, new features, or meaningful behavior and design changes when design choices materially affect the result.
- Use `superpowers:systematic-debugging` for reproducible bugs, test failures, or unexpected behavior that requires root-cause analysis.
- Use `superpowers:test-driven-development` when implementing a feature or bug fix with practical automated-test support. For configuration, generated artifacts, prototypes, or work without a viable automated harness, use the narrowest proportionate verification instead.
- Use `superpowers:writing-plans` for multi-file or long-running implementations with real dependencies; do not require a formal plan for small, well-scoped tasks.
- Before claiming a code change is complete, perform risk-proportionate verification. Invoke `superpowers:verification-before-completion` for substantial or high-risk work, not automatically for every minor edit.
- Use subagents only when the user or a more specific applicable instruction explicitly requests delegation or parallel agent work.
- Always honor an explicit user request to use a named skill unless it conflicts with higher-priority safety or platform constraints.
- This section overrides the blanket "1% chance" and mandatory-invocation rules in `superpowers:using-superpowers`. Select skills from concrete task triggers and proportional value.
```

- [ ] **Step 3: Verify structure and coverage**

Run:

```bash
rg -n '^## |Superpowers|ordinary questions|systematic-debugging|test-driven-development|writing-plans|verification-before-completion|subagents|1% chance' /Users/wangbin/.codex/AGENTS.md
```

Expected: the new heading appears once; all trigger categories and the override statement are present; every original heading is still present.

- [ ] **Step 4: Check for accidental duplication or placeholders**

Run:

```bash
test "$(rg -c '^## Superpowers usage policy$' /Users/wangbin/.codex/AGENTS.md)" -eq 1
! rg -n 'TBD|TODO|PLACEHOLDER' /Users/wangbin/.codex/AGENTS.md
```

Expected: both commands exit successfully with no output.

- [ ] **Step 5: Report completion**

Report that the global policy applies to future Codex tasks, cached plugin files were not changed, and existing project-specific `AGENTS.md` files remain able to override the global defaults.
