// Using ImageSource from React Native
import { ImageSourcePropType } from "react-native";

// For video sources, we can use the type that react-native-video expects
// react-native-video expects a number (for require()) or an object with uri
type VideoSourceType = any; // fix later
//   | { uri: string } // For remote URLs
//   | number // For require() - this is actually correct!
//   | { uri?: string }; // For flexibilit;

export type AvatarId = "dr-al" | "dr-lora" | "lexi" | "bert";
export type AvatarName = "Dr. Al" | "Dr. Lora" | "Lexi" | "Bert";

type AvatarVideoSet = {
  start: VideoSourceType[];
  loop: VideoSourceType[];
  end: VideoSourceType[];
};

export type Avatar = {
  id: AvatarId;
  name: AvatarName;
  source: ImageSourcePropType; // React Native type
  listening: ImageSourcePropType; // React Native type
  video_default: AvatarVideoSet;
  video_listening: AvatarVideoSet;
  video_thinking: AvatarVideoSet;
  video_talking: VideoSourceType[];
};

export const avatars: Avatar[] = [
  {
    id: "dr-al",
    name: "Dr. Al",
    source: require("../assets/avatars/dr-al/profile.jpeg"),
    listening: require("../assets/avatars/dr-al/photos/listening.jpeg"),
    video_default: {
      start: [require("../assets/avatars/dr-al/default-start.m4v")],
      loop: [require("../assets/avatars/dr-al/default-loop.m4v")],
      end: [require("../assets/avatars/dr-al/default-end.m4v")],
    },
    video_listening: {
      start: [require("../assets/avatars/dr-al/listening-start.m4v")],
      loop: [require("../assets/avatars/dr-al/listening-loop.m4v")],
      end: [require("../assets/avatars/dr-al/listening-end.m4v")],
    },
    video_thinking: {
      start: [
        require("../assets/avatars/dr-al/thinking-start-1.m4v"),
        require("../assets/avatars/dr-al/thinking-start-2.m4v"),
      ],
      loop: [
        require("../assets/avatars/dr-al/thinking-loop-1.m4v"),
        require("../assets/avatars/dr-al/thinking-loop-2.m4v"),
      ],
      end: [
        require("../assets/avatars/dr-al/thinking-end-1.m4v"),
        require("../assets/avatars/dr-al/thinking-end-2.m4v"),
      ],
    },
    video_talking: [require("../assets/avatars/dr-al/talking.m4v")],
  },
  {
    id: "dr-lora",
    name: "Dr. Lora",
    source: require("../assets/avatars/dr-lora/profile.jpeg"),
    listening: require("../assets/avatars/dr-lora/photos/listening.jpeg"),
    video_default: {
      start: [require("../assets/avatars/dr-lora/default-start.m4v")],
      loop: [require("../assets/avatars/dr-lora/default-loop.m4v")],
      end: [require("../assets/avatars/dr-lora/default-end.m4v")],
    },
    video_listening: {
      start: [require("../assets/avatars/dr-lora/listening-start.mp4")],
      loop: [require("../assets/avatars/dr-lora/listening-loop.mp4")],
      end: [require("../assets/avatars/dr-lora/listening-end.m4v")],
    },
    video_thinking: {
      start: [
        require("../assets/avatars/dr-lora/thinking-start-1.m4v"),
        require("../assets/avatars/dr-lora/thinking-start-2.m4v"),
      ],
      loop: [
        require("../assets/avatars/dr-lora/thinking-loop-1.m4v"),
        require("../assets/avatars/dr-lora/thinking-loop-2.m4v"),
      ],
      end: [
        require("../assets/avatars/dr-lora/thinking-end-1.m4v"),
        require("../assets/avatars/dr-lora/thinking-end-2.m4v"),
      ],
    },
    video_talking: [
      require("../assets/avatars/dr-lora/talking-1.mp4"),
      require("../assets/avatars/dr-lora/talking-2.mp4"),
      require("../assets/avatars/dr-lora/talking-3.mp4"),
    ],
  },
  {
    id: "lexi",
    name: "Lexi",
    source: require("../assets/avatars/lexi/profile.jpeg"),
    listening: require("../assets/avatars/lexi/photos/listening.jpeg"),
    video_default: {
      start: [require("../assets/avatars/lexi/default-start.m4v")],
      loop: [require("../assets/avatars/lexi/default-loop.m4v")],
      end: [require("../assets/avatars/lexi/default-end.m4v")],
    },
    video_listening: {
      start: [require("../assets/avatars/lexi/listening-start.m4v")],
      loop: [require("../assets/avatars/lexi/listening-loop.m4v")],
      end: [require("../assets/avatars/lexi/listening-end.m4v")],
    },
    video_thinking: {
      start: [
        require("../assets/avatars/lexi/thinking-start-1.m4v"),
        require("../assets/avatars/lexi/thinking-start-2.m4v"),
      ],
      loop: [
        require("../assets/avatars/lexi/thinking-loop-1.m4v"),
        require("../assets/avatars/lexi/thinking-loop-2.m4v"),
      ],
      end: [
        require("../assets/avatars/lexi/thinking-end-1.m4v"),
        require("../assets/avatars/lexi/thinking-end-2.m4v"),
      ],
    },
    video_talking: [
      require("../assets/avatars/lexi/talking-1.mp4"),
      require("../assets/avatars/lexi/talking-2.mp4"),
    ],
  },
  {
    id: "bert",
    name: "Bert",
    source: require("../assets/avatars/bert/profile.jpeg"),
    listening: require("../assets/avatars/bert/photos/listening.jpeg"),
    video_default: {
      start: [], // Empty list as requested
      loop: [require("../assets/avatars/bert/default-loop.m4v")],
      end: [], // Empty list as requested
    },
    video_listening: {
      start: [require("../assets/avatars/bert/listening-start.m4v")],
      loop: [require("../assets/avatars/bert/listening-loop.mp4")],
      end: [require("../assets/avatars/bert/listening-end.m4v")],
    },
    video_thinking: {
      start: [require("../assets/avatars/bert/thinking-start.m4v")],
      loop: [require("../assets/avatars/bert/thinking-loop.m4v")],
      end: [require("../assets/avatars/bert/thinking-end.m4v")],
    },
    video_talking: [require("../assets/avatars/bert/talking.mp4")],
  },
];
