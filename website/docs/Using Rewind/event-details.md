---
title: Event Details Panel
sidebar_position: 3
---

# Event Details Panel

The **Event Details Panel** appears when a user clicks any timeline card in the History View.  
It provides a structured, human-readable snapshot of that specific on-chain event—no JSON, no noise.

---

## Purpose

Rewind’s timeline is great for scanning patterns; the Details Panel is where you *understand* a single event.  
It opens on the right side of the screen and keeps the main timeline visible for quick context switching.

---

## What It Shows

Each panel is built around a consistent structure:

- **Header** – the event’s action (e.g., *Ownership Transfer*, *Record Change*), tinted with its **Legend color**.  
- **Actor** – who performed the action.  
- **Timestamp** – exact block time, formatted for readability.  
- **Transaction** – outbound link to the on-chain record (opens in a new tab).  
- **Details section** – key attributes relevant to the event type:  
  - From / To owner  
  - Process IDs or record keys  
  - Value or TTL changes  
- **Extra box** – a small key–value block for contextual data (e.g., “record: content_target → new_url”).

---

## Interaction & Layout

- Opens instantly beside the timeline without a page reload.  
- Closes via the “×” icon, ESC key, or by clicking outside the panel.  
- Header stays **sticky** while scrolling long data sets.  
- Fully keyboard-accessible; focus returns to the originating card when closed.  
- Glassy “aurora” styling matches the rest of Rewind’s UI.

---

## Why It Matters

The Details Panel turns every dot on the chain into an explorable moment—  
helping users see **what changed, who changed it, and how it fits into the story** of a name.
