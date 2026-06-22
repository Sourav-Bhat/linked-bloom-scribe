# Business Requirements Document (BRD)
## LinkedBloom Scribe — Agentic Personal Branding Platform
**Version:** 1.1 | **Date:** May 2026 | **Owner:** Sourav Bhat | **Status:** Approved
**Change from v1.0:** Backend references updated from Supabase to Firebase to match TRD v2.0.

---

## 1. Executive Summary

LinkedBloom Scribe is an AI-powered personal branding platform that helps professionals — starting with software developers — establish, grow, and manage their thought leadership on LinkedIn without requiring a PR agency. The platform combines persona intelligence, AI-assisted content creation, LinkedIn publishing, real-time engagement intelligence, and a Chrome extension to create a closed-loop personal brand management system.

The platform's core defensible advantage is **voice authenticity**: a living persona model built collaboratively with the user over time, continuously refined through behavioral signals, content feedback, and conversational strategy sessions with an AI PR agent.

---

## 2. Business Objectives

| ID | Objective | Measure of Success |
|----|-----------|-------------------|
| BO-01 | Validate product-market fit with a closed beta of trusted users over 3 months | ≥80% weekly active retention in beta cohort |
| BO-02 | Prove that AI-generated content is approved by users with minimal edits | ≥75% of drafts approved with zero or minor edits by Month 3 |
| BO-03 | Demonstrate measurable LinkedIn engagement improvement for beta users | Average 3× increase in post engagement vs pre-platform baseline |
| BO-04 | Build a reusable persona model that can extend beyond developers to other professions | Persona system successfully adapted for 2+ additional personas by end of beta |
| BO-05 | Establish a privacy-first, trust-based positioning in a market wary of automation | Zero data privacy incidents; 100% explicit user consent for all data collection |

---

## 3. Business Context

### 3.1 Problem Statement
Professionals across all industries understand that personal branding matters for career growth, business development, and thought leadership. However:
- Building a consistent LinkedIn presence requires skills most professionals don't have time to develop: copywriting, content strategy, visual design, and channel management
- PR agencies that provide these services cost thousands per month — inaccessible to individuals
- Existing tools (Buffer, Hootsuite, Taplio) offer scheduling and basic AI generation but fail on voice authenticity — content sounds generic and templated
- LinkedIn's own tools offer no strategic guidance — they are publishing tools, not positioning tools

### 3.2 Opportunity
The advancement of LLMs with long context windows, memory persistence, and multi-agent architectures makes it possible to build a system that genuinely understands and replicates an individual's professional voice. Combined with a Chrome extension as a behavioral sensor layer, the platform can close the loop between observation, strategy, content creation, and publishing.

### 3.3 Target Users — Closed Beta
**Primary:** Software developers and engineers with 3–15 years experience who want to build a thought leadership presence but lack time for consistent content creation.
**Secondary (future phases):** Product managers, designers, consultants, founders, researchers.

### 3.4 Competitive Landscape

| Competitor | Strength | Gap vs LinkedBloom |
|-----------|----------|-------------------|
| Taplio | LinkedIn-native scheduling | No real persona; generic AI voice |
| Buffer | Multi-platform scheduling | No persona intelligence; no engagement guidance |
| Hypefury | Twitter-first, good templates | LinkedIn afterthought; no behavioral signals |
| Shield Analytics | Best LinkedIn analytics | No content creation; no persona |
| AuthoredUp | Strong LinkedIn editor | No AI; no persona; no strategy |

**LinkedBloom's differentiation:** Living persona model + behavioral intelligence from Chrome extension + conversational PR agent strategy sessions = the only platform where the content actually sounds like the user.

---

## 4. Stakeholders

| Role | Responsible Party | Responsibility |
|------|-------------------|----------------|
| Product Owner | Sourav Bhat | Vision, priorities, beta user relationships |
| Development Execution | Claude Code (AI) | Sprint execution, code implementation |
| Planning & Architecture | Claude (AI Chat) | PRD/BRD/TRD, user stories, sprint planning |
| Beta Users | Closed trusted group | Feature feedback, engagement data, NPS |

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-01 | All LinkedIn data collection requires explicit, granular user consent — no background collection without active permission toggle |
| BR-02 | Human approval is required before any content is published to LinkedIn — no autonomous publishing ever |
| BR-03 | Raw behavioral data (scroll patterns, click streams) must never be transmitted to the cloud — only abstracted pattern signals |
| BR-04 | Users must be able to export their full persona model at any time in a portable JSON/markdown format |
| BR-05 | Users must be able to delete all their data (persona, posts, chat history, analytics) with a single action with confirmation |
| BR-06 | The platform must never suggest or facilitate spammy, inauthentic, or LinkedIn ToS-violating behavior |
| BR-07 | API keys provided by users are stored encrypted and never logged or exposed in responses |
| BR-08 | The Chrome extension must display a live data collection transparency feed — users can see exactly what is being monitored |
| BR-09 | All persona data is owned by the user — portability and deletion are non-negotiable product features |

---

## 6. Assumptions and Constraints

### 6.1 Assumptions
- Beta users will use a shared OAuth app registered by the product owner for LinkedIn API access
- Gemini 2.5 Pro remains available and cost-effective for persona generation and content creation
- LinkedIn API permits posting, analytics retrieval, and OAuth for developer-tier applications during beta
- Chrome Manifest V3 is the required extension format
- Users are comfortable installing a Chrome extension and granting monitored permissions with full transparency
- Firebase handles auth, database (Firestore), storage, and Cloud Functions for the full beta duration

### 6.2 Constraints
- 3-month closed beta timeline (6 × 2-week sprints)
- AI-assisted solo development — complexity per sprint must be manageable
- LinkedIn API rate limits apply to all publishing and analytics calls
- Firebase Blaze plan usage limits apply
- Chrome Web Store review process may delay extension — sideloading acceptable for closed beta
- No human engineering hours — Claude Code executes all implementation

---

## 7. Success Metrics (Beta KPIs)

| Metric | Target | How Measured |
|--------|--------|-------------|
| Weekly Active Users | ≥80% of beta cohort | Firebase Auth events |
| Draft approval rate (no/minor edits) | ≥75% by Sprint 6 | Edit delta tracking on `posts` subcollection |
| Posts published to LinkedIn per user/month | ≥4 | `postAnalytics` subcollection |
| LinkedIn engagement uplift | 3× vs baseline | LinkedIn API metrics |
| NPS score | ≥50 | Monthly survey |
| Chrome extension install rate | ≥60% of beta users | Extension event tracking |
| Comment suggestion acceptance rate | ≥40% | Extension telemetry |
| Persona correction rate | Decreasing month-over-month | Chat feedback signals |

---

## 8. Out of Scope (Beta)

- Mobile app (iOS/Android)
- Non-LinkedIn platform auto-posting (Twitter/X, Medium)
- Team/agency accounts (multi-user persona management)
- Video content generation
- Paid monetisation / subscription billing
- White-labelling for other professions
- GDPR/enterprise compliance certification
- A/B testing infrastructure
