/**
 * VOICEVOX TTSクライアント
 * ローカルで起動したVOICEVOXエンジン（デフォルト: http://localhost:50021）に接続します。
 * VOICEVOXアプリ（GUI）を起動している間は自動的にAPIサーバーも立ち上がります。
 *
 * 公式: https://voicevox.hiroshiba.jp/
 * APIドキュメント: http://localhost:50021/docs （VOICEVOX起動中にブラウザでアクセス可能）
 */

export const DEFAULT_VOICEVOX_URL = "http://localhost:50021";

// よく使われる代表的な話者（スタイル）ID。
// 完全なリストはVOICEVOX起動中に GET {VOICEVOX_URL}/speakers で取得可能。
export const VOICEVOX_SPEAKERS = [
  { id: 2, name: "四国めたん（ノーマル）" },
  { id: 0, name: "四国めたん（あまあま）" },
  { id: 6, name: "四国めたん（ツンツン）" },
  { id: 4, name: "四国めたん（セクシー）" },
  { id: 3, name: "ずんだもん（ノーマル）" },
  { id: 1, name: "ずんだもん（あまあま）" },
  { id: 7, name: "ずんだもん（ツンツン）" },
  { id: 5, name: "ずんだもん（セクシー）" },
  { id: 8, name: "春日部つむぎ（ノーマル）" },
  { id: 10, name: "雨晴はう（ノーマル）" },
  { id: 9, name: "波音リツ（ノーマル）" },
  { id: 13, name: "青山龍星（ノーマル）" },
  { id: 14, name: "冥鳴ひまり（ノーマル）" },
  { id: 16, name: "九州そら（ノーマル）" },
] as const;

export interface VoicevoxConfig {
  serverUrl: string;
  speakerId: number;
}

export const DEFAULT_VOICEVOX_CONFIG: VoicevoxConfig = {
  serverUrl: DEFAULT_VOICEVOX_URL,
  speakerId: 2, // 四国めたん（ノーマル）
};

/**
 * テキストを音声(WAV ArrayBuffer)に変換する
 */
export async function synthesizeVoicevox(
  text: string,
  config: VoicevoxConfig
): Promise<ArrayBuffer> {
  const baseUrl = config.serverUrl.replace(/\/$/, "");

  if (!text || text.trim() === "") {
    throw new Error("テキストが空です");
  }

  // 1. audio_query: テキストから音声合成用クエリ（イントネーション情報等）を生成
  const queryUrl = `${baseUrl}/audio_query?speaker=${config.speakerId}&text=${encodeURIComponent(
    text
  )}`;

  const queryRes = await fetch(queryUrl, { method: "POST" }).catch(() => {
    throw new Error(
      "VOICEVOXエンジンに接続できません。VOICEVOXアプリが起動しているか確認してください。"
    );
  });

  if (!queryRes.ok) {
    throw new Error(`VOICEVOX audio_query エラー: ${queryRes.status}`);
  }

  const audioQuery = await queryRes.json();

  // 2. synthesis: クエリを音声(WAV)に変換
  const synthesisUrl = `${baseUrl}/synthesis?speaker=${config.speakerId}`;

  const synthesisRes = await fetch(synthesisUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(audioQuery),
  });

  if (!synthesisRes.ok) {
    throw new Error(`VOICEVOX synthesis エラー: ${synthesisRes.status}`);
  }

  return await synthesisRes.arrayBuffer();
}

/**
 * VOICEVOXエンジンが起動しているか確認する
 */
export async function checkVoicevoxConnection(
  serverUrl: string
): Promise<boolean> {
  try {
    const baseUrl = serverUrl.replace(/\/$/, "");
    const res = await fetch(`${baseUrl}/version`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * VOICEVOXエンジンから話者一覧を取得する
 */
export async function fetchVoicevoxSpeakers(
  serverUrl: string
): Promise<{ id: number; name: string }[]> {
  const baseUrl = serverUrl.replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/speakers`);
  if (!res.ok) throw new Error("話者一覧の取得に失敗しました");

  const data = await res.json();
  const result: { id: number; name: string }[] = [];
  for (const speaker of data) {
    for (const style of speaker.styles) {
      result.push({
        id: style.id,
        name: `${speaker.name}（${style.name}）`,
      });
    }
  }
  return result;
}
