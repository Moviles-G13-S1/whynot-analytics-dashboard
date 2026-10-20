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

If sign-in is rejected despite correct credentials, an administrator should check that Email/Password sign-in is enabled, the account has the custom claim, the token was refreshed by signing out and in, and localhost is allowed in the Firebase Authentication authorized domains. The frontend checks a freshly refreshed token, while the Cloud Function independently checks the claim on every request.

## Metrics and interactions

| View | Information and controls | Backend source |
| --- | --- | --- |
| Saved products | Average per active user; one versus two or more products; current products; active users; zero-product users; 1–5, 6–10, 11–20, 21–50, 51+ distribution; Users / % users toggle | `products`, `users` |
| Recommended products | Total successful recommendation saves | `productEvents` with `recommendation_shown`, `savedAt`, and `savedProductId` |
| Purchased products | Current and previous month counts, 6 / 12 / 24 month stacked chart, category visibility and segment detail | `products` with `purchased` and `purchasedAt` |
| Demographic profile | Category selector, median age, age bands, gender shares, top cities and other/unknown | Current `products` owners, `users`, `categories`, `cities` |

The definitions match the existing Flutter summary models. In particular, the demographic screen describes owners of current products in a category, even if those products have not been marked purchased. Purchase month boundaries use `America/Bogota`. BQ3 is a historical event count, so deleting the saved product later does not reduce it; the legacy `adminMetrics/recommendedProductSaves` document is neither read nor updated by this dashboard.

All calculations run in `whynot-back/functions/analytics.py` through the callable `get_admin_analytics`; the browser receives processed results. The dashboard has no Firestore read or write operations. The Cloud Function checks the admin claim before its first data read. Its Admin SDK is confined to the backend.

## Backend setup and validation

The sibling `whynot-back` repository must have `get_admin_analytics` and the updated `save_recommended_product` deployed to `whynot-f4ae6` before production use. From that repository, after reviewing the changes:

```bash
npm ci
python3.13 -m unittest discover -s tests -p 'test_*.py'
npm run test:rules
npm run test:smart-features
firebase deploy --only functions:get_admin_analytics,functions:save_recommended_product --project whynot-f4ae6
```

For a new 2nd Gen callable, Firebase also sets the Cloud Run service's invoker policy. If the deploy says it could not set IAM on `get-admin-analytics`, a project owner must grant the deployer `roles/run.admin`, then rerun the deploy, or set the service's `roles/run.invoker` binding for `allUsers`. Public invocation only allows the request to reach the function; the function itself returns `permission-denied` unless the Firebase ID token has `admin: true`. A Cloud Run HTML 403 indicates this service-level policy is still missing.

Firestore and Functions emulator tests use `demo-whynot` and do not modify production. The full emulator suite needs Java 21 and Python 3.13 with the Firebase Functions requirements installed. The production BQ3 test script creates a recommendation save and **does modify production data**, so do not run it for read-only verification.

For browser testing against local emulators, run Auth, Firestore, and Functions emulators for `demo-whynot`, seed them with `node scripts/test-smart-features/index.mjs` from `whynot-back`, then start this dashboard with `VITE_USE_EMULATORS=true npm run dev`. This explicit flag changes the project ID to `demo-whynot`; the default always uses production.

For a read-only production check after deployment: run the dashboard, sign in with an admin account, inspect each view and change its filters, refresh, sign out, then sign in with a regular account and confirm access is denied. A second teammate should repeat from another computer. Without an admin account, deployment, or an authorized local origin, this check remains pending.

## Development commands

```bash
npm run build
npm run preview
```
