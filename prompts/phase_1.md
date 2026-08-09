Prompt 1 — Project Initialization & Frontend Foundation (AI Interview Agent)

We are building a hackathon project called "Interview Agent" for the ABTalks Vibe Coding Hackathon.

IMPORTANT:
This project must be built progressively through multiple prompts.
DO NOT attempt to build the backend now.
For this prompt ONLY create the complete frontend architecture and project foundation.

Repository:
https://github.com/CHACHA0044/interview-agent.git

If possible, clone/connect to this repository and work inside it rather than creating another project.

==========================================================
PROJECT GOAL
==========================================================

Build an AI powered Interview Agent capable of conducting adaptive technical interviews for candidates completing an Enterprise AI Cohort.

The frontend should look like an actual modern AI product.

It should feel similar to:

• Cursor
• Claude
• Vercel AI
• Linear
• Raycast
• OpenAI
• Perplexity

Dark mode only.

Premium UI.

Minimal.

Elegant.

Lots of depth.

Smooth animations.

Modern typography.

Excellent spacing.

Beautiful micro interactions.

==========================================================
PRIMARY GOAL OF THIS PROMPT
==========================================================

Create ONLY the frontend.

Backend comes later.

For now every API call should use mock services.

Design the frontend in such a way that replacing mock services with backend APIs later requires minimal changes.

==========================================================
TECH STACK
==========================================================

Use latest stable versions.

React 19

Vite

TypeScript

TailwindCSS v4

React Router

TanStack Query

Zustand

React Hook Form

Zod

Motion (framer-motion)

Lucide React

Shadcn UI

Sonner

React Markdown

clsx

tailwind-merge

dayjs

ESLint

Prettier

Husky

lint-staged

Vitest

React Testing Library

Use latest recommended folder structure.

==========================================================
CODE QUALITY
==========================================================

Follow:

SOLID

DRY

KISS

Clean Architecture

Feature based architecture

Reusable Components

Composition over inheritance

No duplicated logic.

No giant files.

No magic values.

No inline styles.

Strict typing everywhere.

No "any".

Use interfaces/types properly.

No dead code.

No commented old code.

Reusable hooks.

Reusable utility functions.

Separate business logic from UI.

==========================================================
MANDATORY FILE DOCUMENTATION
==========================================================

THIS IS EXTREMELY IMPORTANT.

EVERY SINGLE FILE MUST BEGIN WITH A COMMENT BLOCK.

No exceptions.

tsx

ts

css

json

config files

hooks

components

contexts

services

utils

constants

env examples

router

layouts

pages

types

etc.

EVERY file starts with a documentation block.

The documentation should explain:

--------------------------------------------------

Purpose

Objective

Why this file exists

Responsibilities

How this file interacts with other files

Which files consume it

Which files it depends on

How future developers should modify it

Any important implementation notes

--------------------------------------------------

Example:

/*
========================================================

File:
InterviewLayout.tsx

Purpose:
Provides the common interview layout used across every interview related screen.

Responsibilities:
- Renders interview navigation
- Holds sidebar
- Displays active interview content
- Controls responsive layout

Connected Files:
- InterviewPage.tsx
- Sidebar.tsx
- CandidatePanel.tsx
- InterviewStore.ts

Depends On:
- React Router
- Zustand Interview Store

Notes:
Keep layout logic here.
Business logic belongs inside hooks/services.

========================================================
*/

This documentation convention must remain throughout the ENTIRE project.

Every future file must follow this format.

Never remove these documentation blocks.

==========================================================
PROJECT STRUCTURE
==========================================================

Create scalable folders such as

src/

app/

components/

features/

hooks/

layouts/

pages/

services/

stores/

types/

constants/

utils/

assets/

config/

lib/

mock/

styles/

==========================================================
DESIGN SYSTEM
==========================================================

Create an internal design system.

Typography

Spacing

Radius

Elevation

Glass effects

Cards

