# CASA Worcester Community Resource Guide

A web app that catalogs community resources for CASA Worcester volunteers and staff.

Built with React, Vite, Tailwind CSS, and Firebase (Auth, Firestore, Storage, Hosting).

## Quick Start

If you already have Node.js, Git, and the repo cloned, jump to [Install Dependencies](#3-install-dependencies).

Otherwise, follow the full setup below.

## Prerequisites

You'll need these installed on your machine:

### Node.js (v20 or later recommended)

**Mac (using Homebrew):**
```bash
brew install node
```

**Windows:**
Download the installer from [nodejs.org](https://nodejs.org/) and run it.

**Verify install:**
```bash
node --version
npm --version
```

### Git

**Mac:** Comes pre-installed. If not, run `xcode-select --install`.

**Windows:** Download from [git-scm.com](https://git-scm.com/download/win).

### Firebase CLI (for deploying)

```bash
npm install -g firebase-tools
```

## Setup

### 1. Clone the Repo

```bash
git clone https://github.com/amyworks/casa-worcester-crg.git
cd casa-worcester-crg
```

### 2. Set Up Environment Variables

Amy will share a `.env.local` file via Google Drive. Download it and place it in the project root (the same folder as `package.json`).

This file contains the Firebase config keys that connect the app to the backend.

**Note:** `.env.local` is gitignored and should never be committed.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Dev Server

```bash
npm run dev
```

The app will open at [http://localhost:5173](http://localhost:5173). Edits hot-reload automatically.

## Common Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the local dev server with hot reload |
| `npm run build` | Build production-ready files into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Check code style with ESLint |

## Deploying

The app is hosted on Firebase Hosting at [casa-worcester-crg.web.app](https://casa-worcester-crg.web.app).

### First-Time Deploy Setup

1. Log in to Firebase:
   ```bash
   firebase login
   ```
   Use the FxM Tech account when prompted.

2. Confirm the project is selected:
   ```bash
   firebase use casa-worcester-crg
   ```

### Deploying Changes

Always build before deploying:

```bash
npm run build
firebase deploy
```

To deploy only hosting (faster, skips Firestore rules etc.):

```bash
firebase deploy --only hosting
```

## Project Structure

```
src/
  components/     Reusable UI components
    layout/       Header, navigation, footer
    resources/    Resource cards, entry forms
    cases/        Case management forms (currently disabled)
  contexts/       React contexts (auth, etc.)
  data/           Static data (MA geography, etc.)
  firebase/       Firebase config and Firestore helpers
  pages/          Route-level page components
  router.jsx      App routing
public/
  logos/          Static partner logos
  regions/        MA region map images
  counties/       MA county map images
scripts/          Node scripts for data import/export
```

## Firebase Project Access

To work on this project, you'll need to be added as:

1. **GitHub collaborator** on `amyworks/casa-worcester-crg` (Amy can invite you)
2. **Firebase project member** on `casa-worcester-crg` (Amy can invite you via the Firebase console)

## Working on the Code

### Branch Workflow

- `main` is the production branch - deploys go from here
- Create feature branches off `main` for new work: `git checkout -b your-branch-name`
- Open a PR back to `main` when ready

### Reviewing PRs

PRs are reviewed in the GitHub UI at [github.com/amyworks/casa-worcester-crg/pulls](https://github.com/amyworks/casa-worcester-crg/pulls).

## Need Help?

- **Tech / setup issues:** Amy Coleman (acoleman@fxmtechgroup.com)
- **Resource content / data:** Gloriann Switzer (gswitzer@thecasaproject.org)
