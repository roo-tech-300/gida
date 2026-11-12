# Gida UX audit — November 2026

Branch: `redesign/ux-overhaul`. Brand stays as it is (dark surfaces, gold `#9D7E43`, Inter).
Target: retention through an app that feels intentional and premium, and makes paying easy.

Each finding is tagged **[P0]** (losing users or money), **[P1]** (daily friction) or **[P2]** (polish).

---

## 1. Navigation and information architecture

| # | Finding | Where |
|---|---------|-------|
| 1.1 **[P0]** | Switching between *places* and *people* (roommates) is hidden. You either swipe down on the search bar or tap an unlabeled `swap-vertical` icon, which opens a full-screen "Switch Context" overlay. Most students will never find the roommate side of the app. | `components/home/home-search-bar.tsx`, `feed-mode-selector.tsx` |
| 1.2 **[P0]** | No place answers "where is my house?". Reservations, invites, the group code and the expired banner all sit inside **Profile**, between the avatar and the settings. After paying, the most important object in the app is three scrolls deep in a settings screen. | `components/profile/student-profile-screen.tsx` |
| 1.3 **[P1]** | The Expo tab bar is hidden (`tabBarStyle: display none`), and a hand-built `DiscoverBottomNav` is pasted into 7 screens and uses `router.replace`. Each tab change throws away scroll position and screen state, and the nav is missing on every pushed screen. | `app/(tabs)/_layout.tsx`, `components/home/discover-bottom-nav.tsx` |
| 1.4 **[P1]** | Saved has its own tab but is a low-frequency destination, while the reservation hub has none. | tab layout |

**Proposal: four real tabs.** **Discover** (with a visible `Places / People` segmented control) · **My Home** (reservation hub: status, pay, household, tour pass, receipts) · **Chats** · **Profile** (settings only). Saved becomes a heart filter inside Discover and a row in Profile. Use the native `Tabs` bar with the existing styling so state survives.

## 2. Property feed — is it losing customers?

Probably, yes. The feed is a full-screen vertical pager: one listing per screen (`itemHeight = feedHeight`).

| # | Finding |
|---|---------|
| 2.1 **[P0]** | Students compare *price, distance and room type*. A one-at-a-time, TikTok-style pager makes comparing impossible and turns browsing into a memory test. |
| 2.2 **[P0]** | There is no way to filter by budget, area or move-in date. Category pills exist but only appear when `filtersOpen` is true, and the search bar never sets it, so in practice they are unreachable. The onboarding budget the user typed in is never reflected back as a visible filter. |
| 2.3 **[P1]** | The card shows a status badge, beds/baths/size and "View Listing". It leaves out what decides a booking: *spots left*, *distance to campus gate*, *total cost per person*, *verified by Gida*. |
| 2.4 **[P1]** | Every image in every loaded page is prefetched in an effect (`listings.forEach(Image.prefetch)`). That is heavy on student data plans; prefetch only the next 2–3. |
| 2.5 **[P2]** | The "liked" heart uses `secondary`, which is the same gold as primary, so saved and unsaved look alike on bright photos. |

**Proposal.** Replace the pager with a scannable list of large cards (about 1.6 per screen), keep the immersive feeling for the detail page, and add a sticky filter row (`Budget · Area · Room type · Move-in`) prefilled from onboarding. Each card leads with price per person per year, "2 of 4 spots left" and a walk-time chip.

## 3. Money path (reserve → approve → pay)

| # | Finding |
|---|---------|
| 3.1 **[P0]** | **Parents, who usually pay, can't take part.** There is no "ask someone to pay" flow, no payment link, no way to share an invoice. A student has to borrow a parent's card or do a bank transfer outside the app. This is the biggest conversion leak in the product. |
| 3.2 **[P0]** | The 3-day `payment_deadline` starts when the student reserves, but payment is blocked while the admin reviews (`pending_verification`). Admin slowness eats the student's window, and the pending screen gives no ETA and no way to contact anyone. *(Confirm whether approval extends the deadline. I saw no code that does.)* |
| 3.3 **[P0]** | The vocabulary changes on every screen: *Claim Spot, Slot, Pod, Lobby, Credit, Secure Spot, Buying 1 of 4, Reject Pod, Verified Paid Slot*. Users can't build a mental model, and parents won't trust a screen that says "Buying 1 of 4". |
| 3.4 **[P1]** | The claim wizard is 2–5 steps inside a draggable modal before the user sees what they'll pay. The total appears only on checkout, as a single number ("Covers your share of rent."), with no breakdown of fees, caution deposit or what's refundable. |
| 3.5 **[P1]** | The detail page's bottom bar crams Save, Tour and the CTA side by side, and the CTA label changes between 6 states with no explanation underneath. |

