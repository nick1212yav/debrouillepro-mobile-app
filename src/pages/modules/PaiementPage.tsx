import { View, Text, Pressable, TextInput } from "react-native";
import {
  ArrowLeft, Send, ArrowDownLeft, QrCode, Clock,
  Plus, X, Check, Eye, EyeOff, TrendingUp,
  TrendingDown, Shield, Copy, Phone, Search, Star, Wallet
} from "lucide-react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react-native";
import { Clipboard } from "@react-native-clipboard/clipboard";

// ─── Operators ───────────────────────────────────────────────────────────────
const OPERATORS = [
  { id: "orange", name: "Orange Money", shortName: "Orange", color: "#FF6200", bg: "rgba(255,98,0,0.15)", logo: "🟠" },
  { id: "mtn",    name: "MTN MoMo",     shortName: "MTN",    color: "#FFCC00", bg: "rgba(255,204,0,0.15)", logo: "🟡" },
  { id: "airtel", name: "Airtel Money", shortName: "Airtel", color: "#EF4444", bg: "rgba(239,68,68,0.15)", logo: "🔴" },
  { id: "wave",   name: "Wave",         shortName: "Wave",   color: "#3B82F6", bg: "rgba(59,130,246,0.15)", logo: "🔵" },
];

type TxType = "envoi" | "reception" | "recharge" | "paiement";

const FILTER_LABELS: { key: TxType | "all"; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "reception", label: "Reçus" },
  { key: "envoi", label: "Envois" },
  { key: "recharge", label: "Recharges" },
  { key: "paiement", label: "Paiements" },
];

function formatFCFA(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000000) return `${(abs / 1000000).toFixed(1)}M FCFA`;
  if (abs >= 1000) return `${(abs / 1000).toFixed(0)}k FCFA`;
  return `${abs.toLocaleString()} FCFA`;
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  const w = 200, h = 40;
  if (data.length < 2) return <svg width="100%" viewBox={`0 0 ${w} ${h}`} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="opacity-60">
      <polyline fill="none" stroke="#10B981" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

