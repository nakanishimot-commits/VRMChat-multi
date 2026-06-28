# ChatVRM (Multi-API版)

[zoan37/ChatVRM-jp](https://github.com/zoan37/ChatVRM-jp)（[pixiv/ChatVRM](https://github.com/pixiv/ChatVRM) のフォーク）をベースに、

- 会話文生成のAPIを **Claude（Anthropic）/ OpenAI / Gemini（Google）/ OpenRouter** から選択可能
- 音声合成（TTS）を **VOICEVOX（ローカル・無料）** に変更（旧Koeiro APIは2023年7月にサービス終了）

するように改造したバージョンです。ブラウザ上で3DキャラクターVRMと会話ができるデモアプリケーションです。

## 主な変更点（オリジナルからの差分）

### 会話文生成（LLM）
- **Window AI固定** → **Claude / OpenAI / Gemini / OpenRouter から選択可能** に変更
  - `src/features/chat/llmClient.ts`: 4プロバイダー対応の共通クライアント（ストリーミング対応）
  - `src/components/apiSettings.tsx`: プロバイダー・APIキー・モデルを選択するUI
- 使われていなかったWindow AI関連コード（`openAiChat.ts`, `pages/api/chat.ts`）を削除
- `window.ai` パッケージ依存を削除
- Geminiについて最新の情報を検索して回答できるよう Google検索グラウンディングのトグルが表示されるように設定

### 音声合成（TTS）
- **Koeiro API（サービス終了済み）** → **VOICEVOX（ローカルエンジン）** に変更
  - `src/features/voicevox/voicevoxClient.ts`: VOICEVOXエンジンへの `audio_query` → `synthesis` 呼び出しクライアント
  - `src/components/ttsSettings.tsx`: TTSプロバイダー・話者を選択するUI
  - `src/features/messages/speakCharacter.ts`: TTSプロバイダーを切り替えられるよう拡張（Koeiro実装は後方互換として残置、現在は動作しません）
### キャラクター設定
- キャラクターを①仲良し・②秘書③自由設定（空白から自由に記述）から選択できるように設定
  
## セットアップ

### 1. このアプリ

```bash
npm install
npm run dev
```

`http://localhost:3000` にアクセスしてください。

### 2. VOICEVOX（音声合成エンジン）

VOICEVOXは別アプリとして、お使いのPCにインストール・起動しておく必要があります。

1. [VOICEVOX公式サイト](https://voicevox.hiroshiba.jp/) からダウンロード・インストール
2. VOICEVOXアプリを起動したままにする（起動中、自動的に `http://localhost:50021` でAPIサーバーが立ち上がります）
3. ChatVRM側の「設定」→「音声合成（TTS）の選択」で VOICEVOX を選び、「接続確認」ボタンで疎通確認

VOICEVOXを起動していない状態だと、キャラクターは音声なしで返答テキストのみ表示されます。

## APIキーの設定（会話文生成）

アプリ起動後、右上の「設定」メニューを開き、

1. 使いたいプロバイダー（Claude / OpenAI / Gemini / OpenRouter）を選択
2. 該当するAPIキーを入力
3. 使用したいモデルを選択

してください。APIキーはブラウザのLocalStorageには保存されません（プロバイダーへの直接リクエストにのみ使用、ページをリロードすると再入力が必要です）。

### 各プロバイダーのAPIキー取得先

| プロバイダー | 取得ページ |
|---|---|
| Claude (Anthropic) | https://console.anthropic.com/ |
| OpenAI | https://platform.openai.com/api-keys |
| Gemini (Google) | https://aistudio.google.com/apikey |
| OpenRouter | https://openrouter.ai/keys |

## 注意事項

- 本アプリはブラウザから各社APIに直接リクエストを送る構成のため、**APIキーがブラウザのネットワークタブ等から見える状態**になります。個人の検証・学習目的での利用を想定しています。本番公開する場合は、APIキーをサーバーサイド（Next.js API Routes等）で扱う構成に変更することを推奨します。
- OpenRouter経由の場合、選択したモデルによって課金体系が異なります。利用前にOpenRouterの料金表をご確認ください。
- VOICEVOXは非商用・商用ともに利用可能ですが、キャラクターごとの利用規約（クレジット表記など）に従ってください。詳細は[VOICEVOX利用規約](https://voicevox.hiroshiba.jp/term/)をご確認ください。

---

以下、オリジナルのChatVRM README内容です。

## ChatVRMについて

ChatVRMはブラウザで簡単に3Dキャラクターと会話ができるデモアプリケーションです。

VRMファイルをインポートしてキャラクターに合わせた声の調整や、感情表現を含んだ返答文の生成などを行うことができます。

### 主な使用技術

- 3Dキャラクターの表示: [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)
- ユーザーの音声の認識: [Web Speech API (SpeechRecognition)](https://developer.mozilla.org/ja/docs/Web/API/SpeechRecognition)
- 読み上げ音声の生成: VOICEVOX（本フォークでの変更点。旧: Koeiro API）
- 会話文の生成: Claude / OpenAI / Gemini / OpenRouter（本フォークでの変更点）

## ライセンス

オリジナルの [pixiv/ChatVRM](https://github.com/pixiv/ChatVRM) のライセンス（MIT License）を継承します。`LICENSE` ファイルを参照してください。
