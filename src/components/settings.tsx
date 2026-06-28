import React, { useState, useEffect } from "react";
import { IconButton } from "./iconButton";
import { TextButton } from "./textButton";
import { Message } from "@/features/messages/messages";
import {
  KoeiroParam,
  PRESET_A,
  PRESET_B,
  PRESET_C,
  PRESET_D,
} from "@/features/constants/koeiroParam";
import { Link } from "./link";
import { ApiSettings } from "./apiSettings";
import { TtsSettings } from "./ttsSettings";
import { LLMConfig } from "@/features/chat/llmClient";
import { TTSConfig } from "@/features/messages/speakCharacter";
import {
  CharacterPreset,
  CHARACTER_PRESETS,
} from "@/features/constants/systemPromptConstants";

type Props = {
  llmConfig: LLMConfig;
  ttsConfig: TTSConfig;
  systemPrompt: string;
  characterPreset: CharacterPreset;
  chatLog: Message[];
  koeiroParam: KoeiroParam;
  onClickClose: () => void;
  onChangeLLMConfig: (config: LLMConfig) => void;
  onChangeTTSConfig: (config: TTSConfig) => void;
  onChangeSystemPrompt: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeCharacterPreset: (preset: CharacterPreset, prompt: string) => void;
  onChangeChatLog: (index: number, text: string) => void;
  onChangeKoeiroParam: (x: number, y: number) => void;
  onClickOpenVrmFile: () => void;
  onClickResetChatLog: () => void;
  onClickResetSystemPrompt: () => void;
};

export const Settings = ({
  llmConfig,
  ttsConfig,
  chatLog,
  systemPrompt,
  characterPreset,
  koeiroParam,
  onClickClose,
  onChangeSystemPrompt,
  onChangeLLMConfig,
  onChangeTTSConfig,
  onChangeCharacterPreset,
  onChangeChatLog,
  onChangeKoeiroParam,
  onClickOpenVrmFile,
  onClickResetChatLog,
  onClickResetSystemPrompt,
}: Props) => {
  return (
    <div className="absolute z-40 w-full h-full bg-white/80 backdrop-blur ">
      <div className="absolute m-24">
        <IconButton
          iconName="24/Close"
          isProcessing={false}
          onClick={onClickClose}
        ></IconButton>
      </div>
      <div className="max-h-full overflow-auto">
        <div className="text-text1 max-w-3xl mx-auto px-24 py-64 ">
          <div className="my-24 typography-32 font-bold">設定</div>

          {/* VRMモデル */}
          <div className="my-24">
            <div className="my-16 typography-20 font-bold">
              キャラクターモデル
            </div>
            <div className="my-8">
              <TextButton onClick={onClickOpenVrmFile}>VRMを開く</TextButton>
            </div>
          </div>

          {/* AI API設定 */}
          <ApiSettings
            llmConfig={llmConfig}
            onChangeLLMConfig={onChangeLLMConfig}
          />

          {/* キャラクター設定プリセット */}
          <div className="my-40">
            <div className="my-16 typography-20 font-bold">
              キャラクター設定
            </div>

            {/* プリセット選択ボタン */}
            <div className="my-8 grid grid-cols-3 gap-8">
              {CHARACTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    // ③自由設定は空白、①②はプリセット文言をセット
                    const prompt = preset.prompt ?? "";
                    onChangeCharacterPreset(preset.id, prompt);
                  }}
                  className={`px-12 py-12 rounded-8 text-sm font-medium text-left transition-colors ${
                    characterPreset === preset.id
                      ? "bg-primary text-white"
                      : "bg-surface1 hover:bg-surface1-hover text-text1"
                  }`}
                >
                  <div className="font-bold">{preset.label}</div>
                  <div className={`text-xs mt-4 ${characterPreset === preset.id ? "text-white/80" : "text-gray-500"}`}>
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>

            {/* システムプロンプト編集欄（全プリセット編集可能） */}
            <div className="my-16">
              <div className="flex items-center justify-between my-8">
                <div className="text-sm text-gray-600">
                  システムプロンプト
                  {characterPreset === "custom" && "（自由編集）"}
                  {characterPreset === "friendly" && "（①仲良し・編集可能）"}
                  {characterPreset === "secretary" && "（②秘書・編集可能）"}
                </div>
                <TextButton onClick={onClickResetSystemPrompt}>
                  リセット
                </TextButton>
              </div>
              <textarea
                value={systemPrompt}
                onChange={onChangeSystemPrompt}
                placeholder={characterPreset === "custom" ? "ここにキャラクター設定を自由に入力してください..." : ""}
                className="px-16 py-8 bg-surface1 hover:bg-surface1-hover h-168 rounded-8 w-full text-sm"
              ></textarea>
              <div className="mt-4 text-xs text-gray-400">
                {characterPreset !== "custom"
                  ? "プリセット内容を直接編集できます。「リセット」で元の文言に戻ります。"
                  : "「リセット」を押すと空白に戻ります。"}
              </div>
            </div>
          </div>

          {/* 音声合成（TTS）設定 */}
          <TtsSettings ttsConfig={ttsConfig} onChangeTTSConfig={onChangeTTSConfig} />

          {/* Koeiro声色調整（Koeiro選択時のみ表示・現在は利用不可） */}
          {ttsConfig.provider === "koeiro" && (
            <div className="my-40">
              <div className="my-16 typography-20 font-bold">声の調整（Koeiro）</div>
              <div className="mt-16">プリセット</div>
              <div className="my-8 grid grid-cols-2 gap-[8px]">
                <TextButton onClick={() => onChangeKoeiroParam(PRESET_A.speakerX, PRESET_A.speakerY)}>かわいい</TextButton>
                <TextButton onClick={() => onChangeKoeiroParam(PRESET_B.speakerX, PRESET_B.speakerY)}>元気</TextButton>
                <TextButton onClick={() => onChangeKoeiroParam(PRESET_C.speakerX, PRESET_C.speakerY)}>かっこいい</TextButton>
                <TextButton onClick={() => onChangeKoeiroParam(PRESET_D.speakerX, PRESET_D.speakerY)}>渋い</TextButton>
              </div>
              <div className="my-24">
                <div className="select-none">x : {koeiroParam.speakerX}</div>
                <input type="range" min={-3} max={3} step={0.001} value={koeiroParam.speakerX}
                  className="mt-8 mb-16 input-range"
                  onChange={(e) => onChangeKoeiroParam(Number(e.target.value), koeiroParam.speakerY)}
                />
                <div className="select-none">y : {koeiroParam.speakerY}</div>
                <input type="range" min={-3} max={3} step={0.001} value={koeiroParam.speakerY}
                  className="mt-8 mb-16 input-range"
                  onChange={(e) => onChangeKoeiroParam(koeiroParam.speakerX, Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* 会話履歴 */}
          {chatLog.length > 0 && (
            <div className="my-40">
              <div className="my-8 grid-cols-2">
                <div className="my-16 typography-20 font-bold">会話履歴</div>
                <TextButton onClick={onClickResetChatLog}>会話履歴リセット</TextButton>
              </div>
              <div className="my-8">
                {chatLog.map((value, index) => (
                  <div key={index} className="my-8 grid grid-flow-col grid-cols-[min-content_1fr] gap-x-fixed">
                    <div className="w-[64px] py-8">
                      {value.role === "assistant" ? "Character" : "You"}
                    </div>
                    <input
                      key={index}
                      className="bg-surface1 hover:bg-surface1-hover rounded-8 w-full px-16 py-8"
                      type="text"
                      value={value.content}
                      onChange={(e) => onChangeChatLog(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
