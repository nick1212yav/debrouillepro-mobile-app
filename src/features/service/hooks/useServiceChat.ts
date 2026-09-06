import { useRouter } from "expo-router";

export function useServiceChat(userId?: string) {
  const router = useRouter();
  const openChat = () => {
    if (userId) {
      router.push(`/messages/new?userId=${userId}`);
    }
  };
  return { openChat };
}
