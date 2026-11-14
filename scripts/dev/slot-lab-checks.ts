/** The rules the slot lab is checked against: data rules read back from the database, and behaviour probes. */
import { asService, asStudent, runSql, runSteps, type SqlResult } from './slot-lab-db.ts';

export interface Check {
  area: string;
  title: string;
  /** Returns the problems found; an empty list means the rule holds. */
  run: () => string[];
}

const ACTIVE = `sc.status not in ('expired','cancelled','rejected')`;
const rows = (sql: string): string[][] => runSql(sql).rows;
const describe = (r: SqlResult): string => r.error ?? r.rows.map((x) => x.join(' ')).join('; ');

export const DATA_RULES: Check[] = [
  {
    area: 'Households', title: 'A household\'s recorded intent matches its live members',
    run: () => rows(`select p.group_code, p.current_total_intent, coalesce(sum(pm.intent_size) filter (where ${ACTIVE}),0)
      from pods p left join pod_members pm on pm.pod_id=p.id left join slot_credits sc on sc.id=pm.slot_credit_id
      group by p.id having p.current_total_intent <> coalesce(sum(pm.intent_size) filter (where ${ACTIVE}),0)`)
      .map(([code, recorded, actual]) => `${code}: pod says ${recorded}, members add up to ${actual}`),
  },
  {
    area: 'Households', title: 'No household holds more people than it was made for',
    run: () => rows(`select p.group_code, coalesce(p.target_occupancy,p.property_tier), sum(pm.intent_size)
      from pods p join pod_members pm on pm.pod_id=p.id join slot_credits sc on sc.id=pm.slot_credit_id where ${ACTIVE}
      group by p.id having sum(pm.intent_size) > coalesce(p.target_occupancy,p.property_tier)`)
      .map(([code, target, got]) => `${code}: ${got} members for ${target} places`),
  },
  {
    area: 'Capacity', title: 'No listing has more households than units',
    run: () => rows(`select l.title, l.units_available, public.households_in_use(l.id) from listings l
      where public.households_in_use(l.id) > coalesce(l.units_available, 1) order by 1`)
      .map(([title, units, households]) => `${title}: ${households} households for ${units} unit(s)`),
  },
  {
    area: 'Holds', title: 'Every unpaid hold that has run out has been released',
    run: () => rows(`select l.title, u.email, round(extract(epoch from now()-sc.payment_deadline)/3600) from slot_credits sc
      join listings l on l.id=sc.listing_id join auth.users u on u.id=sc.user_id
      where sc.status in ('booked','booked_pending_claim') and sc.payment_deadline < now()
        and not exists (select 1 from pod_members pm join pods p on p.id=pm.pod_id where pm.slot_credit_id=sc.id and p.verification_status='pending_verification')
      order by 1`)
      .map(([title, who, hours]) => `${title}: ${who} lapsed ${hours}h ago and still holds a spot (the five-minute sweep has not run since)`),
  },
  {
    area: 'Money', title: 'Every rent splits into whole naira for every household size the place allows',
    run: () => rows(`select title, price_amount, coalesce(max_roommates, property_tier, 1), public.round_rent_up(price_amount, coalesce(max_roommates, property_tier, 1))
      from listings where price_amount <> public.round_rent_up(price_amount, coalesce(max_roommates, property_tier, 1)) order by 1`)
      .map(([title, price, people, fixed]) => `${title}: ₦${price} for up to ${people} people (saved before the rounding rule; re-saving it makes it ₦${fixed})`),
  },
  {
    area: 'Money', title: 'Shares add up to the rent',
    run: () => rows(`select l.title, l.price_amount, coalesce(p.target_occupancy,p.property_tier) t,
        round(l.price_amount::numeric/coalesce(p.target_occupancy,p.property_tier),2) share
      from pods p join listings l on l.id=p.listing_id
      where l.price_amount::numeric*100 % coalesce(p.target_occupancy,p.property_tier) <> 0 group by 1,2,3,4`)
      .map(([title, price, t, share]) => `${title}: ₦${price} split ${t} ways is ₦${share} each, so ${t} shares total ₦${(Number(share) * Number(t)).toFixed(2)}`),
  },
  {
    area: 'Money', title: 'Nobody has paid into a household the admin has not approved',
    run: () => rows(`select p.group_code, p.verification_status from pods p join pod_members pm on pm.pod_id=p.id join slot_credits sc on sc.id=pm.slot_credit_id
      where sc.status in ('paid_unmatched','matched','subletting') and p.verification_status <> 'approved' group by 1,2`)
      .map(([code, status]) => `${code}: has a paid member but is ${status}`),
  },
  {
    area: 'Rooms', title: 'A room is only assigned to a household that is full',
    run: () => rows(`select group_code from pods where physical_room_id is not null and not is_finalized`)
      .map(([code]) => `${code}: has a room but is not finalized`),
  },
  {
    area: 'Invites', title: 'Open invitations point at households that can still take someone',
    run: () => rows(`select p.group_code, i.invitee_name from pod_invitations i join pods p on p.id=i.pod_id
      where i.status='pending' and (p.is_finalized or p.verification_status='rejected')`)
      .map(([code, who]) => `${code}: pending invite for ${who} but the household is closed`),
  },
];

