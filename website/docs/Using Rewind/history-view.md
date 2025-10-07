---
title: History View
sidebar_position: 2
---

# History View

The **History View** is the core of Rewind.  
It’s where a single ArNS name’s entire on-chain story is displayed as a time-ordered timeline — from its very first record to the most recent update.

Rewind’s goal here is simple: make it effortless to understand **what happened, when, and why** without digging through raw transactions.

---

## Layout Overview

Each History page has four key zones:

1. **Current ANT Information** – the live “snapshot” of the name.  
   - Displayed at the very top of the page, just beneath the header.  
   - Shows the **name**, **owner**, **controllers**, **process ID**, **expiry**, and **content target**.  
   - On larger screens, this appears as a wide glass-style bar; on smaller devices it collapses into a compact button that expands when tapped, preserving space while keeping information accessible.

2. **Legend Panel** – color-coded event categories that double as filters.  
   - Click a category to highlight those events.  
   - Unselected types fade but remain visible for context.  
   - “Show All” resets everything.

3. **Timeline Chain** – the main column of cards.  
   - Each card represents one event (purchase, transfer, record change, etc.).  
   - Clicking a card opens the **Event Details panel** on the side.  
   - The top item may show an **Initial Mainnet State** if one is available.

4. **Holobar & Controls** – a thin horizontal scrubber with zoom controls below the chain.  
   - Use it to jump between events.  
   - The `+ / – / reset` buttons control the visual scale of the event chain.

---

## How Updates Appear

Rewind streams history data from the network using `ARIORewindService.getEventHistory$`.  
To keep performance smooth:

- Events arrive in batches and are **buffered** before rendering.  
- The UI waits for a quiet moment (~800 ms) before redrawing, avoiding “popcorn” updates on snappier set ups.  
- Cached data (if warm within 1 hour) appears instantly, then quietly refreshes behind the scenes.

---

## Interaction Highlights

| Action | Result |
|--------|---------|
| **Hover / tap a card** | Highlights the event and shows quick info. |
| **Click a card** | Opens the Event Details side panel. |
| **Click Legend items** | Filters the timeline by category. |
| **Use Holobar** | Quickly jump to a specific event in time. |
| **Resize / rotate screen** | ANT info and controls reflow to preserve visibility. |

---

## Why It Matters

The History View is the “truth window” into ArNS.  
By presenting events as a coherent story instead of a stack of transactions, Rewind helps users reason about provenance, ownership, and technical changes at a glance.

It’s the page people come back to — and the one that makes Rewind feel alive.
