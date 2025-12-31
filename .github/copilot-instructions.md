# CASA Worcester Community Resource Guide - AI Agent Instructions

## Project Overview
This is a React + Vite SPA for CASA Worcester's community resource guide, using Firebase for auth/data and deployed via Firebase Hosting. The app helps users search and browse community resources with Google OAuth authentication for admin access.

**Critical context**: This is a **functional tool** for vulnerable populations, not a marketing site. The design is **intentionally calm, restrained, and trauma-informed**. Precision matters more than speed. Styling should never be improvised.

### Project Status
- **Infrastructure**: Complete (React Router, layout shell, Firebase setup)
- **Navigation & Header**: Production-ready
- **Legal Pages**: Complete (Privacy, Terms)
- **Next Phase**: Resource cards, listings page, filtering UI, Firestore integration, role-based permissions

## Architecture & Key Patterns

### Routing Structure
- **React Router v7** with `createBrowserRouter` in `src/router.jsx`
- **Layout pattern**: `ResourceGuideLayout` wraps all routes via `<Outlet />`, provides persistent header/nav
- **Route modes**: `/browse` and `/search` both use `Listings.jsx` but behave differently based on pathname/search params
- **Resource detail**: Dynamic route `/resource/:id` for individual resource pages

### Firebase Integration
Firebase config uses Vite env vars (`VITE_FIREBASE_*`) from `.env.local` (gitignored).

**Three-file organization** in `src/firebase/`:
- `firebase.js` - App initialization, exports `auth`, `db`, `googleProvider`
- `auth.js` - Auth functions: `signInWithGoogle()`, `logOut()`
- `firestore.js` - CRUD operations: `getResources()`, `addResource()`, `updateResource()`, `deleteResource()`

**Pattern**: Always import from these facade files, never directly from firebase packages in components.

### Firestore Data Model

**`resources` collection** - Community organizations with contact info and filterable metadata:
- Core fields: `name`, `website`, `contactEmail`, `contactPhone`, `address`, `city`, `state`, `zipCode`
- Content: `about`, `servicesOffered`, `additionalInfo`
- Filter arrays: `serviceDomains`, `populationsServed`, `accessMethods`, `eligibilityConstraints`
- Filter singles: `geographicCoverage`, `organizationType`
- Boolean flags: `crisisServices`, `spanishSpeaking`, `transportationProvided`, `interpretationAvailable`, `isActive`
- Management: `hasManager`, `managerId` (user ID or null)
- Metadata: `logoUrl`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

**`users` collection** - Authenticated users with role-based permissions:
- Identity: `id` (Firebase Auth UID), `email`, `name`, `agency`
- Access: `role` ("admin", "contributor", or "manager"), `isApproved`
- Management: `managedResources` (array of resource IDs for managers)
- Metadata: `createdAt`, `approvedBy` (admin user ID)

**`accessRequests` collection** - Account request submissions:
- User info: `name`, `email`, `agency`, `requestReason`
- Request: `requestedAccessLevel` ("admin", "contributor", or "manager")
- Status: `status` ("pending", "approved", or "denied")
- Processing: `requestedAt`, `processedAt`, `processedBy`, `resourcesAssigned` (array of resource IDs)

**`suggestedEdits` collection** - Edit suggestions for managed resources:
- Target: `resourceId`, `resourceName` (for display)
- Author: `suggestedBy` (user ID), `suggestedByName` (for display)
- Status: `status` ("pending", "approved", or "denied")
- Content: `changes` (object with key-value pairs of `{current, suggested}`)
- Metadata: `suggestedAt`, `processedAt`, `processedBy`

### Permission Logic (Role-Based Access)

| Role | Can Add | Can Edit Unassigned | Can Edit Managed | Can Suggest Edits | Can Approve |
|------|---------|---------------------|------------------|-------------------|-------------|
| **Admin** | Yes | Yes | Yes | N/A | Yes |
| **Contributor** | Yes | Yes | No | Yes (for managed) | No |
| **Manager** | No | No | Own only | N/A | Own suggestions |

**Key patterns**:
- Admins have full CRUD access to all resources and approve all requests
- Contributors can add/edit unassigned resources, suggest edits to managed resources
- Managers can only edit their assigned resources and approve suggestions for their resources
- All new resources default to unassigned (`hasManager: false`, `managerId: null`)

### Styling with Tailwind CSS v4
- **New @theme syntax** in `src/index.css` (not traditional `tailwind.config.js`)
- **Brand colors**: `brand-blue`, `brand-blue-dark`, `brand-plum`, `brand-red`, `brand-red-hover`, `brand-white`, `brand-gray`
- **Font**: Montserrat from Google Fonts (preloaded in `index.html` + defined in CSS), applied via `--font-sans`
- **Vite plugin**: Uses `@tailwindcss/vite` in `vite.config.js`
- **Typography pattern**: Legal pages use explicit pixel values (`text-[14px]`, `text-[20px]`) instead of Tailwind's default scale

