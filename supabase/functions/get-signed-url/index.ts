import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to verify they're authenticated
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("[get-signed-url] Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { media_id, storage_path, bucket = "generated-media" } = body;

    // Admin client for generating signed URLs
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let filePath: string | null = null;

    // If media_id is provided, look up the storage path from the database
    if (media_id) {
      const { data: media, error: mediaError } = await supabaseAdmin
        .from("generated_media")
        .select("storage_path, file_url, user_id")
        .eq("id", media_id)
        .single();

      if (mediaError || !media) {
        console.error("[get-signed-url] Media not found:", mediaError);
        return new Response(JSON.stringify({ error: "Media not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify user owns the media
      if (media.user_id !== user.id) {
        console.error("[get-signed-url] User does not own media");
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      filePath = media.storage_path;
      
      // If no storage_path, the file might be from external URL (not stored in our bucket)
      if (!filePath && media.file_url) {
        // If it's an external URL, just return it directly
        if (media.file_url.startsWith("http") && !media.file_url.includes(supabaseUrl)) {
          return new Response(JSON.stringify({ signed_url: media.file_url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } else if (storage_path) {
      // Direct storage path provided - verify it starts with user's folder
      if (!storage_path.startsWith(`${user.id}/`)) {
        console.error("[get-signed-url] Path access denied");
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      filePath = storage_path;
    } else {
      return new Response(JSON.stringify({ error: "media_id or storage_path required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!filePath) {
      return new Response(JSON.stringify({ error: "No storage path found for this media" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate signed URL with 1 hour expiry
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from(bucket)
      .createSignedUrl(filePath, 3600); // 1 hour

    if (signedUrlError) {
      console.error("[get-signed-url] Failed to create signed URL:", signedUrlError);
      return new Response(JSON.stringify({ error: "Failed to create signed URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[get-signed-url] Generated signed URL for user ${user.id}, path: ${filePath}`);

    return new Response(JSON.stringify({ 
      signed_url: signedUrlData.signedUrl,
      expires_in: 3600,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[get-signed-url] Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
