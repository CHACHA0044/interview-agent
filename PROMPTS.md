# AI Usage Log — The Interview Agent

This document logs the prompts used with Claude/AI tools throughout development,
organized by phase. Full raw transcripts are in `/prompts/` if longer excerpts are needed.

## Overview
- Primary AI tools used: [Claude / OpenCode / AntiGravity IDE / ChatGpt]
- Development approach: iterative "vibe-coding" — audit → fix → verify → repeat
- Total sessions: [15] across [7th of Aug 8:00 PM - 9th of Aug 8:00 PM]

## Phase 0 — Initial Frontend
**Goal:** Build the initial frontend foundation for The Interview Agent hackathon project before implementing the backend. The frontend needed to communicate the idea of a serious enterprise technical-assessment platform rather than looking like a generic AI chatbot.

The initial objective was to create a functional frontend foundation around the hackathon problem statement, using the provided candidate profiles, curriculum, technical specification, and existing interview-agent repository as the project base.

The frontend was intentionally designed first so the team could establish the complete product flow and UI structure before connecting the real backend services.

**Prompts used:** 
1. Initial project and frontend foundation prompt

The first major prompt instructed the AI coding agent to establish the project foundation and frontend first.

Prompt summary:
Build the base of the project for the hackathon problem statement:

"The Interview Agent — Build the interviewer, not the interview."

First understand the complete problem statement, curriculum JSON, candidate profiles, and technical specification.

Connect the project to:

https://github.com/CHACHA0044/interview-agent.git

Build the frontend first.

The frontend should represent an enterprise AI technical interview platform capable of:

- selecting candidates
- understanding candidate progress
- configuring an interview
- conducting an adaptive technical interview
- displaying interview progress
- displaying evaluation and final feedback
- communicating the overall architecture

Use modern frontend technologies and keep the implementation modular.

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion / Motion
- Lucide icons
- shadcn/ui components

Use a dark-themed enterprise interface.

Follow:

- DRY principles
- modular architecture
- reusable components
- clean separation of concerns
- optimized rendering
- best coding practices
- clear naming
- reusable UI components
- minimal duplication

Every TS/TSX/code file should contain a comment section at the top explaining:

- what the file does
- its objective
- why it exists
- how it connects to other files
- the purpose of the page/component/service

Keep these explanations throughout development.

Do not over-engineer the application.

Create a clear frontend structure that can later connect to the backend without requiring a major rewrite.

Also create/update a Markdown document containing the backend requirements so that backend development can follow the frontend and technical specification.

Do not implement out-of-scope functionality.

2. Frontend architecture and product-flow direction

After establishing the base, the frontend was structured around the actual workflow of the Interview Agent.

The intended product flow became:

Overview
   ↓
Candidates
   ↓
Interview Setup
   ↓
Interview Session
   ↓
Evaluation
   ↓
Final Feedback

Additional informational areas were included:

Architecture
Settings

The goal was to make the interface feel like an enterprise assessment console, rather than a consumer-facing chatbot.

The major frontend concepts became:

Overview

The landing/dashboard experience communicating:

Enterprise AI assessment
adaptive interviewing
curriculum alignment
candidate assessment
evaluation pipeline
system readiness
Candidates

A candidate roster showing information such as:

candidate ID
candidate name
role
experience
cohort progress
completed missions
readiness

Candidates could be selected for an interview.

Interview Setup

The configuration page allowed an interviewer to configure an assessment around:

target candidate
assessment topics
question count
session duration

The UI included curriculum-related areas such as:

Embeddings & Vector Search
LLM Core / Prompting & Fine-Tuning
Chatbot Application Build
Agentic AI & MCP
Evaluation, Security & Deployment
Production & Capstone
Architecture

An architecture/product explanation page was created to explain the system at a high level.

Settings

A dedicated settings area was included for system/application configuration.

3. Code-quality and file-documentation direction

A recurring instruction throughout Phase 0 was that the codebase should remain understandable to the entire team.

The coding agent was instructed to:

avoid unnecessarily complex abstractions
reuse components
follow DRY
keep components focused
separate page-level and reusable UI components
avoid duplicated logic
keep configuration centralized
make future backend integration straightforward

The file documentation requirement was especially important.