### Design Philosophy (Critical - Read First)
**This app is not flashy. It is intentionally restrained.**

Core principles:
- **Calm, trustworthy, readable** - No "tech startup" aesthetics
- **No visual noise** - No overuse of bold, tracking, or animation
- **Trauma-informed** - Serving vulnerable populations
- **"Calm is a feature"** - If something looks "loud," it's probably wrong

**Typography rules (enforced)**:
- **Headings**: `font-bold` only, no extra tracking
- **Buttons/CTAs**: `font-semibold` or `font-bold`
- **Search input**: `font-medium`
- **Body text**: `font-normal`
- **Tracking**: Default only; may be used sparingly for ALL-CAPS labels, never for body text or inputs

**Color usage**:
- Blue backgrounds: Establish trust and calm
- Red: Reserved for actions/CTAs only
- White/gray: Keep interfaces readable
- Avoid color combinations that feel "loud" or promotional

### Component Organization
```
components/
  ├── GoogleSignInButton.jsx      # Reusable auth component
  ├── layout/                      # Layout components used by router
  │   ├── ResourceGuideLayout.jsx  # Main layout wrapper with nav state
  │   ├── ResourceGuideHeader.jsx  # Fixed header with menu trigger
  │   └── ResourceGuideNavigation.jsx # Full-screen overlay nav
  └── resources/                   # Domain-specific components
      └── ResourceSearchBar.jsx    # Search input (used on Home)

pages/                             # Route-level components
  ├── Home.jsx                     # Landing page with search/browse
  ├── Listings.jsx                 # Dual-mode for /browse and /search
  ├── ResourceDetail.jsx           # Dynamic resource detail page
  ├── SignIn.jsx, RequestAccess.jsx, Admin.jsx  # Stub pages (to be implemented)
  └── Terms.jsx, Privacy.jsx       # Legal pages with full content
```

**Page implementation status**:
- **Complete**: `Home`, `Listings`, `Terms`, `Privacy` - Production-ready with full styling
- **Stubs**: `SignIn`, `RequestAccess`, `Admin`, `ResourceDetail` - Placeholder components with `<div style={{padding:24}}>` pattern

### State Management Conventions
- **Auth state**: Managed in `App.jsx` via `onAuthStateChanged` listener
- **Nav state**: Local state in `ResourceGuideLayout`, passed to header/nav via props
- **No global state library**: Currently using React local state only

### Navigation Component Pattern
`ResourceGuideNavigation.jsx` is a **full-screen overlay** (not sidebar):
- Conditionally renders based on `open` prop
- Fixed positioning with `z-[60]` to overlay entire viewport
- Footer with legal links and copyright pinned via `mt-auto`
- Uses Heroicons for icons (`@heroicons/react`)

**Navigation footer rules (critical)**:
- Footer block is pinned to bottom of **viewport**, not just menu content
- Uses `mt-auto` within full-height flex column
- Has top padding only
- Has **50px bottom padding** to prevent clipping
- Legal links use underline styling
- Includes full organization contact info: CASA Project Worcester County, 100 Grove Street, Worcester, MA 01605, 508-757-9877, info@thecasaproject.org

### UI Component Patterns
**Search functionality**: `ResourceSearchBar` uses controlled input + form submission pattern:
```jsx
<form onSubmit={submit}>
  <input value={query} onChange={(e) => setQuery(e.target.value)} />
  <button type="submit">...</button>
</form>
```

**Search bar design rules (very specific - do not modify)**:
- White background with gray border
- Fully rounded pill shape (`rounded-full`)
- Max height: 60px
- Placeholder text: `brand-gray`
- Typed text: `brand-blue` with `font-medium`
- Submit button: Solid magnifying glass icon ONLY (no background, no text label, no rounded container)
- Icon color: `brand-red` with hover state `brand-red-hover`

**Header**: Fixed `top-0` header (64px height) with CASA logo + hamburger menu trigger. Uses `/casa-logo-light.png` from `public/`.

**Legal pages**: `Terms.jsx` and `Privacy.jsx` use consistent styling with `text-brand-blueDark`, specific font sizes (`text-[14px]`, `text-[20px]`), and max-width container pattern.

## Development Workflow

### Commands
```bash
npm run dev       # Start dev server (Vite HMR on localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint check
```

### Git Workflow
- **Feature branches** are always merged before starting new work
- Changes are **scoped tightly** and committed frequently
- Clean feature-branch workflow with regular merges to main
- Current branch: `feature/legal-pages`

