import React, { useCallback, useEffect, useState } from "react";
import { TextButton } from "./textButton";
import { TTSConfig, TTSProvider } from "@/features/messages/speakCharacter";
import {
  VOICEVOX_SPEAKERS,
  checkVoicevoxConnection,
  fetchVoicevoxSpeakers,
} from "@/features/voicevox/voicevoxClient";

type Props = {
  ttsConfig: TTSConfig;
  onChangeTTSConfig: (config: TTSConfig) => void;
};

type ConnectionStatus = "unknown" | "checking" | "connected" | "disconnected";

export const TtsSettings = ({ ttsConfig, onChangeTTSConfig }: Props) => {
  const [status, setStatus] = useState<ConnectionStatus>("unknown");
  const [speakerList, setSpeakerList] =
    useState<{ id: number; name: string }[]>([...VOICEVOX_SPEAKERS]);

  const checkConnection = useCallback(async () => {
    setStatus("checking");
    const ok = await checkVoicevoxConnection(ttsConfig.voicevox.serverUrl);
    setStatus(ok ? "connected" : "disconnected");

    if (ok) {
      // 接続できた場合、実際の話者一覧を取得を試みる（取れなければデフォルト一覧のまま）
      try {
        const speakers = await fetchVoicevoxSpeakers(
          ttsConfig.voicevox.serverUrl
        );
        if (speakers.length > 0) setSpeakerList(speakers);
      } catch {
        // 取得失敗時はデフォルトの代表話者一覧を使い続ける
      }
    }
  }, [ttsConfig.voicevox.serverUrl]);

  useEffect(() => {
    if (ttsConfig.provider === "voicevox") {
      checkConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsConfig.provider]);

  const setProvider = (provider: TTSProvider) => {
    onChangeTTSConfig({ ...ttsConfig, provider });
  };

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">音声合成（TTS）の選択</div>

      <div className="my-8">
        <div className="my-8 text-sm text-gray-600">プロバイダー</div>
        <div className="grid grid-cols-2 gap-8">
          <button
            onClick={() => setProvider("voicevox")}
            className={`px-12 py-8 rounded-8 text-sm font-medium transition-colors ${
              ttsConfig.provider === "voicevox"
                ? "bg-primary text-white"
                : "bg-surface1 hover:bg-surface1-hover text-text1"
            }`}
          >
            VOICEVOX（ローカル）
          </button>
          <button
            onClick={() => setProvider("koeiro")}
            className={`px-12 py-8 rounded-8 text-sm font-medium transition-colors ${
              ttsConfig.provider === "koeiro"
                ? "bg-primary text-white"
                : "bg-surface1 hover:bg-surface1-hover text-text1"
            }`}
          >
            Koeiro API（停止中）
          </button>
        </div>
      </div>

      {ttsConfig.provider === "koeiro" && (
        <div className="my-16 px-16 py-12 bg-red-50 text-red-700 rounded-8 text-sm">
          ⚠️ Koeiro
          APIは2023年7月にサービス提供を終了しており、現在は利用できません。VOICEVOXをご利用ください。
        </div>
      )}

      {ttsConfig.provider === "voicevox" && (
        <div className="my-16">
          <div className="my-8 text-sm text-gray-600">
            VOICEVOXエンジンのURL
          </div>
          <div className="flex gap-8">
            <input
              type="text"
              value={ttsConfig.voicevox.serverUrl}
              onChange={(e) =>
                onChangeTTSConfig({
                  ...ttsConfig,
                  voicevox: { ...ttsConfig.voicevox, serverUrl: e.target.value },
                })
              }
              className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8 flex-1 text-sm"
            />
            <TextButton onClick={checkConnection}>接続確認</TextButton>
          </div>

          <div className="mt-8 text-sm">
            {status === "checking" && (
              <span className="text-gray-500">確認中...</span>
            )}
            {status === "connected" && (
              <span className="text-green-600">✓ 接続できています</span>
            )}
            {status === "disconnected" && (
              <span className="text-red-600">
                ✗
                接続できません。VOICEVOXアプリを起動してから再確認してください。
              </span>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            VOICEVOXアプリ（GUI）を起動している間、自動的にこのURLでAPIサーバーが立ち上がります。インストールはこちら：
            <a
              href="https://voicevox.hiroshiba.jp/"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline ml-4"
            >
              voicevox.hiroshiba.jp
            </a>
          </div>

          <div className="my-16">
            <div className="my-8 text-sm text-gray-600">話者（キャラクターボイス）</div>
            <select
              value={ttsConfig.voicevox.speakerId}
              onChange={(e) =>
                onChangeTTSConfig({
                  ...ttsConfig,
                  voicevox: {
                    ...ttsConfig.voicevox,
                    speakerId: Number(e.target.value),
                  },
                })
              }
              className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8 w-full text-sm"
            >
              {speakerList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
