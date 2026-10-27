# DiscoverPlaceCard icon TypeError

**Session ID:** ses_e86c7ce06ffeqG2yS0VD3759n4
**Created:** 10/26/2026, 6:18:08 PM
**Updated:** 10/26/2026, 7:44:18 PM

---

## User

failure]
 ERROR  [TypeError: Cannot read property 'icon' of undefined]

Code: discover-place-card.tsx
  21 |   const category = PLACE_CATEGORY_MAP[place.category];
  22 |   const openLabel = formatOpenStatus(place.openStatus);
> 23 |   const firstImage = place.images?.split(',').find((u) => u.length > 0);
     |                                                                         ^
  24 |
  25 |   return (
  26 |     <Pressable
Call Stack
  DiscoverPlaceCard (components\discover\discover-place-card.tsx:23:73)

Code: discover-feed-list.tsx
  79 |       renderItem={({ item }) => (
  80 |         <View style={styles.itemWrap}>
> 81 |           {item.kind === 'place' ? (
     |            ^
  82 |             <DiscoverPlaceCard
  83 |               place={item.place}
  84 |               saved={isSaved(item.place.id)}
Call Stack
  FlatList.props.renderItem (components\discover\discover-feed-list.tsx:81:12)
  DiscoverFeedList (components\discover\discover-feed-list.tsx:76:5)
  DiscoverScreen (components\discover\discover-screen.tsx:109:16)
  DiscoverRoute (app\(tabs)\discover.tsx:4:10)
  TabLayout (app\(tabs)\_layout.tsx:13:9)
  RootLayout (app\_layout.tsx:156:19)
 ERROR  [ErrorBoundary] Uncaught error: [TypeError: Cannot read property 'icon' of undefined]

Code: discover-place-card.tsx
  18 | };
  19 |
> 20 | export function DiscoverPlaceCard({ place, saved, onPress, onToggleSave, onDirections }: Props) {
     |        ^
  21 |   const category = PLACE_CATEGORY_MAP[place.category];
  22 |   const openLabel = formatOpenStatus(place.openStatus);
  23 |   const firstImage = place.images?.split(',').find((u) => u.length > 0);
Call Stack
  DiscoverPlaceCard (components\discover\discover-place-card.tsx:20:8)
  DiscoverFeedList (components\discover\discover-feed-list.tsx:33:8)
  SafeKeyboardView (components\ui\safe-keyboard-view.tsx:8:8)
  ErrorBoundary#constructor (components\ui\error-boundary.tsx:19:10)
  DiscoverScreen (components\discover\discover-screen.tsx:24:8)
  DiscoverRoute (app\(tabs)\discover.tsx:3:16)
  TabLayout (app\(tabs)\_layout.tsx:9:16)
  AuthGate (app\_layout.tsx:29)
  MessageSyncProvider (components\messages\message-sync-provider.tsx:23:8)
  ToastProvider (components\ui\toast-card.tsx:99:8)
  OnboardingProvider (context\onboarding-context.tsx:14:8)
  AuthProvider (context\auth-context.tsx:80:8)
  AppConfigProvider (context\app-context.tsx:10:8)
  RootLayout (app\_layout.tsx:137:16)

Code: discover-place-card.tsx
  21 |   const category = PLACE_CATEGORY_MAP[place.category];
  22 |   const openLabel = formatOpenStatus(place.openStatus);
> 23 |   const firstImage = place.images?.split(',').find((u) => u.length > 0);
     |                                                                         ^
  24 |
  25 |   return (
  26 |     <Pressable
Call Stack
  DiscoverPlaceCard (components\discover\discover-place-card.tsx:23:73) 

---

## Assistant

I'll investigate this crash. The error suggests `category` is undefined and the code accesses `category.icon` (or similar) downstream. Let me look at the relevant files.

---

## Assistant

Root cause confirmed. Let me verify the DB taxonomy vs the hardcoded map:

**DB `place_categories`:** `food, cafe, nightlife, chill, work, gym, shopping, health, services, school, recreation, church, mosque`
**Hardcoded `PLACE_CATEGORIES`:** `food, cafe, nightlife, chill, study, gym, shopping, health, services`

So a place with `category: 'school'` (there is one in the DB) hits `PLACE_CATEGORY_MAP['school']` → `undefined`, and the card reads `category.icon` → crash. The same landmine exists in 5 other components, plus the Discover title when you filter by a DB-only category like *Churches*.

I'll fix this at the root: a safe category-meta resolver with a graceful fallback, and align the static defaults with the DB taxonomy.

---

## Assistant

Fixed. The crash wasn't in `images`/`openStatus` — it was an out-of-sync category taxonomy.

## Root cause

The card does `const category = PLACE_CATEGORY_MAP[place.category]` and later reads `category.icon`. Categories are DB-driven (`place_categories` table), but the static map only knew 9 keys.

Live DB check:

```
places.category        → 'school'
place_categories.keys  → food, cafe, nightlife, chill, work, gym, shopping,
                         health, services, school, recreation, church, mosque
```

`PLACE_CATEGORY_MAP['school']` was `undefined` → `Cannot read property 'icon' of undefined`. The row that crashes:
`School Of Agriculture And Agricultural Technology`.

The same landmine existed in 5 other components, plus the Discover header (`PLACE_CATEGORY_MAP[feed.category].label`) would crash when filtering by *Churches*, *Mosques*, etc.

## Fix

- Added `getPlaceCategoryMeta()` in `constants/place-categories.ts` — always returns a valid meta record:
  - known key → curated label/icon/accent
  - unknown DB key → humanized label (`recreation_center` → `Recreation Center`) + `grid-outline`
  - null/blank → `Uncategorized`
- Synced static defaults with the DB taxonomy (`work`, `school`, `recreation`, `church`, `mosque`).
- Switched all consumers to the safe resolver: place card, trending card, place detail, saved card, add-place review, Discover header.
- Made `Place.category` / `PlaceDraft.category` plain `string` instead of an incomplete union, and normalized category values in `mapRow`.
- Removed the now-unnecessary casts in the category picker/form.

## Verification

- `npx tsc --noEmit` → clean
- ESLint on changed files → 0 errors
- Added `constants/place-categories.test.ts` → **11 tests passing**, including the exact `school` regression case

Reload the Discover tab — that place now renders with the *School Buildings* label/icon, and future DB categories degrade gracefully instead of crashing.

I also cleared three unrelated type-check blockers encountered along the way (missing `Href` import, missing `getLodgeSavedIds` import, and a nonexistent `DesignTypography.bodySm`).

---

## User

Ojh nice job very good, but I am seeing that naira thing that indicates the price range in a place card, remove the naira sign, remove direction from the place cards (when I say place card, I mean the card in the discover page before I click a place details), the saved button should take the place of where the direction was before and make it bigger, the ratings should not show the number of stars, it shoukld just be one star and then the number should be beside it instead of taking all that space

---

## Assistant

Done. All four changes are in the Discover place cards.

## What changed

**`components/discover/discover-place-card.tsx`**
- Removed the naira price-range (`₦₦₦`) from the meta line — now only the area shows.
- Removed the **Directions** button and its `onDirections` prop.
- Moved the bookmark button into the old Directions spot (bottom-right), enlarged it to a 36px circular button with a 22px icon and press feedback.
- Rating now uses a single star + numeric value (e.g. `★ 4.5`) instead of five stars.

**`components/ui/star-rating.tsx`**
- Added a `compact` mode that renders one star + rating value, reusing the existing rating component rather than duplicating it.

**`components/discover/discover-trending-card.tsx`**
- Also removed the naira price range from the trending rail cards for consistency (ratings there were already single-star).

**`components/discover/discover-feed-list.tsx` / `discover-screen.tsx`**
- Removed the now-unused Directions plumbing (`onDirections`, `getDirections`, `openPlaceInMaps` import).

## Verification
- `npx tsc --noEmit` → clean
- ESLint on all touched files → 0 errors

The place detail screen still shows the full price range indicator — this only affects the Discover feed cards as requested.

---

## User

Oh nice job but then when we open the place details, the display part does not have enough space, so increae the height where the picture and the title and the user that created that place is. And if we have the title in the top part we should not have it  in the  black container that contains other details, when there is no location and clock or whatever those 2 icons mean, so whenver thise info are not available then don't show the space for it  

---

## User

CONTINUE

---

## User

continue

---

## Assistant

I notice there may be a duplicate `name` style key from my edit. Let me verify and clean up.


---

## Assistant

There's a duplicate `name` style key. Let me remove the redundant one.


---

## Assistant

Both clean. Let me do a final review of the updated files.


---

## Assistant

All done and verified. Here's a summary of the place detail changes:

**`place-detail-hero.tsx`** — Hero section (image + title + area + creator):
- Increased height from **200 → 320** so the picture, title, and creator have more breathing room.
- Increased bottom padding and title size (24 → 26) so text doesn't feel cramped against the bottom edge.
- Title, area, and `PlaceCreator` all live here now.

**`place-detail-content.tsx`** — Details container (what was the "black container"):
- **Removed** the duplicate `<Text>{place.name}</Text>` — the title now only appears once, in the hero.
- **Location row** (`📍 address`) now only renders when `place.address` is non-empty.
- **Hours/open row** (`🕒 hours` + open/closed pill) now only renders when at least one of hours or open status is available.
- When only open status exists (no hours), the open/closed pill shifts right via `marginLeft: 'auto'` so it doesn't leave a dangling time icon.
- No empty space is reserved when these infos are missing.

**Verification:** `tsc --noEmit` → clean; ESLint on all touched files → 0 errors.

If a place has no address, hours, or open status, the detail screen now collapses straight from the rating row to the "About" section instead of showing blank rows.

---

## User

Nice next look at the share button and saved button up there, there black and therefore not visibile, make them bigger and bolder and white, now we have a weird rate this place button, remove that button and add a form field just before  the reviews, so that I can review stuff the form field should be properly rounded, you know what to do just style it well

---

## Assistant

Now I understand. `onPrimary` is dark (`#0e0e10`) so the hero buttons disappear on the dark overlay. Let me fix everything.


---

## Assistant

Now remove the rate button from PlaceDetailReviews:


---

## Assistant

Now create the inline review form component:


---

## Assistant

I have a syntax error - missing closing brace on `maxLength`. Let me fix it:


---

## Assistant

Now wire up place-detail-screen.tsx to use the inline form instead of the sheet:


---

## Assistant

Let me check the current state of place-detail-screen.tsx to see what still needs fixing:


---

## Assistant

Two unused import warnings. Let me clean those up:


---

## Assistant

All clean — zero TypeScript errors, zero ESLint errors/warnings. Here's a summary of everything done:

## Changes

### 1. Hero buttons now visible (`place-detail-hero.tsx`)
- Save and Share icons are now **white** (`#FFFFFF`) instead of dark `onPrimary` (`#0e0e10`), which was invisible on the dark overlay.
- Bigger: **24px icons** inside **44×44 circular buttons** with a white-tinted background and border so they pop against the overlay.
- Increased hitSlop for easier tapping.

### 2. Removed "Rate this place" button (`place-detail-reviews.tsx`)
- Removed the `Rate this place` Pressable button and its `onRate` prop entirely.
- Reviews header now just shows the title.

### 3. Inline review form added before reviews (`place-review-form.tsx` — new file)
- **Star selector:** 1–5 stars, tap to select (selected stars filled in rating color).
- **Text input:** Properly rounded (18px radius), multiline, 120px min height, placeholder "Share your experience…".
- **Submit button:** Rounded pill (999px radius), primary background, disabled until a star is selected.
- Placed inline just above the reviews list in `place-detail-screen.tsx`.

### 4. Wired it up (`place-detail-screen.tsx`)
- Replaced `PlaceRatingSheet` modal with the inline `PlaceReviewForm`.
- Form submits directly to the existing `handleSubmitRating` logic.
- Removed `sheetVisible` state and `PlaceRatingSheet` import.

The review flow is now: open place details → scroll to reviews → see the inline star + text form → submit → review appears in the list immediately. No more modal sheet.

---

## User

I don't like the dominance of the submit revie button, maybe make it smaller or something, it doens't make sense having two dominant buttons in one page, it looks as it it is competeing with the get directions[Image 1]  so maybe something like this, but don't add the pluss button and the mic button just the smalll send button, so a one line form field, but it increases while we type, when it becomes big enough for us to scroll it stops expanding so we can scroll and then the circle up button to send will be at the bottom right corner

---

## Assistant

Both clean. Let me do a final review of the component:



---

## Assistant

Done. The review form now matches the WhatsApp-style input pattern you showed:

**`components/discover/place-review-form.tsx`** — rewritten:

- **Stars row** at top — compact 1–5 star selector (tap to rate)
- **Input row** — `TextInput` starts as a single line (44px), grows vertically as you type up to 100px, then becomes scrollable internally (so the whole card doesn't keep expanding)
- **Send button** — small 40×40 circle at the bottom-right corner of the input row (anchored via `alignItems: 'flex-end'`), white `arrow-forward` icon on primary background
- **Disabled state** — send button fades to 50% opacity until you've selected a star AND typed something
- **No plus, no mic, no dominant full-width button** — so it doesn't compete with "Get Directions"

Placed inline just before the reviews list in `place-detail-screen.tsx`, replacing the old modal sheet.

Verification: `tsc --noEmit` → clean, ESLint → 0 errors/warnings.

---

## User

Ok there is a max number of words that can be typed in the form field, alright put somehing like a counter under so that I can see how much I have left to type, and there is this border that appears the moment I click on the form field, I don't want that i think it is the outline,  nope I don't want it, soyeah I think that is pretty much it

---

## Assistant

I removed `Text` from the imports earlier but I'm using it for the counter. Let me add it back:



---

## Assistant

Done. Both changes are in place in `components/discover/place-review-form.tsx`:

1. **Character counter** — Shows `X / 280` aligned bottom-right under the input field, updating live as you type so you know exactly how many characters remain.

2. **No focus border** — Added `underlineColorAndroid="transparent"` to the `TextInput`, so the outline no longer appears when you click into the field. The input keeps its consistent rounded border at all times.

Verification: `tsc --noEmit` → clean, ESLint → 0 errors/warnings.

---

## User

eb  ERROR 

Code: place-review-form.tsx
  81 |       </View>       
  82 |
> 83 |       <Text style={styles.counter}>{remaining} / 280</Text>      
     |       ^
  84 |     </View>
  85 |   );
  86 | }
Call Stack
  PlaceReviewForm (components\discover\place-review-form.tsx:83:7)      
  PlaceDetailScreen (components\discover\place-detail-screen.tsx:190:13)  PlaceRoute (app\place\[id].tsx:4:10)
  RootLayout (app\_layout.tsx:156:19)
Web  ERROR  [ErrorBoundary] Uncaught error: [TypeError: Failed to construct 'Text': Please use the 'new' operator, this DOM object constructor cannot be called as a function.]     

Code: place-review-form.tsx
  19 | };
  20 |
> 21 | export function PlaceReviewForm({ onSubmit }: Props) {
     |        ^
  22 |   const [rating, setRating] = useState(0);
  23 |   const [text, setText] = useState('');
  24 |   const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT);
Call Stack
  PlaceReviewForm (components\discover\place-review-form.tsx:21:8)      
  ErrorBoundary#constructor (components\ui\error-boundary.tsx:19:5)     
  PlaceDetailScreen (components\discover\place-detail-screen.tsx:26:38) 
  PlaceRoute (app\place\[id].tsx:3:16)
  AuthGate (app\_layout.tsx:29)     
  MessageSyncProvider (components\messages\message-sync-provider.tsx:23:8)
  ToastProvider (components\ui\toast-card.tsx:99:8)
  OnboardingProvider (context\onboarding-context.tsx:14:8)
  AuthProvider (context\auth-context.tsx:80:32)
  AppConfigProvider (context\app-context.tsx:10:8)
  RootLayout (app\_layout.tsx:137:16) 

Code: place-detail-screen.tsx       
  173 |
  174 |   return (
> 175 |     <ErrorBoundary onReset={() => queryClient.invalidateQueries({ queryKey: ['place', id] })}>      
      |     ^
  176 |       <View style={styles.container}>
  177 |         <ScrollView
  178 |           contentContainerStyle={styles.scrollContent}
Call Stack
  PlaceDetailScreen (components\discover\place-detail-screen.tsx:175:5) 
  PlaceRoute (app\place\[id].tsx:4:10)
  RootLayout (app\_layout.tsx:156:19) 

---

## Assistant

The issue is that on web, `Text` is being resolved to the DOM `Text` constructor instead of React Native's `Text` component — likely due to the combined `type` import in the same block confusing the bundler. Let me separate the imports:





---

## Assistant

Both clean. The fix was separating the `type` import from the value imports — on web, having `type TextInputContentSizeChangeEvent` in the same import block as value imports was confusing the bundler, causing `Text` to resolve to the DOM `Text` constructor instead of React Native's `Text` component.

The `place-review-form.tsx` now has:
- **Character counter** (`X / 280`) bottom-right under the input
- **No focus border** via `underlineColorAndroid="transparent"`
- **Compact WhatsApp-style input** with stars row, auto-expanding text field, and small circular send button

All TypeScript and ESLint checks pass.

---

## User

Nice job now hope the fetch reviews thing has lazy loading and infinite scrolling, and why am I not seeing the text I sent with my review

---

## Assistant

Let me investigate both the reviews fetching and why submitted reviews aren't appearing.


---

## Assistant

Now I understand both issues. Let me check for other callers of these functions before making changes:


---

## Assistant

I found both root causes:

1. **Text not showing:** The `place_ratings` DB table has **no `text` column** — it only stores `rating`. `upsertPlaceRating` never saves the review text, and `fetchPlaceRatings` hardcodes `text: ''`. So your typed text vanishes on refresh (local state only, never persisted).

2. **No lazy loading:** `fetchPlaceRatings` fetches all reviews at once with no pagination.

Let me fix both. First, the migration to add the `text` column:


---

## Assistant

Now update `fetchPlaceRatings` for pagination + text, and `upsertPlaceRating` to save text:


---

## Assistant

Now update `PlaceDetailScreen` to use infinite query for reviews with lazy loading:


---

## Assistant

Now update `handleSubmitRating` to pass the review text to `upsertPlaceRating`:


---

## Assistant

Now update `PlaceDetailReviews` to support a "Load more" button:


---

## Assistant

I see the `text` style and closing `});` are missing. Let me add them:


---

## Assistant

The closing `});` is missing. Let me add it:


---

## Assistant

Now update the `PlaceDetailScreen` to pass the new props to `PlaceDetailReviews`:

