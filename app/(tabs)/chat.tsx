import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { CustomTabBar } from './_layout';
import { supabase } from '../../lib/supabase';
import OpenAI from 'openai';
import { format } from 'date-fns';
import { Dimensions } from 'react-native';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  session_type: 'text' | 'voice';
  created_at: string;
  updated_at: string;
  title?: string;
  last_message_preview?: string;
}

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

type ChatView = 'session-select' | 'text-chat';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [currentView, setCurrentView] = useState<ChatView>('session-select');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    loadSessions();
    
  }, []);


  useEffect(() => {
    if (currentSessionId && currentView !== 'session-select') {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId, currentView]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(
          data.map((msg) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role as 'user' | 'assistant' | 'system',
            timestamp: new Date(msg.created_at),
          }))
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createSession = async (type: 'text' | 'voice'): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          session_type: type,
          title: type === 'text' ? 'Text Chat' : 'Voice Chat',
        })
        .select()
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const saveMessage = async (sessionId: string, content: string, role: 'user' | 'assistant' | 'system') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('chat_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        content,
        role,
      });

      if (error) throw error;

      // Update session with last message preview
      await supabase
        .from('chat_sessions')
        .update({
          last_message_preview: content.substring(0, 50),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleStartTextSession = async () => {
    const sessionId = await createSession('text');
    if (sessionId) {
      setCurrentSessionId(sessionId);
      setCurrentView('text-chat');
      setMessages([]);
      await loadSessions();
    }
  };

  const handleStartVoiceSession = async () => {
    // Voice mode not implemented
  };

  const handleResumeSession = async (sessionId: string, type: 'text' | 'voice') => {
    setCurrentSessionId(sessionId);
    setCurrentView('text-chat');
    await loadMessages(sessionId);
  };

  const handleSend = async (text?: string) => {
    if (!currentSessionId) return;
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(currentSessionId, messageText, 'user');
    setInputText('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful healthcare assistant for Medi-Cal beneficiaries. Provide clear, empathetic, and accurate healthcare guidance. Focus on helping users find resources, understand their health needs, and navigate the healthcare system.',
          },
          ...conversationHistory,
          {
            role: 'user',
            content: messageText,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await saveMessage(currentSessionId, aiResponse, 'assistant');
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error. Please check your internet connection and try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExitSession = () => {
    setCurrentView('session-select');
    setCurrentSessionId(null);
    setMessages([]);
    setIsLoading(false);
    loadSessions();
  };

  // Session Selection View
  if (currentView === 'session-select') {
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
                source={require('../../assets/icon.png')}
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
                <Ionicons name="chatbubbles" size={48} color={Theme.colors.primary} />
                <Text style={styles.sessionTypeText}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sessionTypeButton}
                onPress={handleStartVoiceSession}
                activeOpacity={0.7}
              >
                <Ionicons name="mic" size={48} color={Theme.colors.primary} />
                <Text style={styles.sessionTypeText}>Voice</Text>
              </TouchableOpacity>
            </View>

            {sessions.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Resume Previous Session</Text>
                <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
                  {sessions.map((session) => (
                    <TouchableOpacity
                      key={session.id}
                      style={[
                        styles.sessionCard,
                        session.session_type === 'voice' && styles.voiceSessionCard,
                      ]}
                      onPress={() => handleResumeSession(session.id, session.session_type)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={session.session_type === 'voice' ? 'mic' : 'chatbubbles'}
                        size={24}
                        color={session.session_type === 'voice' ? Theme.colors.primary : Theme.colors.text}
                      />
                      <View style={styles.sessionCardContent}>
                        <Text style={styles.sessionCardTitle}>
                          {session.title || `${session.session_type === 'voice' ? 'Voice' : 'Text'} Chat`}
                        </Text>
                        {session.last_message_preview && (
                          <Text style={styles.sessionCardPreview} numberOfLines={1}>
                            {session.last_message_preview}
                          </Text>
                        )}
                        <Text style={styles.sessionCardDate}>
                          {format(new Date(session.updated_at), 'MMM d, yyyy h:mm a')}
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
  if (currentView === 'text-chat') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
              <TouchableOpacity onPress={handleExitSession} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
              <View style={styles.headerLeft}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
                <View>
                  <Text style={styles.title}>AI Assistant</Text>
                  <View style={styles.modeIndicator}>
                    <Ionicons name="chatbubbles" size={14} color={Theme.colors.primary} />
                    <Text style={styles.modeText}>Text</Text>
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
                    Hello! I'm your Medi-Pal AI assistant. How can I help you with your healthcare needs today?
                  </Text>
                </View>
              )}
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.role === 'user' ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userBubble : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.role === 'user' ? styles.userText : styles.aiText,
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
        <CustomTabBar />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
  },
  backButton: {
    padding: Theme.spacing.xs,
    marginRight: Theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: 'bold',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  sessionTypeButton: {
    flex: 1,
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundLight,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    alignItems: 'center',
    gap: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  voiceSessionCard: {
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
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
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.sm,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
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
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.textSecondary,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
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
    paddingVertical: Theme.spacing.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: Theme.colors.primary,
    opacity: 0.8,
  },
});
