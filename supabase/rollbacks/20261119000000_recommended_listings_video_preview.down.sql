-- Restores get_recommended_listings to its original shape (no video_preview_path).
drop function if exists public.get_recommended_listings(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.get_recommended_listings(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, admin_id uuid, landlord_id uuid, estate_id uuid, title character varying, description text, category character varying, status character varying, featured boolean, price_amount numeric, lease_term character varying, layout_type property_layout_type, units_available integer, property_tier integer, abstract_slots_available integer, total_floors integer, is_shared_bathroom boolean, is_shared_kitchen boolean, size_sqft integer, location_landmark text, city character varying, campus character varying, latitude numeric, longitude numeric, has_borehole boolean, has_generator boolean, has_fenced_gate boolean, has_internet boolean, has_burglary boolean, has_cabinet boolean, has_wardrobe boolean, custom_features text[], primary_image text, number_of_bedrooms integer, number_of_bathrooms integer, max_roommates integer, rules text[], created_at timestamp with time zone, updated_at timestamp with time zone, images text[], relevance_score numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_max_budget NUMERIC;
  v_preferred_area TEXT;
  v_preferred_layout TEXT;
  v_must_have_amenities TEXT[];
BEGIN
  -- Fetch user preferences from living_preferences
  SELECT 
    max_budget, preferred_area, preferred_layout, must_have_amenities
  INTO 
    v_max_budget, v_preferred_area, v_preferred_layout, v_must_have_amenities
  FROM public.living_preferences 
  WHERE profile_id = p_user_id;

  RETURN QUERY
  SELECT 
    l.id,
    l.admin_id,
    l.landlord_id,
    l.estate_id,
    l.title,
    l.description,
    l.category,
    l.status,
    l.featured,
    l.price_amount,
    l.lease_term,
    l.layout_type,
    l.units_available,
    l.property_tier,
    l.abstract_slots_available,
    l.total_floors,
    l.is_shared_bathroom,
    l.is_shared_kitchen,
    l.size_sqft,
    l.location_landmark,
    l.city,
    l.campus,
    l.latitude,
    l.longitude,
    l.has_borehole,
    l.has_generator,
    l.has_fenced_gate,
    l.has_internet,
    l.has_burglary,
    l.has_cabinet,
    l.has_wardrobe,
    l.custom_features,
    l.primary_image,
    l.number_of_bedrooms,
    l.number_of_bathrooms,
    l.max_roommates,
    l.rules,
    l.created_at,
    l.updated_at,
    
    -- Subquery for image gallery
    COALESCE(
      (
        SELECT ARRAY_AGG(lp.image_url ORDER BY lp.display_order)
        FROM public.listing_photos lp
        WHERE lp.listing_id = l.id
      ),
      CASE WHEN l.primary_image IS NOT NULL THEN ARRAY[l.primary_image] ELSE '{}'::TEXT[] END
    ) AS images,

    ROUND(
      (
        -- 1. BUDGET MATCH [Max 35 pts]
        CASE 
          WHEN v_max_budget IS NULL OR v_max_budget <= 0 THEN 15
          WHEN l.price_amount BETWEEN (v_max_budget * 0.85) AND (v_max_budget * 1.15) THEN 35
          WHEN l.price_amount < (v_max_budget * 0.85) THEN 25
          WHEN l.price_amount BETWEEN (v_max_budget * 1.15) AND (v_max_budget * 1.30) THEN 10
          ELSE 0
        END +

        -- 2. AREA MATCH (FUT Minna Neighborhoods) [Max 25 pts]
        CASE 
          WHEN v_preferred_area IS NULL OR LOWER(v_preferred_area) = 'any' THEN 10
          WHEN LOWER(l.location_landmark) LIKE '%' || LOWER(v_preferred_area) || '%' THEN 25
          WHEN LOWER(l.city) LIKE '%' || LOWER(v_preferred_area) || '%' THEN 25
          ELSE 0
        END +

        -- 3. LAYOUT MATCH [Max 15 pts]
        CASE 
          WHEN v_preferred_layout IS NULL OR LOWER(v_preferred_layout) = 'any' THEN 5
          WHEN LOWER(l.layout_type::text) = LOWER(v_preferred_layout) THEN 15
          ELSE 0
        END +

        -- 4. MUST-HAVE AMENITIES MATCH [Max 15 pts]
        CASE 
          WHEN v_must_have_amenities IS NULL OR CARDINALITY(v_must_have_amenities) = 0 THEN 10
          ELSE (
            (CASE WHEN 'borehole' = ANY(v_must_have_amenities) AND l.has_borehole THEN 3 ELSE 0 END) +
            (CASE WHEN 'generator' = ANY(v_must_have_amenities) AND l.has_generator THEN 3 ELSE 0 END) +
            (CASE WHEN 'internet' = ANY(v_must_have_amenities) AND l.has_internet THEN 3 ELSE 0 END) +
            (CASE WHEN 'fenced' = ANY(v_must_have_amenities) AND l.has_fenced_gate THEN 3 ELSE 0 END) +
            (CASE WHEN 'wardrobe' = ANY(v_must_have_amenities) AND l.has_wardrobe THEN 3 ELSE 0 END)
          )
        END +

        -- 5. SAVED INTERACTION BOOST [Max 10 pts]
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM public.saved_listings sl 
            WHERE sl.user_id = p_user_id AND sl.listing_id = l.id
          ) THEN 10
          ELSE 0
        END
      )::NUMERIC, 2
    ) AS relevance_score

  FROM public.listings l
  WHERE l.status = 'available' 
    AND l.abstract_slots_available > 0
  ORDER BY relevance_score DESC, l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

grant execute on function public.get_recommended_listings(uuid, integer, integer) to anon, authenticated, service_role;
