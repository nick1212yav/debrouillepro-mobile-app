import { Pressable } from "react-native";
import { Loader2, ShieldCheck } from "lucide-react-native";

interface SubmitBtnProps extends React.ButtonHTMLAttributes<Pressable> {
  isSubmitting: boolean;
  label: string;
  loadingLabel?: string;
  icon?: React.ComponentType<any>;
}

export function SubmitBtn({
  isSubmitting,
  label,
  loadingLabel = "Enregistrement en cours...",
  icon: Icon = ShieldCheck,
  className = "",
  ...props
}: SubmitBtnProps) {
  return (
    <Pressable disabled={isSubmitting || props.disabled} className={`w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 disabled:text-white/20 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-orange-500/10 ${className}`} {...props}>
      {isSubmitting ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          <Icon size={14} />
          {label}
        </>
      )}
    </Pressable>
  );
}
