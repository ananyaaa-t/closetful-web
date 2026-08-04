-- Adds a free-text `notes` column so users (via the extension's or
-- mobile's "preview before save" panel) can jot something down about why
-- they saved an item — e.g. "would look great with the Toteme coat" —
-- at save time. Nullable/optional: every existing save path (paste-URL,
-- bookmarklet) keeps working without ever setting it.

alter table public.items
  add column if not exists notes text;
