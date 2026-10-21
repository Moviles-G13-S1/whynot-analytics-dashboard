# WhyNot analytics dashboard

Local desktop web dashboard for WhyNot admin analytics. It connects to the shared production Firebase project `whynot-f4ae6` and displays metrics calculated by the `get_admin_analytics` Firebase callable. There is no hosted site and no service account in the browser. The Flutter admin screens are legacy; the web dashboard is the target admin interface.

## Run on your computer

Prerequisites: Node.js 22 or 24, network access, and an existing Firebase Authentication email/password account with the `admin: true` custom claim.

```bash
git clone <dashboard-repository-url>
cd whynot-analytics-dashboard
npm ci
npm run dev
```

Open the Vite URL, normally `http://127.0.0.1:5173`. Every teammate can run a separate copy on their own localhost; cloning does not create a local Firebase database. The public Web SDK configuration in `src/firebase.js` points to production. A regular account can sign in but cannot open analytics. Sign out with the button in the top bar.

If sign-in is rejected despite correct credentials, check that Email/Password sign-in is enabled, the account has the custom claim, the token was refreshed by signing out and in, and localhost is allowed in the Firebase Authentication authorized domains. The frontend checks a freshly refreshed token, while the callable independently requires `admin: true` on every request.

## Metrics and interactions

| View | Information and controls | Data used by the backend |
| --- | --- | --- |
| Saved products | Average per active user; one versus two or more products; current products; active users; zero-product users; 1–5, 6–10, 11–20, 21–50, 51+ distribution; Users / % users toggle | `products`, `users` |
| Recommended products | Total successful recommendation saves | `productEvents` with `recommendation_shown`, `savedAt`, and `savedProductId` |
| Purchased products | Current and previous month counts, 6 / 12 / 24 month stacked chart, category visibility and segment detail | `products` with `purchased` and `purchasedAt` |
| Demographic profile | Category selector, median age, age bands, gender shares, top cities and other/unknown | Current `products` owners, `users`, `categories`, `cities` |

The definitions preserve the existing metric meanings. In particular, the demographic screen describes owners of current products in a category, even if those products have not been marked purchased. Purchase month boundaries use `America/Bogota`. BQ3 is a historical event count, so deleting the saved product later does not reduce it; the legacy `adminMetrics/recommendedProductSaves` document is not used.

The dashboard calls `get_admin_analytics({ metric, params })` through the Firebase Web SDK and renders its processed `data` result. The backend reads `products`, `users`, `categories`, `cities`, and BQ3's `productEvents` with the Admin SDK and performs all metric calculations. The dashboard makes no Firestore writes. Firebase Authentication's `admin: true` custom claim protects the callable; this role is separate from Google Cloud project ownership.

After sign-in, the dashboard preloads the four default processed views and keeps callable results in memory while the session is open. Switching to a loaded view reuses that result; changing filters requests a new result from the backend. Use **Refresh** to fetch current backend results again; signing out also clears the cache.

## Backend setup and validation

The sibling `whynot-back` repository must deploy the `get_admin_analytics` callable to `whynot-f4ae6`. The function's transport must allow invocations so its own Firebase token check can run. From that repository:

```bash
npm run test:unit
./node_modules/.bin/firebase deploy --only functions:get_admin_analytics --project whynot-f4ae6
```

Backend unit tests do not modify production. A platform-level HTTP 403 means the callable transport lacks an invoker policy, before its `admin: true` check can run. Its underlying second-generation service must allow invocation while the callable enforces the application role. The production BQ3 test script creates a recommendation save and **does modify production data**, so do not run it for read-only verification.

For browser testing against local emulators, run Auth, Firestore, and Functions emulators for `demo-whynot`, seed the data, then start this dashboard with `VITE_USE_EMULATORS=true npm run dev`. This explicit flag changes the project ID to `demo-whynot`; the default always uses production.

For a read-only production check after deployment: run the dashboard, sign in with an admin account, inspect each view and change its filters, refresh, sign out, then sign in with a regular account and confirm access is denied. A second teammate should repeat from another computer.

## Development commands

```bash
npm run build
npm run preview
```
