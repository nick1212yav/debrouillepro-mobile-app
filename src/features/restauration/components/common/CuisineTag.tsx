import { Text } from "react-native";

interface CuisineTagProps {
  cuisine: string;
}

export function CuisineTag({ cuisine }: CuisineTagProps) {
  return (
    <Text className="inline-flex items-center text-[10px] font-bold text-orange-400">
      {cuisine}
    </Text>
  );
}
