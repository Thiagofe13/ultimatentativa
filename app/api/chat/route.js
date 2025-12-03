import { NextResponse } from "next/server";

const SYSTEM_PROMPT =
  "Você é uma IA útil e direta. Responda exatamente o que foi pedido, em português.";

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, history } = body || {};

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return new Response(
        `[ERRO DE CONFIG]: A variável OPENROUTER_API_KEY não existe ou está vazia na Vercel.`,
        { headers: { "Content-Type": "text/event-stream" } }
      );
    }

    const payload = {
      // Trocamos o modelo quebrado por um estável:
      model: "mistralai/mixtral-8x7b-instruct", 
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...(Array.isArray(history) ? history.slice(-6) : []),
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    };

    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://seu-site.vercel.app", // Pode deixar assim ou por seu link real
        "X-Title": "Seu Chat",
      },
      body: JSON.stringify(payload),
      // Removido signal timeout curto para evitar quedas em modelos lentos
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      return new Response(`[ERRO OPENROUTER]: ${resp.status} - ${errorText}`, {
        headers: { "Content-Type": "text/event-stream" },
      });
    }

    return new Response(resp.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(`[ERRO CRÍTICO NO SERVIDOR]: ${err.message}`, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}
