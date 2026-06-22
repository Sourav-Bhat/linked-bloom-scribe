# LinkedBloom Scribe — Project Documents
**Version:** 1.0 | **Date:** May 2026

---

## Document Index

| File | Purpose | Primary Audience |
|------|---------|-----------------|
| `BRD.md` | Business Requirements — objectives, rules, success metrics, out of scope | Product Owner |
| `PRD.md` | Product Requirements — full feature specs with acceptance criteria per feature | Product Owner + Claude Code |
| `TRD.md` | Technical Requirements — target architecture, Firestore data model, Cloud Function specs, security | Claude Code |
| `APPLICATION_ARCHITECTURE.md` | As-built reference — actual routes, component workflow, tech stack, and gaps vs. plan | Claude Code |
| `BACKLOG.md` | Full backlog — all 54 user stories with acceptance criteria and dependencies | Claude Code |
| `SPRINTS.md` | Sprint execution guide — ordered story list per sprint with DoD | Claude Code |
| `LinkedBloom_Project_Backlog.xlsx` | Excel version of backlog — 4 sheets: Full Backlog, Sprint Plan, Dependency Map, Legend | Product Owner review |

---

## How This Project Runs

**Planning:** Claude (chat) — creates and updates all documents in this folder  
**Execution:** Claude Code — reads documents, implements sprint by sprint  
**Review:** Sourav Bhat — reviews each sprint output, approves, commits to GitHub  

---

## Sprint Overview

| Sprint | Weeks | Focus | Stories |
|--------|-------|-------|---------|
| S1 | 1–2 | Foundation Fixes (P0) | US-001 to US-012 |
| S2 | 3–4 | LinkedIn Integration (P1) | US-013 to US-025 |
| S3 | 5–6 | Analytics Dashboard (P1) | US-026 to US-030 |
| S4 | 7–8 | Engagement Intelligence (P2) | US-031 to US-037 |
| S5 | 9–10 | Chrome Extension (P3) | US-038 to US-048 |
| S6 | 11–12 | Persona Maturity + Polish (P4) | US-049 to US-054 |

**Total:** 54 user stories across 6 sprints

---

## Starting a Sprint with Claude Code

Copy and paste this prompt:

```
Read all documents in /project-documents/ — BRD.md, PRD.md, TRD.md, BACKLOG.md, and SPRINTS.md. 

Confirm you understand the full architecture, existing codebase state, and what is already built vs what is missing.

Then begin Sprint [N] by implementing the first story in order: [US-XXX].

For each story:
1. Re-read its acceptance criteria in BACKLOG.md
2. Identify files to change
3. Implement
4. Verify each AC is met
5. Commit with message: "[US-XXX] story title"
6. Move to next story in sprint order

Do not skip stories. Do not move to Sprint [N+1] until all Sprint [N] stories pass their acceptance criteria.
```

---

## Updating These Documents

If scope changes during the beta:
- New stories: add to BACKLOG.md and the relevant sprint in SPRINTS.md, update Excel
- Removed stories: mark as Cancelled in status column (do not delete)
- Sprint re-ordering: update SPRINTS.md only — BACKLOG.md is the source of truth for story content