**Proposal.**
- **One vocabulary:** *Reserve* (verb), *your spot* (noun), *household* (the group; replaces pod and lobby), *hold* (the 3-day window). Remove "claim", "slot", "credit" and "pod" from all UI copy.
- **Two-step Reserve sheet:** (1) *Who's moving in?* Just me / With friends / Match me. (2) *Review & hold*, with a line-item breakdown, refund rules and the hold timer.
- **Checkout offers two equal paths:** **Pay now** (Paystack) and **Send to a parent** (a secure link over WhatsApp/SMS/email).
- **Parent pay page** (web, no account needed): property photos, a "Verified by Gida" stamp, the student's name, the breakdown, the time left on the hold, Paystack, and an emailed receipt. The student gets a push notification when it's paid.
- **Hold clock:** start (or extend) it when the admin approves, and show the admin's expected response time on the pending screen.

## 4. Chat — who talks to whom?

Today it's strictly 1-to-1 (`conversations.participant_a / participant_b`).

| # | Finding |
|---|---------|
| 4.1 **[P0]** | **Roommates have no group chat.** A household of four needs six separate DMs to agree on anything. |
| 4.2 **[P0]** | **The admin looks like a random person.** When a student reserves, the app posts *"Applied for a lodge spot — awaiting your review"* **in the student's name** into a DM with the listing's `admin_id`. The student sees a message they never wrote, sent to someone they don't know. |
| 4.3 **[P1]** | The filters are only `All / Unread`. Nothing separates support, household and peer threads. |
| 4.4 **[P1]** | The empty state tells users to "Tap Say Hello on any roommate", but the roommate side is hidden (see 1.1). |

**Proposal: three thread types, each visually distinct.**
- **Household:** a group thread created automatically when a household forms. Gold ring avatar stack, and pinned in the list.
- **Gida Support:** the admin presented as a *verified Gida concierge* (brand mark, "Typically replies in 2 h"), never as a personal account. System events (applied, approved, paid) appear as neutral status rows, never as user-authored text.
- **Direct:** peer DMs as today.

Filters become `All · Household · Support · Unread`.
*(Needs a backend change: a `conversation_members` table or a `kind` + `pod_id` column on `conversations`.)*

## 5. Admins — can they work without thinking?

| # | Finding |
|---|---------|
| 5.1 **[P0]** | There are four different dashboards (super, regional, field, basic), each with a different layout. All are launcher grids, so an admin has to know which tile holds today's work. |
| 5.2 **[P0]** | The field and regional dashboards show **hard-coded fake data**: "Musa Ibrahim", "Zone 1: 70 Active Properties", a fake schedule and fake "Recent actions". 4 of 6 tiles on each do nothing (Onboard, Allocations, Maintenance, Contacts / Sub-admins, Field staff, Zone inventory, Landlords). Admins learn not to trust the screen. |
| 5.3 **[P1]** | Applications and tours are separate queues, and approvals also arrive as chat cards, so the same task shows up in three places. |
| 5.4 **[P1]** | Rejecting requires typing a free-text reason in a modal, which is slow and inconsistent. |

**Proposal: one "Today" inbox, the same for every role** (scope filtered by region). It lists items in deadline order: *applications whose hold expires soonest*, *tours today*, *holds about to lapse*, *unanswered support chats*. Each row has one-tap **Approve** and **Decline** (with reason chips plus an optional note). Management (listings, landlords, regions, team) moves to a second tab. Remove every hard-coded number and dead tile.

## 6. Onboarding and copy

| # | Finding |
|---|---------|
| 6.1 **[P1]** | Before seeing a single listing, a student goes through sign-up → username → gender → budget (two typed ₦ fields with validation errors) → layout → a multi-card app tour. Ask for gender and budget only; ask the rest when the student opts into roommate matching. |
| 6.2 **[P1]** | Use budget chips (`< ₦150k`, `₦150–300k`, `₦300–500k`, `₦500k+`) instead of free number fields. |
| 6.3 **[P2]** | The copy mixes ALL-CAPS labels, title case and system jargon. Write for a 19-year-old and a 50-year-old parent at the same time: short, warm, specific ("Your spot is held until Fri 6 pm"). |

## 7. Social side (students)

The roommate deck is a decent start, but it is a hidden mode (see 1.1) and the only action is "Say Hello". Students expect a *People* tab that feels like a social app: compatibility %, mutual course or level, a "looking for 2 more" household card, and lightweight reactions before a DM. Group-forming (inviting friends to a household) should be one share sheet with a link, not an invite code typed by hand.

---

## Priorities

1. **P0 money:** parent pay link + parent web page, consistent vocabulary, line-item breakdown, hold clock fix.
2. **P0 navigation:** four real tabs, My Home hub, visible Places/People toggle.
3. **P0 feed:** scannable cards + budget/area filters.
4. **P0 chat:** household group threads + branded Gida Support; stop posting system text in the student's name.
5. **P0 admin:** unified Today inbox; delete fake data and dead tiles.
6. **P1:** shorter onboarding, budget chips, copy pass, image prefetch fix.

Backend work required: group conversations, payment-link tokens + public pay route, deadline-on-approval, admin SLA field.
Visuals: Penpot page **"Gida · Redesign v2 (UX overhaul)"**.
