import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionFunctionTool } from "openai/resources/chat/completions";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured. AI agent features are unavailable.");
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Sends a prompt and forces the model to reply with a single JSON object,
 * which is parsed and returned as T. Used by agents that need structured
 * extraction/scoring (resume parsing, interview evaluation, analytics insights).
 */
export async function chatJSON<T>(params: {
  system: string;
  user: string;
  temperature?: number;
}): Promise<T> {
  const completion = await getClient().chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: params.temperature ?? 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: params.system },
      { role: "user", content: params.user },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("AI model returned an empty response.");

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("AI model returned malformed JSON output.");
  }
}

/**
 * Sends a plain conversational prompt and returns the model's text reply.
 */
export async function chatText(params: {
  system: string;
  messages: ChatCompletionMessageParam[];
  temperature?: number;
}): Promise<string> {
  const completion = await getClient().chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: params.temperature ?? 0.5,
    messages: [{ role: "system", content: params.system }, ...params.messages],
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

export interface ToolHandler {
  definition: ChatCompletionFunctionTool;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Runs a tool-calling conversation loop: the model may request one or more
 * internal tools, we execute them and feed results back, until it produces
 * a final natural-language answer. Powers the HR Assistant agent so it can
 * intelligently decide which internal HR data to look up.
 */
export async function chatWithTools(params: {
  system: string;
  messages: ChatCompletionMessageParam[];
  tools: ToolHandler[];
  temperature?: number;
  maxRounds?: number;
}): Promise<string> {
  const conversation: ChatCompletionMessageParam[] = [
    { role: "system", content: params.system },
    ...params.messages,
  ];
  const toolDefs = params.tools.map(t => t.definition);
  const toolMap = new Map(params.tools.map(t => [t.definition.function.name, t.handler]));
  const maxRounds = params.maxRounds ?? 4;

  for (let round = 0; round < maxRounds; round++) {
    const completion = await getClient().chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: params.temperature ?? 0.4,
      messages: conversation,
      tools: toolDefs.length ? toolDefs : undefined,
    });

    const message = completion.choices[0]?.message;
    if (!message) break;

    const toolCalls = message.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      return message.content?.trim() || "";
    }

    conversation.push(message);

    for (const call of toolCalls) {
      if (call.type !== "function") continue;
      const handler = toolMap.get(call.function.name);
      let result: unknown;
      try {
        const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        result = handler ? await handler(args) : { error: `Unknown tool: ${call.function.name}` };
      } catch (error: unknown) {
        result = { error: error instanceof Error ? error.message : "Tool execution failed." };
      }
      conversation.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return "I wasn't able to fully resolve that request — could you rephrase or ask something more specific?";
}
