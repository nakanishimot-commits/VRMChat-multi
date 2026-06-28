import React from "react";
import { LLMProvider, LLMConfig } from "@/features/chat/llmClient";

const OPENROUTER_MODELS = [
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "anthropic/claude-sonnet-4-6",
  "anthropic/claude-3-5-haiku",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.3-70b-instruct",
  "mistralai/mistral-large-2411",
];

const CLAUDE_MODELS = [
  "claude-sonnet-4-6",
  "claude-opus-4-6",
  "claude-haiku-4-5-20251001",
];

const OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
];

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

type Props = {
  llmConfig: LLMConfig;
  onChangeLLMConfig: (config: LLMConfig) => void;
};

export const ApiSettings = ({ llmConfig, onChangeLLMConfig }: Props) => {
  const setProvider = (provider: LLMProvider) => {
    onChangeLLMConfig({ ...llmConfig, provider });
  };

  const PROVIDER_LABELS: Record<LLMProvider, string> = {
    claude: "Claude (Anthropic)",
    openai: "OpenAI",
    gemini: "Gemini (Google)",
    openrouter: "OpenRouter",
  };

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">AI APIの選択</div>

      {/* プロバイダー選択 */}
      <div className="my-8">
        <div className="my-8 text-sm text-gray-600">プロバイダー</div>
        <div className="grid grid-cols-2 gap-8">
          {(["claude", "openai", "gemini", "openrouter"] as LLMProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`px-12 py-8 rounded-8 text-sm font-medium transition-colors ${
                llmConfig.provider === p
                  ? "bg-primary text-white"
                  : "bg-surface1 hover:bg-surface1-hover text-text1"
              }`}
            >
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* APIキー入力 */}
      <div className="my-16">
        <div className="my-8 text-sm text-gray-600">
          {llmConfig.provider === "claude" && "Anthropic APIキー"}
          {llmConfig.provider === "openai" && "OpenAI APIキー"}
          {llmConfig.provider === "gemini" && "Gemini APIキー"}
          {llmConfig.provider === "openrouter" && "OpenRouter APIキー"}
        </div>
        <input
          type="password"
          placeholder="sk-..."
          value={llmConfig.apiKey}
          onChange={(e) =>
            onChangeLLMConfig({ ...llmConfig, apiKey: e.target.value })
          }
          className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8 w-full text-sm"
        />
        <div className="mt-4 text-xs text-gray-500">
          {llmConfig.provider === "claude" && (
            <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Anthropic Console でAPIキーを取得
            </a>
          )}
          {llmConfig.provider === "openai" && (
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              OpenAI Platform でAPIキーを取得
            </a>
          )}
          {llmConfig.provider === "gemini" && (
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              Google AI Studio でAPIキーを取得
            </a>
          )}
          {llmConfig.provider === "openrouter" && (
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              OpenRouter でAPIキーを取得
            </a>
          )}
        </div>
      </div>

      {/* モデル選択 */}
      <div className="my-16">
        <div className="my-8 text-sm text-gray-600">モデル</div>
        {llmConfig.provider === "claude" && (
          <select
            value={llmConfig.claudeModel || CLAUDE_MODELS[0]}
            onChange={(e) => onChangeLLMConfig({ ...llmConfig, claudeModel: e.target.value })}
            className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8 w-full text-sm"
          >
            {CLAUDE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        {llmConfig.provider === "openai" && (
          <select
            value={llmConfig.openaiModel || OPENAI_MODELS[0]}
            onChange={(e) => onChangeLLMConfig({ ...llmConfig, openaiModel: e.target.value })}
            className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8 w-full text-sm"
          >
            {OPENAI_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        {llmConfig.provider === "gemini" && (
          <select
            value={llmConfig.geminiModel || GEMINI_MODELS[0]}
            onChange={(e) => onChangeLLMConfig({ ...llmConfig, geminiModel: e.target.value })}
            className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8 w-full text-sm"
          >
            {GEMINI_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        {llmConfig.provider === "openrouter" && (
          <select
            value={llmConfig.openRouterModel || OPENROUTER_MODELS[0]}
            onChange={(e) => onChangeLLMConfig({ ...llmConfig, openRouterModel: e.target.value })}
            className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8 w-full text-sm"
          >
            {OPENROUTER_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </div>

      {/* Gemini Web検索グラウンディング - インラインスタイルで確実に表示 */}
      {llmConfig.provider === "gemini" && (
        <div style={{
          margin: "16px 0",
          padding: "12px 16px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
            🔍 Google 検索グラウンディング
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
            ONにすると最新のWeb情報を参照して回答します
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={llmConfig.geminiWebSearch ?? false}
              onChange={(e) =>
                onChangeLLMConfig({ ...llmConfig, geminiWebSearch: e.target.checked })
              }
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "14px", fontWeight: "500" }}>
              {llmConfig.geminiWebSearch ? "✅ ON（Web検索有効）" : "OFF（通常モード）"}
            </span>
          </label>
        </div>
      )}

      {/* 最大返答トークン数 */}
      <div className="my-16">
        <div className="my-8 text-sm text-gray-600">最大返答トークン数</div>
        <input
          type="number"
          min={256}
          max={32768}
          step={256}
          value={llmConfig.maxTokens ?? 4096}
          onChange={(e) =>
            onChangeLLMConfig({ ...llmConfig, maxTokens: Number(e.target.value) })
          }
          className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8 w-full text-sm"
        />
        <div className="mt-4 text-xs text-gray-500">
          返答の長さの上限です（デフォルト: 4096）。長い会話を望む場合は大きくしてください。
        </div>
      </div>
    </div>
  );
};
