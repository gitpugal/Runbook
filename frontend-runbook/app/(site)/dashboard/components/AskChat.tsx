"use client";

import {
    ChatSection,
    ChatMessages,
    ChatInput,
} from "@llamaindex/chat-ui";
import { useChat } from "@ai-sdk/react";

export default function AskChat() {
    const handler = useChat({
        // api: "/api/chat", // your LLM endpoint
    });

    return (
        <div className="h-full">
            <ChatSection handler={handler}>
                <ChatMessages />

                <ChatInput>
                    <ChatInput.Form className="bg-transparent backdrop-blur border-t border-white/10">
                        <ChatInput.Field
                            // type="textarea"
                            placeholder="Ask your Enterprise…"
                            className="min-h-[44px]"
                        />
                        <ChatInput.Upload />
                        <ChatInput.Submit />
                    </ChatInput.Form>
                </ChatInput>
            </ChatSection>
        </div>
    );
}
