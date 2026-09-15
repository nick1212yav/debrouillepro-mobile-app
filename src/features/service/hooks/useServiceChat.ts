import { useNavigate } from "react-router-dom";

export function useServiceChat(userId?: string) {
  const navigate = useNavigate();
  const openChat = () => {
    if (userId) {
      navigate(`/messages/new?userId=${userId}`);
    }
  };
  return { openChat };
}
