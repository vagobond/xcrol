import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user's JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Fetch all user data in parallel
    const [
      profile,
      xcrolEntries,
      friendships,
      messagesSent,
      messagesReceived,
      brookPosts,
      brookComments,
      brookReactions,
      brooks,
      groupMemberships,
      groupPosts,
      groupPostComments,
      groupPostReactions,
      riverReplies,
      riverReplyReactions,
      referencesGiven,
      referencesReceived,
      socialLinks,
      settings,
      hostingPreferences,
      meetupPreferences,
      hostingRequestsSent,
      hostingRequestsReceived,
      meetupRequestsSent,
      meetupRequestsReceived,
      townListings,
      profileWidgets,
      customFriendshipTypes,
      dreamTrips,
      userInvites,
      blockedUsers,
      oauthAuthorizations,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("xcrol_entries").select("id, content, link, entry_date, privacy_level, created_at").eq("user_id", userId).order("entry_date", { ascending: false }),
      supabase.from("friendships").select("friend_id, level, created_at, needs_level_set, uses_custom_type").eq("user_id", userId),
      supabase.from("messages").select("id, content, to_user_id, created_at, platform_suggestion").eq("from_user_id", userId).order("created_at", { ascending: false }),
      supabase.from("messages").select("id, content, from_user_id, created_at, platform_suggestion").eq("to_user_id", userId).order("created_at", { ascending: false }),
      supabase.from("brook_posts").select("id, brook_id, content, link, created_at").eq("user_id", userId),
      supabase.from("brook_comments").select("id, post_id, content, created_at").eq("user_id", userId),
      supabase.from("brook_reactions").select("id, post_id, emoji, created_at").eq("user_id", userId),
      supabase.from("brooks").select("id, user1_id, user2_id, custom_name, status, created_at").or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
      supabase.from("group_members").select("id, group_id, role, status, created_at").eq("user_id", userId),
      supabase.from("group_posts").select("id, group_id, content, link, created_at").eq("user_id", userId),
      supabase.from("group_post_comments").select("id, post_id, content, created_at").eq("user_id", userId),
      supabase.from("group_post_reactions").select("id, post_id, emoji, created_at").eq("user_id", userId),
      supabase.from("river_replies").select("id, entry_id, content, created_at, parent_reply_id").eq("user_id", userId),
      supabase.from("river_reply_reactions").select("id, reply_id, emoji, created_at").eq("user_id", userId),
      supabase.from("user_references").select("id, to_user_id, content, rating, reference_type, created_at").eq("from_user_id", userId),
      supabase.from("user_references").select("id, from_user_id, content, rating, reference_type, created_at").eq("to_user_id", userId),
      supabase.from("social_links").select("id, platform, url, label, friendship_level_required, created_at").eq("user_id", userId),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("hosting_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("meetup_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("hosting_requests").select("id, to_user_id, message, arrival_date, departure_date, num_guests, status, created_at").eq("from_user_id", userId),
      supabase.from("hosting_requests").select("id, from_user_id, message, arrival_date, departure_date, num_guests, status, response_message, created_at").eq("to_user_id", userId),
      supabase.from("meetup_requests").select("id, to_user_id, message, proposed_dates, purpose, status, created_at").eq("from_user_id", userId),
      supabase.from("meetup_requests").select("id, from_user_id, message, proposed_dates, purpose, status, response_message, created_at").eq("to_user_id", userId),
      supabase.from("town_listings").select("id, title, body, category, subcategory, location, price, status, created_at").eq("user_id", userId),
      supabase.from("profile_widgets").select("widget_key, config, enabled, created_at").eq("user_id", userId),
      supabase.from("custom_friendship_types").select("*").eq("user_id", userId),
      supabase.from("dream_trips").select("destinations, created_at").eq("user_id", userId),
      supabase.from("user_invites").select("id, invite_code, invitee_email, status, created_at, accepted_at").eq("inviter_id", userId),
      supabase.from("user_blocks").select("blocked_id, created_at").eq("blocker_id", userId),
      supabase.from("oauth_user_authorizations").select("client_id, scopes, created_at").eq("user_id", userId),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile.data,
      xcrol_entries: xcrolEntries.data ?? [],
      friendships: friendships.data ?? [],
      messages: {
        sent: messagesSent.data ?? [],
        received: messagesReceived.data ?? [],
      },
      brooks: {
        streams: brooks.data ?? [],
        posts: brookPosts.data ?? [],
        comments: brookComments.data ?? [],
        reactions: brookReactions.data ?? [],
      },
      groups: {
        memberships: groupMemberships.data ?? [],
        posts: groupPosts.data ?? [],
        comments: groupPostComments.data ?? [],
        reactions: groupPostReactions.data ?? [],
      },
      river: {
        replies: riverReplies.data ?? [],
        reactions: riverReplyReactions.data ?? [],
      },
      references: {
        given: referencesGiven.data ?? [],
        received: referencesReceived.data ?? [],
      },
      social_links: socialLinks.data ?? [],
      settings: settings.data,
      hosting: {
        preferences: hostingPreferences.data,
        requests_sent: hostingRequestsSent.data ?? [],
        requests_received: hostingRequestsReceived.data ?? [],
      },
      meetups: {
        preferences: meetupPreferences.data,
        requests_sent: meetupRequestsSent.data ?? [],
        requests_received: meetupRequestsReceived.data ?? [],
      },
      town_listings: townListings.data ?? [],
      profile_widgets: profileWidgets.data ?? [],
      custom_friendship_types: customFriendshipTypes.data ?? [],
      dream_trips: dreamTrips.data ?? [],
      invites_sent: userInvites.data ?? [],
      blocked_users: blockedUsers.data ?? [],
      oauth_authorizations: oauthAuthorizations.data ?? [],
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="xcrol-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
