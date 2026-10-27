# In-feed pod discovery plan for roommate matching

**Session ID:** ses_e845a8c21ffekpCtPf4h3wGwLk
**Created:** 27/10/2026, 05:36:43
**Updated:** 27/10/2026, 07:34:31

---

## User

So the vision is, you know how in instagram you can be scrolling reels  then all of a sudden you just see somethng like a reel but it's not a reel it's a bunch of stories in a grid, stories you havem't viewed something like that, so I want that for my app, so in the home page while I am scrolling through stuff, I want it to show me pods I may like (incomplete pods to match roomate) so I can be scrolling and then I will just see a pod that needs a roomate and I will join them.

We are in plan mode please so let us plan

---

## Assistant

I'll explore the codebase first to understand the home feed architecture, pod model, and matching logic.

---

## Assistant

I dug through the feed, the liquidity/pod system, and the existing join flow. Good news: the backend pieces almost all exist — `pods` + `pod_members` are readable by any authenticated user, `podOpenSlotStatus`, `isGenderCompatible`, `calculateEqualShare` already exist, and `purchaseSlotCredit({ joinCode })` already joins an open pod and pushes to `/property/pay-slot`.

Here's the plan.

---

# Plan: "Pods for you" shelf interleaved in the home reel

## 1. Concept

Today the home feed is a full-screen vertical snap reel of `DiscoverListingCard` (`FlatList`, `snapToInterval = itemHeight`). We add a **second item type** to that same list: a full-screen **pod shelf** card, exactly one screen tall, that looks like Instagram's "stories you haven't seen" block — a grid of pod "story" tiles (avatar stack + progress ring). It appears after the 4th listing, then every 8 cards.

Tapping a tile opens a bottom sheet with who's in the pod, price-per-person, and **Join this pod** → existing pay-slot flow.

Because every item is the same height, **`getItemLayout`, snapping, and the scroll-offset restore in `discover-home-screen.tsx` keep working unchanged.**

```
item 0  listing
item 1  listing
item 2  listing
item 3  listing
item 4  ◀ POD SHELF (full screen, 2×3 grid of open pods)
item 5  listing
...
```

## 2. Data layer

### `services/podRecommendationsService.ts` (new, ~120 lines)

```
fetchRecommendedPods(userId, { limit = 6, seenIds = [] }) : Promise<RecommendedPod[]>
```

Pipeline (4 bounded queries, all cheap):

1. `pods` — `is_finalized = false`, `listing_id not null`, `target_occupancy > 1`, `verification_status != 'rejected'`, `created_at >= now - 30d`, `order(created_at desc).limit(50)`.
2. Reuse the **existing** `enrichPods()` in `liquidity-service.ts` (export it instead of duplicating the profile hydration).
3. One `listings` query by id for the distinct `listing_id`s (title, image, price, campus, landmark, tier).
4. One `slot_credits` query for this user (to exclude listings they already hold a credit on).

Then pure filtering/ranking:

**Exclude** (hard rules): pod not actually open (`podOpenSlotStatus`), already a member, own pod (`founder_user_id`), gender-incompatible (`isGenderCompatible(podEffectiveGender(pod), profile.gender)`), user already booked that listing.

**Score** (pure function in `utils/pod-ranking.ts`, unit-testable):

