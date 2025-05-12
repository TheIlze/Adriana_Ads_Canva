// backend/openai.ts
export default async function handler(req: Request): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
  
    try {
      const { prompt } = await req.json();
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });
  
      const data = await openaiRes.json();
      const content = data.choices?.[0]?.message?.content || "{}";
  
      try {
        const parsed = JSON.parse(content);
        return Response.json(parsed);
      } catch (err) {
        console.error("Could not parse OpenAI response content as JSON:", content);
        return new Response("Invalid JSON from OpenAI", { status: 500 });
      }
  
    } catch (e) {
      console.error("OpenAI error:", e);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
  