### Firebase Deployment
```bash
firebase deploy   # Deploys dist/ to Firebase Hosting
```
- Build artifact: `dist/` directory
- SPA routing: All routes rewrite to `/index.html` (see `firebase.json`)

### Environment Setup
Create `.env.local` with Firebase credentials:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Code Conventions

### ESLint Configuration
- **Flat config** format (`eslint.config.js`, not `.eslintrc`)
- React Hooks + React Refresh rules enabled
- **Custom rule**: Unused vars OK if uppercase (e.g., `_ComponentName`)

### Import Patterns
- Always use relative imports from `src/` (no aliases configured)
- Firebase imports: Use facade files (`src/firebase/*`), not direct SDK imports in components
- Vite env vars: Access via `import.meta.env.VITE_*`

### Component Conventions
- **Functional components** with hooks (no class components)
- Export default for all page/component files
- Props: Use destructuring in function signature
- Event handlers: Inline for simple cases, extracted functions for complex logic
- **Stub pattern**: Incomplete pages use `<div style={{padding:24}}>` with minimal content placeholder

### Navigation Flow
- Use `navigate()` from `useNavigate` hook for programmatic navigation
- Use `<Link>` from `react-router-dom` for declarative links
- Close nav overlay by calling `onClose()` after navigation (see `ResourceGuideNavigation.jsx`)

### Asset Management
- Logo assets in `public/`: `casa-logo-light.png` (header), `casa-logo.png` (favicon)
- Reference public assets with leading slash: `/casa-logo-light.png`
- Favicon configured in `index.html`

## Common Tasks

### Adding a New Route
1. Create page component in `src/pages/`
2. Import and add route object in `src/router.jsx` under `ResourceGuideLayout` children
3. Add navigation link in `ResourceGuideNavigation.jsx` if user-facing

### Implementing a Stub Page
Stub pages follow this pattern (replace inline styles with full layout):
```jsx
export default function PageName() {
  return <div style={{ padding: 24 }}>PageName</div>;
}
```
When implementing, add proper layout container, brand colors, and responsive spacing.

### Adding Firebase Operations
1. Add function in `src/firebase/firestore.js` (or `auth.js` for auth)
2. Import and use in components
3. Handle loading/error states in components

### Adding Brand Colors
1. Define in `src/index.css` under `@theme` with `--color-brand-*` format
2. Use in components via Tailwind: `bg-brand-{name}`, `text-brand-{name}`, etc.

### Working with Icons
- Uses `@heroicons/react` (v2.2.0) with `/24/solid` and `/24/outline` imports
- Example: `import { XMarkIcon } from "@heroicons/react/24/solid"`

## Filter System

### Service Domains (Multi-select)
Housing & Shelter, Domestic Violence & Safety, Foster Care & Child Welfare, Parenting & Family Support, Food & Nutrition, Clothing & Basic Needs, Hygiene & Personal Care, Healthcare & Mental Health, Substance Use & Recovery, Legal Aid & Advocacy, Education & Youth Programs, Employment & Job Training, Immigration & Refugee Support, Disability & Accessibility Support, Financial Assistance, Community & Mutual Aid

### Populations Served (Multi-select)
Infants and toddlers, Young children, Adolescents, Transition-Age Youth, Adults, Families, Survivors of Domestic Violence, Foster / Kinship Families, Individuals with Disabilities, Immigrants / Refugees, Justice-Involved Individuals, Low-Income / Housing-Insecure Individuals

### Geographic Coverage (Single-select)
City-specific, County-wide, Regional, Statewide, Multi-state / National

### Organization Type (Single-select)
Nonprofit Organization, Government Agency, Community-Based Organization, Faith-Based Organization, Mutual Aid / Grassroots, Healthcare Provider, Educational Organization

### Access Methods (Multi-select)
Self-Referral, Professional Referral Required, Agency Referral Only, Walk-In, Appointment Required, Online Request, Phone Request, Emergency / Crisis Access

### Eligibility Constraints (Multi-select)
Age Restrictions, Income-Based Eligibility, Residency Requirements, Documentation Required, Waitlist Likely, Limited Capacity, Emergency-Only

### Secondary Filters (Boolean checkboxes)
- Crisis/Emergency services available
- Spanish-speaking services
- Transportation provided
- Interpretation/translation available

## Key Files to Reference
- `src/router.jsx` - Complete routing structure
- `src/components/layout/ResourceGuideLayout.jsx` - Layout pattern example
- `src/firebase/firestore.js` - Firebase operation patterns
- `src/index.css` - Tailwind v4 theme configuration
- `firebase.json` - Hosting and SPA routing config
