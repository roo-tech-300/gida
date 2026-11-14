/** The rules the slot lab is checked against: data rules read back from the database, and behaviour probes. */
import { asService, asStudent, runSql, type SqlResult } from './slot-lab-db.ts';

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
    area: 'Capacity', title: 'No listing has more live reservations than spots',
    run: () => rows(`select l.title, coalesce(l.abstract_slots_available, l.units_available*greatest(1,coalesce(l.property_tier,l.max_roommates,1))) as spots, count(*)
      from listings l join slot_credits sc on sc.listing_id=l.id where ${ACTIVE} group by l.id
      having count(*) > coalesce(l.abstract_slots_available, l.units_available*greatest(1,coalesce(l.property_tier,l.max_roommates,1)))`)
      .map(([title, spots, held]) => `${title}: ${held} reservations for ${spots} spot(s)`),
  },
  {
    area: 'Holds', title: 'Every unpaid hold that has run out has been released',
    run: () => rows(`select l.title, u.email, round(extract(epoch from now()-sc.payment_deadline)/3600) from slot_credits sc
      join listings l on l.id=sc.listing_id join auth.users u on u.id=sc.user_id
      where sc.status in ('booked','booked_pending_claim') and sc.payment_deadline < now() order by 1`)
      .map(([title, who, hours]) => `${title}: ${who} lapsed ${hours}h ago but still holds a spot (nothing expires holds on the server)`),
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

const spotsLeft = (title: string): string => rows(`select (get_spots_left(array[id]))->>id::text from listings where title like '${title}%'`)[0]?.[0] ?? '?';

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
    run: () => { const r = asStudent('slot.12@gida.test', `select public.join_pod('SLMEMB');`); return r.error ? [`refused: ${r.error}`] : []; },
  },
  {
    area: 'Cancel', title: 'A student who cancelled can start a new reservation on the same listing',
    run: () => {
      const r = asStudent('slot.12@gida.test', `insert into slot_credits (user_id, estate_id, listing_id, property_tier, intent_size, target_occupancy, status)
        select auth.uid(), estate_id, listing_id, property_tier, 1, target_occupancy, 'booked_pending_claim' from slot_credits
        where user_id = auth.uid() and status = 'cancelled' limit 1 returning id;`);
      return r.error ? [`refused: ${r.error}`] : [];
    },
  },
  {
    area: 'Joining', title: 'A household locked to one gender only lets that gender join',
    run: () => { const r = asStudent('slot.02@gida.test', `select public.join_pod('SLGEND');`); return r.error ? [] : ['a woman joined a household locked to men: join_pod does not check the gender lock']; },
  },
  {
    area: 'Holds', title: 'A student whose hold lapsed can reserve the place again',
    run: () => {
      const r = asStudent('slot.10@gida.test', `select public.has_active_booking((select id from listings where title like 'Slot · Lapsed%'));`);
      return r.rows[0]?.[0] ? ['has_active_booking still reports their lapsed hold, so a new reservation would be refused'] : [];
    },
  },
  {
    area: 'Holds', title: 'Spots left ignores holds that have run out',
    run: () => { const left = spotsLeft('Slot · Lapsed'); return left === '1' ? [] : [`shows ${left} left; one of the two reservations lapsed, so it should be 1`]; },
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
    area: 'Security', title: 'A student cannot mark their own reservation as paid',
    run: () => {
      const r = asStudent('slot.03@gida.test', `update slot_credits set status='paid_unmatched', paid_at=now() where user_id=auth.uid() and status='booked_pending_claim' returning id;`);
      return r.rows.length > 0 ? ['a student set their own reservation to paid without paying (row-level security allows it)'] : [];
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
        const expected = ['paid_unmatched', 'matched', 'subletting'].includes(credit) ? 'paid' : want[link];
        return got === expected ? [] : [`${link} link on a ${credit} reservation shows "${got}", expected "${expected}"`];
      });
    },
  },
];
