# Nub Cal

A mobile-first PWA for counting calories, planning meals and tracking body progress. I built it to track my own weight loss.

**Live demo:** https://nubcal.web.app. Tap **"Just looking? Try the demo"** on the login screen to open a sample account without signing up.

## Features

- **Today**: log meals and see calories, protein, carbs and fat left for the day
- **Plan**: build reusable menus from ingredients and plan meals ahead
- **Foods**: personal food database with nutrition per serving
- **Progress**: weight and body-composition charts over time
- **Demo mode**: an anonymous account pre-filled with sample data
- **Installable PWA**: works offline after the first visit and can be added to the home screen

## Tech stack

- Angular 18 (standalone components, signals), TypeScript, RxJS
- Angular Material and Tailwind CSS
- Apache ECharts (`ngx-echarts`) for charts
- Firebase Authentication (email/password and anonymous) and Cloud Firestore
- Firebase Hosting, with an Angular service worker for offline caching

## Security

All user data lives under `users/{uid}/…` in Firestore. The rules in [`firestore.rules`](firestore.rules) only let a signed-in user read and write their own documents. Everything else is denied, and the Realtime Database is locked in [`database.rules.json`](database.rules.json) because the app doesn't use it.

The Firebase web config in `src/environments/firebase.config.ts` is public by design: it identifies the project but grants no access. Access is enforced by the security rules above.

## Project structure

```
src/app/
  pages/      Today, Plan, Foods, Progress, Login, Welcome
  dialogs/    bottom-sheet forms (add food, edit entry, targets, …)
  stores/     signal-based state: profile, food log, menu plan
  shared/     services (session, user data, demo), guards, pipes, utils
```

## Running locally

```bash
pnpm install
pnpm start          # http://localhost:4203
```

## Build and deploy

```bash
pnpm build          # outputs to public/
firebase deploy     # hosting + Firestore and Realtime Database rules
```
