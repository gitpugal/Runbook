import clsx from "clsx";
import { Loader2Icon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatBubble({
    role,
    content,
    isLoading,
}: {
    role: "user" | "assistant";
    content: string;
    isLoading?: boolean;
}) {
    const isUser = role === "user";

    return (
        <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
            {!isUser && isLoading && content.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                    <Loader2Icon className="animate-spin" size={16} />
                    Thinking...
                </div>
            ) : (
                <div
                    className={clsx(
                        "max-w-[85%] rounded-lg border px-4 py-3 text-sm leading-7 shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
                        isUser
                            ? "border-primary/20 bg-primary/12 text-foreground"
                            : "border-border bg-secondary text-foreground",
                    )}
                >
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-pre:border prose-pre:border-border prose-pre:bg-[#0d0d0f]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}