| Signal | Weight |
|---|---|
| `listing.campus === profile.school` | +40 |
| per-person share (`calculateEqualShare`) inside `living_preferences` min/max budget | +30 (scaled down outside) |
| `preferred_area` matches landmark/city (case-insensitive substring) | +20 |
| `created_at` under 7 days | +10 |
| 1 seat left (urgency) | +15 |
| 2 seats left | +8 |
| already in `seenIds` | −25 (demote, don't hide) |

Return top `limit`. `RecommendedPod = Pod & { listing: PodListingSummary; score: number }`.

### `services/pod-seen-store.ts` (new, ~40 lines)
Persisted "viewed" set (the Instagram "unviewed story" metaphor) — same storage approach as the existing offline stores so the rings differ next session. Tapping a tile marks it seen; joining removes it from the shelf.

### `hooks/useRecommendedPods.ts` (new, ~45 lines)
`useQuery({ queryKey: ['recommended-pods', userId], staleTime: 2 * 60_000, gcTime: 10 * 60_000, enabled: !!userId })`. Errors are **not** allowed to break the feed — the shelf is additive.

### `hooks/use-join-open-pod.ts` (new, ~55 lines)
Extracts the join logic currently inlined as `handleJoinOpenPod` in `claim-room-modal.tsx` (rule: never duplicate). On success invalidates `recommended-pods`, `open-pods`, `active-pods`, `user-slot-credits` and pushes `/property/pay-slot`.

> **Backend/perf note (rule 4):** v1 scans at most 50 open pods and ranks client-side — fine at current volume and zero migration. Once `pods` passes a few thousand open rows, move the filter+score into a `get_recommended_pods(p_user_id, p_limit)` RPC mirroring `get_recommended_listings`, so the client never over-fetches. I'd rather ship v1 now and not block on SQL.

## 3. Feed interleaving

`utils/feed-interleave.ts` (new, pure, ~40 lines) + `feed-interleave.test.ts`:

```ts
export type FeedItem =
  | { kind: 'listing'; key: string; listing: FeedListing }
  | { kind: 'pods';    key: string; pods: RecommendedPod[] };

buildFeedItems(listings, pods, { firstAt: 4, every: 8 })
```

Key detail: it must stay **stable** across re-renders (no reshuffling mid-scroll) — derive shelf ids from the pod ids it contains, and rebuild only when inputs change (`useMemo`).

Changes to existing files (small, surgical):
- `components/home/discover-listing-feed.tsx` — `FlatList<FeedItem>`, `renderItem` switch, `keyExtractor` on `item.key`. ~25 lines changed.
- `components/home/discover-home-screen.tsx` — add the hook, `useMemo` the items, prefetch pod listing images in the existing `Image.prefetch` loop. ~12 lines.
- No change to `HomeSearchBar`, `FeedModeSelector`, `RoommateDeck`, or offset restore.

## 4. UI components

- `components/home/pod-shelf-card.tsx` (~150) — full-screen dark gradient surface with the top pod's listing image at 20% opacity, header, 2×3 grid, footer.
- `components/home/pod-shelf-tile.tsx` (~110) — the "story" tile: circular avatar stack with a progress ring (`occupied/target`, using `react-native-svg`, already a dep), unviewed ring = `DesignColors.primaryBright`, viewed = `outlineVariant`, empty seat = dashed circle with `+`. Below: listing title (1 line), `1 of 3 filled`, `₦400k/yr each`.
- `components/pod/pod-avatar-stack.tsx` (~60) — extracted from `open-pod-card.tsx` so card + tile + detail share one avatar implementation.
- `components/pod/pod-join-sheet.tsx` (~120) — `Modal` bottom sheet reusing `useDraggableSheet`, `useEscapeKey`, and the existing `OpenPodDetail` + `ClaimSplitSummary` + `WizardFooter`. **Click-outside + Escape** per rule 3.
- `components/claim/open-pod-detail.tsx` — narrow its `listing` prop from `DbListing` to a `PodListingSummary` structural subset. `DbListing` still satisfies it, so the claim flow's call site is untouched.

## 5. Edge cases / failure handling

| Case | Behavior |
|---|---|
| No pods / fetch error | Shelf never renders; feed identical to today. `console.error('[PodRecommendations] …')`. Nothing blocking. |
| Pod filled between fetch and tap | `purchaseSlotCredit` throws (`This group is already full…`) → toast, invalidate + refetch shelf. |
| User already has a credit on that listing | Excluded up front (`ALREADY_RESERVED` can't surprise them). |
| Pod listing deleted/unavailable | Filtered out (`listing_id` join returns null). |
| Gender mismatch / mixed-gender pod | `isGenderCompatible` filter, same rule the claim flow already applies. |
| Pull-to-refresh | Existing `refetch()` on listings; also `refetch()` pods so the shelf is fresh. |

## 6. Verification

- `utils/pod-ranking.test.ts` — seats/gender/membership exclusion + budget & campus ordering.
- `utils/feed-interleave.test.ts` — placement at 4 then every 8, stability, empty pods = passthrough.
- Manual: reel snap still lands exactly on items; offset restore after returning from `/property/pay-slot`; 250-line cap respected.
- `npm test`, `npm run lint`.

## 7. Suggested phases
1. Service + ranking + tests (no UI).
2. Feed interleave + shelf card (static dummy pods from `/dummy/liquidity-mock.ts` for visual tuning).
3. Tile + join sheet + real data wiring.
4. Seen-state + polish (rings, haptics).

---

A few decisions I'd like from you before writing code:

---

## Assistant

Locked in. Here's the plan updated with your answers.

## Decisions applied

| Decision | Value |
|---|---|
| Cadence | after the 4th listing, then every 8 |
| Shelf size | **dynamic 1–6 pods** — a shelf with a single pod still renders |
| Seen state | session-only, in-memory (resets on app restart) |
| "See all pods" | deferred; footer link not rendered in v1 |

## Adaptive grid (the one thing that changes in the UI section)

`utils/pod-grid.ts` (new, pure, ~25 lines) + test:

| Pods | Columns | Shape |
|---|---|---|
| 1 | 1 | one large hero tile (big ring, member names, seats, `₦x/yr each`) |
| 2 | 2 | side by side |
| 3 | 3 | one row |
| 4 | 2 | 2 × 2 |
| 5 | 3 | 3 + 2 |
| 6 | 3 | 3 + 3 |

Two important constraints baked in:

- **No inner scroll.** The grid uses `flex: 1` rows sized to the available space between header and footer. A vertical `ScrollView` inside a `snapToInterval` reel is a gesture conflict — never do it. On small screens the tiles shrink instead of clipping.
- **No duplicate shelves.** If fewer than 6 qualifying pods exist, the first shelf shows what's there and later shelves in the same feed build are dropped when they'd only repeat pods already shown.

## Session-seen behavior

- `hooks/use-pod-seen.ts` (~30 lines) — module-level `Set<string>` + `markPodSeen` / `isPodSeen`. Survives tab switches and re-renders, resets on cold start. No storage layer, no migration.
- Visual: unviewed tile ring = `DesignColors.primaryBright`; viewed = `outlineVariant` (the "stories you've watched" dimming).
- Ranking: seen pods get `−25` (demoted, not hidden) so a refreshed shelf surfaces new groups first.

## Final file list

**New**
- `services/podRecommendationsService.ts` — fetch → enrich → filter → rank
- `utils/pod-ranking.ts` — pure scoring + exclusion rules
- `utils/pod-grid.ts` — column mapping for 1–6
- `utils/feed-interleave.ts` — `FeedItem[]` builder, stable keys, no-duplicate shelves
- `hooks/useRecommendedPods.ts` — TanStack `useQuery`, 2 min stale
- `hooks/use-pod-seen.ts` — session Set
- `hooks/use-join-open-pod.ts` — extracted from `claim-room-modal`
- `components/home/pod-shelf-card.tsx` — full-screen surface, header, fitted grid
- `components/home/pod-shelf-tile.tsx` — story tile (ring + avatar stack + seats + price)
- `components/pod/pod-avatar-stack.tsx` — shared, extracted from `open-pod-card`
- `components/pod/pod-join-sheet.tsx` — Modal sheet, click-outside + Escape

**Modified (surgical)**
- `components/home/discover-listing-feed.tsx` — `FlatList<FeedItem>` + render switch
- `components/home/discover-home-screen.tsx` — hook wiring, memoised items, pod image prefetch
- `components/claim/open-pod-detail.tsx` — prop narrowed to `PodListingSummary` (structural subtype of `DbListing`, so the claim flow's call site is untouched)
- `components/claim/open-pod-card.tsx` — use shared avatar stack
- `services/liquidity-service.ts` — `export` the existing `enrichPods` (no duplication)

**Tests**
- `utils/pod-ranking.test.ts`, `utils/pod-grid.test.ts`, `utils/feed-interleave.test.ts`

## Order of work
1. Ranking + grid + interleave utilities with tests (no UI, reviewable in isolation)
2. Service + `useRecommendedPods`, wire into feed, render shelf with `dummy/liquidity-mock.ts` pods to tune visuals
3. Tile + join sheet + `use-join-open-pod`, real data
4. Session-seen rings, prefetch, empty/error polish

Everything stays well under the 250-line cap; largest new files are the shelf card (~150) and the service (~120).

Say the word and I'll start on **Phase 1** (pure utilities + tests) so you can review the ranking and interleaving logic before any UI lands.

---

## User

Ok this is good

---

## Assistant

Starting Phase 1. Let me check the existing test conventions and type setup first.

---

## Assistant

Now I'll write the Phase 1 utilities and types.

---

## Assistant

All 37 tests pass. Now type-checking (filtering to the new files, since the project may have pre-existing errors).

---

## Assistant

**Phase 1 is done.** Pure logic only — no UI touched yet.

## What landed

| File | Lines | Purpose |
|---|---|---|
| `types/pod-recommendation.ts` | 38 | `PodListingSummary`, `RecommendedPod`, `PodMatchContext` |
| `utils/pod-grid.ts` | 35 | 1–6 adaptive grid mapping (`1→hero`, `2→2col`, `3→3col`, `4→2×2`, `5/6→3col×2row`) |
| `utils/pod-ranking.ts` | 138 | Hard eligibility filters + weighted scoring + deterministic sort |
| `utils/feed-interleave.ts` | 83 | `FeedItem[]` builder: first shelf after 4, then every 8, no repeated pods |

## Behavior locked in by tests (37 passing)

**Eligibility** — a pod is excluded if it's finalized, full (invited seats count as taken), your own pod, one you're already in, gender-incompatible, or on a listing you already hold a credit for.

**Scoring** — campus `+40`, area match `+20`, budget in range `+30` (below range `+15`, slightly over `+10`, way over `−25`), fresh `<7d` `+10`, last seat `+15` / two seats `+8`, already-seen this session `−25`.

**Interleaving** — 20 listings + 8 pods produces `4 listings → shelf(6) → 8 listings → shelf(2) → 8 listings`; 2 listings + 3 pods still yields `2 listings → shelf(3)`; empty pods returns the reel completely untouched; empty feed returns `[]`.

**Determinism** — equal scores break by newest first, then id, so a re-render never reshuffles the shelf under the user's thumb.

Verification: `37/37` tests pass, `tsc` reports no errors in any new file (the 8 pre-existing errors are in `discover-bottom-nav.tsx` and `message-lodge-decision-card.tsx`, untouched), and `eslint` is clean on all seven files. Every file is well under the 250-line cap.

## Phase 2 next

`services/podRecommendationsService.ts` (query → `enrichPods` → rank), `hooks/useRecommendedPods.ts`, then wiring `buildFeedItems` into `discover-listing-feed.tsx` + `discover-home-screen.tsx`, with the shelf rendered from `dummy/liquidity-mock.ts` pods first so you can eyeball the layout before real data is connected.

Want me to go ahead with Phase 2?

---

## User

Good next phase

---

## Assistant

Phase 2. Starting with the data service and hook.

---

## Assistant

Let me verify those 4 failures are pre-existing by temporarily stashing my tracked edits.

---

## Assistant

**Phase 2 is in.** The shelf now renders in the home reel with real data.

## Data layer

**`services/podRecommendationsService.ts`** (187) — bounded pipeline: `pods` (`is_finalized=false`, has `listing_id`, created within 30 days, `limit 50`) → batch profiles → batch pending invitations → batch listings → `rankPods`. Returns up to 18 pods, enough to fill several shelves.

Two deliberate calls:
- **Didn't reuse `enrichPods`** — it fires a `fetchPodInvitations` query *per pod* plus an RPC. At 50 pods that's ~100 round-trips per shelf fetch. The feed-shaped variant batches everything into 3 queries. (Deviation from the plan, noted.)
- **Pending invites count as occupied seats**, otherwise the shelf would advertise seats already promised to a friend.

**`hooks/useRecommendedPods.ts`** (63) — composes profile + `living_preferences` + non-expired slot credits into a `PodMatchContext`, `staleTime` 2 min, `gcTime` 10 min. Errors never gate the reel.

## UI

| File | Lines | |
|---|---|---|
| `pod-shelf-card.tsx` | 141 | Full-height gradient interstitial, gold glow, header, flex-fitted grid |
| `pod-shelf-tile.tsx` | 173 | SVG progress ring (`occupied/target`), avatar cluster, seats, `₦x/yr each` |
| `pod-avatar.tsx` | 56 | Shared avatar + initials/color helpers |
| `pod-avatar-stack.tsx` | 100 | Overlapping stack, `+N`, dashed empty seat |
| `discover-listing-feed.tsx` | 112 | Now `FlatList<FeedItem>` with a `listing` / `pods` render switch |
| `discover-home-screen.tsx` | 220 | Wires `buildFeedItems`, prefetches pod imagery, refreshes pods on pull-to-refresh |

Layout is exactly one `itemHeight`, so snapping, `getItemLayout`, and scroll-offset restore are untouched. Single-pod shelves switch to a wide hero tile with a green "2 seats open" chip — your min-1 requirement works end to end.

Also de-duplicated two things while I was in there: `open-pod-card` / `open-pod-detail` now import the shared avatar helpers, and `roommateService` uses the new `utils/currency.ts` instead of its private formatter.

## Tests

`41 passed` across the four suites — including a new `pod-shelf-card.test.tsx` rendering 1, 3, and 6 pods via `dummy/pod-shelf-mock.ts` (verified hero layout, singular/plural footnote, tap callback with the right pod, and null render on empty). ESLint clean, `tsc` reports nothing in any touched file.

**Known pre-existing failures** (confirmed on `HEAD` by stashing my changes): `location-access-service`, `message-lodge-reservation-card`, `payment-checkout-screen`. The `lobby-screen` suite also failed once during a full parallel run but passes standalone — resource contention, not my change.

## Two things to flag

1. **Tile press is temporarily a navigation** to `/property/{listingId}`, where the existing claim wizard already offers open pods to join. Phase 3 replaces it with the inline bottom sheet — this is a working behavior, not a stub.
2. **Insertion timing:** if the pods query resolves *after* the user has scrolled past the 4th listing, the shelf insertion shifts content. In practice both queries resolve in parallel on mount, so it lands before the user reaches that point.

Ready for Phase 3: `use-join-open-pod` (extracted from `claim-room-modal`), `pod-join-sheet` with click-outside + Escape, and post-join invalidation so a joined pod disappears from the shelf.

---

## User

So what's next?

---

## Assistant

Next is **Phase 3 — join from the shelf**, which is the piece that turns the card from a teaser into the actual feature you described ("I see a pod, I join it").

## Phase 3 deliverables

| Step | File | What it does |
|---|---|---|
| 1 | `hooks/use-join-open-pod.ts` (new, ~55) | Extracts the join logic currently inlined in `claim-room-modal.tsx` → `purchaseSlotCredit({ joinCode, source: 'recommendation' })` → toast → `/property/pay-slot?id=…`. Both call sites then share one path. |
| 2 | `components/pod/pod-join-sheet.tsx` (new, ~110) | Bottom sheet on the reel: who's in, per-person split, **Join this group**. Backdrop press **and** Escape close it (rule 3), reusing the existing `useDraggableSheet` + `useEscapeKey`. |
| 3 | `components/claim/open-pod-detail.tsx` (edit) | Narrow `listing` from `DbListing` → `PodListingSummary`. Drop-in compatible, so the claim wizard's call site is untouched. |
| 4 | `discover-home-screen.tsx` (edit) | Tile press opens the sheet instead of navigating to the listing (replacing the interim behavior I flagged). |
| 5 | `claim-room-modal.tsx` (edit) | Switch to `use-join-open-pod` so the join logic exists once. |
| 6 | Cache behavior | On success invalidate `recommended-pods`, `open-pods`, `active-pods`, `user-slot-credits`, and remove that pod from the cached shelf so it can't be re-tapped while the user is in the payment flow. |

Plus the failure paths that matter here: **group filled between fetch and tap** → toast + silent refetch; **already reserved on that listing** → toast (shouldn't happen thanks to the eligibility filter); **offline** → whatever `purchaseSlotCredit` already throws, surfaced as a toast, not a crash.

## Phase 4 — the "unviewed stories" feel + polish

- `hooks/use-pod-seen.ts` — session `Set` with `useSyncExternalStore`, resets on cold start (your call).
- Ring turns from gold → dim `outlineVariant` once tapped; seen pods get the `−25` demotion on the next fetch.
- Sub-cases worth tightening: pod disappears while its sheet is open, shelf empties after a join (the card should drop out rather than render blank), and logging on tap/join so you can see whether the shelf actually converts.

## Parked for later (not blocking)

- `/roommate/pods` "see all" screen.
- Lifestyle compatibility % on the sheet (needs `roommate_preferences` joins — deliberately left out of the feed query).
- Moving filter+score into a `get_recommended_pods` RPC once open pods pass a few thousand rows.

Want me to run Phase 3 now?

---

## User

Nice job, mext phase

---

## Assistant

Phase 3. First, checking the sheet primitives I plan to reuse.

---

## Assistant

Now the Phase 3 refactor. Starting with the type change (`RecommendedPod.listing` becomes a real `DbListing`, since joining needs the whole row).

---

## Assistant

Now the dummy shelf mock needs full listings:

---

## Assistant

The claim modal is now over the 250-line cap (it already was, but I touched it). Extracting two cohesive pieces to bring it under:

---

## Assistant

**Phase 3 is done — you can now join a pod without leaving the reel.**

## Tap → sheet → payment

| File | Lines | Role |
|---|---|---|
| `components/pod/pod-join-sheet.tsx` | 78 | Bottom sheet on the reel: who's in, split, **Join This Group**. Backdrop press, close button, and `Escape` all dismiss. |
| `hooks/use-join-open-pod.ts` | 65 | One join path: `purchaseSlotCredit({ joinCode, source: 'recommendation' })` → toast → returns the credit. |
| `hooks/use-pod-join-flow.ts` | 30 | Owns sheet selection + navigation to `/property/pay-slot`. |
| `hooks/use-pod-member-navigation.ts` | 24 | Tapping a member opens their profile; pending invites explain themselves. |

The sheet reuses the claim wizard's shell (`useDraggableSheet`, `useEscapeKey`, `claim-room-modal.styles`, `OpenPodDetail`), so dragging, the 92% height, and the CTA behave identically in both places — no second sheet implementation.

**Post-join state:** the joined pod is dropped from the `['recommended-pods']` cache synchronously, so it can't be tapped twice while the user is in the payment flow. On failure the cache is invalidated instead, since the usual cause is the group filling up under us (the server rejects it with "This group is already full").

## One type decision worth flagging

`RecommendedPod.listing` is now a **full `DbListing`** instead of the narrow `PodListingSummary`. Joining feeds that row into `purchaseSlotCredit`, which needs `estate_id`, `admin_id`, `max_roommates`, etc. The alternatives were a second fetch at join time or guessing which fields the join chain touches — selecting `*` for ≤18 listings is the smaller and safer cost. Consequences: `PodListingSummary` is gone, `pod-ranking.ts` and its fixtures use `DbListing`, and `dummy/listing-fixture.ts` provides `makeDbListing()` so test fixtures stay one-liners.

## Claim wizard consolidated

`claim-room-modal.tsx` was 292 lines (already over the cap before this phase). It's now **241**:

- `use-reserve-claim-spot.ts` (97) — the reserve → admin-notify → pay flow, lifted out verbatim.
- `roommate-choice-step.tsx` (54) — step 1's JSX, reusing the shared sheet styles.
- The join logic now comes from `useJoinOpenPod`, so the wizard and the shelf share it instead of duplicating the mutation. `open-pod-step.tsx` also dropped to 89 lines via the member-navigation hook.

Behaviour is unchanged: same toasts, same admin notification, same navigation, `joining={isReserving || isJoining}` keeps the spinner correct.

## Verification

- **52 tests pass** across `pod-shelf-card`, `pod-join-sheet`, `pod-grid`, `pod-ranking`, `feed-interleave`, and both claim selector suites.
- New sheet suite covers content, CTA payload, backdrop + close-button dismissal, Escape wiring, and the empty state.
- `tsc --noEmit`: only the **7 pre-existing** error lines in `discover-bottom-nav.tsx` / `message-lodge-decision-card.tsx`.
- ESLint clean on every touched file.
- Full suite: 24/28 suites pass. The 4 reds are `location-access-service`, `message-lodge-reservation-card`, `payment-checkout-screen` (all fail on `HEAD` too) plus `lobby-screen`, which passes standalone and only flakes under full parallel load — confirmed again just now.

Two things to note: the sheet suite needed `jest.setTimeout(30_000)` because icon-font loading makes its first mount slow on a loaded box; and `discover-home-screen.tsx` is at **241/250**, so Phase 4 wiring there should go into the `usePodJoinFlow` hook rather than the screen.

Next up is **Phase 4** — session-seen rings (gold → dim, `−25` demotion, in-memory only) plus the polish cases: pod vanishes while its sheet is open, shelf emptying after a join, and conversion logging.

---

## User

Nice now look at the pods, and see something instead of the avatar in the center that has the user initails make the background of each card to be the picture of the lodge, bring the name and dteails a little bit down so that I can see  the picture properly, and in the modal I want to see details about the lodge including pictures and everything

---

## User

Continue

---

## Assistant

I'll continue from where we left off. Let me first explore the current state of the key files to understand exactly what I'm working with.


---

## Assistant

Let me read more supporting files in parallel.


---

## Assistant

Now let me read the remaining key files in parallel.


---

## Assistant

Let me read the rest of the image gallery modal and top of discover-listing-card, plus check related hooks.


---

## Assistant

Let me check `podOpenSlotStatus` and run the baseline tests before making changes.


---

## Assistant

I now have a full picture. Let me check the currency util, then start implementing.


---

## Assistant

I have everything I need. Let me set up a task list and start implementing.


---

## Assistant

The plan is solid. Let me verify a couple of details (tsconfig strict catch, existing chip components) before writing code.


---

## Assistant

Now I'll write the code. Starting with the new photo hook:


---

## Assistant

Now refactor `hooks/use-listing.ts` to reuse `fetchListingPhotos`:


---

## Assistant

Now create `components/pod/pod-listing-section.tsx`:


---

## Assistant

Now update `open-pod-detail.tsx` to include the lodge section:


---

## Assistant

Now the main piece — rewriting `pod-shelf-tile.tsx` as an image card:


---

## Assistant

Now fix the shelf eyebrow text so the pre-existing test failure resolves:


---

## Assistant

Now run the shelf card tests, then type-check and lint everything:


---

## Assistant

Tests pass. Two new tsc errors in my section component (one is a pre-existing error in an unrelated file). Let me fix them:


---

## Assistant

Only the pre-existing error remains — no new type errors from my changes. Now run ESLint on all touched files:


---

## Assistant

One unused import warning. Let me add the loader indicator to the image tile (matches the discover card pattern):


---

## Assistant

ESLint clean. Now let me add tests. First check the jest setup to know how to mock `supabase`/`useListingPhotos`:


---

## Assistant

I need to fix a bug: `onImagePress` in the section only sets the index but never opens the gallery. Let me fix that:


---

## Assistant

Now let me write the two test files:


---

## Assistant

Now run the new tests plus the existing pod/claim suites:


---

## Assistant

Some tests passed; the command timed out running serially (each file is slow). Let me run the remaining ones individually:


---

## Assistant

The test environment lacks native `react-native-reanimated` (pulled in transitively via `ImageGalleryModal`). Let me check what uses reanimated to decide where to mock it:


---

## Assistant

`react-native` Animated (used by the sheet) works in tests; only `image-gallery-modal.tsx` imports `react-native-reanimated`, which needs a mock in the node test env. I'll add a minimal reanimated mock to `jest.setup.js`:


---

## Assistant

The gallery modal calls `useSafeAreaInsets()` unconditionally, so tests need a safe-area-context shim too (same category as the existing firebase/expo-sqlite mocks in this file). Let me add it:

