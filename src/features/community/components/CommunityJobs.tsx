import { Pressable, View, Text, Image } from "react-native";
import { Briefcase, MapPin, Clock, Building, DollarSign } from "lucide-react-native";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  salary?: string;
  currency?: string;
  createdAt: number;
  logo?: string;
}

interface Props {
  jobs: Job[];
  onSelect: (jobId: string) => void;
}

export function CommunityJobs({ jobs, onSelect }: Props) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <Briefcase size={16} className="text-white/30" />
        <Text className="text-sm font-medium text-white/50">Offres d'emploi</Text>
      </View>
      <View className="space-y-2">
        {jobs.slice(0, 5).map((job) => (
          <Pressable
            key={job.id}
            onPress={() => onSelect(job.id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left bg-white/5 border border-white/5"
          >
            {job.logo ? (
              <Image
               
               
                className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
               source={{ uri: job.logo }} accessibilityLabel={job.company}/>
            ) : (
              <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-500/20">
                <Building size={16} className="text-purple-400" />
              </View>
            )}
            <View className="flex-1 min-w-0">
              <Text className="text-white/80 text-sm font-medium truncate">
                {job.title}
              </Text>
              <Text className="text-white/40 text-xs truncate">{job.company}</Text>
              <View className="flex items-center gap-2 text-white/30 text-[10px] mt-0.5">
                <View className="flex items-center gap-0.5">
                  <MapPin size={10} />
                  <Text>{job.location}</Text>
                </View>
                <Text>·</Text>
                <View className="flex items-center gap-0.5">
                  <Clock size={10} />
                  <Text>{job.contractType}</Text>
                </View>
                {job.salary && (
                  <>
                    <Text><Text>·</Text></Text>
                    <View className="flex items-center gap-0.5">
                      <DollarSign size={10} />
                      <Text>
                        {job.salary} {job.currency || "USD"}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
