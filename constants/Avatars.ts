// Using ImageSource from React Native
import { ImageSourcePropType } from "react-native";

// Or using Expo's Image type
// import { Image } from 'expo-image';

export type AvatarId = "dr-al" | "dr-lora" | "lexi" | "bert";
export type AvatarName = "Dr. Al" | "Dr. Lora" | "Lexi" | "Bert";

export type Avatar = {
  id: AvatarId;
  name: AvatarName;
  source: ImageSourcePropType; // React Native type
  listening: ImageSourcePropType; // React Native type
};

export const avatars: Avatar[] = [
  {
    id: "dr-al",
    name: "Dr. Al",
    source: require("../assets/avatars/dr-al/profile.jpeg"),
    listening: require("../assets/avatars/dr-al/photos/listening.jpeg"),
  },
  {
    id: "dr-lora",
    name: "Dr. Lora",
    source: require("../assets/avatars/dr-lora/profile.jpeg"),
    listening: require("../assets/avatars/dr-lora/photos/listening.jpeg"),
  },
  {
    id: "lexi",
    name: "Lexi",
    source: require("../assets/avatars/lexi/profile.jpeg"),
    listening: require("../assets/avatars/lexi/photos/listening.jpeg"),
  },
  {
    id: "bert",
    name: "Bert",
    source: require("../assets/avatars/bert/profile.jpeg"),
    listening: require("../assets/avatars/bert/photos/listening.jpeg"),
  },
];