Buttons

Inputs

Dialogs

Panels

Accordions

Scrollable areas

Tooltips

Empty states

Skeletons

Loading states

Status colors

Success

Warning

Danger

Info

Everything reusable.

==========================================================
THEME
==========================================================

Dark only.

Black

Slate

Gray

Purple

Blue accents

Subtle gradients

Soft shadows

Glassmorphism where appropriate.

Animated glowing borders sparingly.

==========================================================
ANIMATIONS
==========================================================

Use Motion library.

Smooth page transitions.

Component entrance animations.

Hover animations.

Button feedback.

Card lift.

Progress animations.

Typing indicator.

Loading shimmer.

Animated sidebar.

Respect reduced motion.

==========================================================
INITIAL PAGES
==========================================================

Landing Page

About Project

Candidate Selection

Interview Setup

Interview Screen

Feedback Screen

404

Settings

==========================================================
INTERVIEW PAGE (MOCK)
==========================================================

Build complete UI only.

Include:

Chat area

Question cards

Typing indicator

Candidate profile sidebar

Progress

Interview timeline

Question counter

Curriculum coverage

Session timer

Answer input

Submit button

Feedback drawer

End interview modal

Everything powered using mock data.

==========================================================
MOCK DATA
==========================================================

Create realistic mock services.

Mock candidate.

Mock curriculum.

Mock interview.

Mock feedback.

These services should mimic backend responses.

==========================================================
STATE MANAGEMENT
==========================================================

Use Zustand.

Separate stores by feature.

No UI logic inside stores.

==========================================================
ROUTING
==========================================================

Modern routing.

Layouts.

Protected route abstraction (mock).

404.

==========================================================
ERROR HANDLING
==========================================================

Error boundaries.

Fallback UI.

Toast notifications.

Skeleton loading.

Empty states.

==========================================================
README
==========================================================

Update README with:

Project overview

Architecture

Folder structure

Tech stack

How to run

Future backend roadmap

==========================================================
BACKEND REQUIREMENTS
==========================================================

DO NOT BUILD THE BACKEND.

Instead create a markdown file:

backend-requirements.md

Inside it document:

Complete backend architecture.

Folder structure.

API requirements.

Agent architecture.

RAG architecture.

Database schema.

Vector database.

Memory strategy.

Prompt strategy.

Session handling.

Evaluation pipeline.

Feedback generation.

HTTP endpoints.

Authentication (future).

Caching.

Observability.

Deployment.

Every future backend prompt should update this document.

==========================================================
OUTPUT EXPECTATION
==========================================================

Do NOT rush.

Think like a Staff Software Engineer.

Create a production-ready frontend foundation.

Prefer scalability over shortcuts.

Use latest best practices.

The generated code should look like something maintained by a professional engineering team.

No placeholder spaghetti code.

Everything should be modular, reusable, and extensible.


# Prompt 2 — Complete Frontend Redesign (White • Black • Gold Premium Theme)

The current frontend is functionally correct but visually weak. I am NOT satisfied with the layout, spacing, hierarchy, typography, UX, or overall premium feel.

Do NOT patch the existing UI.

Instead, redesign the frontend from first principles while keeping the existing functionality.

====================================================
IMPORTANT
====================================================

Before changing anything:

1. Scan every page.
2. Analyze every component.
3. Analyze spacing.
4. Analyze typography.
5. Analyze responsiveness.
6. Analyze user flow.
7. Analyze information hierarchy.
8. Identify weak layouts.
9. Replace poor layouts with better ones.

Think like a Senior Product Designer at Apple, Linear, Notion, Vercel or OpenAI.

Don't just beautify.

Improve the experience.

====================================================
COLOR SYSTEM
====================================================

REMOVE the purple theme entirely.

The new theme should use ONLY

Black
White
Gold

Primary Background
#0A0A0A

Secondary Surface
#111111

Elevated Surface
#171717

Borders
#262626

