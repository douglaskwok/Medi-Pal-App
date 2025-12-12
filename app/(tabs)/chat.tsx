import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  Keyboard,
} from "react-native";
import {
  Video,
  AVPlaybackStatus,
  VideoFullscreenUpdate,
  ResizeMode,
} from "expo-av";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import Fontisto from "@expo/vector-icons/Fontisto";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { CustomTabBar } from "./_layout";
import { supabase } from "../../lib/supabase";
import OpenAI from "openai";
import { format } from "date-fns";
import { Dimensions } from "react-native";
import SelectionModal from "../../components/selectionModal";
import AreYouSurePopup from "../../components/AreYouSurePopup";
import { AISuggestion } from "../../components/AISuggestion";
import { Avatar, avatars } from "../../constants/Avatars";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Speech from "expo-speech";
import { useLanguage } from "../../constants/LanguageContext";

// bug: NEED SUPABASE TO STORE GENERATED POPUPS TOO!! --> already addressed.

const { width, height } = Dimensions.get("window");
const isTablet = width - 80 > height * 0.5;

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
}

interface ChatSession {
  id: string;
  session_type: "text" | "voice";
  created_at: string;
  updated_at: string;
  title?: string;
  last_message_preview?: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance: string;
  phone: string;
  email: string;
  hours: string;
  description: string;
}
interface SoundWaveIconProps {
  isActive: boolean;
  size?: number;
  color?: string;
}

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

type ChatView = "session-select" | "text-chat" | "avatar-chat";

const translations = {
  en: {
    aiAssistant: "AI Assistant",
    startNewSession: "Start a new session",
    resumePreviousSession: "Resume Previous Session",
    liveConversation: "Live Conversation",
    newChat: "New Chat",
    selectAvatar: "Select Avatar",
    textChat: "Text Chat",
    avatarChat: "Avatar Call",
    welcomeMessage:
      "Hello! I'm your Medi-Pal AI assistant, Dr. Al. I specialize in helping residents find Medi-Cal resources. How can I help you with your healthcare needs today?",
    askPlaceholder: "Ask me anything about resources...",
    connected: "Connected",
    live: "Live",
    holdToTalk: "Hold to Talk",
    listening: "Listening...",
    processing: "Processing...",
    speakerOn: "Speaker On",
    speakerOff: "Speaker Off",
    endCall: "End Call",
    startSpeaking: "Start speaking to begin conversation",
  },
  es: {
    aiAssistant: "Asistente IA",
    startNewSession: "Comenzar una nueva sesión",
    resumePreviousSession: "Reanudar Sesión Anterior",
    liveConversation: "Conversación en Vivo",
    newChat: "Nuevo Chat",
    selectAvatar: "Seleccionar Avatar",
    textChat: "Chat de Texto",
    avatarChat: "Llamada Avatar",
    welcomeMessage:
      "¡Hola! Soy tu asistente IA de Medi-Pal, el Dr. Al. Me especializo en ayudar a residentes a encontrar recursos de Medi-Cal. ¿Cómo puedo ayudarte con tus necesidades de salud hoy?",
    askPlaceholder: "Pregúntame cualquier cosa sobre recursos...",
    connected: "Conectado",
    live: "En Vivo",
    holdToTalk: "Mantén el Mic",
    listening: "Escuchando...",
    processing: "Procesando...",
    speakerOn: "Altavoz Encendido",
    speakerOff: "Altavoz Apagado",
    endCall: "Terminar Llamada",
    startSpeaking: "Empieza a hablar para comenzar la conversación",
  },
};

// Hardcoded transition durations (seconds:frames converted to milliseconds)
const TRANSITION_DURATIONS = {
  "dr-al": {
    start: 2000, // 2:00 = 2 seconds
    end: 1600, // 1:18 = ~1.6 seconds
  },
  "dr-lora": {
    start: 4567, // 4:17 = ~4.567 seconds
    end: 2000, // 2:00 = 2 seconds
  },
  lexi: {
    start: 3633, // 3:19 = ~3.633 seconds
    end: 1400, // 1:12 = ~1.4 seconds
  },
  bert: {
    start: 3333, // 3:10 = ~3.333 seconds
    end: 2500, // 2:15 = ~2.5 seconds
  },
};

