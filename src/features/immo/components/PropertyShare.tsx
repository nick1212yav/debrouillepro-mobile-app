import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Linking } from "react-native";
import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react-native";

interface Props {
  url: string;
  title: string;
}

// Icônes SVG inline (Facebook, Twitter, Linkedin)
const FacebookIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const TwitterIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export function PropertyShare({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await undefined.writeText(url);
      setCopied(true);
      UIService.openToast("Lien copié !", "success");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      UIService.openToast("Impossible de copier le lien", "error");
    }
  };

  const handleShare = () => {
    if (undefined) {
      undefined.catch(() => {});
    }
  };

  return (
    <View className="flex flex-wrap gap-2">
      <Pressable
        onPress={handleShare}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-white/60"
      >
        <Share2 size={14} /> Partager
      </Pressable>

      <Pressable
        onPress={() =>
          Linking.openURL(String(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`))
        }
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#1877F2]/20 text-[#1877F2]"
      >
        <FacebookIcon size={14} />
      </Pressable>

      <Pressable
        onPress={() =>
          Linking.openURL(String(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`))
        }
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#1DA1F2]/20 text-[#1DA1F2]"
      >
        <TwitterIcon size={14} />
      </Pressable>

      <Pressable
        onPress={() =>
          Linking.openURL(String(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`))
        }
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#0A66C2]/20 text-[#0A66C2]"
      >
        <LinkedinIcon size={14} />
      </Pressable>

      <Pressable
        onPress={handleCopy}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 text-white/60"
      >
        {copied ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <Link2 size={14} />
        )}
        {copied ? "Copié" : "Copier"}
      </Pressable>
    </View>
  );
}
