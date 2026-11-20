# Business information requiring confirmation

## Research completed

References inspected on 17 November 2026:

- [Google Business Profile / Google Search](https://www.google.com/search?q=Moz+Delicious+Foods&kgmid=%2Fg%2F11hyp8n6xm)
- [Official Instagram profile](https://www.instagram.com/moz_delifoods/)

The public Google listing identifies **Moz Delicious Foods** as a Portuguese restaurant and shows:

- Address: Next to McDonald's, 31031 Mocke St, Daveyton, Benoni, 1501.
- Phone: 081 350 0712.
- Menu highlights: “Large Lamb Shank Served With,” “Queen Prawns,” and “King Prawn and Seafood Mix Paella Rice.”
- Service options: reservations required, all-you-can-eat, and outdoor seating.

The public Instagram profile identifies the account as Moz delicious foods, uses “GOOD * CLEAN * FOOD,” and lists 31031 Mocke Street, Daveyton, opposite McDonald's. Its post grid prompted for login in the browser, so individual post captions, menu information, and photo details could not be reviewed.

Google showed a reported price range of R100–R200 per person, attributed to 12 people. This is not a product price and is not used as one. The listing exposed a current-hours status but not a dependable complete weekly schedule; no hours are published on this site.

The limited public Google Maps photo view also showed a Moz Delicious Foods poster dated August 2024 (image capture shown as July 2024). It advertised King Prawns at R170 (5 prawns with seafood paella rice and Moz Deli salad) and Queen Prawns at R150 (4 prawns with seafood paella rice and Moz Deli salad). The latest owner instruction authorizes these existing sample prices for this implementation; they are recorded in ZAR. Confirm them again before production payments if the owner did not intend the historical poster values.

The storefront catalog contains the 13 dishes and prices supplied in the implementation request. The public listing independently corroborates the Queen Prawns and King Prawn and Seafood Mix Paella Rice names and the historical sample prices above; it does not corroborate the remaining dishes or current prices. The separate database seed still contains the original three Google listing highlights.

The public photo view showed the restaurant interior, plated seafood meals, a chicken-and-pasta-looking meal, grilled skewers, a seafood plate, and an outdoor dining area. A restaurant-posted meal image from the profile matches each of the existing local plated-dish files. The profile view was limited to 10 photos and prompted for sign-in to see more. Instagram post details also prompted for login, and Facebook did not load in the public browser. No restricted content was accessed and no profile images were downloaded. See the [image manifest](./image-manifest.md) for per-photo notes and permission status.

## Confirm with the restaurant owner before launch

- Confirm the exact full name, spelling and preferred public brand name.
- Confirm each storefront menu name, description, category, price and current availability, including the 24-hour notice for platters.
- Confirm whether the historical sample prawn prices remain current for production. The incomplete lamb-shank listing still has no approved price.
- Confirm product variations, extras, allergens and dietary claims before publishing them.
- Identify which supplied local photographs are approved for public website use and which photo corresponds to each menu item.
- Confirm whether the historical August 2024 prawns poster still reflects any current menu items or prices; do not publish those old prices as current without confirmation.
- Supply approved logo files, a current hero image, product photography, and restaurant exterior photography if available.
- Confirm whether online orders are accepted, and whether collection, delivery, dine-in or reservations are currently offered. If delivery is available, confirm service areas, fee and any conditions.
- Confirm opening hours and special holiday hours.
- Confirm the supplied email address `moz.delifoods@gmail.com`; it was not visible in the reviewed public Google or Instagram information and is therefore not presented as verified contact information.
- Confirm whether the public listing's all-you-can-eat and outdoor-seating options are current.

The original database-backed PayFast ordering backend and admin controls remain separate from the storefront's Stripe Checkout flow. Stripe Checkout requires `STRIPE_SECRET_KEY` and `APP_BASE_URL`; owner confirmation of the displayed catalog, current prices, fulfilment details and photo permissions is still required before accepting live orders. The seeded lamb-shank highlight remains unavailable and unpriced in the database.
