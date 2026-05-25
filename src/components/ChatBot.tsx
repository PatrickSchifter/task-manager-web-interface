import { sendRagMessage } from "@/api/client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationKey: ["projects", "chat"],
    mutationFn: (message: string) => sendRagMessage({ message }),
    onSuccess: (data: { answer?: string } | unknown) => {
      const answer =
        typeof data === "object" && data !== null && "answer" in data
          ? ((data as { answer?: string }).answer ?? "...")
          : "...";

      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro ao conectar com o assistente." },
      ]);
    },
  });

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessageMutation.isPending) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    sendMessageMutation.mutate(trimmed); // passa o valor capturado
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Abrir chat do projeto"
      >
        {isOpen ? (
          // X icon
          // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          // Chat icon
          // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[480px] bg-background border border-divider rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-divider bg-content1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .3 2.7-1.1 2.7H3.9c-1.4 0-2.1-1.7-1.1-2.7L4 15.3"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Assistente</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-default-400">
                {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <p className="text-sm">Pergunte algo sobre o projeto!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3 text-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-content2 text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {sendMessageMutation.isPending && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 text-primary"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" />
                  </svg>
                </div>
                <div className="bg-content2 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <span className="flex gap-1 items-center">
                    <span
                      className="w-1.5 h-1.5 bg-default-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-default-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-default-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-divider flex gap-2 items-end">
            <Input
              size="sm"
              placeholder="Digite sua mensagem..."
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              classNames={{ inputWrapper: "bg-content2" }}
            />
            <Button
              isIconOnly
              size="sm"
              color="primary"
              onPress={sendMessage}
              isLoading={sendMessageMutation.isPending}
              isDisabled={!input.trim()}
              className="shrink-0 h-8 w-8 min-w-8"
            >
              {!sendMessageMutation.isPending && (
                // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
