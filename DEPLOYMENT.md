# Deploying Your HQ — Step by Step

This turns `hustle-hq.jsx` from a Claude.ai artifact into a real, paywalled web app.
None of these steps can be done for you — they all require your own accounts and
credentials — but each one is short.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Once it's ready, go to **SQL Editor > New Query**, paste in the entire contents
   of `supabase/schema.sql`, and run it. This creates every table (profiles,
   subscriptions, projects, goals, notes, coach_messages, activity) with the
   security rules that keep each user's data private to them.
3. Go to **Project Settings > API** and copy two values — you'll need them soon:
   - **Project URL**
   - **anon public key**
4. Go to **Authentication > Providers** and confirm Email is enabled (it is by
   default). Under **Authentication > URL Configuration**, you may want to turn
   off "Confirm email" while you're testing, so you don't have to click a
   confirmation link every time you sign up a test account. Turn it back on
   before going live.

## 2. Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) and create an
   API key. This is separate from your Claude.ai account — it's billed by usage.
2. Keep this key somewhere safe. It goes into Supabase as a *secret*, never into
   any file that ends up in a browser.

## 3. Deploy the two Edge Functions

These require the Supabase CLI. From your terminal, inside this project folder:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>   # found in your Supabase project URL

# Set your secrets (these never touch the frontend):
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...   # see step 4 for where this comes from

# Deploy both functions:
supabase functions deploy coach-chat
supabase functions deploy stripe-webhook --no-verify-jwt
```

The `--no-verify-jwt` flag on `stripe-webhook` is required — Stripe calls that
endpoint directly, not through a logged-in user, so it can't send a Supabase
auth token.

## 4. Connect Stripe's webhook

1. In your **Stripe Dashboard > Developers > Webhooks**, click **Add endpoint**.
2. Endpoint URL: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Subscribe to these three events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Stripe will show you a **Signing secret** (starts with `whsec_`) — that's the
   `STRIPE_WEBHOOK_SECRET` from step 3.
5. Open `supabase/functions/stripe-webhook/index.ts` and fill in `PRICE_PLAN_MAP`
   with your actual Stripe Price IDs (found in Stripe Dashboard > Product
   catalog) so subscriptions get labeled "monthly" or "annual" correctly. Then
   redeploy: `supabase functions deploy stripe-webhook --no-verify-jwt`

## 5. Point Stripe's post-payment redirect at your real signup flow

In your Stripe Payment Link settings (the two links already wired into
`hustle-paywall.html`), there's an "After payment" section. Set it to redirect
to wherever you deploy this app (step 6), e.g. `https://hq.hustlefile.io/`,
instead of Stripe's generic confirmation page. That's the page where someone
creates their password and gets in.

## 6. Set your environment variables and deploy the frontend

1. Copy `.env.example` to `.env` and fill in the three values:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from step 1
   - `VITE_COACH_CHAT_URL` — `https://<your-project-ref>.supabase.co/functions/v1/coach-chat`
2. Test locally first: `npm install`, then `npm run dev`.
3. Deploy to Vercel or Netlify (either works fine for a Vite app):
   - Connect this project's repo, or drag-and-drop the built `dist/` folder
   - Set the same three environment variables in the host's dashboard
     (Vercel: Project Settings > Environment Variables)
   - This is **not** Hostinger — Hostinger serves static files only and can't
     run this build step. Keep your four marketing pages (`index.html` etc.)
     on Hostinger, and put this app on Vercel/Netlify under a subdomain like
     `hq.hustlefile.io`.

## 7. Wire the last two loose ends back on your marketing site

- On `hustle-paywall.html`, the **"Already unlocked? Go to your HQ"** link
  currently points to a placeholder. Update it to your real deployed URL
  (e.g. `https://hq.hustlefile.io`).
- Double check `PAYWALL_URL` at the top of `src/App.jsx` — it should already
  point to `https://hustlefile.io/hustle-paywall.html`, which is what someone
  sees if they're logged in but haven't paid.

## How the pieces fit together, end to end

1. Someone clicks **Unlock Your HQ** on your paywall → Stripe Payment Link
2. They pay → Stripe fires the webhook → your `stripe-webhook` function marks
   their email `active` in the `subscriptions` table
3. Stripe redirects them to your HQ app → they create an account with the same
   email → a `profiles` row is created automatically (via the database trigger
   in `schema.sql`)
4. The app checks: is this email's subscription `active`? Yes → they're in.
5. Every action inside the app (saving a case file, checking off a goal,
   chatting with a coach) reads and writes directly to Supabase, scoped to
   their account only.
6. Coach chat messages get routed through the `coach-chat` function, which
   checks they're logged in *and* subscribed before spending a cent of your
   Anthropic API budget on their behalf.

## What to test before calling this live

- [ ] Sign up with a test email, confirm the `profiles` row appears in Supabase
- [ ] Complete a real (or Stripe test-mode) payment, confirm the `subscriptions`
      row flips to `active` within a few seconds
- [ ] Log into the app with that email — you should land in the HQ, not the gate
- [ ] Run the questionnaire, save a case file, check off a goal, chat with a
      coach, pin a decision — confirm everything reloads correctly on refresh
- [ ] Cancel the test subscription in Stripe, confirm `customer.subscription.deleted`
      flips the row to `canceled` and the app locks back to the subscribe gate
