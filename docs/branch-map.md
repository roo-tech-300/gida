# Branch map (checked 2026-11-14)

## How the branches relate

```
prod ─ main ("launched", f8e7506) ─┬─ dev (+63: Discover, places, saved)
                                   │    ├─ new-feat            (+20: landing, release prompts)
                                   │    └─ feature/listing-video (+90: admin video upload, video previews)
                                   │          └─ builds        (+121, newest, 2026-11-08)
                                   └─ redesign/ux-overhaul      (+63: this branch, forked from main)
```

- `builds` contains `feature/listing-video`, `dev` and `main`. It is the most recent line and where the release workflows live.
- `redesign/ux-overhaul` is a **sibling**, not a descendant of `builds`: both forked from `main` and were built in parallel.
- It does carry a port of the video tour *viewer* (commits `26813f1`, `82f2530`), but none of the admin video tools.

## Merging `builds` into the redesign (dry run)

About 60 files conflict, mostly whole screens that were redesigned twice:
- Consumer: Discover and home, bottom navigation (moved to `components/navigation/` on `builds`), saved, property details, messages, claim sheet, payment checkout, profile.
- Admin: the four create-listing screens, `listing-detail-admin-screen`, `lodge-reservation-detail-screen`.
- Plumbing: `app/_layout.tsx`, the two GitHub workflows, `auth-context`, `eslint.config.js`, `.gitignore`, and SQL files (`sql/` was renamed to `docs/legacy-sql/` here).

## The hosted database is already at `builds` level

The local schema was built from the hosted catalogs and already has `referrals`, `referral_payments`, `referral_withdrawal_requests`, `listing_videos`, `device_tokens` and `app_releases`, and the `claim_payment_attempt` function. The redesign branch's code is *behind* the database it runs on.

## Admin: who has what

| | `builds` | redesign |
|---|---|---|
| Today inbox (one queue, oldest first, decline reasons) | no | yes |
| Role dashboards | still the hard-coded "Musa Ibrahim" / "Zone 1" data and dead tiles | replaced by Today and a role management screen |
| Admin video upload, hero/cover choice, readiness progress | yes (`listing-media-grid`, `listing-media-tile`, `listing-hero-media-picker`, `listing-readiness-progress`; `media-server/`) | no |
| Referral payouts and withdrawals (moves money) | yes (`referral-payouts`, worker `referral-disburse.ts`) | no |
| Super-admin user count | yes (`dev-stats-section`) | no |
| Phone number booking gate, notifications, admin identification | yes | no |
| Rent rounded up in the listing wizard | no | yes |
| Payment safety (refunds, no ending a reservation mid-payment), capacity, invite links | no | yes |

## Workers differ

`builds` split the Paystack worker into `paystack-initialize`, `paystack-events` and `paystack-router` on top of `claim_payment_attempt`. This branch keeps the older single `paystack.ts` and adopts the same claim function (`worker/src/payment-attempts.ts` is copied from `dev`). These will conflict and need merging by hand.
