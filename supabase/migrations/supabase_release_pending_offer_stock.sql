-- Release stock that older application versions reserved for offers that
-- have not been accepted. New offers reserve stock only when accepted.
-- Run once in Supabase SQL Editor after deploying the matching app change.
BEGIN;

CREATE TEMP TABLE pending_offer_stock_to_release ON COMMIT DROP AS
SELECT
  o.id,
  o.commodity_id,
  COALESCE(NULLIF(o.notes::jsonb ->> 'reservedTon', '')::numeric, o.requested_ton) AS reserved_ton
FROM public.offers AS o
WHERE o.commodity_id IS NOT NULL
  AND o.status NOT IN ('Disetujui', 'Diterima', 'accepted')
  AND COALESCE((o.notes::jsonb ->> 'stockReserved')::boolean, false)
  AND NOT COALESCE((o.notes::jsonb ->> 'stockRestored')::boolean, false);

UPDATE public.commodities AS c
SET stock_ton = c.stock_ton + released.total_ton,
    updated_at = now()
FROM (
  SELECT commodity_id, SUM(reserved_ton) AS total_ton
  FROM pending_offer_stock_to_release
  GROUP BY commodity_id
) AS released
WHERE c.id = released.commodity_id;

UPDATE public.offers AS o
SET notes = jsonb_set(
  jsonb_set(o.notes::jsonb, '{stockReserved}', 'false'::jsonb, true),
  '{reservedTon}', '0'::jsonb, true
)
FROM pending_offer_stock_to_release AS released
WHERE o.id = released.id;

COMMIT;
