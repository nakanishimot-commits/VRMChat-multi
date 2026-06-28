import { useState } from "react";
import { Link } from "./link";

export const Introduction = () => {
  const [opened, setOpened] = useState(true);

  return opened ? (
    <div className="absolute z-40 w-full h-full px-24 py-40  bg-black/30 font-M_PLUS_2">
      <div className="mx-auto my-auto max-w-3xl max-h-full p-24 overflow-auto bg-white rounded-16">
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary ">
            このアプリケーションについて
          </div>
          <div>
            Webブラウザだけで3Dキャラクターとの会話を、マイクやテキスト入力、音声合成を用いて楽しめます。キャラクター（VRM）の変更や性格設定、音声調整もできます。
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            技術紹介
          </div>
          <div>
            3Dモデルの表示や操作には
            <Link
              url={"https://github.com/pixiv/three-vrm"}
              label={"@pixiv/three-vrm"}
            />
            、 会話文生成には Claude（Anthropic）/ OpenAI / OpenRouter
            のいずれかのAPIを選んで利用できます。 音声合成には
            <Link url={"http://koeiromap.rinna.jp/"} label={"Koeiro API"} />
            を使用しています。
          </div>
          <div className="my-16">
            このデモはGitHubでソースコードを公開しています。自由に変更や改変をお試しください！
            <br />
            ベースリポジトリ：
            <Link
              url={"https://github.com/zoan37/ChatVRM-jp"}
              label={"https://github.com/zoan37/ChatVRM-jp"}
            />
          </div>
        </div>

        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            利用上の注意
          </div>
          <div>
            差別的または暴力的な発言、特定の人物を貶めるような発言を、意図的に誘導しないでください。また、VRMモデルを使ってキャラクターを差し替える際はモデルの利用条件に従ってください。
          </div>
        </div>
        <div className="my-24">
          <div className="my-8 font-bold typography-20 text-secondary">
            APIキーの設定
          </div>
          <div>
            画面右上の「設定」メニューから、利用したいAIプロバイダー（Claude
            / OpenAI / OpenRouter）を選び、APIキーとモデルを設定してください。
            APIキーはブラウザ内にのみ保存され、外部には送信されません（各プロバイダーへの通信を除く）。
          </div>
        </div>
        <div className="my-24">
          <button
            onClick={() => {
              setOpened(false);
            }}
            className="font-bold bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white px-24 py-8 rounded-oval"
          >
            Start 始める
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
