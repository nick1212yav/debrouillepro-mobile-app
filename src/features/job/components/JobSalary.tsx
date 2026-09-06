import { Text, View } from "react-native";

interface Props {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
}

export function JobSalary({ salaryMin, salaryMax, currency }: Props) {
  if (!salaryMin && !salaryMax) return null;

  // ✅ Formatage correct pour éviter les erreurs de concaténation
  const formattedMin = salaryMin ? salaryMin.toLocaleString() : "";
  const formattedMax = salaryMax ? salaryMax.toLocaleString() : "";

  return (
    <View className="mt-2">
      <Text className="text-lg font-black text-white">
        {formattedMin}
        {salaryMin && salaryMax ? ` – ${formattedMax}` : ""}
        {currency ? ` ${currency}` : ""}
        {salaryMin || salaryMax ? "/mois" : ""}
      </Text>
    </View>
  );
}
