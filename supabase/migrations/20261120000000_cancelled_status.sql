-- Own migration: a new enum value cannot be used in the transaction that adds it.
alter type public.slot_credit_status add value if not exists 'cancelled';