Primary Text
#FFFFFF

Secondary Text
#A3A3A3

Muted
#737373

Gold Accent
#D4AF37

Light Gold
#E6C76B

Hover Gold
#F0D878

Success
#22C55E

Error
#EF4444

Warning
#F59E0B

Gold should be used ONLY for:

buttons

hover states

active navigation

important numbers

progress

badges

small highlights

Never use gold as large backgrounds.

====================================================
TYPOGRAPHY
====================================================

DO NOT USE DEFAULT FONTS.

Inside the project there is already a fonts folder.

Scan it.

Identify the available font family.

Use ONLY those fonts.

Do not download fonts from Google.

Use the supplied fonts.

Create proper typography tokens.

Large Display

Hero

Section Titles

Card Titles

Body

Small Labels

Captions

Monospace (if available)

Typography should immediately feel premium.

====================================================
DESIGN STYLE
====================================================

The product should feel like

Apple

Linear

OpenAI

Cursor

Perplexity

Raycast

Vercel Dashboard

Notion

NOT like an admin template.

NOT like Bootstrap.

NOT like Material Dashboard.

====================================================
LAYOUT
====================================================

Completely rethink every page.

Use large whitespace.

Proper page containers.

Max widths.

Section spacing.

Consistent gutters.

8px spacing system.

No stretched components.

No cramped layouts.

Everything aligned perfectly.

Every page should have

Hero

Content

Secondary information

Clear CTA

Strong visual hierarchy

====================================================
COMPONENTS
====================================================

Redesign every component.

Navigation

Sidebar (if needed)

Cards

Buttons

Tables

Inputs

Dropdowns

Dialogs

Badges

Progress bars

Tabs

Empty States

Skeletons

Loading

Tooltips

Everything should belong to one design system.

====================================================
LANDING PAGE
====================================================

Current landing page is weak.

Redesign it.

Large hero.

Better typography.

Premium illustrations using CSS only.

Strong CTA.

Beautiful sections.

Feature grid.

Architecture preview.

Interview workflow.

Footer.

Scrolling experience.

====================================================
CANDIDATES PAGE
====================================================

The current candidate cards waste space.

Instead create a premium layout.

Possible ideas

Modern table

Hybrid cards

Search panel

Filters

Sorting

Status chips

Experience visualization

Completion progress

Mission stats

Expandable row

Quick preview

Selection animation

Large breathing room.

====================================================
INTERVIEW SETUP
====================================================

Current page looks like a form.

Instead build a guided experience.

Step based layout.

Candidate summary.

Curriculum coverage.

Interview difficulty.

Topics.

Estimated duration.

Question distribution.

Live preview.

Summary card.

Launch CTA.

Much better spacing.

====================================================
INTERVIEW PAGE
====================================================

This is the most important page.

It should feel like an AI interview platform.

Layout idea

Left

Curriculum Progress

Session Progress

Question Navigator

Middle

Conversation

Typing animation

Rich code blocks

Markdown

Streaming messages

Right

Candidate Profile

Live Evaluation

Skills

Confidence

Coverage

Interview Timeline

Bottom

Premium message input

Action buttons

Voice placeholder (disabled)

Shortcuts

Everything should feel premium.

====================================================
FEEDBACK PAGE
====================================================

Build an executive report.

Large score.

Radar chart placeholder.

Strengths.

Weaknesses.

Recommendations.

Coverage.

Question analysis.

Timeline.

Printable report.

Download PDF button.

====================================================
NAVIGATION
====================================================

Minimal.

Premium.

Sticky.

Transparent on top.

Blur while scrolling.

Beautiful hover animations.

Gold active indicator.

====================================================
MOTION
====================================================

Use Motion.

Subtle only.

Page transitions.

Fade.

Lift.

Scale.

Reveal.

Stagger animations.

Hover interactions.

Micro interactions.

Never over animate.

====================================================
RESPONSIVENESS
====================================================

