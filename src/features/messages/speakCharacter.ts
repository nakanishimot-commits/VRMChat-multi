import { wait } from "@/utils/wait";
import { synthesizeVoice } from "../koeiromap/koeiromap";
import { synthesizeVoicevox, VoicevoxConfig } from "../voicevox/voicevoxClient";
import { Viewer } from "../vrmViewer/viewer";
import { Screenplay } from "./messages";
import { Talk } from "./messages";

export type TTSProvider = "koeiro" | "voicevox";

export interface TTSConfig {
  provider: TTSProvider;
  voicevox: VoicevoxConfig;
}

const createSpeakCharacter = () => {
  let lastTime = 0;
  let prevFetchPromise: Promise<unknown> = Promise.resolve();
  let prevSpeakPromise: Promise<unknown> = Promise.resolve();

  return (
    screenplay: Screenplay,
    viewer: Viewer,
    ttsConfig: TTSConfig,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now();
      if (now - lastTime < 1000) {
        await wait(1000 - (now - lastTime));
      }

      const buffer = await fetchAudio(screenplay.talk, ttsConfig).catch(
        (e) => {
          console.error("TTS fetch error:", e);
          return null;
        }
      );
      lastTime = Date.now();
      return buffer;
    });

    prevFetchPromise = fetchPromise;
    prevSpeakPromise = Promise.all([fetchPromise, prevSpeakPromise]).then(([audioBuffer]) => {
      onStart?.();
      if (!audioBuffer) {
        return;
      }
      return viewer.model?.speak(audioBuffer, screenplay);
    });
    prevSpeakPromise.then(() => {
      onComplete?.();
    });
  };
}

export const speakCharacter = createSpeakCharacter();

export const fetchAudio = async (
  talk: Talk,
  ttsConfig: TTSConfig
): Promise<ArrayBuffer> => {
  if (ttsConfig.provider === "voicevox") {
    return synthesizeVoicevox(talk.message, ttsConfig.voicevox);
  }

  // koeiro（後方互換・現在はサービス終了のため動作しません）
  const ttsVoice = await synthesizeVoice(
    talk.message,
    talk.speakerX,
    talk.speakerY,
    talk.style
  );
  const url = ttsVoice.audio;

  if (url == null) {
    throw new Error("Something went wrong");
  }

  const resAudio = await fetch(url);
  const buffer = await resAudio.arrayBuffer();
  return buffer;
};
