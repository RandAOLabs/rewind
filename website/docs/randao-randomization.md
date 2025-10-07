---
title: RandAO Randomization
---

# RandAO Randomization

Rewind’s **“I’m Feeling Lucky”** feature is powered by **RandAO**, the decentralized randomness protocol built on the AO network.

Each time you press the button, Rewind fetches a fresh, verifiable random value derived from RandAO’s on-chain entropy stream. This value is used to select a random registered ArNS name and routes you to its history view.

---

## How It Works

1. The app requests the latest available random output from the RandAO protocol.  
2. That entropy source provides the most recently published random number.  
3. Rewind uses that number to select a random entry from the current pool of known ArNS names.  
4. The chosen name appears as if drawn “from a hat,” and the app navigates to `/history/{that-name}`.

The result: a new, unpredictable discovery every click, with no bias or repetition.

---

## Why RandAO

RandAO delivers **verifiable, tamper-resistant randomness** anchored directly to the AO network.  
By basing Rewind’s discovery feature on that entropy rather than a local pseudo-random function, we ensure:

- Each “Lucky” result comes from an unbiased source, not a local seed.  
- The feature reflects the trustless ethos of AO itself.

---

## Experience

- **Instant feedback:** the button animates and shows a short loading state while fetching the random value.  
- **New every time:** each click computes a new random selection from the registered names.  
- **Accessibility:** fully keyboard-friendly and visually consistent with the app’s design.

---

_“I’m Feeling Lucky” isn’t just playful — it’s a live demo of decentralized randomness at work._
