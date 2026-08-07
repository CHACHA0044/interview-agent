/*
========================================================

File:
app/router.tsx

Purpose:
Application router definitions using React Router v7.

Responsibilities:
- Maps application paths to page components
- Configures RootLayout wrapper
- Implements catch-all 404 route handling

Connected Files:
- src/main.tsx (mounts RouterProvider)
- src/layouts/RootLayout.tsx
- All page components

Depends On:
- react-router (createBrowserRouter)

Notes:
Routes follow modular layout hierarchy.

========================================================
*/

import { createBrowserRouter } from "react-router";
import { RootLayout } from "@/layouts/RootLayout";
import { LandingPage } from "@/pages/LandingPage";
import { AboutPage } from "@/pages/AboutPage";
import { CandidatesPage } from "@/pages/CandidatesPage";
import { InterviewSetupPage } from "@/pages/InterviewSetupPage";
import { InterviewPage } from "@/pages/InterviewPage";
import { FeedbackPage } from "@/pages/FeedbackPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "candidates", element: <CandidatesPage /> },
      { path: "interview/setup", element: <InterviewSetupPage /> },
      { path: "interview/:sessionId", element: <InterviewPage /> },
      { path: "interview/:sessionId/feedback", element: <FeedbackPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
