import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { classPhotoBase64, studentPhotos } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!classPhotoBase64 || !studentPhotos || studentPhotos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing class photo or student photos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt with student photos for comparison
    const studentDescriptions = studentPhotos.map((s: any, idx: number) => 
      `Student ${idx + 1}: Name="${s.name}", ID="${s.student_id}"`
    ).join("\n");

    const imageContents = [
      {
        type: "image_url",
        image_url: { url: classPhotoBase64 }
      },
      ...studentPhotos.filter((s: any) => s.photo_url).map((s: any) => ({
        type: "image_url",
        image_url: { url: s.photo_url }
      }))
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a face recognition assistant for student attendance. 
            
Your task:
1. Look at the first image (class photo) and identify faces
2. Compare those faces with the subsequent student photos provided
3. Return which students are present in the class photo

You MUST respond with ONLY a valid JSON object in this exact format:
{
  "detected_faces": <number of faces detected in class photo>,
  "present_students": [
    {"student_id": "<student_id>", "name": "<name>", "confidence": <0-100>}
  ],
  "analysis": "<brief description of the analysis>"
}

Do not include any text outside the JSON object. The student_id values must match exactly with the provided student IDs.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze the class photo (first image) and identify which of the following students are present by comparing with their individual photos (subsequent images):

${studentDescriptions}

The images are provided in order: first is the class photo, then each student's photo in the same order as listed above.`
              },
              ...imageContents
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let result;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      result = JSON.parse(cleanContent.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Face recognition error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