const spotsLeft = (title: string, setup = ''): string =>
  runSql(`begin; ${setup} select (get_spots_left(array[id]))->>id::text from listings where title like '${title}%'; rollback;`).rows[0]?.[0] ?? '?';

/** Starts a probe with the student holding no other unpaid spot, so the one-unpaid-spot rule does not hide what is being tested. */
const clearUnpaid = (email: string): string =>
  `update slot_credits set status = 'cancelled' where user_id = (select id from auth.users where email = '${email}') and status in ('booked', 'booked_pending_claim');`;

/** A scratch table the probe's students can all read, to hand an invite token from one to the next. */
const TOKEN_TABLE = `create temp table tk(t text); grant all on tk to authenticated, anon;`;

const listingId = (title: string): string => `(select id from listings where title like '${title}%')`;
/** Makes a student's unpaid hold on a listing run out, as the database owner, before the probe starts. */
const lapse = (email: string, title: string): string =>
  `update slot_credits set payment_deadline = now() - interval '2 hours' where user_id = (select id from auth.users where email='${email}') and listing_id = ${listingId(title)} and status = 'booked_pending_claim';`;

/** What the app does to start a household: insert a pod for the listing. */
const startHousehold = (title: string): string =>
  `insert into pods (estate_id, listing_id, property_tier, matched_gender, target_occupancy, group_code, current_total_intent)
   select estate_id, id, coalesce(max_roommates, property_tier, 1), 'ANY', 1, 'PROBE' || substr(md5(random()::text), 1, 6), 1 from listings where title like '${title}%' returning id;`;

