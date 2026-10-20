# WhyNot analytics dashboard

Local desktop web dashboard for the four Flutter admin views. It connects to the shared production Firebase project `whynot-f4ae6`. There is no hosted site and no service account in the browser.

## Run on your computer

Prerequisites: Node.js 22 or 24, network access, and an existing Firebase Authentication email/password account with the `admin: true` custom claim.

```bash
git clone <dashboard-repository-url>
cd whynot-analytics-dashboard
npm ci
npm run dev
```

Open the Vite URL, normally `http://127.0.0.1:5173`. Every teammate can run a separate copy on their own localhost; cloning does not create a local Firebase database. The public Web SDK configuration in `src/firebase.js` points to production. A regular account can sign in but cannot open analytics. Sign out with the button in the top bar.

If sign-in is rejected despite correct credentials, check that Email/Password sign-in is enabled, the account has the custom claim, the token was refreshed by signing out and in, and localhost is allowed in the Firebase Authentication authorized domains. The frontend checks a freshly refreshed token, while Firestore Security Rules independently check the claim on every read.

## Metrics and interactions

| View | Information and controls | Backend source |
| --- | --- | --- |
| Saved products | Average per active user; one versus two or more products; current products; active users; zero-product users; 1–5, 6–10, 11–20, 21–50, 51+ distribution; Users / % users toggle | `products`, `users` |
| Recommended products | Total successful recommendation saves | `productEvents` with `recommendation_shown`, `savedAt`, and `savedProductId` |
| Purchased products | Current and previous month counts, 6 / 12 / 24 month stacked chart, category visibility and segment detail | `products` with `purchased` and `purchasedAt` |
| Demographic profile | Category selector, median age, age bands, gender shares, top cities and other/unknown | Current `products` owners, `users`, `categories`, `cities` |

The definitions match the existing Flutter summary models. In particular, the demographic screen describes owners of current products in a category, even if those products have not been marked purchased. Purchase month boundaries use `America/Bogota`. BQ3 is a historical event count, so deleting the saved product later does not reduce it; the legacy `adminMetrics/recommendedProductSaves` document is neither read nor updated by this dashboard.

The dashboard reads `products`, `users`, `categories`, `cities`, and BQ3's `productEvents` with the Firebase Web SDK, then calculates the four views in `src/analytics.js`. It makes no Firestore writes. Firestore Security Rules allow these reads only for the same `admin: true` application role used by Flutter, except the public city catalog. This role is separate from Google Cloud project ownership.

After sign-in, the dashboard loads these collections once and keeps the data and calculated views in memory while the session is open. Switching views or filters reuses that data. Use **Refresh** to fetch current Firestore data again; signing out also clears the cache.

## Backend setup and validation

The sibling `whynot-back` repository must have the updated `productEvents` read rule deployed to `whynot-f4ae6` before BQ3 works. From that repository:

```bash
npm run test:rules
firebase deploy --only firestore:rules --project whynot-f4ae6
```

Firestore emulator tests use `demo-whynot` and do not modify production. They need Java 21. The production BQ3 test script creates a recommendation save and **does modify production data**, so do not run it for read-only verification.

For browser testing against local emulators, run Auth and Firestore emulators for `demo-whynot`, seed the data, then start this dashboard with `VITE_USE_EMULATORS=true npm run dev`. This explicit flag changes the project ID to `demo-whynot`; the default always uses production.

For a read-only production check after deployment: run the dashboard, sign in with an admin account, inspect each view and change its filters, refresh, sign out, then sign in with a regular account and confirm access is denied. A second teammate should repeat from another computer.

## Development commands

```bash
npm run build
npm run preview
```
