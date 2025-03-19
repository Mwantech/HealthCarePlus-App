import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

// Types
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

interface ChatResponse {
    status?: string;
    message?: string;
    response?: string;
    next_question?: string;
    session_id?: string;
    possible_conditions?: Array<{
      name: string;
      probability: number;
    }>;
    error?: string;
    result?: string;
    suggestions?: string[];
    [key: string]: any;
}

const API_URL = 'http://192.168.19.185:5000/api';

// New color scheme: black, pink, white
const CustomColors = {
  light: {
    primary: '#FF69B4', // Pink
    background: '#FFFFFF', // White
    text: '#000000', // Black
    tabBar: '#FFFFFF', // White
    label: '#666666',
    shadow: 'rgba(0, 0, 0, 0.1)',
    inputBackground: '#F5F5F5',
    messageBubbleUser: '#FF69B4', // Pink
    messageBubbleBot: '#FFFFFF', // White
  },
  dark: {
    primary: '#FF69B4', // Pink
    background: '#000000', // Black
    text: '#FFFFFF', // White
    tabBar: '#000000', // Black
    label: '#AAAAAA',
    shadow: 'rgba(0, 0, 0, 0.3)',
    inputBackground: '#222222',
    messageBubbleUser: '#FF69B4', // Pink
    messageBubbleBot: '#222222', // Dark gray
  },
};

const HealthChatbotScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = CustomColors[isDark ? 'dark' : 'light'];
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Start a new session when the component mounts
  useEffect(() => {
    startNewSession();
  }, []);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const startNewSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/start_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: ChatResponse = await response.json();

      if (data.status === 'success' && data.session_id) {
        setSessionId(data.session_id);
        
        const welcomeMessage: Message = {
          id: 1,
          text: data.response || "Hello! I'm Nova, your health assistant. How can I help you today?",
          sender: 'bot',
        };
        
        setMessages([welcomeMessage]);
        setError('');
      } else {
        setError('Failed to start a new session');
      }
    } catch (err) {
      setError('Unable to connect to the health service. Please try again later.');
      console.error('Start session error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Modified handleSend function to format responses properly
  const handleSend = async (): Promise<void> => {
    if (!inputText.trim() || !sessionId) return;
  
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
    };
    
    setMessages(prev => [...prev, userMessage]);
    const sentMessage = inputText;
    setInputText('');
    setIsLoading(true);
    
    try {
      console.log('Sending message to API:', {
        session_id: sessionId,
        message: sentMessage,
      });
  
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: sentMessage,
        }),
      });
  
      // Log the raw response for debugging
      const rawText = await response.text();
      console.log('Raw API response:', rawText);
      
      // Try to parse the response as JSON
      let data: ChatResponse;
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error('Invalid response format from server');
      }
  
      console.log('Parsed API response:', data);
  
      // Check if the response is in the expected format
      if (!data) {
        throw new Error('Empty response from server');
      }
  
      // Format the response text properly
      let botResponseText = '';
      
      // If there's a direct response message, use it
      if (data.response) {
        // Replace HTML tags with proper formatting
        botResponseText = data.response.replace(/<br>/g, '\n');
      } else if (data.message) {
        botResponseText = data.message.replace(/<br>/g, '\n');
      }
      
      // Add next question if available
      if (data.next_question) {
        botResponseText += botResponseText ? '\n\n' : '';
        botResponseText += data.next_question;
      }
      
      // Add possible conditions if available
      if (data.possible_conditions && data.possible_conditions.length > 0) {
        botResponseText += '\n\nPossible conditions:';
        data.possible_conditions.forEach(condition => {
          botResponseText += `\n- ${condition.name} (${Math.round(condition.probability * 100)}%)`;
        });
      }
      
      // If we still don't have any content, use a fallback message
      if (!botResponseText) {
        botResponseText = "I've received your message but I'm not sure how to respond. Please try rephrasing or contact support if this issue persists.";
      }
      
      const botResponse: Message = {
        id: messages.length + 2,
        text: botResponseText,
        sender: 'bot',
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Only set an error if status is explicitly 'error'
      if (data.status === 'error') {
        setError(data.message || 'The server reported an error processing your request');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('Chat request error:', err);
      setError(`Unable to communicate with the health service: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      await fetch(`${API_URL}/end_session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });
      
      // Start a new session
      startNewSession();
    } catch (err) {
      console.error('End session error:', err);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { borderBottomColor: colors.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Health Assistant
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={endSession}
        >
          <Feather name="refresh-cw" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Chat window taking up most of the space */}
      <ScrollView 
        ref={scrollViewRef}
        style={[styles.chatWindow, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.sender === 'user' ? styles.userMessageRow : styles.botMessageRow,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.sender === 'user' 
                  ? [styles.userMessage, { backgroundColor: colors.messageBubbleUser }]
                  : [styles.botMessage, { backgroundColor: colors.messageBubbleBot, borderColor: colors.primary }],
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  { color: message.sender === 'user' ? '#FFFFFF' : colors.text },
                ]}
              >
                {message.text}
              </Text>
            </View>
          </View>
        ))}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.label }]}>
              Nova is typing...
            </Text>
          </View>
        )}
      </ScrollView>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Input section fixed at the bottom */}
      <View style={[styles.inputContainer, { 
        backgroundColor: colors.background,
        borderTopColor: colors.primary,
        borderTopWidth: 1,
      }]}>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.inputBackground,
              color: colors.text,
              borderColor: colors.primary,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your symptoms..."
          placeholderTextColor={colors.label}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading || !sessionId}
        >
          <Feather 
            name="send" 
            size={20} 
            color={!inputText.trim() || !sessionId ? colors.label : '#fff'} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
  },
  chatWindow: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  botMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    borderBottomRightRadius: 4,
  },
  botMessage: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default HealthChatbotScreen;