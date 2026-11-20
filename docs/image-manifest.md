# Moz Deli Foods image manifest

## Access and reuse

The public Google Maps view exposed only a limited set of 10 photos from a profile reporting 124 photos. Selecting “See more photos” prompted for Google sign-in, so the restricted gallery was not accessed. Instagram post details prompted for login, and the Facebook page did not load in the public browser. No profile image was downloaded, hotlinked, or copied during this review.

The user confirmed authorization to use the existing project photographs. This confirmation does not extend to profile images that were not supplied in the project or to customer-contributed photos. Authenticity and exact dish identity still need owner confirmation wherever noted below.

## Existing project assets

| Image filename | Source / description | Website use | Authenticity and permission |
| --- | --- | --- | --- |
| `public/images/hero/hero-main.webp` | Existing project file; plated grilled fish and prawns. It was not positively matched to a photo in the limited public Google Maps view. | Homepage hero | Existing-photo reuse authorized by user; confirm business authenticity with the owner. |
| `public/images/gallery/moz-deli-plated-dish-01.webp` | Existing project file; plated meal with vegetables and avocado. It visually matches Google Maps Photo 5, attributed to Moz Delicious Foods and dated Aug 2024. The dish's official name was not visible. | Story section and gallery | Existing-photo reuse authorized by user; profile match supports authenticity. Confirm the dish name before menu association. |
| `public/images/gallery/moz-deli-plated-dish-02.webp` | Existing project file; chicken-and-pasta-looking meal with Moz Deli watermark. It visually matches Google Maps Photo 6, attributed to Moz Delicious Foods and dated Aug 2024. The dish's official name was not visible. | Gallery | Existing-photo reuse authorized by user; profile match supports authenticity. Confirm the dish name before menu association. |
| `public/images/restaurant/interior.webp` | Existing project file showing the dining area; it matches an accessible Google Maps interior photo. | Story section | Existing-photo reuse authorized by user; restaurant authenticity is supported by the profile match. |
| `public/images/restaurant/service-counter.webp` | Existing project file showing a service counter. No exact match was established in the inspected public photos. | Location section | Existing-photo reuse authorized by user; confirm that it depicts this restaurant. |
| `public/images/gallery/moz-deli-sign.webp` | Existing project file showing Moz Deli branding. | Gallery | Existing-photo reuse authorized by user; confirm source if needed. |
| `public/images/food/seafood/fish-and-chips.webp` | Existing project photo showing grilled fish, prawns, rice, chips and salad. The image visibly includes prawns but does not distinguish the Queen/King serving sizes. | Queen Prawns and King Prawn menu cards as a shared seafood photograph; alt text describes all visible food and does not claim a precise serving match. | Existing-photo reuse authorized by user. Exact product/portion match remains unverified. |
| `public/images/food/seafood/grilled-fish-closeup.webp`, `public/images/food/chicken/grilled-chicken-rice.webp`, `public/images/food/grills/mixed-grill.webp`, `public/images/gallery/celebration-table.webp` | Existing project files showing a grilled fish fillet, chicken with rice and sides, a mixed grilled plate, and a table setting respectively. | General gallery only; not assigned to a different menu product. | Existing-photo reuse authorized by user; no matching product record was supplied for these images. |
| `public/images/founder/founder.jpg` | Existing project file; identity and consent are unverified. | Not displayed | Do not publish without identity and explicit consent. |
| `public/images/brand/logo.png`, `public/images/brand/logo-white.png` | No approved logo files supplied. | Navigation and footer currently use a text wordmark. | Request approved original logo files and web-use permission. |

## Public profile photos inspected

The records below describe what was visible in the public Maps photo viewer. The images were not downloaded or added to the site.

| Image filename / reference | Original source and visible description | Intended website section | Permission status |
| --- | --- | --- | --- |
| `Not downloaded — Google Maps Photo 1` | Moz Delicious Foods profile photo showing the dining interior; visually matches `public/images/restaurant/interior.webp`. | Restaurant story / gallery, using the existing local project file only | Profile attribution supports authenticity, not reuse rights; owner approval required. |
| `Not downloaded — Google Maps Photo 3` | Moz Delicious Foods profile photo dated Feb 2025 showing a seafood-looking plated meal with fish and a prawn-like topping; the exact dish was not established. | No product placement until the dish is identified | Do not reuse without owner approval and identification. |
| `Not downloaded — Google Maps Photo 4` | Moz Delicious Foods profile poster dated Aug 2024 (image capture shown as Jul 2024). It advertises King Prawns at R170 (5 prawns with seafood paella rice and Moz Deli salad) and Queen Prawns at R150 (4 prawns with seafood paella rice and Moz Deli salad). These are historical poster prices, not verified current prices. | Research evidence only; not a current menu or ordering image | Owner approval required for image reuse; confirm whether these items and prices remain current. |
| `Not downloaded — Google Maps Photo 5` | Moz Delicious Foods profile photo dated Aug 2024 showing a plated meal with vegetables and avocado; it matches `public/images/gallery/moz-deli-plated-dish-01.webp`. The dish's official name was not visible. | General gallery only; do not assign a menu name without confirmation | Owner approval required for website reuse and dish identification. |
| `Not downloaded — Google Maps Photo 6` | Moz Delicious Foods profile photo dated Aug 2024 showing a chicken-and-pasta-looking plated meal; it matches `public/images/gallery/moz-deli-plated-dish-02.webp`. | General gallery only; do not assign a menu name without confirmation | Owner approval required for website reuse and dish identification. |
| `Not downloaded — Google Maps Photo 7` | Photo attributed to Sandy Ngwenya, dated Oct 2026, showing a plated fish meal with sides. This is a customer/contributor photo, not a restaurant-owned profile upload. | None | Do not reuse without photographer permission and restaurant approval. |
| `Not downloaded — Google Maps Photo 8` | Moz Delicious Foods profile photo dated Aug 2024 showing grilled skewered food; the exact meat and dish name were not established. | No product placement until the dish is identified | Owner approval required for reuse and dish identification. |
| `Not downloaded — Google Maps Photo 9` | Moz Delicious Foods profile photo dated Aug 2024 showing a seafood plate with fish and shellfish; the exact dish name was not established. | No product placement until the dish is identified | Owner approval required for reuse and dish identification. |
| `Not downloaded — Google Maps Photo 10` | Moz Delicious Foods profile photo dated Oct 2026 showing an outdoor dining area. | Restaurant/gallery section, if approved | Owner approval required for website reuse. |

## Missing approved assets and owner follow-up

- Request original, high-resolution photos where available: a preferred hero image, identifiable current menu dishes, exterior/outdoor seating, and brand/logo files.
- Identify each photographed dish and confirm whether it is currently sold before associating an image with a menu item.
- Ask the restaurant to provide written permission for any additional Google Business Profile image; do not reuse customer-contributed images without permission from the photographer.
- Keep menu cards on the existing “Dish photo pending confirmation” placeholder until a matching, approved product photo is supplied.
- The admin upload accepts JPEG, PNG and WebP and persists uploaded image bytes in the PostgreSQL `MenuImageAsset` table. Product image paths are only published after the owner saves the product.