For applicable source files, the agent was instructed to keep a header explaining:

Purpose:
What this file is responsible for.

Objective:
What problem it solves.

Connections:
Which components/services/pages use it.

Role:
Why this file exists in the overall architecture.

JSON, .env, and similar configuration/data files were excluded from the requirement where comments would not be appropriate.

4. Initial visual direction

The first frontend direction was a dark, modern AI interface.

The initial implementation used a dark background with a strong accent color and modern dashboard cards.

The frontend used:

dark backgrounds
large typography
rounded cards
icon-based feature blocks
animated UI elements
dashboard-style layouts
responsive grids
CTA buttons
navigation tabs

The initial design emphasized:

AI-powered assessment
Natural conversation
Deep analytics
Curriculum alignment
Adaptive difficulty
Instant feedback

5. Frontend redesign and visual refinement

After the initial implementation was reviewed, the visual design was considered too generic and the layout was not strong enough for a hackathon submission.

A second design direction was therefore introduced.

The instruction was to move away from the original purple-heavy appearance and create a more distinctive black + white + gold enterprise visual identity.

Prompt summary:
The existing frontend layout and visual hierarchy are poor.

Do not rebuild the product concept.

Improve the entire frontend site-wide.

Use only:

- black
- white
- gold

as the primary visual language.

Remove the previous purple-heavy visual identity.

Create a premium enterprise AI assessment interface.

Use the font files already included in the project folder.

First scan the project folder and identify the available font files and assets.

Use the provided font consistently throughout the application.

Do not introduce another font unnecessarily.

Improve:

- typography hierarchy
- spacing
- page width
- navigation
- section hierarchy
- cards
- buttons
- information density
- alignment
- visual rhythm
- responsive behavior
- empty space
- content grouping

The interface should look like a serious enterprise technical assessment platform.

Avoid excessive gradients, excessive glow effects, oversized decorative elements, and unnecessary animation.

Keep the design clean and intentional.
6. Site-wide layout correction

The first redesign still had layout problems, particularly on different viewport sizes.

The subsequent direction focused on fixing the entire site layout, rather than tweaking individual components.

The instruction emphasized that the application had to work across:

desktop PCs
laptops
tablets
mobile devices

The layout needed to respond naturally rather than simply shrinking the desktop version.

Prompt summary:
Fix the frontend layout site-wide.

Do not only adjust the homepage.

Audit every page:

- Overview
- Candidates
- Interview Setup
- Interview
- Architecture
- Settings
- any shared navigation/components

The layout must be genuinely responsive across:

- desktop
- laptop
- tablet
- mobile

Do not rely on fixed widths or desktop-only positioning.

Use responsive containers, grids, flex layouts, spacing and typography.

Desktop should use the available screen width intelligently.

Tablet layouts should transition from multi-column layouts to appropriate two-column or single-column layouts.

Mobile should become a proper single-column application with usable navigation and controls.

Prevent:

- horizontal overflow
- clipped text
- overlapping cards
- buttons going outside containers
- oversized headings
- fixed-width panels
- content hidden below the viewport
- navigation collisions

Keep the black / white / gold design system.

Do not change the product functionality.

Do not add unnecessary features.

Focus specifically on layout quality, responsive behavior, spacing, hierarchy and usability.
7. Responsive design refinement

The responsive requirement was subsequently made even more explicit because screenshots showed that the desktop layout was being treated as the primary design and smaller screens were not being handled properly.

The frontend was instructed to use mobile/tablet/desktop as first-class layouts, rather than treating mobile as an afterthought.

The expected behavior became:

Desktop
full navigation
multi-column candidate cards
wide assessment layouts
dashboard information panels
architecture visualizations
Tablet
reduced columns
compact navigation
appropriately sized cards
reorganized dashboard sections
Mobile
single-column content
stacked cards
simplified navigation
full-width buttons
readable typography
no horizontal scrolling
interview interface optimized for narrow screens
8. Backend-awareness during frontend development

Although the backend was not implemented during this phase, the frontend was designed with the eventual backend contract in mind.

The UI was structured around the expected concepts:

Candidate
Session
Question
Answer
Evaluation
Feedback

This was important because the later backend architecture would introduce:

Frontend
   ↓
