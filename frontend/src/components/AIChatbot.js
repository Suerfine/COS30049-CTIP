import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Send, Bot, User, X, MessageSquare, Sparkles } from 'lucide-react-native';

const AIChatBot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your SIGMAmed Assistant. How can I help you with your training today?", sender: 'ai', time: '9:41 AM' },
  ]);
  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef();

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    const userMsg = {
      id: Date.now(),
      text: inputText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");

    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: "That's an interesting question about park safety! I'm currently in dummy mode, but soon I'll be able to help you analyze course elements in real-time.",
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <View style={styles.botContainer}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.botIconCircle}>
            <Bot size={20} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>SIGMA AI Guide</Text>
            <Text style={styles.headerStatus}>Online | Powered by Gemini</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose}>
          <X size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.chatArea}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            style={[
              styles.messageWrapper, 
              msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper
            ]}
          >
            <View style={[
              styles.bubble, 
              msg.sender === 'user' ? styles.userBubble : styles.aiBubble
            ]}>
              <Text style={[
                styles.messageText, 
                msg.sender === 'user' ? styles.userText : styles.aiText
              ]}>
                {msg.text}
              </Text>
            </View>
            <Text style={styles.timestamp}>{msg.time}</Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Ask about safety protocols..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Send size={18} color="white" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  botContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 350,
    height: 500,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
},
  botIconCircle: { 
    width: 35, 
    height: 35, 
    borderRadius: 18, 
    backgroundColor: '#0a6340', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontWeight: 'bold', 
    fontSize: 14, 
    color: '#333' 
},
  headerStatus: { 
    fontSize: 10, 
    color: '#4caf50', 
    fontWeight: '600' 
},
  
  chatArea: { 
    flex: 1, 
    padding: 15 
},
  messageWrapper: { 
    marginBottom: 15, 
    maxWidth: '85%' 
},
  userWrapper: { 
    alignSelf: 'flex-end' 
},
  aiWrapper: { 
    alignSelf: 'flex-start' 
},
  
  bubble: { 
    padding: 12, 
    borderRadius: 15 
},
  userBubble: { 
    backgroundColor: '#0a6340', 
    borderBottomRightRadius: 2 
},
  aiBubble: { 
    backgroundColor: '#f0f2f5', 
    borderBottomLeftRadius: 2 
},
  
  messageText: { 
    fontSize: 14, 
    lineHeight: 20 
},
  userText: { 
    color: 'white' 
},
  aiText: { 
    color: '#333' 
},
  timestamp: { 
    fontSize: 9, 
    color: '#999', 
    marginTop: 4, 
    alignSelf: 'flex-end' 
},

  inputContainer: { 
    flexDirection: 'row', 
    padding: 10, 
    alignItems: 'center', 
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 14
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a6340',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendBtnDisabled: { 
    backgroundColor: '#ccc' 
}
});

export default AIChatBot;