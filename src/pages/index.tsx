import { useCallback, useContext, useEffect, useState } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import {
  Message,
  textsToScreenplay,
  Screenplay,
} from "@/features/messages/messages";
import { speakCharacter, TTSConfig } from "@/features/messages/speakCharacter";
import { MessageInputContainer } from "@/components/messageInputContainer";
import { SYSTEM_PROMPT, CharacterPreset, CHARACTER_PRESETS } from "@/features/constants/systemPromptConstants";
import { KoeiroParam, DEFAULT_PARAM } from "@/features/constants/koeiroParam";
import { getChatResponseStream, LLMConfig } from "@/features/chat/llmClient";
import { DEFAULT_VOICEVOX_CONFIG } from "@/features/voicevox/voicevoxClient";
import { M_PLUS_2, Montserrat } from "next/font/google";
import { Introduction } from "@/components/introduction";
import { Menu } from "@/components/menu";
import { GitHubLink } from "@/components/githubLink";
import { Meta } from "@/components/meta";

const m_plus_2 = M_PLUS_2({
  variable: "--font-m-plus-2",
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  display: "swap",
  subsets: ["latin"],
});

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: "claude",
  apiKey: "",
  claudeModel: "claude-sonnet-4-6",
};

const DEFAULT_TTS_CONFIG: TTSConfig = {
  provider: "voicevox",
  voicevox: DEFAULT_VOICEVOX_CONFIG,
};

