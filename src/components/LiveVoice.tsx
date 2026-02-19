import React, { useEffect, useRef, useState } from 'react';
import { geminiService } from '../services/gemini';
import { Mic, MicOff, X, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { arrayBufferToBase64, downsampleBuffer, convertFloat32ToInt16 } from '../utils/audio';

interface LiveVoiceProps {
  onClose: () => void;
}

export const LiveVoice: React.FC<LiveVoiceProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        
        // Setup Analyser for visualizer
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;

        // Connect to Gemini Live
        const session = await geminiService.connectLive({
          onopen: () => {
            console.log('Live Session Connected');
            setIsConnected(true);
            startAudioInput();
          },
          onmessage: (message: any) => {
            handleAudioOutput(message);
          },
          onclose: () => {
            console.log('Live Session Closed');
            setIsConnected(false);
          },
          onerror: (error: any) => {
            console.error('Live Session Error:', error);
            setIsConnected(false);
          }
        });
        sessionRef.current = session;

      } catch (error) {
        console.error('Failed to initialize Live Voice:', error);
      }
    };

    init();

    return () => {
      stopAudioInput();
      if (sessionRef.current) {
        // sessionRef.current.close(); 
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startAudioInput = async () => {
    if (!audioContextRef.current || !sessionRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(analyserRef.current!); // For visualizer
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        if (isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Downsample to 16kHz
        const downsampled = downsampleBuffer(inputData, audioContextRef.current!.sampleRate, 16000);
        // Convert to Int16
        const pcm16 = convertFloat32ToInt16(downsampled);
        // Convert to Base64
        const base64Audio = arrayBufferToBase64(pcm16);

        sessionRef.current.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio
          }
        });
      };
      
      visualize();

    } catch (error) {
      console.error('Microphone Error:', error);
    }
  };

  const stopAudioInput = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
  };

  const handleAudioOutput = async (message: any) => {
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && audioContextRef.current) {
      try {
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const pcmData = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
            float32Data[i] = pcmData[i] / 32768.0;
        }

        const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
        audioBuffer.getChannelData(0).set(float32Data);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        const currentTime = audioContextRef.current.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime;
        }
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;

      } catch (error) {
        console.error('Audio Playback Error:', error);
      }
    }
  };

  const visualize = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for(let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    setVolume(average);

    animationFrameRef.current = requestAnimationFrame(visualize);
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-primary)]/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 pointer-events-none" />
      
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-110 transition-all shadow-lg"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex flex-col items-center gap-12 relative z-10">
        <div className="relative">
          {/* Pulsing Circles */}
          <motion.div 
            animate={{ scale: 1 + (volume / 40), opacity: 0.5 - (volume / 200) }}
            className="w-64 h-64 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30"
          />
          <motion.div 
            animate={{ scale: 1 + (volume / 60) }}
            className="w-40 h-40 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center relative z-10 shadow-2xl shadow-[var(--accent-primary)]/50"
          >
            {!isConnected ? (
              <Loader2 className="w-16 h-16 text-white animate-spin" />
            ) : (
              <div className="relative">
                <Sparkles className="w-16 h-16 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                <Mic className="w-16 h-16 text-white relative z-10" />
              </div>
            )}
          </motion.div>
        </div>

        <div className="text-center space-y-3">
          <h2 className="text-4xl font-display font-bold text-[var(--text-primary)] tracking-tight">
            {isConnected ? 'Listening...' : 'Connecting...'}
          </h2>
          <p className="text-[var(--text-secondary)] text-lg font-medium">Speak naturally to Orbit</p>
        </div>

        <div className="flex gap-6">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`p-6 rounded-full transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 ${
              isMuted 
                ? 'bg-red-500 text-white shadow-red-500/30' 
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>
      </div>
    </div>
  );
};
