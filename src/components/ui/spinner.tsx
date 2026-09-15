import { SvgProps } from "react-native-svg";
import { Loader2Icon } from "lucide-react-native";
import { cn } from "@/lib/utils.ts";

function Spinner({ className, ...props }: SvgProps) {
  return (
    <Loader2Icon
      accessibilityRole="status"
      accessibilityLabel="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
