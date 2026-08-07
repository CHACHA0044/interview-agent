# Interview Agent — AI Technical Interview Platform

An adaptive, AI-powered technical interview platform engineered for evaluating candidates completing an Enterprise AI Cohort. Built with modern, state-of-the-art frontend architecture for the **ABTalks Vibe Coding Hackathon**.

![Interview Agent Banner](https://img.shields.io/badge/Status-Frontend_Ready-purple)
![React 19](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-6-646CFF)
![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4-06B6D4)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6)

---

## 🌟 Highlights & Features

- **Dark-Only Premium UI**: Designed with depth, smooth animations (Motion), subtle glassmorphism, and modern typography.
- **Adaptive Technical Interviewing**: Interactive chat environment simulating realistic AI interviewer dialogue.
- **Candidate Roster Management**: Grounded in cohort candidate completion signals (`candidates.json`).
- **Curriculum-Grounded Assessment**: Topic focus selection based on 31-day AI Cohort curriculum modules (`curriculum.json`).
- **Real-Time Telemetry & Metrics**: Session timer, question progress counter, live feedback drawer, and detailed evaluation report.
- **Decoupled Architecture**: Service layer powered by async mock services, enabling zero-friction transition to live backend APIs later.

---

## 📁 Repository & Folder Structure

```
interview-agent/
├── backend-requirements.md   # Architectural & API spec for future backend
├── technical-spec.md         # Official hackathon HTTP API contract
├── candidates.json           # Cohort candidates dataset
├── curriculum.json           # 31-day cohort curriculum dataset
└── frontend/                 # Complete Vercel-deployable Vite frontend app
    ├── src/
    │   ├── app/              # Router & global provider configuration
    │   ├── components/       # Design system primitives & layout components
    │   ├── constants/        # Central app constants & color tokens
    │   ├── hooks/            # Reusable React hooks (useCandidates, useTimer)
    │   ├── layouts/          # Root navigation layout
    │   ├── lib/              # Class merging utilities (cn)
    │   ├── mock/             # Realistic mock services & data generators
    │   ├── pages/            # Landing, Candidates, Setup, Interview, Feedback, Settings, 404
    │   ├── services/         # Decoupled service layer
    │   ├── stores/           # Zustand state management
    │   ├── styles/           # Global CSS & Tailwind configuration
    │   └── types/            # Strict TypeScript interfaces
    ├── package.json
    ├── vite.config.ts
    └── README.md
```

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- npm / pnpm / yarn

### Steps

1. Navigate into the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Run tests:
   ```bash
   npm test
   ```

5. Build for deployment:
   ```bash
   npm run build
   ```

---

## 🌐 Vercel Deployment

This project is structured specifically for one-click Vercel deployment:
- **Root Directory**: Select `frontend` in Vercel settings.
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 📋 File Documentation Convention

Every file in the codebase strictly follows the mandatory file header format:

```typescript
/*
========================================================

File: [Filename]
Purpose: [High level purpose]
Responsibilities:
- [Itemized responsibilities]
Connected Files: [List of imports/exports]
Depends On: [Dependencies]
Notes: [Developer notes]

========================================================
*/
```

---

## 🔮 Future Backend Roadmap

See [`backend-requirements.md`](./backend-requirements.md) for full backend specs including:
- FastAPI `POST /api/interview` agent handlers
- LangGraph / CrewAI multi-agent orchestration
- ChromaDB / PGVector RAG retrieval pipeline
- Redis session memory buffer
