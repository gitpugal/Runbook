"use client";

import { useEffect, useRef, useState } from "react";
import ChatBubble from "./ChatBubble";
import { nanoid } from "nanoid";
import { useSession } from "next-auth/react";
import Image from "next/image";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages]);

    async function sendMessage() {
        if (!input.trim()) return;
        setIsLoading(true);

        const userMessage: Message = {
            id: nanoid(),
            role: "user",
            content: input,
        };

        const assistantMessage: Message = {
            id: nanoid(),
            role: "assistant",
            content: "",
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInput("");

        const res = await fetch("", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: input,
                thread_id: "32",
            }),
        });

        const resData = await res.json();

        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === assistantMessage.id
                    ? { ...msg, content: resData.response }
                    : msg,
            ),
        );
        setIsLoading(false);
    }

    return (
        <div className="app-panel flex h-full flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                        {session?.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt="User avatar"
                                width={36}
                                height={36}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-sm font-medium text-muted-foreground">
                                {session?.user?.name?.[0] ?? "U"}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">Axel chat</p>
                        <p className="text-xs text-muted-foreground">Operational assistant</p>
                    </div>
                </div>
                <span className="app-badge border-[rgba(59,130,246,0.2)] bg-info-soft text-info">Beta</span>
            </div>

            <div
                ref={containerRef}
                className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
            >
                {messages.map((m) => (
                    <ChatBubble key={m.id} role={m.role} content={m.content} isLoading={isLoading} />
                ))}
            </div>

            <div className="border-t border-border p-4">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type your question..."
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-[#71717A] outline-none"
                    />
                    <button
                        onClick={sendMessage}
                        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-[#7C7FFF]"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
