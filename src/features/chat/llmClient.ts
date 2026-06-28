/**
 * LLMクライアント - 複数のAPIプロバイダーに対応
 * 対応プロバイダー: claude, openai, openrouter
 */

import { Message } from "../messages/messages";

export type LLMProvider = "claude" | "openai" | "gemini" | "openrouter";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  claudeModel?: string;
  openaiModel?: string;
  geminiModel?: string;
  openRouterModel?: string;
  maxTokens?: number;
  geminiWebSearch?: boolean; // Gemini Google Search グラウンディング
}

const DEFAULT_MAX_TOKENS = 4096;

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  claude: "claude-sonnet-4-6",
  openai: "gpt-4o",
  gemini: "gemini-2.5-flash",
  openrouter: "openai/gpt-4o",
};

export async function getChatResponseStream(
  messages: Message[],
  config: LLMConfig
): Promise<ReadableStream> {
  switch (config.provider) {
    case "claude":
      return getClaudeStream(messages, config);
    case "openai":
      return getOpenAIStream(messages, config);
    case "gemini":
      return getGeminiStream(messages, config);
    case "openrouter":
      return getOpenRouterStream(messages, config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// ── Claude (Anthropic) ──────────────────────────────────────────────
async function getClaudeStream(
  messages: Message[],
  config: LLMConfig
): Promise<ReadableStream> {
  if (!config.apiKey) throw new Error("Claude APIキーが設定されていません");

  const systemMessage = messages.find((m) => m.role === "system");
  const userMessages = messages.filter((m) => m.role !== "system");
  const model = config.claudeModel || DEFAULT_MODELS.claude;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
      stream: true,
      system: systemMessage?.content || "",
      messages: userMessages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Claude API Error: ${JSON.stringify(err)}`);
  }

  return transformAnthropicStream(response.body!);
}

function transformAnthropicStream(body: ReadableStream): ReadableStream {
  const decoder = new TextDecoder();
  const reader = body.getReader();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              if (json.type === "content_block_delta" && json.delta?.text) {
                controller.enqueue(json.delta.text);
              }
            } catch {}
          }
        }
      } catch (e) {
        controller.error(e);
      } finally {
        controller.close();
      }
    },
  });
}

// ── OpenAI ─────────────────────────────────────────────────────────
async function getOpenAIStream(
  messages: Message[],
  config: LLMConfig
): Promise<ReadableStream> {
  if (!config.apiKey) throw new Error("OpenAI APIキーが設定されていません");
  const model = config.openaiModel || DEFAULT_MODELS.openai;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: config.maxTokens ?? DEFAULT_MAX_TOKENS, stream: true }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API Error: ${JSON.stringify(err)}`);
  }

  return transformOpenAIStream(response.body!);
}

// ── Google Gemini ──────────────────────────────────────────────────
async function getGeminiStream(
  messages: Message[],
  config: LLMConfig
): Promise<ReadableStream> {
  if (!config.apiKey) throw new Error("Gemini APIキーが設定されていません");

  const systemMessage = messages.find((m) => m.role === "system");
  const conversation = messages.filter((m) => m.role !== "system");
  const model = config.geminiModel || DEFAULT_MODELS.gemini;

  // Gemini形式: role は "user" / "model"、assistant → model に変換
  const contents = conversation.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
    generationConfig: {
      maxOutputTokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
    },
  };
  if (systemMessage?.content) {
    body.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    };
  }
  // Google Search グラウンディングを有効化
  if (config.geminiWebSearch) {
    body.tools = [{ google_search: {} }];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Gemini API Error: ${JSON.stringify(err)}`);
  }

  return transformGeminiStream(response.body!);
}

function transformGeminiStream(body: ReadableStream): ReadableStream {
  const decoder = new TextDecoder();
  const reader = body.getReader();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data) continue;
            try {
              const json = JSON.parse(data);
              const text = json.candidates?.[0]?.content?.parts
                ?.map((p: any) => p.text || "")
                .join("");
              if (text) controller.enqueue(text);
            } catch {}
          }
        }
      } catch (e) {
        controller.error(e);
      } finally {
        controller.close();
      }
    },
  });
}

// ── OpenRouter ─────────────────────────────────────────────────────
async function getOpenRouterStream(
  messages: Message[],
  config: LLMConfig
): Promise<ReadableStream> {
  if (!config.apiKey) throw new Error("OpenRouter APIキーが設定されていません");
  const model = config.openRouterModel || DEFAULT_MODELS.openrouter;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer": "https://chatvrmjp.local",
    },
    body: JSON.stringify({ model, messages, max_tokens: config.maxTokens ?? DEFAULT_MAX_TOKENS, stream: true }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API Error: ${JSON.stringify(err)}`);
  }

  return transformOpenAIStream(response.body!);
}

// OpenAI形式のSSEストリームをテキストに変換（OpenAI & OpenRouter共通）
function transformOpenAIStream(body: ReadableStream): ReadableStream {
  const decoder = new TextDecoder();
  const reader = body.getReader();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const text = json.choices?.[0]?.delta?.content;
              if (text) controller.enqueue(text);
            } catch {}
          }
        }
      } catch (e) {
        controller.error(e);
      } finally {
        controller.close();
      }
    },
  });
}