Desktop first.

Then tablet.

Then mobile.

Every breakpoint should feel intentionally designed.

====================================================
DESIGN SYSTEM
====================================================

Create reusable tokens.

Colors

Typography

Spacing

Radius

Elevation

Shadow

Animations

Buttons

Forms

Everything reusable.

====================================================
QUALITY
====================================================

Avoid generic dashboards.

Avoid repetitive cards.

Avoid giant empty spaces.

Avoid clutter.

Avoid inconsistent spacing.

Avoid different border radii.

Avoid inconsistent font sizes.

Avoid inconsistent shadows.

Everything should feel designed by one designer.

====================================================
CODE
====================================================

Maintain modular architecture.

Maintain DRY.

Maintain SOLID.

Maintain feature-based architecture.

Do not break existing routing.

Do not break mock services.

Do not break project structure.

Every reusable component should remain reusable.

====================================================
FINAL GOAL
====================================================

When someone opens this application, their first reaction should be:

"This looks like a real funded startup product."

The frontend should be clean, premium, modern, elegant, minimal, and highly polished.

Prioritize UX, visual hierarchy, typography, spacing, consistency, accessibility, and user experience over adding unnecessary visual effects.

# Prompt — Site-wide Layout & UX Architecture Refactor

The frontend styling is acceptable, but the SITE-WIDE LAYOUT is not.

DO NOT redesign colors or branding.

Instead, perform a complete UX and layout audit of the entire application.

Think like a Senior Product Designer and UX Engineer from Apple, Linear, Vercel, Notion, or OpenAI.

This task is NOT about adding animations or new components.

It is about fixing the overall page structure, spacing, hierarchy, proportions, alignment, and information architecture.

====================================================
STEP 1 — AUDIT
====================================================

Before making any changes, inspect every page and identify layout issues such as:

• Poor spacing
• Bad alignment
• Inconsistent margins
• Uneven card heights
• Weak visual hierarchy
• Sections competing for attention
• Poor content grouping
• Misaligned grids
• Excessive empty space
• Cramped sections
• CTA placement
• Typography imbalance
• Navigation alignment
• Container sizing
• Responsiveness

Treat the current UI as a wireframe rather than a finished design.

====================================================
GLOBAL LAYOUT SYSTEM
====================================================

Create a proper layout system used across the entire application.

Every page should share the same design language.

Define:

• Max content width
• Container widths
• Grid system
• Column spacing
• Vertical rhythm
• Section spacing
• Component spacing
• Page padding
• Header spacing
• Footer spacing

Everything must align perfectly.

====================================================
USE THE SCREEN PROPERLY
====================================================

The application currently wastes a large portion of desktop screen space.

Use modern dashboard layouts.

Content should breathe without looking empty.

Do not squeeze everything into a narrow centered column.

Scale intelligently for:

1440p

2K

4K

Large laptops

Small laptops

====================================================
ESTABLISH VISUAL HIERARCHY
====================================================

Every page should have one obvious focal point.

Users should naturally understand

1. Where they are

2. What they should do

3. What is most important

4. What information is secondary

Reduce cognitive load.

Group related content together.

====================================================
CONSISTENT PAGE STRUCTURE
====================================================

Every page should follow a predictable structure.

Page Header

↓

Short Description

↓

Primary Action

↓

Primary Content

↓

Secondary Content

↓

Supporting Information

↓

Footer

Maintain this hierarchy throughout the application.

====================================================
SECTION SPACING
====================================================

Increase whitespace.

Do not stack sections tightly.

Every section should have breathing room.

Use consistent vertical spacing.

Nothing should feel cramped.

Nothing should feel disconnected.

====================================================
GRID SYSTEM
====================================================

Replace inconsistent layouts with a proper grid.

Cards should align perfectly.

Equal heights.

Equal spacing.

Consistent gutters.

Responsive breakpoints.

No random widths.

====================================================
CARDS
====================================================

