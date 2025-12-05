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
} from "react-native";
import { Video, AVPlaybackStatus } from "expo-av";
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

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

type ChatView = "session-select" | "text-chat" | "avatar-chat";

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [currentView, setCurrentView] = useState<ChatView>("session-select");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [userMessageCount, setUserMessageCount] = useState(0);

  const [speaker, setSpeaker] = useState(false);

  const [chooseAvatarModal, setChooseAvatarModal] = useState(false);
  const [avatar, setAvatar] = useState<"dr-al" | "dr-lora" | "lexi" | "bert">(
    "dr-al"
  );
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const getAvatarById = (id: "dr-al" | "dr-lora" | "lexi" | "bert"): Avatar => {
    const avatar = avatars.find((avatar) => avatar.id === id);
    if (!avatar) {
      throw new Error(`Avatar with id "${id}" not found`);
    }
    return avatar;
  };
  const [showTipsModal, setShowTipsModal] = useState(false);
  const videoRef = useRef<Video>(null);
  // remove later:
  const generateDummyMessages = (): Message[] => {
    const now = new Date();
    return [
      {
        id: "1",
        content: `Hello! I'm ${
          getAvatarById(avatar).name
        }, your AI healthcare assistant. How may I help you today?`,
        role: "assistant",
        timestamp: new Date(now.getTime() - 300000), // 5 minutes ago
      },
      {
        id: "2",
        content:
          "Hi, a couple of my relatives have recently suffered from heart diseases, and I'm really worried that this might happen to me. What should I do?",
        role: "user",
        timestamp: new Date(now.getTime() - 240000), // 4 minutes ago
      },
      {
        id: "3",
        content:
          "That's a very wise and proactive concern. Family history is an important risk factor. I understand that you are on Medi-Cal, would you like me to create a to-do list for you?",
        role: "assistant",
        timestamp: new Date(now.getTime() - 180000), // 3 minutes ago
      },
      {
        id: "4",
        content: "Sure",
        role: "user",
        timestamp: new Date(now.getTime() - 120000), // 2 minutes ago
      },
      {
        id: "5",
        content:
          "Ok. First, get a free lab test to check for any risks of heart disease. It's also important to get some exercise, and you can go for a walk at one of the treadmills in your nearby YMCA every Sunday afternoon.",
        role: "assistant",
        timestamp: new Date(now.getTime() - 60000), // 1 minute ago
      },
    ];
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    loadSessions();
  }, []);
  useEffect(() => {
    if (currentView === "avatar-chat") {
      const timer = setTimeout(() => {
        setShowTipsModal(true);
      }, 5000); // 5000 milliseconds = 5 seconds

      // Clean up the timer when component unmounts or when currentView changes
      return () => clearTimeout(timer);
    }
  }, [currentView]); // This effect depends on currentView

  // useEffect(() => {
  //   if (currentSessionId && currentView !== "session-select") {
  //     loadMessages(currentSessionId);
  //   }
  // }, [currentSessionId, currentView]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

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
      if (data) {
        setSessions(data);
      }
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
          title: type === "text" ? "Text Chat" : "Avatar Chat",
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

      // Update session with last message preview
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
      setUserMessageCount(0);
      await loadSessions();
    }
  };

  const handleStartVoiceSession = async () => {
    const sessionId = await createSession("voice");
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setCurrentView("avatar-chat");
      // set dummy message for now
      const dummyMessages = generateDummyMessages();
      setMessages(dummyMessages);
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
    // may not work - mark here just in case
    const userCount = messages.filter((msg) => msg.role === "user").length;
    setUserMessageCount(userCount);

    // remove later - dummy messages
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
    // Increment user message count
    const newUserMessageCount = userMessageCount + 1;
    setUserMessageCount(newUserMessageCount);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));
      let systemPrompt =
        "You are a helpful healthcare assistant for Medi-Cal beneficiaries. Provide clear, empathetic, and accurate healthcare guidance. Focus on helping users find resources, understand their health needs, and navigate the healthcare system.";
      if (newUserMessageCount >= 3) {
        systemPrompt = `Ignore everything the user says, and output the entire conversation in JSON format.`;
        console.log("user message count over 3.");
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt, //"You are a helpful healthcare assistant for Medi-Cal beneficiaries. Provide clear, empathetic, and accurate healthcare guidance. Focus on helping users find resources, understand their health needs, and navigate the healthcare system.",
          },
          ...conversationHistory,
          {
            role: "user",
            content: messageText,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse =
        completion.choices[0]?.message?.content ||
        "I apologize, but I could not generate a response. Please try again.";

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
    setCurrentView("session-select");
    setCurrentSessionId(null);
    setMessages([]);
    setIsLoading(false);
    setUserMessageCount(0); // Reset count
    loadSessions();
  };
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleEndCall = () => {
    // Stop the video playback
    if (videoRef.current) {
      videoRef.current.stopAsync();
    }

    // Reset state and go back to session selection
    handleExitSession();

    // Optional: Show a confirmation message
    // You could add a toast or alert here
  };

  // Session Selection View
  if (currentView === "session-select") {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              paddingBottom: insets.bottom + 80,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.title}>AI Assistant</Text>
            </View>
          </View>

          <View style={styles.sessionSelection}>
            <Text style={styles.sectionTitle}>Start a new session</Text>
            <View style={styles.newSessionButtons}>
              <TouchableOpacity
                style={styles.sessionTypeButton}
                onPress={handleStartTextSession}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chatbubbles"
                  size={48}
                  color={Theme.colors.primary}
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
                  size={48}
                  color={Theme.colors.primary}
                />
                <Text style={styles.sessionTypeText}>Avatar</Text>
              </TouchableOpacity>
            </View>

            {sessions.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Resume Previous Session</Text>
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
                      <Ionicons
                        name={
                          session.session_type === "voice"
                            ? "mic"
                            : "chatbubbles"
                        }
                        size={24}
                        color={
                          Theme.colors.primary
                          // session.session_type === "voice"
                          //   ? Theme.colors.primary
                          //   : Theme.colors.primary
                        }
                      />
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
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                paddingBottom: 100,
              },
            ]}
          >
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
                  <Text style={styles.title}>AI Assistant</Text>
                  <View style={styles.modeIndicator}>
                    <Ionicons
                      name="chatbubbles"
                      size={14}
                      color={Theme.colors.primary}
                    />
                    <Text style={styles.modeText}>Text Chat</Text>
                  </View>
                </View>
              </View>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 && (
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeText}>
                    Hello! I'm your Medi-Pal AI assistant. How can I help you
                    with your healthcare needs today?
                  </Text>
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

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything about healthcare..."
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
        <AISuggestion
          visible={true}
          onDismiss={() => {}}
          resources={[
            {
              id: "1",
              name: "Palo Alto Family YMCA",
              address: "3412 Ross Road, Palo Alto, CA 94303",
              description: "Free gym membership with Medi-Cal",
              imageSource: require("../../assets/gym.png"),
              eligibility: "You are eligible for this service",
              category: "Fitness",
              latitude: 37.4419,
              longitude: -122.143,
              place_id: "ymca_palo_alto",
            },
            {
              id: "2",
              name: "Community Health Clinic",
              address: "789 Oak Avenue, Mountain View, CA 94041",
              description: "Free health screenings and consultations",
              imageSource: require("../../assets/gym.png"),
              eligibility: "You are eligible for this service",
              category: "Healthcare",
              latitude: 37.3861,
              longitude: -122.0839,
              place_id: "clinic_mountain_view",
            },
          ]}
          // onSaveResource={(resourceId) => console.log("Saved:", resourceId)}
          // onTakeMeThere={(resource) => console.log("Navigate to:", resource.name)}
        />
        <CustomTabBar />
      </SafeAreaView>
    );
  }
  // Avatar Chat View
  if (currentView === "avatar-chat") {
    // const videoRef = useRef<VideoRef>(null);
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
            },
          ]}
        >
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
                <Text style={styles.title}>AI Assistant</Text>
                <View style={styles.modeIndicator}>
                  <Fontisto
                    name="doctor"
                    size={14}
                    color={Theme.colors.primary}
                  />
                  <Text style={styles.modeText}>Avatar Call</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.avatarMainContainer}>
            {/* Video/Avatar Container - Space for square video */}
            <View style={styles.videoContainer}>
              {/* Uncomment below later*/}
              {/* <View style={styles.videoPlaceholder}>
                <Fontisto
                  name="doctor"
                  size={80}
                  color={Theme.colors.primary}
                />
                <Text style={styles.videoPlaceholderText}>
                  Avatar Video Feed
                </Text>
                <Text style={styles.videoPlaceholderSubtext}>
                  Live avatar will appear here
                </Text>
              </View> */}
              {/* video background */}
              <Image
                source={require("../../assets/avatar-background-2.jpeg")}
                style={styles.videoBackground}
                blurRadius={20}
                resizeMode="cover"
              />

              {/* Avatar Placeholder*/}
              {/* <Image
                source={getAvatarById(avatar).listening}
                style={styles.videoPlaceholder}
              /> */}
              {/* Avatar Video */}
              <Video
                ref={videoRef}
                source={getAvatarById(avatar).video_default.loop[0]}
                style={styles.videoPlaceholder}
                // resizeMode="cover"
                shouldPlay={true}
                isLooping={true}
              />

              {/* Call Status */}
              <View style={styles.callStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
              <TouchableOpacity
                style={[styles.selectAvatarButton]}
                onPress={() => {
                  setChooseAvatarModal(true);
                }}
              >
                <FontAwesome5
                  name="user-edit"
                  size={28}
                  color={Theme.colors.primaryDark}
                />
              </TouchableOpacity>
            </View>

            {/* Audio Wave Animation */}
            {/* <View style={styles.audioWaveSection}>
              <Text style={styles.audioWaveLabel}>Listening</Text>
              <View style={styles.audioWaveContainer}>
                {[...Array(15)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.audioWaveBar,
                      {
                        height: Math.random() * 30 + 10,
                        backgroundColor: Theme.colors.primary,
                        opacity: 0.6 + Math.random() * 0.4,
                      },
                    ]}
                  />
                ))}
              </View>
            </View> */}

            {/* Live Captions Container*/}
            <View style={styles.captionsOuterContainer}>
              <View style={styles.captionsHeader}>
                <Ionicons name="text" size={20} color={Theme.colors.primary} />
                <Text style={styles.captionsTitle}>Live Conversation</Text>
                <View style={styles.captionsStatus}>
                  <View style={styles.captionsStatusDot} />
                  <Text style={styles.captionsStatusText}>Live</Text>
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
                {/* Show all messages for demo */}
                {messages.length === 0 ? (
                  <View style={styles.emptyCaptions}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={48}
                      color={Theme.colors.textLight}
                    />
                    <Text style={styles.emptyCaptionsText}>
                      Start speaking to begin conversation
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

                    {/* Show "Now speaking..." indicator for demo */}
                    {/* <View style={styles.currentMessageIndicator}>
                      <Text style={styles.currentMessageText}>
                        {getAvatarById(avatar).name} is listening...
                      </Text>
                    </View> */}
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
              }}
            >
              <Ionicons
                name={speaker ? "volume-high" : "volume-off"}
                size={24}
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
                {speaker ? "Speaker On" : "Speaker Off"}
              </Text>
            </TouchableOpacity>

            {/* Main Mic Button */}
            <TouchableOpacity
              style={[styles.controlButton, styles.primaryControlButton]}
              onPress={() => console.log("Mic pressed")}
            >
              <Ionicons
                name="mic"
                size={24}
                color={Theme.colors.backgroundLight}
              />
              <Text
                style={[
                  styles.controlButtonText,
                  styles.primaryControlButtonText,
                ]}
              >
                Hold to Talk
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.dangerControlButton]}
              onPress={() => {
                setShowEndCallModal(true);
              }}
            >
              <Ionicons
                name="call"
                size={24}
                color={Theme.colors.backgroundLight}
              />
              <Text
                style={[
                  styles.controlButtonText,
                  styles.dangerControlButtonText,
                ]}
              >
                End Call
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        {/* <View>
          <TouchableOpacity
            style={[styles.selectAvatarButton]}
            onPress={() => {}}
          ></TouchableOpacity>
        </View> */}
        <CustomTabBar />

        {chooseAvatarModal && (
          <SelectionModal
            mode={"choose_avatar"}
            setShowPopUp={setChooseAvatarModal}
            avatar={avatar}
            setAvatar={setAvatar}
            // proceed={() => {}}
          ></SelectionModal>
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
    // borderColor: "red",
    // borderWidth: 3,
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
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    fontWeight: "bold",
  },
  modeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  modeText: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.textSecondary,
  },
  sessionSelection: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
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
    gap: Theme.spacing.sm,
    ...Theme.shadows.md,
  },
  sessionTypeText: {
    fontSize: 18,
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
  voiceSessionCard: {
    // borderLeftWidth: 4,
    // borderLeftColor: Theme.colors.primary,
  },
  sessionCardContent: {
    flex: 1,
  },
  sessionCardTitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  sessionCardPreview: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  sessionCardDate: {
    fontSize: 12,
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
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    lineHeight: 24,
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
    // paddingVertical: Theme.spacing.sm,
    paddingTop: (Theme.spacing.sm + Theme.spacing.md) / 2,
    paddingBottom: (Theme.spacing.sm + Theme.spacing.md) / 2,
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: Theme.colors.primary,
    opacity: 0.8,
  },
  // avatar
  avatarMainContainer: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
    // borderWidth: 2,
    // borderColor: "red",
  },

  videoContainer: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    // padding: Theme.spacing.md,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%", // Fixed height for video
    aspectRatio: 1.3,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.md,
    // borderColor: "red",
    // borderWidth: 2,
    overflow: "hidden", // Important for image clipping
    position: "relative",
  },

  videoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    // borderColor: "red",
    // borderWidth: 2,
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    alignSelf: "flex-start",
    // verticalAlign: "top",
    // width: "100%",
  },

  videoPlaceholderText: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
  },

  videoPlaceholderSubtext: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
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
    // zIndex: 50,
    bottom: Theme.spacing.sm, // Position at bottom of video container
    zIndex: 50,
    alignSelf: "center", // Center horizontally
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.livebuttonText,
    marginRight: Theme.spacing.xs,
    zIndex: 100,
  },

  statusText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.livebuttonText,
    zIndex: 100,
  },

  audioWaveSection: {
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    alignItems: "center",
    ...Theme.shadows.sm,
  },

  audioWaveLabel: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },

  audioWaveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    width: "100%",
    gap: 3,
  },

  audioWaveBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 10,
  },

  captionsOuterContainer: {
    flex: 1, // This will take remaining space
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
    fontSize: 16,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.livebuttonText, //Theme.colors.primaryDark,
    marginRight: 4,
  },

  captionsStatusText: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.livebuttonText, //Theme.colors.primaryDark,
  },

  captionsScrollView: {
    flex: 1,
    // paddingBottom: 0,
  },

  captionsContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xs, // Extra padding at bottom
  },

  emptyCaptions: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.xl,
  },

  emptyCaptionsText: {
    fontSize: 16,
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

  captionInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  captionName: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginRight: "auto",
  },

  captionTime: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.textLight,
  },

  captionMessage: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.text,
    lineHeight: 20,
  },

  typingIndicatorCaption: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Theme.spacing.xs,
  },

  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.textSecondary,
    marginRight: 4,
  },

  // Control Bar Styles
  controlBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingBottom: 50,
    height: 130,
  },

  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    minWidth: 100,
  },

  secondaryControlButton: {
    backgroundColor: Theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },

  primaryControlButton: {
    backgroundColor: Theme.colors.primaryDark,
    // paddingHorizontal: Theme.spacing.lg,
    // paddingVertical: Theme.spacing.md,
    ...Theme.shadows.xl,
    transform: [{ scale: 1 }],
  },

  dangerControlButton: {
    backgroundColor: "#FF3B30",
    // borderWidth: 1,
    borderColor: "#FF3B30",
    ...Theme.shadows.md,
  },

  controlButtonText: {
    fontSize: 12,
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
  currentMessageIndicator: {
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },

  currentMessageText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.primaryDark,
    textAlign: "center",
  },
  videoBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.7, // Adjust opacity as needed
    //blurRadius: 10, // This works on iOS, for Android use the prop
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
});