// ─── Receive Modal ────────────────────────────────────────────────────────────
function ReceiveModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const phone = "+225 07 88 21 34";
  const copy = () => {
    Clipboard.setString(phone).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-sm rounded-t-3xl p-5" style={{ backgroundColor: "#0d1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between mb-5"><Text className="text-base font-bold text-white">Recevoir un paiement</Text><Pressable onPress={onClose} className=""><X size={18} className="text-white/60" /></Pressable></View>
        <View className="flex justify-center mb-4"><View className="p-4 rounded-2xl" style={{ backgroundColor: "white" }}><View className="w-40 h-40 gap-0.5">{Array.from({ length: 100 }).map((_, i) => {
                const isCorner = [0,1,10,11,8,9,18,19,80,81,90,91,88,89,98,99].includes(i);
                const isFill = (i % 7 === 0 || i % 11 === 3 || (i > 30 && i < 70 && i % 5 === 2));
                return <View key={i} className="rounded-sm" style={{ backgroundColor: isCorner || isFill ? "#000" : "transparent", aspectRatio: "1" }} />;
              })}</View></View></View>
        <View className="flex items-center justify-center gap-2 mb-5"><Phone size={14} className="text-green-400" /><Text className="text-base font-bold text-white">{phone}</Text><Pressable onPress={copy} className="">{copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-white/40" />}</Pressable></View>
        <View className="flex gap-2">{OPERATORS.map(op => (
            <View key={op.id} className="flex-1 py-2 rounded-xl text-[10px] font-semibold text-center" style={{ backgroundColor: op.bg }}>{op.logo}{op.shortName}</View>
          ))}</View>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function PaiementInner({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<TxType | "all">("all");
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [sendAmt, setSendAmt] = useState("");
  const [sendDesc, setSendDesc] = useState("");
  const [selectedOp, setSelectedOp] = useState("orange");

  const walletData = useQuery(api.finances.getWalletBalance, {});
  const transactions = useQuery(api.finances.getWalletTransactions, { limit: 30 }) ?? [];
  const addTx = useMutation(api.finances.addWalletTransaction);

  const balance = walletData?.balance ?? 0;
  const monthIn = walletData?.monthIn ?? 0;
  const monthOut = walletData?.monthOut ?? 0;

  // Map wallet transactions to mobile money style
  const enrichedTxs = transactions.map(tx => ({
    ...tx,
    txType: (tx.type === "deposit" || tx.type === "reward" || tx.type === "refund" ? "reception" : tx.type === "withdrawal" ? "retrait" : tx.type === "payment" ? "paiement" : "envoi") as TxType,
    isIn: tx.type === "deposit" || tx.type === "reward" || tx.type === "refund",
  }));

  const filtered = filter === "all" ? enrichedTxs : enrichedTxs.filter(tx => tx.txType === filter);
  const sparkData = transactions.slice(0, 30).map(tx => tx.amount).reverse();

  async function handleSend() {
    if (!sendAmt || parseFloat(sendAmt) <= 0) return;
    try {
      await addTx({ type: "transfer", amount: parseFloat(sendAmt), currency: "XAF", description: sendDesc || `Envoi ${OPERATORS.find(o => o.id === selectedOp)?.name}` });
      setShowSend(false);
      setSendAmt("");
      setSendDesc("");
      toast.success("Transfert envoyé !");
    } catch {
      toast.error("Erreur lors du transfert");
    }
  }

  async function handleTopup(opId: string) {
    const op = OPERATORS.find(o => o.id === opId);
    try {
      await addTx({ type: "deposit", amount: 10000, currency: "XAF", description: `Recharge ${op?.name}` });
      setShowTopup(false);
      toast.success("Compte rechargé !");
    } catch {
      toast.error("Erreur");
    }
  }

  return (
    <View className="h-full flex flex-col" style={{  }}><View initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-5 pb-4 flex-shrink-0"><View className="flex items-center gap-3 mb-5"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-xl font-bold text-white">Mobile Money Pro</Text><Text className="text-xs" style={{ color: "#10B981" }}>Orange · MTN · Airtel · Wave</Text></View><View className="ml-auto flex gap-2"><Pressable onPress={() => setBalanceVisible(v => !v)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>{balanceVisible ? <Eye size={14} className="text-white/60" /> : <EyeOff size={14} className="text-white/60" />}</Pressable><Pressable onPress={() => setShowReceive(true)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,0.15)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }}><QrCode size={14} style={{  }} /></Pressable></View></View>{}<View initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="rounded-3xl p-5 mb-3 overflow-hidden relative" style={{ borderWidth: 1, borderColor: "rgba(16,185,129,0.25)", borderStyle: "solid" }}><View className="flex items-start justify-between mb-1"><View><Text className="text-xs text-green-300/60 mb-1">Solde Débrouille Pay</Text><Text key={balanceVisible ? "show" : "hide"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl font-black text-white">{balanceVisible ? <>{formatFCFA(balance)}</> : <Text className="tracking-widest">••••••</Text>}</Text></View><View className="text-right"><Text className="text-[10px] text-white/40 mb-1">Activité</Text><View className="h-8 w-20"><Sparkline data={sparkData.length > 0 ? sparkData : [0, 0]} /></View></View></View><View className="flex gap-2 mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" }}><View className="flex-1 flex items-center gap-1.5"><View className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(16,185,129,0.2)" }}><TrendingUp size={12} style={{  }} /></View><View><Text className="text-[9px] text-white/40">Reçu</Text><Text className="text-xs font-bold text-green-400">{formatFCFA(monthIn)}</Text></View></View><View className="w-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} /><View className="flex-1 flex items-center gap-1.5"><View className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.2)" }}><TrendingDown size={12} style={{  }} /></View><View><Text className="text-[9px] text-white/40">Dépensé</Text><Text className="text-xs font-bold text-red-400">{formatFCFA(monthOut)}</Text></View></View></View><View className="flex gap-2 mt-3">{[
              { icon: Send, label: "Envoyer", action: () => setShowSend(true), color: "#10B981" },
              { icon: ArrowDownLeft, label: "Recevoir", action: () => setShowReceive(true), color: "#3B82F6" },
              { icon: RefreshCw, label: "Recharger", action: () => setShowTopup(true), color: "#8B5CF6" },
            ].map(({ icon: Icon, label, action, color }) => (
              <Pressable key={label} onPress={action} className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl active:scale-95 transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><Icon size={16} style={{ color }} /><Text className="text-[10px] text-white/70 font-medium">{label}</Text></Pressable>
            ))}</View></View>{}<View className="flex gap-2">{OPERATORS.map((op, i) => (
            <Pressable key={op.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }} className="flex-1 py-2 rounded-xl text-[10px] font-semibold active:scale-95 transition-transform" style={{ backgroundColor: op.bg, borderStyle: "solid" }}>
              {op.logo} {op.shortName}
            </Pressable>
          ))}</View></View>{}<View className="flex-1 overflow-y-auto px-5 pb-6" style={{  }}><View className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{  }}>{FILTER_LABELS.map(({ key, label }) => (
            <Pressable key={key} onPress={() => setFilter(key)} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all" style={{ backgroundColor: filter === key ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)", borderColor: "rgba(16,185,129,0.4)", borderStyle: "solid" }}>{label}</Pressable>
          ))}</View><View className="flex items-center justify-between mb-3"><Text className="text-xs font-semibold text-white/40 uppercase tracking-wider">{filtered.length}transaction{filtered.length > 1 ? "s" : ""}</Text><View className="flex items-center gap-1"><Shield size={10} className="text-green-400" /><Text className="text-[10px] text-green-400">Sécurisé</Text></View></View>{filtered.length === 0 && (
          <View className="flex flex-col items-center justify-center py-12 gap-3"><Wallet size={40} color="#6B7280" /><Text className="text-gray-400 text-sm">Aucune transaction</Text></View>
        )}<View className="flex flex-col gap-2"><View>{filtered.map((tx, i) => {
              const op = OPERATORS[i % OPERATORS.length];
              return (
                <View key={tx._id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}>
                  <View className="relative"><View className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: op.bg }}>{op.logo}</View></View>
                  <View className="flex-1 min-w-0"><Text className="text-sm font-semibold text-white truncate">{tx.description}</Text><View className="flex items-center gap-1.5 mt-0.5"><Text className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}>{tx.type}</Text><Clock size={9} className="text-white/25" /><Text className="text-[10px] text-white/35 truncate">{tx.completedAt ? new Date(tx.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—"}</Text></View></View>
                  <View className="text-right flex-shrink-0"><Text className="text-sm font-black" style={{ color: tx.isIn ? "#10B981" : "#EF4444" }}>{tx.isIn ? "+" : "-"}{formatFCFA(tx.amount)}</Text></View>
                </View>
              );
            })}</View></View></View>{}<View>{showSend && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-sm rounded-t-3xl p-5" style={{ backgroundColor: "#0d1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <View className="flex items-center justify-between mb-5"><Text className="text-base font-bold text-white">Envoyer de l'argent</Text><Pressable onPress={() => setShowSend(false)} className=""><X size={18} className="text-white/60" /></Pressable></View>
              <View className="space-y-3 mb-4"><View className="text-center mb-4"><TextInput value={sendAmt} onChangeText={value => setSendAmt(value)} placeholder="0" className="bg-transparent text-5xl font-black text-white text-center w-40 outline-none" inputMode="numeric" keyboardType="numeric" /><Text className="text-white/40 text-sm">FCFA</Text></View><View className="flex gap-2 flex-wrap mb-3">{[1000, 2000, 5000, 10000].map(v => (
                    <Pressable key={v} onPress={() => setSendAmt(String(v))} className="flex-1 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: sendAmt === String(v) ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.07)", borderColor: "rgba(16,185,129,0.4)", borderStyle: "solid" }}>{formatFCFA(v)}</Pressable>
                  ))}</View><TextInput value={sendDesc} onChangeText={value => setSendDesc(value)} placeholder="Description (optionnel)…" className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", outline: "none" }} /><Text className="text-xs text-white/40">Opérateur</Text><View className="flex gap-2">{OPERATORS.map(op => (
                    <Pressable key={op.id} onPress={() => setSelectedOp(op.id)} className="flex-1 py-2 rounded-xl text-[10px] font-semibold" style={{ backgroundColor: selectedOp === op.id ? op.bg : "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                      {op.logo} {op.shortName}
                    </Pressable>
                  ))}</View></View>
              <Pressable onPress={handleSend} disabled={!sendAmt || parseFloat(sendAmt) <= 0} className="w-full py-3.5 rounded-2xl font-bold text-sm disabled:opacity-40" style={{ backgroundColor: "#10B981" }}>
                Envoyer
              </Pressable>
            </View>
          </View>
        )}{showReceive && <ReceiveModal onClose={() => setShowReceive(false)} />}{showTopup && (
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-sm rounded-t-3xl p-5" style={{ backgroundColor: "#0d1117", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <View className="flex items-center justify-between mb-5">
                <Text className="text-base font-bold text-white">Recharger le solde</Text>
                <Pressable onPress={() => setShowTopup(false)} className=""><X size={18} className="text-white/60" /></Pressable>
              </View>
              <View className="flex flex-col gap-2">
                {OPERATORS.map(op => (
                  <Pressable key={op.id} onPress={() => handleTopup(op.id)} className="flex items-center gap-3 p-3.5 rounded-2xl active:scale-[0.98] transition-transform" style={{ backgroundColor: op.bg, borderStyle: "solid" }}>
                    <Text className="text-2xl">{op.logo}</Text>
                    <View className="flex-1 text-left">
                      <Text className="text-sm font-bold" style={{ color: op.color }}>{op.name}</Text>
                      <Text className="text-xs text-white/40">Recharge instantanée (+10,000 FCFA)</Text>
                    </View>
                    <Star size={14} style={{  }} />
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}</View></View>
  );
}

export default function PaiementPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <AuthLoading>
        <View className="h-full flex flex-col p-5 gap-4" style={{  }}>
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </View>
      </AuthLoading>
      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center gap-4 relative" style={{  }}>
          <Pressable onPress={onBack} className="absolute top-14 left-5 p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={18} color="white" />
          </Pressable>
          <Wallet size={48} color="#6B7280" />
          <Text className="text-gray-400">Connectez-vous pour accéder aux paiements</Text>
        </View>
      </Unauthenticated>
      <Authenticated>
        <PaiementInner onBack={onBack} />
      </Authenticated>
    </>
  );
}
