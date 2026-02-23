import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Types ---

interface HeartbeatPayload {
  event: "heartbeat";
  timestamp: string;
  version: string;
}

interface AgentSyncPayload {
  event: "agent_sync";
  agents: Array<{
    id: string;
    name: string;
    role?: string;
    tools?: string[];
    status?: string;
  }>;
}

interface ActivityLogPayload {
  event: "activity_log";
  agent_id: string;
  type: "info" | "error" | "success" | "warning";
  message: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

type WebhookPayload = HeartbeatPayload | AgentSyncPayload | ActivityLogPayload;

// --- Helpers ---

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function validateToken(token: string) {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("openclaw_connections")
    .select("id, user_id, status")
    .eq("webhook_token", token)
    .maybeSingle();

  if (error) throw error;
  return data; // null if not found
}

async function updateHeartbeat(connectionId: string) {
  const supabase = serviceClient();
  await supabase
    .from("openclaw_connections")
    .update({ last_heartbeat: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", connectionId);
}

// --- Event Handlers ---

async function handleHeartbeat(connectionId: string, status: string) {
  const supabase = serviceClient();
  const updates: Record<string, unknown> = {
    last_heartbeat: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (status === "pending") {
    updates.status = "connected";
  }
  await supabase.from("openclaw_connections").update(updates).eq("id", connectionId);
  return json({ success: true, status: updates.status ?? status });
}

async function handleAgentSync(userId: string, payload: AgentSyncPayload) {
  const supabase = serviceClient();
  let synced = 0;

  for (const agent of payload.agents) {
    const { error } = await supabase
      .from("agents")
      .upsert(
        {
          user_id: userId,
          openclaw_agent_id: agent.id,
          name: agent.name,
          role: agent.role ?? null,
          tools: agent.tools ?? [],
          status: agent.status ?? "idle",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,openclaw_agent_id" },
      );
    if (error) {
      console.error("Agent upsert error:", error);
      continue;
    }
    synced++;
  }

  return json({ success: true, synced });
}

async function handleActivityLog(userId: string, payload: ActivityLogPayload) {
  const supabase = serviceClient();

  // Resolve internal agent id from openclaw_agent_id
  let agentId: string | null = null;
  if (payload.agent_id) {
    const { data } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", userId)
      .eq("openclaw_agent_id", payload.agent_id)
      .maybeSingle();
    agentId = data?.id ?? null;
  }

  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    agent_id: agentId,
    type: payload.type,
    message: payload.message,
    details: payload.details ?? null,
    metadata: payload.metadata ?? {},
  });

  if (error) {
    console.error("Activity log insert error:", error);
    return json({ success: false, error: "Failed to save activity log" }, 500);
  }

  return json({ success: true });
}

// --- Main Handler ---
// TODO: Add rate limiting for production

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // Extract token
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return json({ error: "Missing token" }, 401);
    }

    // Validate token
    const connection = await validateToken(token);
    if (!connection) {
      return json({ error: "Invalid token" }, 401);
    }
    if (connection.status === "disconnected") {
      return json({ error: "Connection is disconnected" }, 403);
    }

    // Parse body
    let payload: WebhookPayload;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    if (!payload.event) {
      return json({ error: "Missing event field" }, 400);
    }

    // Update heartbeat for every valid request
    await updateHeartbeat(connection.id);

    // Route to handler
    switch (payload.event) {
      case "heartbeat":
        return await handleHeartbeat(connection.id, connection.status);
      case "agent_sync":
        return await handleAgentSync(connection.user_id, payload as AgentSyncPayload);
      case "activity_log":
        return await handleActivityLog(connection.user_id, payload as ActivityLogPayload);
      default:
        return json({ error: `Unknown event: ${(payload as any).event}` }, 400);
    }
  } catch (err) {
    console.error("Webhook error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
