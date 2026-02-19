import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { geminiService } from '../services/gemini';
import { Mic, Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playAudioData } from '../utils/audio';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export const Chat: React.FC = () => {
  const { events, tasks, executeAction } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await geminiService.sendMessage(input, { events, tasks });
      
      if (response) {
        let actionResult = '';
        if (response.action && response.action !== 'UNKNOWN_INTENT') {
           actionResult = await executeAction(response.action, response.data);
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: response.response_message || actionResult || "I've processed your request.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (assistantMessage.text) {
            const audioData = await geminiService.generateSpeech(assistantMessage.text);
            if (audioData) {
                playAudio(audioData);
            }
        }
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        text: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      setIsPlaying(true);
      const source = await playAudioData(base64Audio, 24000);
      source.onended = () => setIsPlaying(false);
    } catch (error) {
      console.error("Failed to play audio:", error);
      setIsPlaying(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)] border-r border-[var(--bg-tertiary)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/30 animate-float">
                  <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[var(--bg-secondary)] p-2 rounded-full shadow-md">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-display font-semibold text-[var(--text-primary)]">Hello! I'm Orbit.</h3>
              <p className="text-sm max-w-[200px]">I can help manage your calendar, tasks, and reminders.</p>
            </div>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-br-none'
                    : 'bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-bl-none border border-[var(--bg-tertiary)]'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isProcessing && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex justify-start"
           >
               <div className="bg-[var(--bg-primary)] p-4 rounded-2xl rounded-bl-none border border-[var(--bg-tertiary)] flex items-center gap-3 shadow-sm">
                   <div className="flex gap-1">
                     <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-[var(--accent-primary)] rounded-full" />
                     <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-[var(--accent-secondary)] rounded-full" />
                     <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-[var(--accent-tertiary)] rounded-full" />
                   </div>
                   <span className="text-xs font-medium text-[var(--text-secondary)]">Thinking...</span>
               </div>
           </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2 bg-[var(--bg-primary)] p-2 rounded-2xl border border-[var(--bg-tertiary)] focus-within:border-[var(--accent-primary)]/50 focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/10 transition-all shadow-sm">
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30' 
                : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type or speak..."
            className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-sm font-medium px-2"
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="p-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[var(--accent-primary)]/20 hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
