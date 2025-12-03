"use client";

import { useState, useRef, useEffect } from "react";

// Definição do tipo da mensagem para o TypeScript não reclamar
interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Ref para rolar a tela para baixo
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Efeito para rolar sempre que chegar mensagem nova
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    
    // Adiciona a mensagem do usuário e limpa o input
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages, // Envia o histórico para a IA ter contexto
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(response.statusText);
      }

      // Adiciona um balão vazio da IA para começar a preencher
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // LEITURA DO STREAM (AQUI O TYPESCRIPT TRABALHA)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });

        // Quebra as linhas que vêm do backend (data: {...})
        const lines = chunkValue.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const jsonStr = line.replace("data: ", "");
              const json = JSON.parse(jsonStr);
              const content = json.choices[0]?.delta?.content || "";
              
              if (content) {
                assistantText += content;
                
                // Atualiza a última mensagem na tela letra por letra
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  const lastMsg = newMsgs[newMsgs.length - 1];
                  if (lastMsg.role === "assistant") {
                    lastMsg.content = assistantText;
                  }
                  return newMsgs;
                });
              }
            } catch (err) {
              console.error("Erro ao fazer parse do JSON", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao conectar com a IA. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* CABEÇALHO */}
      <header className="p-4 bg-gray-800 border-b border-gray-700 text-center font-bold text-lg shadow-md">
        🤖 Chat DeepInfra (TSX)
      </header>

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
            <p className="text-xl">💬</p>
            <p>Comece a conversa...</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-700 text-gray-100 rounded-bl-none border border-gray-600"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {/* Elemento invisível para rolar até o fim */}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-gray-800 border-t border-gray-700 flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 p-3 rounded-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white px-5 placeholder-gray-500 transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-full transition-colors shadow-lg"
        >
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : (
            "Enviar"
          )}
        </button>
      </form>
    </div>
  );
}