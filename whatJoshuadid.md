# What Joshua Did — 27 September 2026

This summary covers the four commits by `josh234678` on the local `prod` branch
whose commit dates fall on 27 September 2026 (WAT). `prod` and `origin/prod`
currently point to `2cb2bb6`.

## Commits

| Time (WAT) | Commit | Change |
|---|---|---|
| 16:26 | `7450450` | Added persistent inline waitlist submission errors alongside the existing toast; introduced a reusable `LinkCard`; changed the success state to show a WhatsApp link card. |
| 16:30 | `0402b36` | Updated coming-soon headline and supporting copy to say “Gida is coming” and that the app is being finished. |
| 16:38 | `6505a74` | Revised the copy to clarify that Gida has launched and the full mobile experience is in its final stage. |
| 16:54 | `2cb2bb6` | Changed the success message to refer explicitly to the “link tree.” |

## Overall changes

Across the four commits, three files changed: `components/landing/coming-soon-screen.tsx`,
`components/landing/waitlist-form.tsx`, and the new
`components/landing/link-card.tsx`. The net diff is 137 insertions and 13
deletions. No backend, database migration, or routing files changed in these
commits.

The waitlist form now keeps submission failures visible inline as well as
showing a toast, and clears the inline error when the user edits the email.
The first commit's message reports that the Supabase waitlist table migration
had not been applied and that submissions were failing at that time. This is
information from the commit message; these commits themselves do not apply a
migration or verify the table's current state.

The success view replaces the single WhatsApp button with a reusable link-card
layout. It currently contains one WhatsApp Channel destination. The page copy
was then revised by the next three commits, with the final headline and
subtitle describing Gida as launched and the mobile app as nearing completion;
the final success message calls the destination area a “link tree.”