export default function Home() {
  const { viewer } = useContext(ViewerContext);

  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [characterPreset, setCharacterPreset] = useState<CharacterPreset>("friendly");
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [ttsConfig, setTtsConfig] = useState<TTSConfig>(DEFAULT_TTS_CONFIG);
  const [koeiroParam, setKoeiroParam] = useState<KoeiroParam>(DEFAULT_PARAM);
  const [chatProcessing, setChatProcessing] = useState(false);
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [assistantMessage, setAssistantMessage] = useState("");

  // LocalStorage から設定を復元（バージョンが変わった場合はキャッシュをクリア）
  useEffect(() => {
    const STORAGE_VERSION = "v4"; // プリセット機能追加・Gemini検索対応
    const savedVersion = window.localStorage.getItem("chatVRMVersion");
    if (savedVersion !== STORAGE_VERSION) {
      window.localStorage.removeItem("chatVRMParams");
      window.localStorage.setItem("chatVRMVersion", STORAGE_VERSION);
      return; // デフォルト値のまま起動
    }
    const saved = window.localStorage.getItem("chatVRMParams");
    if (saved) {
      try {
        const params = JSON.parse(saved);
        if (params.systemPrompt) setSystemPrompt(params.systemPrompt);
        if (params.koeiroParam) setKoeiroParam(params.koeiroParam);
        if (params.chatLog) setChatLog(params.chatLog);
        if (params.llmConfig) setLlmConfig((prev) => ({ ...prev, ...params.llmConfig }));
        if (params.ttsConfig) setTtsConfig(params.ttsConfig);
        if (params.characterPreset) setCharacterPreset(params.characterPreset);
      } catch {
        window.localStorage.removeItem("chatVRMParams");
      }
    }
  }, []);

  // LocalStorage へ保存（APIキーは除外）
  useEffect(() => {
    const { apiKey, ...safeConfig } = llmConfig;
    process.nextTick(() =>
      window.localStorage.setItem(
        "chatVRMParams",
        JSON.stringify({ systemPrompt, koeiroParam, chatLog, llmConfig: safeConfig, ttsConfig, characterPreset })
      )
    );
  }, [systemPrompt, koeiroParam, chatLog, llmConfig, ttsConfig, characterPreset]);

  const handleChangeChatLog = useCallback(
    (targetIndex: number, text: string) => {
      const newChatLog = chatLog.map((v: Message, i) => {
        return i === targetIndex ? { role: v.role, content: text } : v;
      });
      setChatLog(newChatLog);
    },
    [chatLog]
  );

  const handleChangeCharacterPreset = useCallback(
    (preset: CharacterPreset, prompt: string) => {
      setCharacterPreset(preset);
      setSystemPrompt(prompt);
      setChatLog([]); // プリセット切替時は会話履歴をリセット
    },
    []
  );

  const handleSpeakAi = useCallback(
    async (screenplay: Screenplay, onStart?: () => void, onEnd?: () => void) => {
      speakCharacter(screenplay, viewer, ttsConfig, onStart, onEnd);
    },
    [viewer, ttsConfig]
  );

  const handleSendChat = useCallback(
    async (text: string) => {
      if (!llmConfig.apiKey) {
        setAssistantMessage("⚠️ 設定からAPIキーを入力してください");
        return;
      }

      const newMessage = text;
      if (newMessage == null) return;

      setChatProcessing(true);
      const messageLog: Message[] = [
        ...chatLog,
        { role: "user", content: newMessage },
      ];
      setChatLog(messageLog);

      const messages: Message[] = [
        { role: "system", content: systemPrompt },
        ...messageLog,
      ];

      const stream = await getChatResponseStream(messages, llmConfig).catch((e) => {
        console.error(e);
        setAssistantMessage(`エラー: ${e.message}`);
        return null;
      });

      if (stream == null) {
        setChatProcessing(false);
        return;
      }

      const reader = stream.getReader();
      let receivedMessage = "";
      let aiTextLog = "";
      let tag = "";
      const sentences = new Array<string>();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          receivedMessage += value;

          const tagMatch = receivedMessage.match(/^\[(.*?)\]/);
          if (tagMatch && tagMatch[0]) {
            tag = tagMatch[0];
            receivedMessage = receivedMessage.slice(tag.length);
          }

          const sentenceMatch = receivedMessage.match(
            /^(.+[。．！？\n]|.{10,}[、,])/
          );
          if (sentenceMatch && sentenceMatch[0]) {
            const sentence = sentenceMatch[0];
            sentences.push(sentence);
            receivedMessage = receivedMessage.slice(sentence.length).trimStart();

            if (
              !sentence.replace(
                /^[\s\[\(\{「［（【『〈《〔｛«‹〘〚〛〙›»〕》〉』】）］」\}\)\]]+$/g,
                ""
              )
            ) {
              continue;
            }

            const aiText = `${tag} ${sentence}`;
            const aiTalks = textsToScreenplay([aiText], koeiroParam);
            aiTextLog += aiText;

            const currentAssistantMessage = sentences.join(" ");
            handleSpeakAi(aiTalks[0], () => {
              setAssistantMessage(currentAssistantMessage);
            });
          }
        }
      } catch (e) {
        setChatProcessing(false);
        console.error(e);
      } finally {
        reader.releaseLock();
      }

      const messageLogAssistant: Message[] = [
        ...messageLog,
        { role: "assistant", content: aiTextLog },
      ];
      setChatLog(messageLogAssistant);
      setChatProcessing(false);
    },
    [systemPrompt, chatLog, handleSpeakAi, llmConfig, koeiroParam]
  );

  return (
    <div className={`${m_plus_2.variable} ${montserrat.variable}`}>
      <Meta />
      <Introduction />
      <VrmViewer />
      <MessageInputContainer
        isChatProcessing={chatProcessing}
        onChatProcessStart={handleSendChat}
      />
      <Menu
        llmConfig={llmConfig}
        ttsConfig={ttsConfig}
        systemPrompt={systemPrompt}
        characterPreset={characterPreset}
        chatLog={chatLog}
        koeiroParam={koeiroParam}
        assistantMessage={assistantMessage}
        onChangeLLMConfig={setLlmConfig}
        onChangeTTSConfig={setTtsConfig}
        onChangeSystemPrompt={setSystemPrompt}
        onChangeCharacterPreset={handleChangeCharacterPreset}
        onChangeChatLog={handleChangeChatLog}
        onChangeKoeiromapParam={setKoeiroParam}
        handleClickResetChatLog={() => setChatLog([])}
        handleClickResetSystemPrompt={() => {
          const preset = CHARACTER_PRESETS.find((p) => p.id === characterPreset);
          setSystemPrompt(preset?.prompt ?? "");
        }}
      />
      <GitHubLink />
    </div>
  );
}