Cards currently feel randomly placed.

Improve:

Padding

Content hierarchy

Internal spacing

Icon alignment

Text alignment

Button placement

Card heights

Card grouping

Cards should feel related rather than floating independently.

====================================================
TYPOGRAPHY HIERARCHY
====================================================

Reduce oversized headings where necessary.

Improve spacing between

Heading

Subtitle

Description

Buttons

Section titles

Body text

Captions

Everything should read naturally.

====================================================
NAVIGATION
====================================================

Navigation should align with the content container.

Improve spacing between navigation items.

Improve active state placement.

Improve header height.

Make navigation feel intentional rather than floating.

====================================================
PAGE SPECIFIC IMPROVEMENTS
====================================================

Landing Page

• Better hero proportions
• Improve CTA placement
• Reduce clutter
• Better feature layout
• Strong scrolling rhythm

Candidates Page

• Better search/filter placement
• Cleaner grid
• Better use of horizontal space
• Better information hierarchy

Interview Setup

• Transform into a guided workflow
• Better grouping
• Step-by-step progression
• Better spacing between controls

Interview Screen

• Professional three-column layout
• Fixed conversation area
• Better sidebar proportions
• Better message width
• Better metadata placement

Feedback Page

• Executive dashboard layout
• Better chart placement
• Better summary hierarchy
• Cleaner recommendations section

====================================================
RESPONSIVENESS
====================================================

Desktop should feel intentionally designed.

Tablet should not simply stack everything.

Mobile should have its own layout.

Avoid awkward wrapping.

Avoid overflowing components.

====================================================
DO NOT
====================================================

Do NOT redesign branding.

Do NOT change colors.

Do NOT replace the design language.

Do NOT add unnecessary components.

Do NOT over-animate.

Do NOT increase complexity.

Focus purely on layout quality.

====================================================
GOAL
====================================================

The final product should feel like it was designed by an experienced product designer.

Every page should have:

• Clear hierarchy
• Consistent spacing
• Excellent proportions
• Balanced whitespace
• Strong alignment
• Predictable layouts
• Premium UX

If two pages solve similar problems, they should follow the same layout patterns.

Prioritize clarity, readability, usability, and visual balance over adding more UI elements.

# MASTER FRONTEND LAYOUT REBUILD PROMPT

STOP.

Do NOT continue modifying the current frontend.

The current frontend has reached a point where incremental improvements are hurting the product.

Treat the current frontend as an early prototype.

I want you to redesign the ENTIRE frontend architecture from scratch while preserving the existing functionality and routing.

This is NOT a component redesign.

This is NOT a color redesign.

This is a COMPLETE LAYOUT SYSTEM REBUILD.

==========================================================
FIRST STEP (MANDATORY)
==========================================================

Before writing a single line of code:

Audit EVERY page.

Audit EVERY section.

Audit EVERY layout.

Audit EVERY breakpoint.

Identify every UX issue.

Identify every hierarchy issue.

Identify every responsiveness issue.

Identify every spacing issue.

Identify every accessibility issue.

Only after completing this analysis should implementation begin.

Do NOT blindly modify the current design.

==========================================================
DO NOT PRESERVE BAD LAYOUTS
==========================================================

You have permission to completely replace:

Entire page layouts

Section layouts

Navigation

Grid systems

Containers

Card arrangements

Content flow

Whitespace

Component placement

Responsive behavior

You are NOT expected to preserve existing layouts.

Only preserve functionality.

==========================================================
BUILD A DESIGN SYSTEM
==========================================================

Everything should be based on ONE design system.

Every page must share:

Container widths

Grid

Spacing

Typography

Component sizes

Section spacing

Navigation height

Footer spacing

Card padding

Border radius

Animation timing

Everything should feel like one product.

==========================================================
RESPONSIVE FIRST
==========================================================

The current project does NOT feel responsive.

I want the project rebuilt using a true responsive design methodology.

Design independently for:

