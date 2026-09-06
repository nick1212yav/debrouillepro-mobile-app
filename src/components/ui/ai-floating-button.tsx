import { Text, Pressable } from "react-native";
import { useState } from "react";
import { Sparkles } from "lucide-react-native";
import AIAssistant from "@/pages/home/_components/AIAssistant";

interface AIFloatingButtonProps {
  moduleContext: string;
  onNavigate?: (page: string) => void;
}

/**
 * Floating AI button that can be placed on any module page.
 * Renders an absolute-positioned button + full-screen assistant overlay.
 */
export default function AIFloatingButton({ moduleContext, onNavigate }: AIFloatingButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <Pressable
          onPress={() => setOpen(true)}
          className="absolute bottom-6 right-5 z-30 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }}
        >
          <Sparkles size={18} className="text-white" />
          <Text
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white"
            style={{  }}
          >
            AI
          </Text>
        </Pressable>
      )}

      <>
        {open && (
          <AIAssistant
            onClose={() => setOpen(false)}
            onNavigate={(page) => { onNavigate?.(page); setOpen(false); }}
            moduleContext={moduleContext}
          />
        )}
      </>
    </>
  );
}
