"use client";
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Olá! Sou a Linus 😊 Como posso ajudar hoje?" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input };
    setMessages((m) => [...m, newMsg]);
    setInput("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full h-screen flex flex-col bg-neutral-950 text-white">
      {/* TOP BAR */}
      <div className="h-14 flex items-center justify-center border-b border-neutral-800 text-lg font-semibold">
        LinusGPT
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`w-full flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] p-3 rounded-2xl text-sm shadow-md ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-neutral-800 text-neutral-100 rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t border-neutral-800 flex items-center gap-3">
        <input
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