Large Desktop (2560+)

Desktop (1920)

Laptop (1440)

Small Laptop (1280)

Tablet Landscape

Tablet Portrait

Large Phone

Small Phone

DO NOT simply stack components.

Each breakpoint should have its own intentional layout.

==========================================================
DESKTOP EXPERIENCE
==========================================================

Desktop should NOT look like a stretched mobile app.

Use horizontal space intelligently.

Create layouts that feel designed for large monitors.

Use multiple columns where appropriate.

Allow breathing room.

Avoid narrow centered layouts.

Avoid giant empty regions.

Avoid oversized cards.

==========================================================
TABLET EXPERIENCE
==========================================================

Tablet should NOT be desktop squeezed.

Rebuild layouts specifically for tablets.

Cards should reorganize.

Navigation should adapt.

Content hierarchy should remain obvious.

==========================================================
MOBILE EXPERIENCE
==========================================================

Mobile should NOT simply collapse desktop.

Create dedicated mobile layouts.

Reduce visual noise.

Prioritize actions.

Improve touch targets.

Proper spacing.

Thumb-friendly interactions.

Bottom spacing.

Sticky actions where useful.

==========================================================
EVERY PAGE MUST BE REBUILT
==========================================================

Landing

Candidates

Interview Setup

Interview

Feedback

About

Architecture

Settings

404

Every page should have a different layout where appropriate while still following the same design language.

==========================================================
PAGE STRUCTURE
==========================================================

Every page should have:

Clear Hero

Primary Content

Supporting Content

Secondary Actions

Proper Footer

Strong hierarchy

Consistent rhythm

Nothing should feel randomly placed.

==========================================================
GRID SYSTEM
==========================================================

Implement a professional grid system.

12-column desktop

8-column tablet

4-column mobile

Use CSS Grid wherever appropriate.

Do not rely entirely on Flexbox.

Everything should snap to the grid.

==========================================================
SECTION SYSTEM
==========================================================

Every section must have

Top spacing

Bottom spacing

Internal padding

Consistent heading spacing

Proper alignment

No section should directly touch another.

==========================================================
TYPOGRAPHY
==========================================================

Current typography hierarchy is weak.

Rebuild typography completely.

Every heading should have purpose.

Every paragraph should have readable width.

Never allow text to span excessively long lines.

Maintain proper line-height.

Maintain proper rhythm.

==========================================================
CONTENT WIDTH
==========================================================

Create reusable layout containers.

Example philosophy:

Hero Width

Content Width

Dashboard Width

Reading Width

Form Width

Chat Width

Do NOT use one container for every page.

==========================================================
CARDS
==========================================================

Current cards feel randomly positioned.

Rebuild card layouts.

Equal heights where appropriate.

Consistent internal spacing.

Consistent alignment.

Consistent padding.

Proper grouping.

Cards should belong to sections.

==========================================================
USER EXPERIENCE
==========================================================

Before implementing every page ask:

What is the user's primary goal?

What should they see first?

What should they click first?

What information matters most?

Remove everything else from primary focus.

==========================================================
QUALITY BAR
==========================================================

The final application should feel comparable to:

OpenAI Platform

Vercel Dashboard

Linear

Raycast

Stripe Dashboard

Apple

Notion

Perplexity

NOT like:

Bootstrap Admin

Material Dashboard

TemplateForest

Generic SaaS Template

==========================================================
IMPORTANT
==========================================================

Do NOT try to save the existing layout.

Start over.

Preserve:

Business logic

Components

Stores

Routing

Services

Mock APIs

Only rebuild the frontend architecture.

==========================================================
FINAL GOAL
==========================================================

When opened on ANY device:

Desktop

Laptop

Tablet

Mobile

the interface should feel intentionally designed for THAT device.

The UI should never look like a resized version of another layout.

It should feel handcrafted for every screen size.

Do not stop until the application looks like a premium production SaaS built by an experienced product design team.