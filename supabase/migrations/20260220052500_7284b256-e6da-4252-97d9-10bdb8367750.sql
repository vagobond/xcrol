
CREATE OR REPLACE FUNCTION public.calculate_user_points(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total integer := 0;
  v_profile RECORD;
BEGIN
  -- Invites sent (pending or accepted): 2 points each
  SELECT COUNT(*) INTO total
  FROM user_invites WHERE inviter_id = p_user_id;
  total := total * 2;

  -- Invites accepted: additional 3 points each (2 already counted above, total 5)
  total := total + (SELECT COUNT(*) * 3 FROM user_invites WHERE inviter_id = p_user_id AND status = 'accepted');

  -- Xcrol entries posted: 1 point each
  total := total + (SELECT COUNT(*) FROM xcrol_entries WHERE user_id = p_user_id);

  -- Xcrol entries with a link: 1 extra point each
  total := total + (SELECT COUNT(*) FROM xcrol_entries WHERE user_id = p_user_id AND link IS NOT NULL AND link != '');

  -- River replies: 1 point each
  total := total + (SELECT COUNT(*) FROM river_replies WHERE user_id = p_user_id);

  -- Brook comments: 1 point each
  total := total + (SELECT COUNT(*) FROM brook_comments WHERE user_id = p_user_id);

  -- Brook reactions: 1 point each
  total := total + (SELECT COUNT(*) FROM brook_reactions WHERE user_id = p_user_id);

  -- User references (reviews): 3 points each
  total := total + (SELECT COUNT(*) * 3 FROM user_references WHERE from_user_id = p_user_id);

  -- Complete profile: 10 points
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF v_profile.display_name IS NOT NULL AND v_profile.display_name != ''
    AND v_profile.username IS NOT NULL AND v_profile.username != ''
    AND v_profile.avatar_url IS NOT NULL AND v_profile.avatar_url != ''
    AND v_profile.bio IS NOT NULL AND v_profile.bio != ''
    AND v_profile.link IS NOT NULL AND v_profile.link != ''
    AND v_profile.hometown_city IS NOT NULL
    AND v_profile.birthday_month IS NOT NULL
  THEN
    total := total + 10;
  END IF;

  -- 1 point per friend
  total := total + (SELECT COUNT(*) FROM friendships WHERE user_id = p_user_id);

  -- Brook setup: 2 points per active/pending brook
  total := total + (SELECT COUNT(*) * 2 FROM brooks WHERE (user1_id = p_user_id OR user2_id = p_user_id) AND status IN ('active', 'pending'));

  -- Brook alive 5+ days: 5 points per qualifying brook
  total := total + (SELECT COUNT(*) * 5 FROM brooks
    WHERE (user1_id = p_user_id OR user2_id = p_user_id)
    AND status = 'active'
    AND last_post_at IS NOT NULL
    AND last_post_at >= created_at + interval '5 days');

  -- Town listing: 1 point each
  total := total + (SELECT COUNT(*) FROM town_listings WHERE user_id = p_user_id);

  -- Create group: 10 points each
  total := total + (SELECT COUNT(*) * 10 FROM groups WHERE creator_id = p_user_id);

  -- Group posts: 1 point each
  total := total + (SELECT COUNT(*) FROM group_posts WHERE user_id = p_user_id);

  -- Group post comments: 1 point each
  total := total + (SELECT COUNT(*) FROM group_post_comments WHERE user_id = p_user_id);

  -- Group post reactions: 1 point each
  total := total + (SELECT COUNT(*) FROM group_post_reactions WHERE user_id = p_user_id);

  -- Hometown filled: 2 points
  IF v_profile.hometown_city IS NOT NULL AND v_profile.hometown_city != '' THEN
    total := total + 2;
  END IF;

  RETURN total;
END;
$$;