export const PROBES: Check[] = [
  {
    area: 'Joining', title: 'Joining a full household says so plainly',
    run: () => { const r = asStudent('slot.01@gida.test', `select public.join_pod('SLFULL');`); return /already full/i.test(r.error ?? '') ? [] : [`got: ${describe(r)}`]; },
  },
  {
    area: 'Joining', title: 'Joining a household you are already in is refused',
    run: () => { const r = asStudent('slot.01@gida.test', `select public.join_pod('SLFORM');`); return /already a member/i.test(r.error ?? '') ? [] : [`got: ${describe(r)}`]; },
  },
  {
    area: 'Joining', title: 'A student who cancelled can join the household again',
    run: () => { const r = asStudent('slot.12@gida.test', `select public.join_pod('SLMEMB');`, clearUnpaid('slot.12@gida.test')); return r.error ? [`refused: ${r.error}`] : []; },
  },
  {
    area: 'Gender lock', title: 'A household locked to men refuses a woman who joins with its code',
    run: () => { const r = asStudent('slot.02@gida.test', `select public.join_pod('SLGEND');`); return /for men only/i.test(r.error ?? '') ? [] : [`got: ${describe(r)}`]; },
  },
  {
    area: 'Gender lock', title: 'A woman cannot add herself to a household locked to men by writing the membership directly',
    run: () => {
      const r = asStudent('slot.02@gida.test', `insert into pod_members (pod_id, user_id, slot_credit_id, intent_size)
        select (select id from pods where group_code='SLGEND'), auth.uid(), sc.id, 1 from slot_credits sc where sc.user_id = auth.uid() limit 1;`);
      return /for men only/i.test(r.error ?? '') ? [] : [`got: ${describe(r)}`];
    },
  },
  {
    area: 'Gender lock', title: 'A man can still join a household locked to men',
    run: () => { const r = asStudent('slot.m2@gida.test', `select public.join_pod('SLGEND');`); return r.error ? [`refused: ${r.error}`] : []; },
  },
  {
    area: 'Holds', title: 'A student whose hold ran out can reserve the place again straight away',
    run: () => {
      const r = asStudent('slot.14@gida.test', `select public.has_active_booking(${listingId('Slot · Cancelled and expired')});`, lapse('slot.14@gida.test', 'Slot · Cancelled and expired'));
      return r.rows[0]?.[0] ? ['has_active_booking still reports the lapsed hold, so a new reservation would be refused'] : [];
    },
  },
  {
    area: 'Holds', title: 'Spots left does not count holds that have run out',
    run: () => {
      const left = spotsLeft('Slot · Mixed', lapse('slot.03@gida.test', 'Slot · Mixed'));
      return left === '2' ? [] : [`shows ${left} left; one of three reservations lapsed, so it should be 2`];
    },
  },
  {
    area: 'Holds', title: 'The sweep expires approved holds that ran out and leaves requests waiting for an admin alone',
    run: () => {
      const r = runSql(`begin;
        update slot_credits set payment_deadline = now() - interval '2 hours' where user_id in (select id from auth.users where email in ('slot.03@gida.test','slot.01@gida.test')) and status='booked_pending_claim';
        select public.expire_lapsed_holds();
        select u.email, l.title, sc.status from slot_credits sc join auth.users u on u.id=sc.user_id join listings l on l.id=sc.listing_id
          where u.email in ('slot.03@gida.test','slot.01@gida.test') and l.title like any (array['Slot · Mixed%','Slot · Admin queue%']) order by 2;
        rollback;`);
      const out = r.rows.map((x) => x.join(' '));
      const problems: string[] = [];
      if (!out.some((x) => /Mixed.*expired/.test(x))) problems.push(`an approved, lapsed hold was not expired: ${out.join('; ')}`);
      if (!out.some((x) => /Admin queue.*booked_pending_claim/.test(x))) problems.push(`a request still waiting for review was expired: ${out.join('; ')}`);
      return problems;
    },
  },
  {
    area: 'Capacity', title: 'A second household cannot be started on a place whose units are all taken',
    run: () => {
      const r = asStudent('slot.02@gida.test', startHousehold('Slot · Full and paid'));
      return /fully booked/i.test(r.error ?? '') ? [] : [`got: ${describe(r)}`];
    },
  },
  {
    area: 'Capacity', title: 'A household can still be started on a place with a free unit',
    run: () => { const r = asStudent('slot.02@gida.test', startHousehold('Lab · Two photos')); return r.error ? [`refused: ${r.error}`] : []; },
  },
  {
    area: 'Capacity', title: 'A solo buyout of a shared flat takes the whole flat',
    run: () => { const left = spotsLeft('Slot · Solo buyout'); return left === '0' ? [] : [`shows ${left} spot(s) left on a flat one person has bought outright`]; },
  },
  {
    area: 'Cancel', title: 'Cancelling frees the spot and shrinks the household',
    run: () => {
      const r = asStudent('slot.03@gida.test', `select public.cancel_reservation((select sc.id from slot_credits sc join listings l on l.id=sc.listing_id where sc.user_id=auth.uid() and l.title like 'Slot · Mixed%'));
        select current_total_intent from pods where group_code='SLMIXD';`);
      const intent = r.rows.at(-1)?.[0];
      return r.error || intent !== '2' ? [`household intent is ${intent ?? 'unknown'} after cancelling (expected 2) ${r.error ?? ''}`] : [];
    },
  },
  {
    area: 'Cancel', title: 'A student who cancelled can start a new reservation on the same listing',
    run: () => {
      const r = asStudent('slot.12@gida.test', `insert into slot_credits (user_id, estate_id, listing_id, property_tier, intent_size, target_occupancy, status)
        select auth.uid(), estate_id, listing_id, property_tier, 1, target_occupancy, 'booked_pending_claim' from slot_credits
        where user_id = auth.uid() and status = 'cancelled' limit 1 returning id;`, clearUnpaid('slot.12@gida.test'));
      return r.error ? [`refused: ${r.error}`] : [];
    },
  },
  {
    area: 'Payment', title: 'A student cannot mark their own reservation as paid',
    run: () => {
      const r = asStudent('slot.03@gida.test', `update slot_credits set status='paid_unmatched', paid_at=now() where user_id=auth.uid() and status='booked_pending_claim' returning id;`);
      return r.rows.length > 0 ? ['a student set their own reservation to paid without paying'] : (/ALREADY_PAID|not allowed|cannot be changed/i.test(r.error ?? '') ? [] : [`unexpected: ${describe(r)}`]);
    },
  },
  {
    area: 'Payment', title: 'A new reservation cannot start out paid',
    run: () => {
      const r = asStudent('slot.12@gida.test', `insert into slot_credits (user_id, estate_id, listing_id, property_tier, intent_size, target_occupancy, status, paid_at)
        select auth.uid(), estate_id, listing_id, property_tier, 1, target_occupancy, 'paid_unmatched', now() from slot_credits where user_id = auth.uid() and status='cancelled' limit 1 returning id;`);
      return r.rows.length > 0 ? ['a student created a reservation that was already paid'] : [];
    },
  },
  {
    area: 'Payment', title: 'A student cannot pay less than the rent split, or give themselves a longer hold',
    run: () => {
      const r = asStudent('slot.12@gida.test', `insert into slot_credits (user_id, estate_id, listing_id, property_tier, intent_size, target_occupancy, status, amount_paid, payment_deadline)
        select auth.uid(), estate_id, listing_id, property_tier, 1, target_occupancy, 'booked_pending_claim', 1, now() + interval '3 years' from slot_credits where user_id = auth.uid() and status='cancelled' limit 1
        returning amount_paid, extract(epoch from (payment_deadline - now()))/86400;`, clearUnpaid('slot.12@gida.test'));
      const [amount, days] = r.rows[0] ?? [];
      const problems: string[] = [];
      if (!amount) return [`insert refused: ${r.error}`];
      if (Number(amount) <= 1) problems.push(`amount stayed ₦${amount}`);
      if (Number(days) > 3.01) problems.push(`hold is ${Math.round(Number(days))} days long`);
      return problems;
    },
  },
  {
    area: 'Payment', title: 'A student cannot approve a household, their own or anyone else\'s',
    run: () => {
      const r = asStudent('slot.01@gida.test', `update pods set verification_status='approved' where group_code='SLQUE1' returning id;`);
      return r.rows.length > 0 ? ['a student approved a household that was waiting for an admin'] : (/admin can change/i.test(r.error ?? '') ? [] : [`unexpected: ${describe(r)}`]);
    },
  },
  {
    area: 'Invites', title: 'An invite link holds a seat for two hours, then lets it go',
    run: () => {
      const forming = `(select id from listings where title like 'Slot · Forming%')`;
      const left = `select (get_spots_left(array[${forming}]))->>${forming}::text;`;
      const make = `select public.create_household_invite((select id from pods where group_code='SLFORM'));`;
      const r = runSteps([
        { as: 'owner', sql: left }, { as: 'slot.01@gida.test', sql: make }, { as: 'owner', sql: left },
        { as: 'owner', sql: `update household_invites set seat_held_until = now() - interval '1 minute';` }, { as: 'owner', sql: left },
      ]);
      const counts = r.rows.filter((x) => /^\d+$/.test(x[0])).map((x) => x[0]);
      return counts.join(',') === '3,2,3' ? [] : [`spots left went ${counts.join(' → ')} (expected 3 → 2 → 3)`];
    },
  },
  {
    area: 'Invites', title: 'A friend who joins by link has 24 hours to pay, and the link cannot be used twice',
    run: () => {
      const token = `(select t from tk)`;
      const r = runSteps([
        { as: 'slot.01@gida.test', sql: `insert into tk select public.create_household_invite((select id from pods where group_code='SLFORM'))->>'token';` },
        { as: 'slot.05@gida.test', sql: `select public.join_household_invite(${token}) is not null;` },
        { as: 'owner', sql: `select round(extract(epoch from (sc.payment_deadline - now()))/3600) from slot_credits sc join auth.users u on u.id=sc.user_id join listings l on l.id=sc.listing_id where u.email='slot.05@gida.test' and l.title like 'Slot · Forming%';` },
        { as: 'slot.02@gida.test', sql: `select public.join_household_invite(${token});` },
      ], TOKEN_TABLE + clearUnpaid('slot.05@gida.test') + clearUnpaid('slot.02@gida.test'));
      const hours = r.rows.map((x) => x[0]).find((x) => /^\d+$/.test(x));
      const problems: string[] = [];
      if (hours !== '24') problems.push(`the friend's pay clock is ${hours ?? 'unknown'}h, expected 24h`);
      if (!/already been used/i.test(r.error ?? '')) problems.push(`using the link a second time gave: ${r.error ?? 'no error'}`);
      return problems;
    },
  },
  {
    area: 'Invites', title: 'A link stops working when the founder cancels their reservation',
    run: () => {
      const r = runSteps([
        { as: 'slot.01@gida.test', sql: `insert into tk select public.create_household_invite((select id from pods where group_code='SLFORM'))->>'token';` },
        { as: 'slot.01@gida.test', sql: `select public.cancel_reservation((select sc.id from slot_credits sc join listings l on l.id=sc.listing_id where sc.user_id=auth.uid() and l.title like 'Slot · Forming%'));` },
        { as: 'anon', sql: `select public.get_household_invite((select t from tk))->>'status';` },
      ], TOKEN_TABLE);
      return r.rows.at(-1)?.[0] === 'revoked' ? [] : [`the link shows "${r.rows.at(-1)?.[0]}" after the founder cancelled`];
    },
  },
  {
    area: 'Open groups', title: 'The open-groups list counts only people who still hold a seat, and seats held for links',
    run: () => {
      const forming = `(select id from pods where group_code='SLFORM')`;
      const members = `(select id from pods where group_code='SLMEMB')`;
      const counts = (id: string) => `select coalesce(array_length(live_user_ids, 1), 0) || ',' || held from public.get_pod_seat_counts(array[${id}]);`;
      const r = runSteps([
        { as: 'slot.03@gida.test', sql: counts(members) },
        { as: 'slot.03@gida.test', sql: counts(forming) },
        { as: 'slot.01@gida.test', sql: `select public.create_household_invite(${forming}) is not null;` },
        { as: 'slot.03@gida.test', sql: counts(forming) },
      ]);
      const seen = r.rows.map((x) => x[0]).filter((x) => /^\d+,\d+$/.test(x));
      const problems: string[] = [];
      if (seen[0] !== '2,0') problems.push(`a household with 4 membership rows (2 ended) reports ${seen[0]} (live,held), expected 2,0`);
      if (seen[2] !== '1,1') problems.push(`after a link is sent the household reports ${seen[2]}, expected 1,1`);
      return problems;
    },
  },
  {
    area: 'Limits', title: 'A student holds one unpaid spot at a time',
    run: () => {
      // slot.03 holds an unpaid spot at Mixed payments; joining another household must be refused.
      const r = asStudent('slot.03@gida.test', `select public.join_pod('SLFORM');`);
      return /unpaid spot/i.test(r.error ?? '') ? [] : [`got: ${describe(r)}`];
    },
  },
  {
    area: 'Limits', title: 'Two holds that ran out in the last day pause new reservations',
    run: () => {
      const setup = clearUnpaid('slot.05@gida.test') + `insert into slot_credits (user_id, estate_id, listing_id, property_tier, intent_size, target_occupancy, status, expired_at)
        select u.id, l.estate_id, l.id, 1, 1, 1, 'expired', now() - interval '2 hours' from auth.users u, listings l where u.email='slot.05@gida.test' and l.title in ('Lab · Bare minimum', 'Lab · No photos');`;
      const r = asStudent('slot.05@gida.test', `select public.join_pod('SLFORM');`, setup);
      return /ran out recently/i.test(r.error ?? '') ? [] : [`got: ${describe(r)}`];
    },
  },
  {
    area: 'Rent', title: 'Rent is rounded up, never down, so every household size pays whole naira',
    run: () => {
      const got = rows(`select public.round_rent_up(1000000,3), public.round_rent_up(1000000,4), public.round_rent_up(1200000,4), public.round_rent_up(99999,1)`)[0] ?? [];
      return got.join(',') === '1000002,1000008,1200000,99999' ? [] : [`got ${got.join(', ')}`];
    },
  },
  {
    area: 'Pay links', title: 'Parent pay links show the right state',
    run: () => {
      const links = rows(`select pl.token, case when pl.revoked_at is not null then 'revoked' when pl.expires_at < now() then 'expired' else 'open' end, sc.status
        from payment_links pl join slot_credits sc on sc.id=pl.credit_id order by 2`);
      const want: Record<string, string> = { revoked: 'expired', expired: 'expired', open: 'open' };
      return links.flatMap(([token, link, credit]) => {
        const got = JSON.parse(asService(`select public.get_payment_link('${token}');`).rows[0]?.[0] ?? '{}').status as string;
        const expected = ['paid_unmatched', 'matched', 'subletting'].includes(credit) ? 'paid' : (credit === 'expired' ? 'expired' : want[link]);
        return got === expected ? [] : [`${link} link on a ${credit} reservation shows "${got}", expected "${expected}"`];
      });
    },
  },
];
