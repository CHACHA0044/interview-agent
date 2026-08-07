# Frontend Layout Audit (Pre-Implementation)

## Scope
Audit covered all routed pages and shared layout layers:
- `/` Landing
- `/candidates`
- `/interview/setup`
- `/interview/:sessionId`
- `/interview/:sessionId/feedback`
- `/about` (Architecture)
- `/settings`
- `*` 404
- Root shell (`RootLayout`, `Navbar`), page transition wrapper, shared UI primitives

## Core System Findings

### 1) Container and width architecture issues
- A single hard-coded container pattern (`max-w-[1440px] px-6 sm:px-10 lg:px-12`) is repeated page-by-page.
- Inconsistent widths (`max-w-6xl`, `max-w-4xl`) appear without semantic intent.
- No dedicated container semantics for hero/content/dashboard/reading/form/chat.
- No adaptive behavior for 1920+ and 2560+ displays; layouts cap early and leave unbalanced empty regions.

### 2) Grid architecture issues
- Page-level grids are ad hoc (`lg:grid-cols-12`, `xl:grid-cols-4`, etc.) without one shared grid contract.
- No explicit 12/8/4 responsive system applied consistently across pages.
- Tablet breakpoints often inherit desktop structure rather than intentional tablet composition.

### 3) Spacing and rhythm issues
- Vertical rhythm varies by page (`space-y-10`, `space-y-12`, `space-y-24`, etc.) with no tokenized system.
- Section separation depends on one-off margins/padding, causing inconsistent hierarchy density.
- Card internal spacing and section heading spacing differ by page and component.

### 4) Typography hierarchy issues
- Heading scales and paragraph widths vary unpredictably by route.
- Long text lines frequently exceed comfortable reading length.
- Section subtitles and metadata labels lack a consistent hierarchy pattern.

### 5) Navigation and shell issues
- Navbar uses fixed heights and ad hoc link treatment; mobile hierarchy is cramped.
- No skip-link to main content.
- Footer is only implemented on landing; remaining pages have no consistent secondary/footer zone.

### 6) Accessibility issues
- Inconsistent landmark structure across pages.
- Interactive topic cards in Interview Setup are click-divs (insufficient keyboard semantics).
- Focus-visible is present in some primitives but not guaranteed across all interactive elements.
- Mobile touch targets are not consistently sized to a minimum target.
- Some content groupings lack semantic list/form structure.

### 7) Responsiveness quality issues by device class
- **Large Desktop (2560+)**: capped containers create overly centered, narrow experience.
- **Desktop (1920) / Laptop (1440)**: some pages underuse horizontal space; others become card-heavy without clear grouping.
- **Small Laptop (1280)**: dashboard compositions begin to feel crowded.
- **Tablet landscape/portrait**: often desktop squeezed rather than redesigned compositions.
- **Large/Small phone**: many sections simply stack; action hierarchy and spacing are not consistently optimized for thumbs.

## Page-by-page findings

### Landing
- Hero split exists but spacing and supporting sections are oversized/inconsistent.
- Pipeline + feature sections use different card sizing rhythm.
- Footer appears only here, breaking global consistency.

### Candidates
- Filtering and card roster work functionally, but hierarchy between search/filter/roster is weak.
- Grid progression is inconsistent across medium and large breakpoints.
- Card internals and CTA alignment need stronger standardization.

### Interview Setup
- Useful split pattern, but left/right composition is not re-authored for tablet/mobile.
- Topic selectors use non-semantic clickable containers.
- Form rhythm and step hierarchy need stronger tokenized spacing.

### Interview
- Desktop 3-column works functionally, but side panels disappear on mobile instead of becoming intentional mobile/tablet structures.
- Workspace hierarchy (session meta, primary chat, supporting telemetry/actions) is not consistently prioritized across breakpoints.

### Feedback
- Dashboard concept is strong but section spacing and card grouping are inconsistent.
- Top summary and detailed sections need better container semantics and rhythm.

### About (Architecture)
- Uses different container strategy than other pages.
- Structure does not clearly separate hero/primary/supporting/secondary action zones.

### Settings
- Form page uses a different width and rhythm than other app pages.
- CTA and content container hierarchy can be clearer for mobile and tablet.

### 404
- Functional, but not integrated into shared section/container rhythm and footer structure.

## Redesign decisions

1. Establish one reusable layout system with semantic containers:
   - Hero, Content, Dashboard, Reading, Form, Chat
2. Introduce one responsive grid contract used everywhere:
   - 4 columns mobile, 8 columns tablet, 12 columns desktop
3. Introduce global tokens:
   - spacing rhythm, typography scales, component sizing, nav height, card paddings/radii, motion timings
4. Rebuild root shell:
   - skip-link, semantic landmarks, responsive nav hierarchy, global footer
5. Recompose each page into explicit zones:
   - Hero, Primary Content, Supporting Content, Secondary Actions
6. Improve accessibility baseline:
   - heading structure, focus-visible consistency, semantic controls, touch target minimums, controlled line lengths
7. Preserve all business logic, state flows, routes, services, and mocks while replacing layout composition.
