"use client";
import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Rolagem automática para o fim
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages, // Envia o histórico anterior
        }),
      });

      if (!response.ok) throw new Error(response.statusText);

      // Prepara a mensagem da IA vazia para começar a preencher
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // LEITURA DO STREAM (A MÁGICA ACONTECE AQUI)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantResponse = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        // O backend manda linhas tipo: data: {"content": "..."}
        // Vamos separar e limpar essas linhas
        const lines = chunkValue.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "").trim();
            if (jsonStr === "[DONE]") break;
            
            try {
              const json = JSON.parse(jsonStr);
              const contentFragment = json.choices[0]?.delta?.content;
              
              if (contentFragment) {
                assistantResponse += contentFragment;
                
                // Atualiza a última mensagem na tela em tempo real
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = assistantResponse;
                  return newMsgs;
                });
              }
            } catch (err) {
              // Ignora linhas que não sejam JSON válido
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao conectar com a IA." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* CABEÇALHO */}
      <header className="p-4 border-b border-gray-700 bg-gray-800 text-center font-bold text-xl">
        🤖 Chat DeepInfra (Mixtral)
      </header>

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            Comece uma conversa...
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-700 text-gray-100 rounded-bl-none"
              }`}
            >
              {/* Renderiza quebras de linha */}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="text-gray-400 text-sm animate-pulse">
            Digitando...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT DE TEXTO */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-bold transition-colors"
        >
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}