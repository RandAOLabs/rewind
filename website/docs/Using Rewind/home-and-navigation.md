---
title: Home & Navigation
sidebar_position: 1
---

# Home & Navigation

The **Home** page is a fast entry point into any ArNS name’s timeline. It’s a single, glassy “aurora-wash” card with one job: get you to `/history/{name}` with zero friction.

---

## The Home Page

- **Title:** *Search Name History*  
- **Search field:** Placeholder “Enter a name (e.g. example)”.  
- **Submit:** Press **Enter** or click the search icon → navigates to `/history/{name}`.

Beneath the field you’ll see **three suggestion chips**—short, tappable names shown on load (either curated or randomly sampled). Clicking a chip:
- Fills the search field with that name, and  
- Immediately routes to `/history/{that-name}`.

---

## “I’m Feeling Lucky” (Powered by RandAO)

The **I’m Feeling Lucky** button lets you explore a random *registered* ArNS name in one click.

- Calls `ARIORewindService.autoConfiguration() → getRandomARNSName()`  
- Shows a brief loading state, supports keyboard focus, and matches the aurora styling  
- On success, navigates to `/history/{random-name}`

<small class="powered-note">Randomization provided by **RandAO**.</small>

---

## Keyboard & Accessibility

- The search field **autofocuses**; press **Enter** to go.  
- Chips are actual **buttons**: focusable, `aria-label` per name.  
- Lucky button is fully keyboard-accessible and announces loading state.  
- The page uses **polite** live regions for “Random names loading…” feedback.

---

## Behavior & States

- **Instant feel:** The page is static and lightweight; it renders immediately.  
- **Suggestions:** If random-name fetches fail, chips simply don’t render (no blocking).  
- **Navigation:** All paths land on the **History View**, a zoomable, filterable timeline of ownership and content changes.

---

### TL;DR
Type a name, tap a chip, or hit **I’m Feeling Lucky** — all roads lead to `/history/{name}`.
