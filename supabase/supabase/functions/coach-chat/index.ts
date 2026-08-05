// supabase/functions/coach-chat/index.ts
//
// Deploy with:  supabase functions deploy coach-chat
// (no --no-verify-jwt here — this one DOES require a logged-in user)
//
// Required secrets:
//   ANTHROPIC_API_KEY  - your real Anthropic API key, from console.anthropic.com
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - auto-provided
//
// The frontend calls this instead of api.anthropic.com directly. This function:
//   1. Verifies the caller's Supabase auth token (so randoms can't rack up your API bill)
//   2. Checks their subscription is active (so only paying users can chat with coaches)
//   3. Calls Anthropic server-side, where the real API key can safely live
//   4. Returns the reply text to the frontend

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = "claude-sonnet-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // tighten to your real domain before going live
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify the caller is logged in.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ error: "Invalid or expired session" }, 401);
    }
    const email = userData.user.email;

    // 2. Verify they have an active subscription.
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("status")
      .eq("email", email)
      .maybeSingle();

    if (!sub || sub.status !== "active") {
      return json({ error: "No active subscription" }, 403);
    }

    // 3. Call Anthropic with the real key, server-side only.
    const { system, messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages is required" }, 400);
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: system || "",
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", errText);
      return json({ error: "Coach is unavailable right now. Try again shortly." }, 502);
    }

    const data = await anthropicRes.json();
    const text = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");

    return json({ text });
  } catch (err) {
    console.error("coach-chat error:", err);
    return json({ error: "Something went wrong." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
