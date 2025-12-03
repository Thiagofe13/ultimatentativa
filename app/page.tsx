"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");

  // 🔥 CORREÇÃO DO ERRO DA VERCEL
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: userMessage,
        history: messages,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    let assistantMessage = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      assistantMessage += decoder.decode(value);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = assistantMessage;
        return updated;
      });
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="p-4 bg-gray-800 shadow text-center font-bold text-xl">
        Chat DeepInfra 🚀
      </header>

      {/* Chat messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-blue-600 ml-auto"
                : "bg-gray-700 mr-auto"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {/* 🔥 Mantém o scroll sempre atualizado */}
        <div ref={bottomRef}></div>
      </main>

      {/* Input field */}
      <footer className="p-4 bg-gray-800 flex gap-2">
        <input
          className="flex-1 p-3 rounded bg-gray-700 border border-gray-600 outline-none"
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Enviar
        </button>
      </footer>
    </div>
  );
}
