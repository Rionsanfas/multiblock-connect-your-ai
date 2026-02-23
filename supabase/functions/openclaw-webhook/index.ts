import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Validation Constants ---
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
const MAX_AGENTS = 100;
const MAX_STRING_LENGTH = 1000;
const MAX_DETAILS_LENGTH = 5000;
const MAX_TOOLS = 50;

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

// --- Validation Helpers ---

function truncateString(val: unknown, max: number): string {
  if (typeof val !== "string") return "";
  return val.slice(0, max);
}

function validateAgentSyncPayload(payload: unknown): { valid: boolean; error?: string; data?: AgentSyncPayload } {
  const p = payload as Record<string, unknown>;
  if (!Array.isArray(p.agents)) return { valid: false, error: "agents must be an array" };
  if (p.agents.length > MAX_AGENTS) return { valid: false, error: `agents array exceeds maximum of ${MAX_AGENTS}` };
  
  const sanitizedAgents = [];
  for (const agent of p.agents) {
    if (typeof agent !== "object" || agent === null) continue;
    const a = agent as Record<string, unknown>;
    if (typeof a.id !== "string" || !a.id) return { valid: false, error: "Each agent must have a string id" };
    if (typeof a.name !== "string" || !a.name) return { valid: false, error: "Each agent must have a string name" };
    
    const tools = Array.isArray(a.tools) ? a.tools.filter((t): t is string => typeof t === "string").slice(0, MAX_TOOLS) : [];
    
    sanitizedAgents.push({
      id: truncateString(a.id, 255),
      name: truncateString(a.name, 255),
      role: a.role ? truncateString(a.role, 255) : undefined,
      tools,
      status: a.status ? truncateString(a.status, 50) : undefined,
    });
  }
  
  return { valid: true, data: { event: "agent_sync", agents: sanitizedAgents } };
}

function validateActivityLogPayload(payload: unknown): { valid: boolean; error?: string; data?: ActivityLogPayload } {
  const p = payload as Record<string, unknown>;
  const validTypes = ["info", "error", "success", "warning"];
  
  if (typeof p.agent_id !== "string" || !p.agent_id) return { valid: false, error: "agent_id is required" };
  if (typeof p.type !== "string" || !validTypes.includes(p.type)) return { valid: false, error: "type must be one of: info, error, success, warning" };
  if (typeof p.message !== "string" || !p.message) return { valid: false, error: "message is required" };
  
  // Sanitize metadata - limit depth/size
  let metadata: Record<string, unknown> = {};
  if (p.metadata && typeof p.metadata === "object" && !Array.isArray(p.metadata)) {
    const metaStr = JSON.stringify(p.metadata);
    if (metaStr.length <= 10000) {
      metadata = p.metadata as Record<string, unknown>;
    }
  }
  
  return {
    valid: true,
    data: {
      event: "activity_log",
      agent_id: truncateString(p.agent_id, 255),
      type: p.type as ActivityLogPayload["type"],
      message: truncateString(p.message, MAX_STRING_LENGTH),
      details: p.details ? truncateString(p.details, MAX_DETAILS_LENGTH) : undefined,
      metadata,
    },
  };
}

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
  if (token.length > 255) return null;
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("openclaw_connections")
    .select("id, user_id, status")
    .eq("webhook_token", token)
    .maybeSingle();

  if (error) throw error;
  return data;
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
    // Check content length
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return json({ error: "Payload too large" }, 413);
    }

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

    // Parse body with size limit
    let rawBody: string;
    try {
      rawBody = await req.text();
      if (rawBody.length > MAX_PAYLOAD_SIZE) {
        return json({ error: "Payload too large" }, 413);
      }
    } catch {
      return json({ error: "Failed to read request body" }, 400);
    }

    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    if (!payload || typeof payload !== "object" || !("event" in payload) || typeof payload.event !== "string") {
      return json({ error: "Missing or invalid event field" }, 400);
    }

    // Update heartbeat for every valid request
    await updateHeartbeat(connection.id);

    // Route to handler with validation
    switch (payload.event) {
      case "heartbeat":
        return await handleHeartbeat(connection.id, connection.status);
      case "agent_sync": {
        const agentResult = validateAgentSyncPayload(payload);
        if (!agentResult.valid) return json({ error: agentResult.error }, 400);
        return await handleAgentSync(connection.user_id, agentResult.data!);
      }
      case "activity_log": {
        const logResult = validateActivityLogPayload(payload);
        if (!logResult.valid) return json({ error: logResult.error }, 400);
        return await handleActivityLog(connection.user_id, logResult.data!);
      }
      default:
        return json({ error: "Unknown event type" }, 400);
    }
  } catch (err) {
    console.error("Webhook error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
