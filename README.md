# Closetful

A full-stack shopping wishlist platform with a companion Chrome extension —
save products from any online store into a single, AI-organized closet.

## What it does

- **Save from anywhere.** Paste a product URL, use the drag-to-bookmarks
  bookmarklet, or install the companion Chrome extension to save an item
  with one click from the product page itself.
- **AI auto-categorization.** Every saved item is automatically categorized
  (clothing, shoes, makeup, skincare, tech, etc.) and tagged using Google
  Gemini with JSON-schema-constrained structured output.
- **Bypasses bot-protected sites.** The Chrome extension reads product data
  directly from the page DOM in the user's own browser, sidestepping
  server-side anti-bot protection (Akamai, DataDome) that blocks
  traditional scraping on sites like Sephora and Etsy.
- **Brand filtering + search** across your saved closet.
- **Auto-login bridge.** Logging into the web app automatically signs the
  Chrome extension in too, via Chrome's `externally_connectable` messaging
  — no separate login required.

## Tech stack

- **Frontend/Backend:** Next.js 16 (App Router, Server Actions, Route
  Handlers), TypeScript, Tailwind CSS
- **Database & Auth:** Supabase (Postgres with Row-Level Security,
  Supabase Auth)
- **AI:** Google Gemini (structured JSON output for categorization/tagging)
- **Browser extension:** Chrome Extension (Manifest V3), vanilla JS +
  React popup, Parcel bundler

## Project structure

- `app/` — Next.js App Router pages, Server Actions, and API routes
- `lib/` — shared logic: scraping (`scrape.ts`), AI categorization
  (`categorize.ts`), the shared save pipeline (`save-item.ts`), Supabase
  client helpers
- `supabase/migrations/` — database schema (items, collections) with RLS
  policies
- `proxy.ts` — Next.js 16's renamed `middleware.ts`; refreshes the Supabase
  session cookie on every request

The Chrome extension lives in a separate repository
([universal-wishlist](https://github.com/ananyaaa-t/universal-wishlist))
since it has its own build tooling (Parcel) and ships independently of the
web app.
