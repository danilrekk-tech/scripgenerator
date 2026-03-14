import { useState, useCallback } from "react";
import { toast } from "sonner";
import ConfigSidebar, { type ScriptConfig } from "@/components/ConfigSidebar";
import ScriptOutput from "@/components/ScriptOutput";
import Armory from "@/components/Armory";
import { streamScript } from "@/lib/streamChat";

const defaultConfig: ScriptConfig = {
  managerName: "",
  clientName: "",
  service: "SEO-продвижение",
  situation: "Холодный звонок",
  tone: "Уверенный эксперт",
  context: "",
};

export default function Index() {
  const [config, setConfig] = useState<ScriptConfig>(defaultConfig);
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(
    (overrideContext?: string) => {
      if (isGenerating) return;
      setIsGenerating(true);
      setScript("");

      const payload = {
        ...config,
        context: overrideContext || config.context,
      };

      streamScript({
        config: payload,
        onDelta: (chunk) => setScript((prev) => prev + chunk),
        onDone: () => setIsGenerating(false),
        onError: (msg) => {
          toast.error(msg);
          setIsGenerating(false);
        },
      });
    },
    [config, isGenerating]
  );

  const handleArmorySelect = useCallback(
    (prompt: string) => {
      generate(prompt);
    },
    [generate]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ConfigSidebar
        config={config}
        onChange={setConfig}
        onGenerate={() => generate()}
        isGenerating={isGenerating}
      />
      <ScriptOutput script={script} isGenerating={isGenerating} />
      <Armory onSelect={handleArmorySelect} isGenerating={isGenerating} />
    </div>
  );
}