const DEFAULT_RESOURCES: Resource[] = [
  {
    id: "ymca_palo_alto",
    name: "Palo Alto Family YMCA",
    type: "Gym",
    address: "3412 Ross Road, Palo Alto, CA 94303",
    latitude: 37.4419,
    longitude: -122.143,
    rating: 4.5,
    distance: "2.3 mi",
    phone: "650-856-9622",
    email: "info@ymcasv.org",
    hours: "Mon–Fri: 6am–9pm\nSat: 8am–4pm\nSun: 9am–4pm",
    description:
      "A community gym offering classes, pool access, and fitness equipment.",
  },
  {
    id: "clinic_mountain_view",
    name: "Community Health Clinic",
    type: "Healthcare",
    address: "789 Oak Avenue, Mountain View, CA 94041",
    latitude: 37.3861,
    longitude: -122.0839,
    rating: 4.2,
    distance: "4.0 mi",
    phone: "650-555-1032",
    email: "support@chclinic.org",
    hours: "Mon–Fri: 8am–6pm\nSat: 9am–1pm\nSun: Closed",
    description:
      "Clinic offering free health screenings, vaccinations, and wellness checkups.",
  },
];
// const { width, height } = Dimensions.get("window");
export default function ChatScreen() {
  const { language } = useLanguage();
  const t =
    translations[language as keyof typeof translations] || translations.en;

  const VOICE_CONFIGS = {
    "dr-al":
      language === "en"
        ? {
            language: "en-GB",
            pitch: Platform.OS === "ios" ? 1.0 : 0.0,
            rate: 1.0,
            ...(Platform.OS === "android" && {
              voice: "en-gb-x-gbb-local",
              pitch: 0,
            }),
          }
        : {
            language: Platform.OS === "android" ? "es-MX" : "es-US",
            pitch: 0.0,
            rate: 0.9,
            ...(Platform.OS === "android" && { voice: "es-es-x-eem-local" }),
          },
    "dr-lora":
      language === "en"
        ? { language: "en-ZA", pitch: 0.8, rate: 1.0 }
        : { language: "es-MX", pitch: 1.0, rate: 1.0 },
    lexi:
      language === "en"
        ? { language: "en-AU", pitch: 1, rate: 1.1 }
        : { language: "es-ES", pitch: 1.2, rate: 1.0 },
    bert:
      language === "en"
        ? {
            language: "en-GB",
            pitch: Platform.OS === "ios" ? 2.0 : 0.0,
            rate: 1.1,
            ...(Platform.OS === "android" && { voice: "en-gb-x-gbb-local" }),
          }
        : {
            language: Platform.OS === "android" ? "es-ES" : "es-US",
            pitch: Platform.OS === "android" ? 0.5 : 0.2,
            rate: 1.0,
            ...(Platform.OS === "android" && { voice: "es-us-x-esm-local" }),
          },
  };
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // State
  const [currentView, setCurrentView] = useState<ChatView>("session-select");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [aiResources, setAIResources] = useState<string | null>(null);
  const [shownResources, setShownResources] = useState<Resource[] | null>(null);
  const [showAIResources, setShowAIResources] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [chooseAvatarModal, setChooseAvatarModal] = useState(false);
  const [avatar, setAvatar] = useState<"dr-al" | "dr-lora" | "lexi" | "bert">(
    "dr-al"
  );
  // Add these states near your other state declarations
  const [dummyMessagesIndex, setDummyMessagesIndex] = useState(0);
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isKeyboardEverShown, setIsKeyboardEverShown] = useState(false);
  // just to make sure height of input is correct on android.
  useEffect(() => {
    setIsKeyboardEverShown(true);
  }, [isKeyboardVisible]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  // Video State
  const [videoMode, setVideoMode] = useState<
    "default" | "listening" | "transition" | "talking"
  >("default");
  const [currentTransition, setCurrentTransition] = useState<
    "start" | "end" | null
  >(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  // const listeningVideoRef = useRef<Video>(null);
  // const transitionVideoRef = useRef<Video>(null);
  const defaultVideoRef = useRef<Video>(null);
  const talkingVideoRef = useRef<Video>(null);
  const listeningVideoRef = useRef<Video>(null);
  const transitionVideoRef = useRef<Video>(null);
  // Add state to track which video is currently visible
  const [activeVideo, setActiveVideo] = useState<
    "default" | "talking" | "listening" | "transition"
  >("default");

  //   // Audio:
  //   const [isAudioRecording, setIsAudioRecording] = useState(false);
  // const [transcription, setTranscription] = useState("");
  // const [hasSpeechPermission, setHasSpeechPermission] = useState(false);

  const getAvatarById = (id: "dr-al" | "dr-lora" | "lexi" | "bert"): Avatar => {
    const avatar = avatars.find((avatar) => avatar.id === id);
    if (!avatar) {
      throw new Error(`Avatar with id "${id}" not found`);
    }
    return avatar;
  };

  const parseResources = (resources: string): Resource[] => {
    try {
      const parsed = JSON.parse(resources);
      if (!Array.isArray(parsed)) {
        console.warn("Parsed JSON is not an array. Using fallback defaults.");
        return DEFAULT_RESOURCES;
      }
      return parsed;
    } catch (error) {
      console.warn("Failed to parse resources JSON:", error);
      return DEFAULT_RESOURCES;
    }
  };

  // Replace the dummy messages array with a function that returns messages based on index
  // Update the generateDummyMessages function with proper typing:
  // Also update the generateDummyMessages function to use the current avatar
  const generateDummyMessages = (): Message[] => {
    const now = new Date();
    const avatarName = getAvatarById(avatar).name;

    let messages;
    if (language === "es") {
      messages = [
        `¡Hola! Soy ${avatarName}, tu asistente de salud con IA. ¿Cómo puedo ayudarte hoy?`,
        "Hola, un par de mis familiares recientemente han sufrido enfermedades cardíacas, y estoy muy preocupado de que esto me pueda pasar a mí. ¿Qué debo hacer?",
        "Esa es una preocupación muy sabia y proactiva. El historial familiar es un factor de riesgo importante. Entiendo que estás en Medi-Cal, ¿te gustaría que cree una lista de tareas para ti?",
        "Claro",
        "Vale. Primero, haz un análisis de laboratorio gratuito para verificar cualquier riesgo de enfermedad cardíaca. También es importante hacer algo de ejercicio, y puedes caminar en una de las caminadoras en tu YMCA cercana todos los domingos por la tarde.",
      ];
    } else {
      messages = [
        `Hello! I'm ${avatarName}, your AI healthcare assistant. How may I help you today?`,
        "Hi, a couple of my relatives have recently suffered from heart diseases, and I'm really worried that this might happen to me. What should I do?",
        "That's a very wise and proactive concern. Family history is an important risk factor. I understand that you are on Medi-Cal, would you like me to create a to-do list for you?",
        "Sure",
        "Ok. First, get a free lab test to check for any risks of heart disease. It's also important to get some exercise, and you can go for a walk at one of the treadmills in your nearby YMCA every Sunday afternoon.",
      ];
    }

    return [
      {
        id: "1",
        content: messages[0],
        role: "assistant" as const,
        timestamp: new Date(now.getTime() - 300000),
      },
      {
        id: "2",
        content: messages[1],
        role: "user" as const,
        timestamp: new Date(now.getTime() - 240000),
      },
      {
        id: "3",
        content: messages[2],
        role: "assistant" as const,
        timestamp: new Date(now.getTime() - 180000),
      },
      {
        id: "4",
        content: messages[3],
        role: "user" as const,
        timestamp: new Date(now.getTime() - 120000),
      },
      {
        id: "5",
        content: messages[4],
        role: "assistant" as const,
        timestamp: new Date(now.getTime() - 60000),
      },
    ];
  };
  useEffect(() => {
    if (currentView === "text-chat") {
      // Reset input-related states when entering text chat
      setInputText("");
      setIsLoading(false);
      // Ensure keyboard state is fresh
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    }
  }, [currentView]);
  // Initial effect
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    loadSessions();
  }, []);
  useEffect(() => {
    if (currentView === "avatar-chat" && messages.length > 0) {
      // Update the first message (greeting) with new avatar name
      const updatedMessages = [...messages];

      // Update only the first assistant message (greeting)
      if (updatedMessages[0] && updatedMessages[0].role === "assistant") {
        const avatarName = getAvatarById(avatar).name;
        const greeting =
          language === "es"
            ? `¡Hola! Soy ${avatarName}, tu asistente de salud con IA. ¿Cómo puedo ayudarte hoy?`
            : `Hello! I'm ${avatarName}, your AI healthcare assistant. How may I help you today?`;

        updatedMessages[0] = {
          ...updatedMessages[0],
          content: greeting,
        };
      }

      // Update any other assistant messages that reference the avatar
      updatedMessages.forEach((msg, index) => {
        if (msg.role === "assistant" && index > 0) {
          // You might want to update other messages that reference the avatar name
          // For now, we're only updating the greeting
        }
      });

      setMessages(updatedMessages);
    }
  }, [avatar, currentView]);

  useEffect(() => {
    if (currentView === "avatar-chat" && isVideoReady) {
      updateVideoBasedOnConversation();
    }
  }, [dummyMessagesIndex, avatar, currentView, isVideoReady]);

  // // Tips modal effect
  // useEffect(() => {
  //   if (currentView === "avatar-chat") {
  //     const timer = setTimeout(() => {
  //       setShowTipsModal(true);
  //     }, 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [currentView]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      }
    );

    // Cleanup listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height); // This is the keyboard height
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  // Video preloading and management
  // Update the preload function
  const preloadVideos = async () => {
    if (currentView !== "avatar-chat") return;

    try {
      const avatarData = getAvatarById(avatar);
      setIsVideoReady(false);

      // Get video sources
      const defaultVideoSource = avatarData.video_default.loop[0];
      const talkingVideoSource =
        avatarData.video_talking?.[0] || defaultVideoSource;
      const listeningVideoSource = avatarData.video_listening.loop[0];

      console.log("Preloading all videos...");

      // Preload all three videos simultaneously
      const loadPromises = [];

      // Load default video
      if (defaultVideoRef.current) {
        loadPromises.push(
          defaultVideoRef.current.loadAsync(
            defaultVideoSource,
            { shouldPlay: false, isLooping: true },
            false
          )
        );
      }

      // Load talking video
      if (talkingVideoRef.current && avatarData.video_talking) {
        loadPromises.push(
          talkingVideoRef.current.loadAsync(
            talkingVideoSource,
            { shouldPlay: false, isLooping: true },
            false
          )
        );
      }

      // Load listening video
      if (listeningVideoRef.current) {
        loadPromises.push(
          listeningVideoRef.current.loadAsync(
            listeningVideoSource,
            { shouldPlay: false, isLooping: true },
            false
          )
        );
      }

      // Wait for all videos to load
      await Promise.all(loadPromises);

      // Start with appropriate video based on conversation state
      const initialVideoType = shouldShowTalkingVideo() ? "talking" : "default";

      if (initialVideoType === "talking" && talkingVideoRef.current) {
        await talkingVideoRef.current.playAsync();
        setActiveVideo("talking");
      } else if (defaultVideoRef.current) {
        await defaultVideoRef.current.playAsync();
        setActiveVideo("default");
      }

      setVideoMode(initialVideoType === "talking" ? "talking" : "default");
      setIsVideoReady(true);
      console.log("All videos preloaded and ready");
    } catch (error) {
      console.error("Error preloading videos:", error);
    }
  };

  // Update the cleanup function
  useEffect(() => {
    preloadVideos();

    return () => {
      const cleanup = async () => {
        const unloadPromises = [];
        if (defaultVideoRef.current)
          unloadPromises.push(defaultVideoRef.current.unloadAsync());
        if (talkingVideoRef.current)
          unloadPromises.push(talkingVideoRef.current.unloadAsync());
        if (listeningVideoRef.current)
          unloadPromises.push(listeningVideoRef.current.unloadAsync());
        if (transitionVideoRef.current)
          unloadPromises.push(transitionVideoRef.current.unloadAsync());

        await Promise.all(unloadPromises);
      };
      cleanup();
    };
  }, [avatar, currentView]);
  // Handle recording state changes
  // Update the useEffect for recording state changes:
  useEffect(() => {
    const handleRecordingChange = async () => {
      if (!isVideoReady) {
        console.log("Video not ready yet");
        return;
      }

      console.log("Recording changed:", isRecording);

      if (isRecording) {
        await playTransition("start");
      } else {
        await playTransition("end");
      }
    };

    handleRecordingChange();
  }, [isRecording]);
  // Add this function to get the appropriate video source based on state
  const getCurrentVideoSource = () => {
    const avatarData = getAvatarById(avatar);

    // If we should show talking video, return talking video
    if (shouldShowTalkingVideo()) {
      return avatarData.video_talking?.[0] || avatarData.video_default.loop[0];
    }

    // Otherwise return default video
    return avatarData.video_default.loop[0];
  };

  // Video transition function
  const playTransition = async (type: "start" | "end") => {
    try {
      const avatarData = getAvatarById(avatar);
      const transitionSource =
        type === "start"
          ? avatarData.video_listening?.start?.[0]
          : avatarData.video_listening?.end?.[0];

      if (!transitionSource) {
        console.log(`No ${type} transition, switching directly`);
        if (type === "start") {
          await switchToListening();
        } else {
          await switchToDefault();
        }
        return;
      }

      console.log(`Starting ${type} transition`);
      setCurrentTransition(type);
      setActiveVideo("transition");

      // Pause current videos
      if (activeVideo === "default" && defaultVideoRef.current) {
        await defaultVideoRef.current.pauseAsync();
      }
      if (activeVideo === "talking" && talkingVideoRef.current) {
        await talkingVideoRef.current.pauseAsync();
      }
      if (activeVideo === "listening" && listeningVideoRef.current) {
        await listeningVideoRef.current.pauseAsync();
      }

      // Load and play transition
      if (transitionVideoRef.current) {
        await transitionVideoRef.current.loadAsync(
          transitionSource,
          { shouldPlay: true, isLooping: false },
          false
        );

        const duration = TRANSITION_DURATIONS[avatar][type];
        console.log(`Transition will take ${duration}ms`);

        // Add a small buffer to ensure smooth transition
        const bufferDuration = 50;

        setTimeout(async () => {
          console.log(
            `Transition complete, switching to ${
              type === "start" ? "listening" : "default"
            }`
          );
          setCurrentTransition(null);

          if (type === "start") {
            await switchToListening();
          } else {
            await switchToDefault();
          }
        }, duration - bufferDuration);
      }
    } catch (error) {
      console.error("Error in playTransition:", error);
      // Fallback
      if (type === "start") {
        await switchToListening();
      } else {
        await switchToDefault();
      }
    }
  };

  const switchToTalking = async () => {
    try {
      console.log("Switching to talking mode");

      // Stop current video
      if (activeVideo === "default" && defaultVideoRef.current) {
        await defaultVideoRef.current.pauseAsync();
      }
      if (activeVideo === "listening" && listeningVideoRef.current) {
        await listeningVideoRef.current.pauseAsync();
      }

      // Start talking video
      if (talkingVideoRef.current) {
        await talkingVideoRef.current.setPositionAsync(0);
        await talkingVideoRef.current.playAsync();
        setActiveVideo("talking");
        setVideoMode("talking");
      }
    } catch (error) {
      console.error("Error switching to talking:", error);
    }
  };

  const switchToDefault = async () => {
    try {
      console.log("Switching to default mode");

      // Stop current video
      if (activeVideo === "talking" && talkingVideoRef.current) {
        await talkingVideoRef.current.pauseAsync();
      }
      if (activeVideo === "listening" && listeningVideoRef.current) {
        await listeningVideoRef.current.pauseAsync();
      }

      // Start default video
      if (defaultVideoRef.current) {
        await defaultVideoRef.current.setPositionAsync(0);
        await defaultVideoRef.current.playAsync();
        setActiveVideo("default");
        setVideoMode("default");
      }
    } catch (error) {
      console.error("Error switching to default:", error);
    }
  };

  const switchToListening = async () => {
    try {
      console.log("Switching to listening mode");

      // Stop current video
      if (activeVideo === "default" && defaultVideoRef.current) {
        await defaultVideoRef.current.pauseAsync();
      }
      if (activeVideo === "talking" && talkingVideoRef.current) {
        await talkingVideoRef.current.pauseAsync();
      }

      // Start listening video
      if (listeningVideoRef.current) {
        await listeningVideoRef.current.setPositionAsync(0);
        await listeningVideoRef.current.playAsync();
        setActiveVideo("listening");
        setVideoMode("listening");
      }
    } catch (error) {
      console.error("Error switching to listening:", error);
    }
  };
  // Add this function to update the video based on conversation state
  // Add this function to update the video
  const updateVideoBasedOnConversation = async () => {
    if (isVideoReady && !currentTransition) {
      try {
        const shouldShowTalking = shouldShowTalkingVideo();
        const targetVideoType = shouldShowTalking ? "talking" : "default";

        // Only switch if we're not already showing the correct video
        if (
          activeVideo !== targetVideoType &&
          activeVideo !== "listening" &&
          activeVideo !== "transition"
        ) {
          if (targetVideoType === "talking") {
            await switchToTalking();
          } else {
            await switchToDefault();
          }
        }
      } catch (error) {
        console.error("Error updating video:", error);
      }
    }
  };

  const SoundWaveIcon = ({
    isActive,
    size = 24,
    color = "#fff",
  }: SoundWaveIconProps) => {
    const waveAnimations = useRef([
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
      new Animated.Value(1),
    ]).current;
    // Add this effect near your other useEffects
    useEffect(() => {
      if (
        currentView === "avatar-chat" &&
        isVideoReady &&
        videoMode === "default"
      ) {
        updateVideoBasedOnConversation();
      }
    }, [dummyMessagesIndex]);

    useEffect(() => {
      if (isActive) {
        // Create a staggered wave effect
        waveAnimations.forEach((anim, index) => {
          Animated.loop(
            Animated.sequence([
              Animated.delay(index * 100),
              Animated.timing(anim, {
                toValue: 1.5,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ])
          ).start();
        });
      } else {
        // Stop all animations
        waveAnimations.forEach((anim) => {
          anim.stopAnimation();
          Animated.timing(anim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      }
    }, [isActive]);

    return (
      <View style={{ width: size, height: size, position: "relative" }}>
        {/* Sound waves */}
        {isActive && (
          <>
            <Animated.View
              style={{
                position: "absolute",
                width: size * 0.7,
                height: size * 0.7,
                borderRadius: size * 0.35,
                borderWidth: 1,
                borderColor: color,
                opacity: 0.3,
                transform: [{ scale: waveAnimations[0] }],
                alignSelf: "center",
                top: size * 0.15,
                left: size * 0.15,
              }}
            />
            <Animated.View
              style={{
                position: "absolute",
                width: size * 0.9,
                height: size * 0.9,
                borderRadius: size * 0.45,
                borderWidth: 1,
                borderColor: color,
                opacity: 0.2,
                transform: [{ scale: waveAnimations[1] }],
                alignSelf: "center",
                top: size * 0.05,
                left: size * 0.05,
              }}
            />
            <Animated.View
              style={{
                position: "absolute",
                width: size * 1.1,
                height: size * 1.1,
                borderRadius: size * 0.55,
                borderWidth: 1,
                borderColor: color,
                opacity: 0.1,
                transform: [{ scale: waveAnimations[2] }],
                alignSelf: "center",
                top: -size * 0.05,
                left: -size * 0.05,
              }}
            />
          </>
        )}

        {/* Mic Icon */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={isActive ? "mic" : "mic-outline"}
            size={size}
            color={color}
          />
        </View>
      </View>
    );
  };
  const loadSessions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (data) setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(
          data.map((msg) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role as "user" | "assistant" | "system",
            timestamp: new Date(msg.created_at),
          }))
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const createSession = async (
    type: "text" | "voice"
  ): Promise<string | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          session_type: type,
          title: type === "text" ? t.textChat : t.avatarChat,
        })
        .select()
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  const saveMessage = async (
    sessionId: string,
    content: string,
    role: "user" | "assistant" | "system"
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("chat_messages").insert({
        session_id: sessionId,
        user_id: user.id,
        content,
        role,
      });

      if (error) throw error;

      await supabase
        .from("chat_sessions")
        .update({
          last_message_preview: content.substring(0, 50),
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleStartTextSession = async () => {
    const sessionId = await createSession("text");
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setCurrentView("text-chat");
      setMessages([]);
      setInputText(""); // Ensure input is cleared
      setUserMessageCount(0);
      setAIResources(null);
      setShownResources(null);
      setShowAIResources(false);
      setIsKeyboardEverShown(false); // Reset keyboard state
      setIsKeyboardVisible(false);
      await loadSessions();
    }
  };
  useEffect(() => {
    return () => {
      // Clean up speech when component unmounts
      Speech.stop();
    };
  }, []);
  useEffect(() => {
    // Get the last message
    const lastMessage = messages[messages.length - 1];

    // If the last message is from assistant, speak it
    if (
      lastMessage &&
      lastMessage.role === "assistant" &&
      currentView === "avatar-chat"
    ) {
      speak(lastMessage.content);
    }
  }, [messages]); // Trigger whenever messages change
  const speak = (thingToSay: string) => {
    // const thingToSay = "hello";
    Speech.stop();
    Speech.speak(
      thingToSay,
      VOICE_CONFIGS[avatar]
      // dr al: 1,
      // bert: 1.5,
      // dr lora: language en, pitch 1.2
      // lexi: language en, pitch 1.7

      //   ,
      //   {
      //   language: "en", // Optional: specify language
      //   pitch: 2, // Optional: adjust pitch
      //   rate: 0.9, // Optional: adjust speaking rate
      // }
    );
  };
  // useEffect(() => {
  //   if (true) {
  //     speak();
  //   }
  // }, []);
  // //

  // Replace the handleStartVoiceSession function:
  const handleStartVoiceSession = async () => {
    const sessionId = await createSession("voice");
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setCurrentView("avatar-chat");
      // Start with just the first assistant message
      setMessages([generateDummyMessages()[0]]);
      setDummyMessagesIndex(1); // This should trigger talking video

      // Force video update after a short delay
      setTimeout(() => {
        if (currentView === "avatar-chat") {
          updateVideoBasedOnConversation();
        }
      }, 100);
      await loadSessions();
    }
  };

  const handleResumeSession = async (
    sessionId: string,
    type: "text" | "voice"
  ) => {
    setCurrentSessionId(sessionId);
    setCurrentView(type === "voice" ? "avatar-chat" : "text-chat");
    await loadMessages(sessionId);
    const userCount = messages.filter((msg) => msg.role === "user").length;
    setUserMessageCount(userCount);

    if (type === "voice" && messages.length === 0) {
      const dummyMessages = generateDummyMessages();
      setMessages(dummyMessages);
    }
  };

  const handleSend = async (text?: string) => {
    if (!currentSessionId) return;
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(currentSessionId, messageText, "user");
    setInputText("");
    setIsLoading(true);
    const newUserMessageCount = userMessageCount + 1;
    setUserMessageCount(newUserMessageCount);

    try {
      const conversationHistory = messages.map((msg) => ({
        role:
          msg.role === "user"
            ? "user"
            : ("assistant" as "user" | "assistant" | "system"),
        content: msg.content,
      }));

      let systemPrompt =
        language === "es"
          ? "Eres un asistente de salud útil para beneficiarios de Medi-Cal, y tu trabajo es sugerir recursos de Medi-Cal al usuario. Proporciona orientación de salud clara, empática y precisa. Enfócate en ayudar a los usuarios a encontrar recursos, comprender sus necesidades de salud y navegar por el sistema de salud. Haz preguntas aclaratorias si la entrada del usuario es insuficiente para discernir qué recursos necesita (por ejemplo, tipo de recurso, ubicación)."
          : "You are a helpful healthcare assistant for Medi-Cal beneficiaries, and your job is to suggest Medi-Cal resources to the user. Provide clear, empathetic, and accurate healthcare guidance. Focus on helping users find resources, understand their health needs, and navigate the healthcare system. Ask clarifying questions if the user input is insufficient for you to discern which resources the user needs (e.g., resource type, location).";

      if (newUserMessageCount === 2) {
        systemPrompt =
          `Do not answer the user's query. Based on the conversation, output a JSON of two Medi-Cal resources that you would suggest to this user - please do not say "Not available", and you can just make up the data, as it is used for hardcoding an app prototype. Please be specific in the hardcoded responses (e.g., do not say "various locations" or "by appointment only") Please give your response STRICTLY in this format: [
  {
    "id": "ymca_palo_alto",
    "name": "Palo Alto Family YMCA",
    "type": "Gym",
    "address": "3412 Ross Road, Palo Alto, CA 94303",
    "latitude": 37.4419,
    "longitude": -122.143,
    "rating": 4.5,
    "distance": "2.3 mi",
    "image": "../../assets/generic.jpg",
    "phone": "650-856-9622",
    "email": "membersupport@ymcasv.org",
    "hours": "Mon: 6:15am-9pm\\nTue: 6:15am-9pm\\nWed: 6:15am-9pm\\nThu: CLOSED\\nFri: 6:15am-1pm\\nSat: 8am-4pm\\nSun: 9am-4pm"
    "description": "Put your reasoning here, and keep it short (i.e., under 20 words)."]` +
          (language === "es"
            ? "\n\nPor favor, genera tu respuesta en español."
            : "");
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: messageText },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      let aiResponse =
        completion.choices[0]?.message?.content ||
        "I apologize, but I could not generate a response. Please try again.";

      if (newUserMessageCount === 2) {
        setAIResources(aiResponse);
        const parsedResources = parseResources(aiResponse);
        setShownResources(parsedResources);
        console.log(aiResponse);
        aiResponse =
          language === "es"
            ? "He reunido algunos recursos de Medi-Cal que podrían ser útiles. Puedes revisarlos en la ventana de sugerencias. Si hay algo más con lo que te gustaría recibir apoyo, estoy aquí para ti."
            : "I've gathered a few Medi-Cal resources that might be helpful. You can check them in the suggestion pop-up. If there's anything else you'd like support with, I'm here for you.";
        Keyboard.dismiss();
        setShowAIResources(true);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await saveMessage(currentSessionId, aiResponse, "assistant");
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I encountered an error. Please check your internet connection and try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExitSession = () => {
    Speech.stop();
    setCurrentView("session-select");
    setCurrentSessionId(null);
    setMessages([]);
    setIsLoading(false);
    setUserMessageCount(0);
    setInputText(""); // ADD THIS: Clear input text
    setAIResources(null);
    setShownResources(null);
    setShowAIResources(false);
    setShowEndCallModal(false);
    setIsKeyboardEverShown(false);
    loadSessions();
  };
  const shouldShowTalkingVideo = () => {
    const totalDummyMessages = generateDummyMessages().length;
    // Show talking video until all dummy messages are loaded
    return dummyMessagesIndex < totalDummyMessages;
  };

  const handleMicPressIn = () => {
    console.log("Mic pressed IN");
    setIsRecording(true);
  };

  const handleMicPressOut = async () => {
    console.log("Mic pressed OUT");

    if (isRecording && !isProcessingMessage) {
      setIsProcessingMessage(true);

      // Get all dummy messages
      const allDummyMessages = generateDummyMessages();

      // Check if we have more messages to show
      if (dummyMessagesIndex < allDummyMessages.length) {
        // Get the next message to show
        const nextMessage = allDummyMessages[dummyMessagesIndex];
        const isUserMessage = nextMessage.role === "user";

        // Add a small processing delay
        setTimeout(() => {
          // Add the current message
          const newIndex = dummyMessagesIndex + 1;
          setMessages((prev) => [...prev, nextMessage]);
          setDummyMessagesIndex(newIndex);

          // Update video immediately after adding message
          updateVideoBasedOnConversation();

          // Check if this was the last message
          const isLastMessage = newIndex >= allDummyMessages.length;

          if (isLastMessage) {
            // Show tips modal when all messages are shown
            setTimeout(() => {
              setShowTipsModal(true);
            }, 2000);
            setIsProcessingMessage(false);
          } else if (isUserMessage) {
            // If it was a user message, automatically add the AI response after delay
            setTimeout(() => {
              const aiMessage = allDummyMessages[newIndex];
              const nextIndex = newIndex + 1;

              setMessages((prev) => [...prev, aiMessage]);
              setDummyMessagesIndex(nextIndex);

              // Update video again after AI message
              updateVideoBasedOnConversation();

              // Check if AI message was the last one
              const isAILastMessage = nextIndex >= allDummyMessages.length;

              if (isAILastMessage) {
                // Show tips modal when all messages are shown
                setTimeout(() => {
                  setShowTipsModal(true);
                }, 2000);
              }

              setIsProcessingMessage(false);
            }, 3000);
          } else {
            // If it was an AI message, we're done processing
            setIsProcessingMessage(false);
          }
        }, 800);
      } else {
        // No more messages to show
        setIsProcessingMessage(false);
      }
    }

    setIsRecording(false);
  };
  console.log(height);

  const handleEndCall = () => {
    if (videoRef.current) videoRef.current.stopAsync();
    handleExitSession();
  };

  // Session Selection View
  if (currentView === "session-select") {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, paddingBottom: insets.bottom + 80 },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t.aiAssistant}</Text>
            </View>
          </View>

          <View style={styles.sessionSelection}>
            <Text style={styles.sectionTitle}>{t.startNewSession}</Text>
            <View style={styles.newSessionButtons}>
              <TouchableOpacity
                style={styles.sessionTypeButton}
                onPress={handleStartTextSession}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chatbubbles"
                  size={isTablet ? 72 : 48}
                  color={Theme.colors.primaryDark}
                />
                <Text style={styles.sessionTypeText}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sessionTypeButton}
                onPress={handleStartVoiceSession}
                activeOpacity={0.7}
              >
                <Fontisto
                  name="doctor"
                  size={isTablet ? 72 : 48}
                  color={Theme.colors.primaryDark}
                />
                <Text style={styles.sessionTypeText}>Avatar</Text>
              </TouchableOpacity>
            </View>

            {sessions.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  {t.resumePreviousSession}
                </Text>
                <ScrollView
                  style={styles.sessionsList}
                  showsVerticalScrollIndicator={false}
                >
                  {sessions.map((session) => (
                    <TouchableOpacity
                      key={session.id}
                      style={[
                        styles.sessionCard,
                        session.session_type === "voice" &&
                          styles.voiceSessionCard,
                      ]}
                      onPress={() =>
                        handleResumeSession(session.id, session.session_type)
                      }
                      activeOpacity={0.7}
                    >
                      {session.session_type === "voice" ? (
                        <Fontisto
                          name="doctor"
                          size={isTablet ? 36 : 24}
                          color={Theme.colors.primaryDark}
                        />
                      ) : (
                        <Ionicons
                          name={"chatbubbles"}
                          size={isTablet ? 36 : 24}
                          color={Theme.colors.primaryDark}
                        />
                      )}
                      <View style={styles.sessionCardContent}>
                        <Text style={styles.sessionCardTitle}>
                          {session.title ||
                            `${
                              session.session_type === "voice"
                                ? "Voice"
                                : "Text"
                            } Chat`}
                        </Text>
                        {session.last_message_preview && (
                          <Text
                            style={styles.sessionCardPreview}
                            numberOfLines={1}
                          >
                            {session.last_message_preview}
                          </Text>
                        )}
                        <Text style={styles.sessionCardDate}>
                          {format(
                            new Date(session.updated_at),
                            "MMM d, yyyy h:mm a"
                          )}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </Animated.View>
        <CustomTabBar />
      </SafeAreaView>
    );
  }

  // Text Chat View
  if (currentView === "text-chat") {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          key={currentSessionId || "new-session"} // Add key to force recreation
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleExitSession}
                style={styles.backButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={Theme.colors.text}
                />
              </TouchableOpacity>
              <View style={styles.headerLeft}>
                <Image
                  source={require("../../assets/icon.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.title}>{t.aiAssistant}</Text>
                  <View style={styles.modeIndicator}>
                    <Ionicons
                      name="chatbubbles"
                      size={isTablet ? 24 : 14}
                      color={Theme.colors.primaryAlt}
                    />
                    <Text style={styles.modeText}>{t.textChat}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Messages ScrollView - Takes available space */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 && (
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeText}>{t.welcomeMessage}</Text>
                </View>
              )}
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.role === "user"
                      ? styles.userMessage
                      : styles.aiMessage,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === "user"
                        ? styles.userBubble
                        : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.role === "user"
                          ? styles.userText
                          : styles.aiText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                </View>
              ))}
              {isLoading && (
                <View style={[styles.messageContainer, styles.aiMessage]}>
                  <View style={[styles.messageBubble, styles.aiBubble]}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                      <View style={styles.dot} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>

          {/* Input Container - Will move up with keyboard */}
          <View
            style={[
              styles.inputContainer,
              {
                bottom: Platform.select({
                  ios: isTablet ? 80 : 40,
                  android: isKeyboardEverShown ? 30 : 100,
                }),
              },
              isKeyboardVisible && {
                bottom: Platform.select({
                  ios: isTablet
                    ? keyboardHeight * 0.935
                    : keyboardHeight * 0.92,
                  android: 0,
                }),
              },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder={t.askPlaceholder}
              placeholderTextColor={Theme.colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={Theme.colors.backgroundLight}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <CustomTabBar opacity={showAIResources ? 0.4 : 1} />
        {showAIResources && (
          <AISuggestion
            visible={showAIResources}
            onDismiss={() => setShowAIResources(false)}
            resources={(shownResources || DEFAULT_RESOURCES).map(
              (resource, index) => ({
                id: index.toString(),
                place_id: resource.id,
                name: resource.name,
                address: resource.address || "",
                description: resource.description || "",
                imageSource:
                  resource.type === "Gym"
                    ? require("../../assets/gym.png")
                    : resource.type.includes("Dental") ||
                      resource.type.includes("Dentist")
                    ? require("../../assets/dental.png")
                    : resource.type.includes("Clinic")
                    ? require("../../assets/clinic.png")
                    : require("../../assets/generic.jpg"),
                eligibility: "You are eligible for this service",
                category: resource.type || "General",
                latitude: resource.latitude || 0,
                longitude: resource.longitude || 0,
                distance: resource.distance,
                phone: resource.phone,
                email: resource.email,
                hours: resource.hours,
              })
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // Avatar Chat View
  if (currentView === "avatar-chat") {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleExitSession}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.headerLeft}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.title}>{t.aiAssistant}</Text>
                <View style={styles.modeIndicator}>
                  <Fontisto
                    name="doctor"
                    size={14}
                    color={Theme.colors.primaryAlt}
                  />
                  <Text style={styles.modeText}>{t.avatarChat}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.avatarMainContainer}>
            {/* Video Container */}
            <View style={styles.videoContainer}>
              <Image
                source={getAvatarById(avatar).background}
                style={styles.videoBackground}
                blurRadius={20}
                resizeMode="cover"
              />

              <View style={styles.videoPlaceholder}>
                {/* Default Video (always preloaded) */}
                <Video
                  ref={defaultVideoRef}
                  style={[
                    styles.video,
                    activeVideo !== "default" && styles.hiddenVideo,
                  ]}
                  shouldPlay={activeVideo === "default"}
                  isLooping={true}
                  resizeMode={ResizeMode.CONTAIN}
                  onError={(error) =>
                    console.error("Default video error:", error)
                  }
                  isMuted={true}
                  volume={0}
                />

                {/* Talking Video (always preloaded) */}
                <Video
                  ref={talkingVideoRef}
                  style={[
                    styles.video,
                    activeVideo !== "talking" && styles.hiddenVideo,
                  ]}
                  shouldPlay={activeVideo === "talking"}
                  isLooping={true}
                  resizeMode={ResizeMode.CONTAIN}
                  onError={(error) =>
                    console.error("Talking video error:", error)
                  }
                  isMuted={true}
                  volume={0}
                />

                {/* Listening Video (always preloaded) */}
                <Video
                  ref={listeningVideoRef}
                  style={[
                    styles.video,
                    activeVideo !== "listening" && styles.hiddenVideo,
                  ]}
                  shouldPlay={activeVideo === "listening"}
                  isLooping={true}
                  resizeMode={ResizeMode.CONTAIN}
                  isMuted={true}
                  volume={0}
                />

                {/* Transition Video (loaded on demand) */}
                <Video
                  ref={transitionVideoRef}
                  style={[
                    styles.video,
                    activeVideo !== "transition" && styles.hiddenVideo,
                  ]}
                  shouldPlay={activeVideo === "transition"}
                  isLooping={false}
                  resizeMode={ResizeMode.CONTAIN}
                  onError={(error) =>
                    console.error("Transition video error:", error)
                  }
                  isMuted={true}
                  volume={0}
                />
              </View>

              {/* Call Status */}
              <View style={styles.callStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{t.connected}</Text>
              </View>

              <TouchableOpacity
                style={styles.selectAvatarButton}
                onPress={() => setChooseAvatarModal(true)}
              >
                <FontAwesome5
                  name="user-edit"
                  size={28}
                  color={Theme.colors.primaryDark}
                />
              </TouchableOpacity>
            </View>

            {/* Live Captions */}
            <View style={styles.captionsOuterContainer}>
              <View style={styles.captionsHeader}>
                <Ionicons
                  name="text"
                  size={isTablet ? 30 : 20}
                  color={Theme.colors.primaryAlt}
                />
                <Text style={styles.captionsTitle}>{t.liveConversation}</Text>
                <View style={styles.captionsStatus}>
                  <View style={styles.captionsStatusDot} />
                  <Text style={styles.captionsStatusText}>{t.live}</Text>
                </View>
              </View>

              <ScrollView
                style={styles.captionsScrollView}
                showsVerticalScrollIndicator={false}
                ref={scrollViewRef}
                contentContainerStyle={styles.captionsContent}
                onContentSizeChange={() =>
                  scrollViewRef.current?.scrollToEnd({ animated: true })
                }
              >
                {messages.length === 0 ? (
                  <View style={styles.emptyCaptions}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={48}
                      color={Theme.colors.textLight}
                    />
                    <Text style={styles.emptyCaptionsText}>
                      {t.startSpeaking}
                    </Text>
                  </View>
                ) : (
                  <>
                    {messages.map((message) => (
                      <View
                        key={message.id}
                        style={[
                          styles.captionItem,
                          message.role === "user"
                            ? styles.userCaptionItem
                            : styles.aiCaptionItem,
                        ]}
                      >
                        <View style={styles.captionHeader}>
                          <View
                            style={[
                              styles.captionAvatar,
                              message.role === "user"
                                ? styles.userCaptionAvatar
                                : styles.aiCaptionAvatar,
                            ]}
                          >
                            {message.role === "user" ? (
                              <Ionicons
                                name="person"
                                size={16}
                                color={Theme.colors.backgroundLight}
                              />
                            ) : (
                              <Image
                                source={getAvatarById(avatar).source}
                                style={styles.avatarIcon}
                                resizeMode="cover"
                              />
                            )}
                          </View>
                          <Text style={styles.captionName}>
                            {message.role === "user"
                              ? "You"
                              : getAvatarById(avatar).name}
                          </Text>
                          <Text style={styles.captionTime}>
                            {format(message.timestamp, "h:mm a")}
                          </Text>
                        </View>
                        <Text style={styles.captionMessage}>
                          {message.content}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            </View>
          </View>

          {/* Control Bar */}
          <View style={styles.controlBar}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.secondaryControlButton,
                speaker && Theme.shadows.md,
              ]}
              onPress={() => {
                setSpeaker(!speaker);
                // speak();
              }}
            >
              <Ionicons
                name={speaker ? "volume-high" : "volume-off"}
                size={isTablet ? 40 : 24}
                color={speaker ? Theme.colors.text : Theme.colors.text + "99"}
              />
              <Text
                style={[
                  styles.controlButtonText,
                  {
                    color: speaker
                      ? Theme.colors.text
                      : Theme.colors.text + "99",
                  },
                ]}
              >
                {speaker ? t.speakerOn : t.speakerOff}
              </Text>
            </TouchableOpacity>

            {/* Main Mic Button */}
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.primaryControlButton,
                isRecording && styles.recordingControlButton,
                (isProcessingMessage ||
                  dummyMessagesIndex >= generateDummyMessages().length) &&
                  styles.disabledControlButton,
              ]}
              onPressIn={handleMicPressIn}
              onPressOut={handleMicPressOut}
              activeOpacity={0.7}
              disabled={isProcessingMessage}
            >
              <SoundWaveIcon
                isActive={isRecording || isProcessingMessage}
                size={isTablet ? 40 : 24}
                color={Theme.colors.backgroundLight}
              />
              <Text
                style={[
                  styles.controlButtonText,
                  styles.primaryControlButtonText,
                ]}
              >
                {isProcessingMessage
                  ? t.processing
                  : isRecording
                  ? t.listening
                  : t.holdToTalk}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.dangerControlButton]}
              onPress={() => setShowEndCallModal(true)}
            >
              <Ionicons
                name="call"
                size={isTablet ? 40 : 24}
                color={Theme.colors.backgroundLight}
              />
              <Text
                style={[
                  styles.controlButtonText,
                  styles.dangerControlButtonText,
                ]}
              >
                {t.endCall}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <CustomTabBar />

        {/* Modals */}
        {chooseAvatarModal && (
          <SelectionModal
            mode={"choose_avatar"}
            setShowPopUp={setChooseAvatarModal}
            avatar={avatar}
            setAvatar={setAvatar}
            selectedLanguage={language}
          />
        )}

        {showEndCallModal && (
          <AreYouSurePopup
            mode={"end_call"}
            setShowPopUp={setShowEndCallModal}
            proceed={handleEndCall}
          />
        )}

        {showTipsModal && (
          <SelectionModal
            mode={"tips_checklist"}
            from_video={true}
            setShowPopUp={setShowTipsModal}
            selectedLanguage={language}
            proceed={() => {}}
          />
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
  },
  backButton: {
    padding: Theme.spacing.xs,
    marginRight: Theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    flex: 1,
  },
  headerLogo: {
    width: isTablet ? 80 : 40,
    height: isTablet ? 80 : 40,
  },
  title: {
    fontSize: isTablet ? 52 : 32,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: "bold",
  },
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: isTablet ? 8 : 4,
    marginTop: 2,
  },
  modeText: {
    fontSize: isTablet ? 24 : 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  sessionSelection: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: isTablet ? 28 : 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
  },
  newSessionButtons: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  sessionTypeButton: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: isTablet ? Theme.spacing.md : Theme.spacing.sm,
    ...Theme.shadows.md,
  },
  sessionTypeText: {
    fontSize: isTablet ? 28 : 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  sessionsList: {
    flex: 1,
  },
  sessionCard: {
    flexDirection: "row",
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    alignItems: "center",
    gap: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  voiceSessionCard: {},
  sessionCardContent: {
    flex: 1,
  },
  sessionCardTitle: {
    fontSize: isTablet ? 24 : 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  sessionCardPreview: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  sessionCardDate: {
    fontSize: isTablet ? 18 : 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textLight,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  messagesContent: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  welcomeContainer: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
  },
  welcomeText: {
    fontSize: isTablet ? 22 : 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    lineHeight: isTablet ? 32 : 24,
    textAlign: "center",
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: Theme.spacing.sm,
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  aiMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.sm,
  },
  userBubble: {
    backgroundColor: Theme.colors.primaryDark,
    borderTopRightRadius: Theme.borderRadius.sm,
  },
  aiBubble: {
    backgroundColor: Theme.colors.backgroundLight,
    borderTopLeftRadius: Theme.borderRadius.sm,
    opacity: 0.95,
  },
  messageText: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    lineHeight: 22,
  },
  userText: {
    color: Theme.colors.backgroundLight,
  },
  aiText: {
    color: Theme.colors.text,
  },
  typingIndicator: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.textSecondary,
  },
  inputContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
    backgroundColor: Theme.colors.background,
    gap: Theme.spacing.sm,
    zIndex: 999,
  },
  input: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: (Theme.spacing.sm + Theme.spacing.md) / 2,
    paddingBottom: (Theme.spacing.sm + Theme.spacing.md) / 2,
    fontSize: isTablet ? 20 : 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40 + 3,
    height: 40 + 3,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: Theme.colors.primaryDark,
    opacity: 0.8,
  },
  avatarMainContainer: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
  },
  videoContainer: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    aspectRatio: isTablet ? 1.5 : 1.3,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.md,
    overflow: "hidden",
    position: "relative",
  },
  videoBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.7,
  },
  videoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  hiddenVideo: {
    opacity: 0,
    position: "absolute",
    zIndex: -99999,
  },
  callStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.livebuttonBG,
    borderColor: "green",
    borderWidth: 1,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.sm,
    position: "absolute",
    bottom: Theme.spacing.sm,
    zIndex: 50,
    alignSelf: "center",
  },
  statusDot: {
    width: isTablet ? 15 : 8,
    height: isTablet ? 15 : 8,
    borderRadius: isTablet ? 8 : 4,
    backgroundColor: Theme.colors.livebuttonText,
    marginRight: Theme.spacing.xs,
    zIndex: 100,
  },
  statusText: {
    fontSize: isTablet ? 18 : 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.livebuttonText,
    zIndex: 100,
  },
  captionsOuterContainer: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    overflow: "hidden",
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  captionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: (Theme.spacing.md + Theme.spacing.sm) / 2,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.backgroundLight,
  },
  captionsTitle: {
    fontSize: isTablet ? 26 : 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginLeft: Theme.spacing.sm,
    marginRight: "auto",
  },
  captionsStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.livebuttonBG,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  captionsStatusDot: {
    width: isTablet ? 10 : 6,
    height: isTablet ? 10 : 6,
    borderRadius: isTablet ? 5 : 3,
    backgroundColor: Theme.colors.livebuttonText,
    marginRight: 4,
  },
  captionsStatusText: {
    fontSize: isTablet ? 20 : 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.livebuttonText,
  },
  captionsScrollView: {
    flex: 1,
  },
  captionsContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xs,
  },
  emptyCaptions: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.xl,
  },
  emptyCaptionsText: {
    fontSize: isTablet ? 24 : 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
    textAlign: "center",
  },
  captionItem: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.sm,
  },
  userCaptionItem: {
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  aiCaptionItem: {
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.secondary,
  },
  captionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  captionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.sm,
  },
  userCaptionAvatar: {
    backgroundColor: Theme.colors.primary,
  },
  aiCaptionAvatar: {
    backgroundColor: Theme.colors.secondary,
  },
  captionName: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginRight: "auto",
  },
  captionTime: {
    fontSize: isTablet ? 18 : 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textLight,
  },
  captionMessage: {
    fontSize: isTablet ? 20 : 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    lineHeight: isTablet ? 24 : 20,
  },
  avatarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectAvatarButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: Theme.colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.md,
    position: "absolute",
    top: 16,
    right: 16,
  },
  controlBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingBottom: isTablet ? 90 : 50,
    height: isTablet
      ? height * 0.16
      : Platform.OS === "android"
      ? height * 0.18
      : height * 0.15,

    marginBottom: Platform.OS === "android" ? Theme.spacing.lg : 0,
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    minWidth: isTablet ? 140 : 100,
  },
  secondaryControlButton: {
    backgroundColor: Theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  primaryControlButton: {
    backgroundColor: Theme.colors.primaryDark,
    ...Theme.shadows.xl,
    transform: [{ scale: 1 }],
  },
  dangerControlButton: {
    backgroundColor: "#FF3B30",
    borderColor: "#FF3B30",
    ...Theme.shadows.md,
  },
  recordingControlButton: {
    backgroundColor: Theme.colors.primaryAlt,
    transform: [{ scale: 1.1 }],
  },
  disabledControlButton: {
    opacity: 0.7,
  },
  controlButtonText: {
    fontSize: isTablet ? 18 : 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    marginTop: 4,
    fontWeight: "500",
  },
  primaryControlButtonText: {
    color: Theme.colors.backgroundLight,
  },
  dangerControlButtonText: {
    color: Theme.colors.backgroundLight,
  },
  inputContainerKeyboardOpen: {
    bottom: Platform.OS === "ios" ? 310 : 100,
  },
});
