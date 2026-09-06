import { View, Image } from "react-native";
export function RestaurantStories() {
  const stories = [
    {
      title: "En Cuisine",
      avatar:
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100&q=80",
    },
    {
      title: "Arrivage Frais",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
    },
  ];

  return (
    <View className="px-4 py-3 flex gap-3.5 overflow-x-auto no-scrollbar">
      {stories.map((story, i) => (
        <View
          key={i}
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <View className="w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-orange-500 to-amber-400">
            <Image
             
             
              className="w-full h-full object-cover rounded-full border border-[#020617]"
             source={{ uri: story.avatar }} accessibilityLabel={story.title}/>
          </View>
          <Text className="text-[10px] text-white/60 font-medium">
            {story.title}
          </Text>
        </View>
      ))}
    </View>
  );
}