Gateway
   ↓
Interview Agent
   ↓
AI Intelligence

The frontend was therefore not supposed to contain the actual interview intelligence.

The frontend's responsibility was primarily:

collecting candidate/session information
presenting interview questions
collecting answers
displaying progress
displaying evaluation/feedback
communicating with backend APIs
9. Repository integration

The project was connected to the team's repository:

https://github.com/CHACHA0044/interview-agent.git

The frontend was developed inside the repository rather than creating a separate unrelated application.

The project structure eventually included:

interview-agent/
│
├── backend/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── docs/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── ...
│
├── candidates.json
├── curriculum.json
├── technical-spec.md
├── backend.md
├── backend-requirements.md
└── README.md

This allowed the frontend, provided hackathon resources, backend documentation, and later backend implementation to remain within one repository.

**What was implemented:** Frontend foundation

A React + TypeScript + Vite frontend was established with a reusable component structure.

Core navigation

The frontend developed a navigation system around:

Overview/Home
Candidates
Interview Setup
Architecture
Settings
Candidate interface

A candidate roster was created using candidate-oriented cards displaying information such as:

candidate ID
candidate name
role
experience
cohort progress
missions completed
interview readiness
Interview configuration

An Interview Setup interface was created where a candidate could be selected and assessment topics configured before launching an interview.

Enterprise assessment visual identity

The design evolved from the initial dark/purple AI-dashboard concept into a more distinctive:

Black + White + Gold

visual system.

Responsive frontend

The frontend was progressively refined for:

PC
laptop
tablet
mobile
Animation and interaction

Motion-based transitions and Lucide/shadcn-style components were used to make the interface feel polished while keeping the application functional.

Architecture presentation

An Architecture section was added so the hackathon judges could understand the intended multi-agent assessment pipeline.

Backend preparation

The frontend phase also established the initial backend requirements/documentation so backend implementation could proceed independently.

Phase 0 Outcome

Status: Frontend foundation completed and progressively refined.

The phase established the product's visual language, navigation, candidate workflow, interview configuration flow, architecture presentation, and responsive UI foundation.

The frontend was intentionally kept separate from the interview intelligence so that the later backend could implement the actual adaptive interview engine without coupling business logic into React components.

The major progression of Phase 0 was:

Problem Statement
       ↓
Product / UX Definition
       ↓
React + TypeScript Foundation
       ↓
Candidate & Interview Flow
       ↓
Enterprise Assessment UI
       ↓
Black / White / Gold Redesign
       ↓
Site-wide Layout Improvements
       ↓
Responsive PC / Tablet / Mobile Design
       ↓
Backend-ready Frontend Foundation

Phase 0 ended with the frontend serving as the product shell for the backend work that followed.

## Phase 1 — Backend Audit & Deployment Prep
**Goal:** Prepare existing backend for single-service Render deployment
**Prompts used:** [paste or summarize key prompts]
**What was implemented:** Dockerfile, start.sh, single-container service orchestration, env config

## Phase 2 — Backend Verification & Bug Fixes
**Goal:** Verify 168-test backend actually meets hackathon floor requirements (8Q/4-day)
**Key finding:** curriculum.json day-range parsing bug (interior days dropped)
**Prompts used:** [paste]
**Fix applied:** commit 63cc7fd — expanded [start,end] ranges correctly

## Phase 3 — Frontend Data Wiring
**Goal:** Replace mock candidate/interview data with real backend calls
**Key finding:** Frontend was 100% mock — zero real HTTP calls
**Prompts used:** [paste]
**Fix applied:** real interview.service.ts, Settings functional wiring

## Phase 4 — Agent Quality & Multi-Provider Resilience
**Goal:** Fix generic/stuck questions, add Groq multi-key rotation + Cerebras failover
**Prompts used:** [paste]
**Fix applied:** provider rotation chain, structured logging, keepalive

## Phase 5 — Live Testing & Bug Discovery
**Goal:** Real end-to-end interviews against real APIs, no mocks
**Findings:** Cerebras model 404, fake-fallback schema validation failures
**Prompts used:** [paste]

## Phase 6 — Frontend Polish
**Goal:** Cross-device responsiveness, animations, UX fixes
**Prompts used:** [paste]