import { View, Text, Pressable } from "react-native";

// src/features/network/components/Company/CompanyEmployees.tsx
import { Users, UserPlus, MapPin, Mail } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/features/network/components/common/FollowButton";
import { ProfileAvatar } from "../Profile/ProfileAvatar";

interface Employee {
  _id: string;
  name: string;
  avatar?: string;
  title: string;
  department?: string;
  city?: string;
  isFollowing: boolean;
  isVerified: boolean;
}

interface CompanyEmployeesProps {
  employees?: Employee[];
  totalCount?: number;
  onViewAll?: () => void;
  onFollowToggle?: (userId: string) => void;
  onEmployeeClick?: (userId: string) => void;
  isLoading?: boolean;
  className?: string;
  maxDisplay?: number;
}

function EmployeeItem({
  employee,
  onFollowToggle,
  onClick,
}: {
  employee: Employee;
  onFollowToggle?: (userId: string) => void;
  onClick?: () => void;
}) {
  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-colors" onPress={onClick}>
      <ProfileAvatar
        name={employee.name}
        avatar={employee.avatar}
        size="md"
        verified={employee.isVerified}
      />
      <View className="flex-1 min-w-0"><View className="flex items-center gap-1.5"><Text className="text-white font-semibold text-sm truncate">{employee.name}</Text>{employee.isVerified && (
            <Text className="text-[10px] text-emerald-400">✓</Text>
          )}</View><Text className="text-white/40 text-xs truncate">{employee.title}</Text>{employee.department && (
          <Text className="text-white/30 text-[10px] truncate">{employee.department}</Text>
        )}{employee.city && (
          <View className="flex items-center gap-1 text-white/30 text-[10px]"><MapPin size={10} />{employee.city}</View>
        )}</View>
      <FollowButton
        userId={employee._id as any}
        isFollowing={employee.isFollowing}
        size="sm"
        onToggle={() => onFollowToggle?.(employee._id)}
      />
    </View>
  );
}

export function CompanyEmployees({
  employees = [],
  totalCount,
  onViewAll,
  onFollowToggle,
  onEmployeeClick,
  isLoading = false,
  className,
  maxDisplay = 5,
}: CompanyEmployeesProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-8 w-20 rounded-xl" /></View><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></View>
    );
  }

  const displayEmployees = employees.slice(0, maxDisplay);
  const hasMore = (totalCount ?? employees.length) > maxDisplay;
  const showViewAll = onViewAll && (hasMore || employees.length > 0);

  if (employees.length === 0) {
    return null;
  }

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400"><Users size={15} /></View><Text className="text-white font-bold text-sm">Employés</Text>{totalCount !== undefined && (
            <Text className="text-white/30 text-xs">({totalCount})</Text>
          )}</View>{showViewAll && (
          <Pressable onPress={onViewAll} className="text-xs text-indigo-400 transition-colors">
            Voir tous
          </Pressable>
        )}</View>

      <View className="space-y-2">
        {displayEmployees.map((employee) => (
          <EmployeeItem
            key={employee._id}
            employee={employee}
            onFollowToggle={onFollowToggle}
            onPress={() => onEmployeeClick?.(employee._id)}
          />
        ))}
      </View>

      {hasMore && !onViewAll && (
        <Text className="text-center text-white/30 text-xs mt-3">
          +{totalCount! - maxDisplay} autres employés
        </Text>
      )}
    </View>
  );
}
