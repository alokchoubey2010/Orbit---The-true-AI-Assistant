import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Chat } from './components/Chat';
import { Dashboard } from './components/Dashboard';
import { LiveVoice } from './components/LiveVoice';
import { Mic, MessageSquare, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AppContent: React.FC = () => {
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [mobileView, setMobileView] = useState<'chat' | 'dashboard'>('chat');
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-20 flex-col items-center py-6 border-r border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl z-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center mb-8 shadow-lg shadow-[var(--accent-primary)]/20">
          <div className="w-4 h-4 bg-white rounded-full" />
        </div>
        
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => setIsLiveMode(false)}
            className={`p-3 rounded-xl transition-all duration-300 ${!isLiveMode ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsLiveMode(true)}
            className={`p-3 rounded-xl transition-all duration-300 ${isLiveMode ? 'bg-[var(--bg-tertiary)] text-[var(--accent-secondary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <Mic className="w-6 h-6" />
          </button>
        </nav>

        <div className="mt-auto">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Header & Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)] flex items-center justify-around z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setMobileView('chat')}
          className={`p-2 flex flex-col items-center gap-1 transition-colors ${mobileView === 'chat' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button 
          onClick={() => setIsLiveMode(true)}
          className="p-3 -mt-6 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full text-white shadow-lg shadow-[var(--accent-primary)]/40 hover:scale-105 transition-transform"
        >
          <Mic className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setMobileView('dashboard')}
          className={`p-2 flex flex-col items-center gap-1 transition-colors ${mobileView === 'dashboard' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        
        {/* Chat Panel */}
        <div className={`
          flex-1 md:w-[450px] md:flex-none flex flex-col border-r border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]/80 backdrop-blur-md z-10
          ${mobileView === 'chat' ? 'flex' : 'hidden md:flex'}
        `}>
          <div className="h-16 border-b border-[var(--bg-tertiary)] flex items-center justify-between px-6 bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
            <h1 className="font-display font-semibold text-lg tracking-tight bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
              Orbit Assistant
            </h1>
            <div className="md:hidden">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <Chat />
        </div>

        {/* Dashboard Panel */}
        <div className={`
          flex-1 bg-[var(--bg-primary)] relative flex flex-col
          ${mobileView === 'dashboard' ? 'flex' : 'hidden md:flex'}
        `}>
          {/* Decorative Gradient Blob */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-primary)]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--accent-secondary)]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="h-16 border-b border-[var(--bg-tertiary)] flex items-center px-8 justify-between relative z-10 shrink-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm">
            <h2 className="text-[var(--text-secondary)] text-sm font-medium uppercase tracking-wider">Dashboard</h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--bg-secondary)] shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-[var(--text-secondary)]">System Online</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0 scroll-smooth">
            <Dashboard />
          </div>
        </div>

        {/* Live Voice Overlay */}
        <AnimatePresence>
          {isLiveMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50"
            >
              <LiveVoice onClose={() => setIsLiveMode(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
