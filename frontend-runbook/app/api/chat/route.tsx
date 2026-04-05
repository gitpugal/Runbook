import { NextResponse } from "next/server";
import {
    buildWorkflowGeneratorPrompt,
    isWorkflowDefinition,
    workflowDefinitionJsonSchema,
} from "@/lib/workflow-generator";

export const runtime = "edge";

type ResponseContentItem = {
    type?: string;
    text?: string;
};

type ResponseOutputItem = {
    content?: ResponseContentItem[];
};

type OpenAIResponsesPayload = {
    output_text?: string;
    output?: ResponseOutputItem[];
    error?: {
        message?: string;
    };
};

function extractOutputText(payload: OpenAIResponsesPayload) {
    if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
        return payload.output_text;
    }

    const contentItems = Array.isArray(payload?.output)
        ? payload.output.flatMap((item) =>
            Array.isArray(item?.content) ? item.content : []
        )
        : [];

    const outputText = contentItems.find(
        (item) => item?.type === "output_text" && typeof item?.text === "string"
    );

    if (outputText?.text) {
        return outputText.text;
    }

    throw new Error("No text output returned from the model");
}

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (typeof message !== "string" || !message.trim()) {
            return NextResponse.json(
                { error: "A workflow description is required." },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "OPENAI_API_KEY is not configured." },
                { status: 500 }
            );
        }

        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gpt-5-mini",
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: buildWorkflowGeneratorPrompt(message),
                            },
                        ],
                    },
                ],
                text: {
                    format: {
                        type: "json_schema",
                        strict: true,
                        ...workflowDefinitionJsonSchema,
                    },
                },
            }),
        });

        const payload = (await response.json()) as OpenAIResponsesPayload;

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: payload?.error?.message || "Failed to generate workflow JSON.",
                },
                { status: response.status }
            );
        }

        const rawText = extractOutputText(payload);
        const workflow = JSON.parse(rawText);

        if (!isWorkflowDefinition(workflow)) {
            return NextResponse.json(
                { error: "The model returned an invalid workflow definition." },
                { status: 502 }
            );
        }

        return NextResponse.json(workflow);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to generate workflow JSON." },
            { status: 500 }
        );
    }
}
