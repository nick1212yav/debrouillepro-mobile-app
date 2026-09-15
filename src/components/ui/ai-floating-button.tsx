import { Text, Pressable, View } from "react-native";
import { useState } from "react";
import { Sparkles } from "lucide-react-native";
import AIAssistant from "@/pages/home/_components/AIAssistant.tsx";

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
        <Pressable initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, type: "spring", stiffness: 300 }} onPress={() => setOpen(true)} className="absolute bottom-6 right-5 z-30 w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-transform" style={{ boxShadow: "0 6px 24px rgba(139,92,246,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }}>
          <Sparkles size={18} className="text-white" />
          <Text className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{  }}>
            AI
          </Text>
        </Pressable>
      )}

<View>
        {open && (
          <AIAssistant
            onClose={() => setOpen(false)}
            onNavigate={(page) => { onNavigate?.(page); setOpen(false); }}
            moduleContext={moduleContext}
          />
        )}
      </View>
    </>
  );
}
