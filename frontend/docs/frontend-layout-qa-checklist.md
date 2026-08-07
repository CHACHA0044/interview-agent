# Frontend Layout QA Checklist

## Breakpoint matrix validation

- [x] **Large Desktop (2560+)**: semantic container widths scale up (`hero/content/dashboard/chat`) to avoid narrow-center layouts.
- [x] **Desktop (1920)**: 12-column composition active for page shells and dashboard views.
- [x] **Laptop (1440)**: 12-column layouts preserve hierarchy and card grouping.
- [x] **Small Laptop (1280)**: transitions to compact desktop structure without collapsing information architecture.
- [x] **Tablet Landscape**: 8-column structure applied; major pages recompose sections instead of squeezed desktop.
- [x] **Tablet Portrait**: 8-column structure with deliberate card/group reflow.
- [x] **Large Phone**: 4-column structure with reduced visual noise and stacked priorities.
- [x] **Small Phone**: touch target minimums and spacing rhythm preserved.

## Accessibility baseline checks

- [x] Skip link added to app shell and main landmark maintained.
- [x] Page heading hierarchy standardized (`h1` page titles, section headings grouped semantically).
- [x] Focus-visible states enforced globally and retained in controls.
- [x] Keyboard operability improved for topic selection (button + `aria-pressed`).
- [x] Touch target sizing applied for nav/chip/form controls.
- [x] Long-form text constrained with reading widths to avoid excessive line length.
- [x] Modal and drawer controls include improved semantics/labels.

## Page-by-page validation

### Landing
- [x] Hero / Primary / Supporting structure reauthored with coherent section rhythm.
- [x] Pipeline and feature card systems aligned to shared grid and surface tokens.

### Candidates
- [x] Hero, filtering, and roster sections separated with clear hierarchy.
- [x] Card equalization and CTA placement consistent across breakpoints.

### Interview Setup
- [x] Form shell rebuilt with dedicated form container and 12/8/4 grid transitions.
- [x] Candidate context, topic selection, calibration controls, and guardrails grouped into clear steps.

### Interview
- [x] Workspace bar, chat core, candidate context, and telemetry zones rebuilt for desktop/tablet/mobile intent.
- [x] Mobile/tablet no longer rely on hidden desktop-only side content for core context.

### Feedback
- [x] Summary hero, score panel, strengths/gaps, topic breakdown, and next-step actions mapped into consistent section architecture.

### About (Architecture)
- [x] Reframed into hero + architecture pillars + technical foundation sections using shared tokens.

### Settings
- [x] Runtime settings page rebuilt using form container semantics and consistent action hierarchy.

### 404
- [x] Error state integrated into shared container/section/surface system with primary and secondary actions.

## Validation commands

- [x] `npm run lint`
- [x] `npm run build`

## Notes

- Existing functionality, routing, state management, services, and mock API behavior were preserved.
- A Vite chunk-size warning remains informational and unchanged from behavior scope.
