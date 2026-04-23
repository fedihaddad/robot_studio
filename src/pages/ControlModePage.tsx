import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RobotMode } from '../types';
import { ROBOT_MODES, getModeCapabilities } from '../config/robotModes.config';
import { useAppStore } from '../store/appStore';
import ModeIcon from '../components/shared/ModeIcon';
import AudioVisualizer from '../components/shared/AudioVisualizer';
import { GeminiService } from '../services/gemini/gemini.service';
import { MultimodalLiveResponseType } from '../services/gemini/geminiLiveAPI.js';

interface ControlModePageProps {
  onModeChange?: (mode: RobotMode) => Promise<boolean>;
  isConnected?: boolean;
}

const ControlModePage: React.FC<ControlModePageProps> = ({ onModeChange, isConnected = true }) => {
  const { currentMode, setCurrentMode, saveModePreference } = useAppStore();
  const [isChanging, setIsChanging] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [lastToolCall, setLastToolCall] = useState<string | null>(null);
  const [modeToast, setModeToast] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const modeCapabilities = getModeCapabilities(currentMode);
  const isAudioActiveRef = useRef(false);
  const isVideoActiveRef = useRef(false);
  const currentModeRef = useRef<RobotMode>(currentMode);
  const modeCapsRef = useRef(modeCapabilities);

  const [geminiService] = useState(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.1-flash-live-preview';
    return new GeminiService(apiKey, model);
  });

  useEffect(() => {
    isAudioActiveRef.current = isAudioActive;
  }, [isAudioActive]);
  useEffect(() => {
    isVideoActiveRef.current = isVideoActive;
  }, [isVideoActive]);
  useEffect(() => {
    currentModeRef.current = currentMode;
    modeCapsRef.current = modeCapabilities;
  }, [currentMode, modeCapabilities]);

  const onGeminiResponse = useCallback((response: any) => {
    if (response.type === MultimodalLiveResponseType.AUDIO) {
      setVoiceState('speaking');
    } else if (response.type === MultimodalLiveResponseType.TURN_COMPLETE) {
      setVoiceState('listening');
    } else if (response.type === MultimodalLiveResponseType.INTERRUPTED) {
      setVoiceState('listening');
    } else if (response.type === MultimodalLiveResponseType.TOOL_CALL) {
      setVoiceState('thinking');
    }
  }, []);

  useEffect(() => {
    // Reconfigure mode (system prompt + tools) whenever mode changes
    geminiService.configureForMode(currentMode);
  }, [currentMode, geminiService]);

  useEffect(() => {
    // If the server closes the socket during a hot mode update, auto-recover
    // without forcing the user to click Stop/Start again.
    geminiService.setOnConnectionClosed(async () => {
      if (!isAudioActiveRef.current) return;
      try {
        // Re-apply current mode then reconnect
        geminiService.configureForMode(currentModeRef.current);
        await geminiService.start(onGeminiResponse);
        setVoiceState('listening');

        if (modeCapsRef.current.allowVisionAnalysis && isVideoActiveRef.current) {
          await geminiService.startVideo();
        }
      } catch (e) {
        console.error('Auto-restart Gemini failed:', e);
        setIsAudioActive(false);
        setVoiceState('idle');
      }
    });
  }, [geminiService, onGeminiResponse]);

  useEffect(() => {
    return () => {
      if (geminiService.isActive()) {
        geminiService.stop();
      }
    };
  }, [geminiService]);

  const toggleAudioInteraction = async () => {
    if (isAudioActive) {
      geminiService.stop();
      setIsAudioActive(false);
      setVoiceState('idle');
    } else {
      setIsAudioActive(true);
      setVoiceState('listening');
      
      // Configure mode (full system instruction + tools)
      geminiService.configureForMode(currentMode);

      // Set tool call UI feedback
      geminiService.setOnToolCall((toolName: string, args: any) => {
        setLastToolCall(toolName);
        setTimeout(() => setLastToolCall(null), 3000);
      });
      
      try {
        await geminiService.start(onGeminiResponse);

        if (modeCapabilities.allowVisionAnalysis && isVideoActive) {
          await geminiService.startVideo();
        }
      } catch (error) {
        console.error('Failed to start Gemini service:', error);
        setIsAudioActive(false);
        setVoiceState('idle');
      }
    }
  };

  const toggleVideo = async () => {
    if (isVideoActive) {
      geminiService.stopVideo();
      setIsVideoActive(false);
    } else {
      setIsVideoActive(true);
      if (isAudioActive) {
        await geminiService.startVideo();
      }
    }
  };

  const handleModeChange = async (newMode: RobotMode) => {
    if (newMode === currentMode) return;

    setIsChanging(true);
    try {
      let rosPublishSuccess = false;
      if (onModeChange && isConnected) {
        rosPublishSuccess = await onModeChange(newMode);
      }

      // Always apply mode locally for Gemini hot-update without session restart.
      // ROS publication is best-effort and should not block local mode switching.
      setCurrentMode(newMode);
      saveModePreference();
      geminiService.configureForMode(newMode);

      // UX feedback: confirm mode change immediately.
      setModeToast({
        type: 'success',
        message: `✅ Mode changed: ${getModeCapabilities(newMode).label}`,
      });
      window.setTimeout(() => setModeToast(null), 2200);

      if (isConnected && onModeChange && !rosPublishSuccess) {
        console.warn(`Mode switched locally to ${newMode}, but ROS mode publish failed.`);
        setModeToast({
          type: 'warning',
          message: `⚠️ Mode changed locally, but robot publish failed`,
        });
        window.setTimeout(() => setModeToast(null), 3200);
      }
    } catch (error) {
      console.error('Error changing mode:', error);
      // Keep local mode switching resilient even when remote mode publication fails.
      setCurrentMode(newMode);
      saveModePreference();
      geminiService.configureForMode(newMode);
      setModeToast({
        type: 'success',
        message: `✅ Mode changed: ${getModeCapabilities(newMode).label}`,
      });
      window.setTimeout(() => setModeToast(null), 2200);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col bg-[#020617] text-white overflow-hidden relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />

      {/* Top Header */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-md">
            Live Axel
          </h1>
          <p className="text-slate-400 font-medium">Voice-activated robot control & operational modes</p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-bold border backdrop-blur-md ${
          isConnected ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        }`}>
          {isConnected ? '● Online' : '○ Offline Mode'}
        </div>
      </div>

      {/* Mode toast */}
      {modeToast && (
        <div
          className={`fixed top-20 right-6 z-[160] px-4 py-3 rounded-xl border shadow-2xl backdrop-blur ${
            modeToast.type === 'success'
              ? 'bg-emerald-900/25 border-emerald-500/25 text-emerald-200'
              : 'bg-amber-900/25 border-amber-500/25 text-amber-200'
          }`}
        >
          <p className="text-sm font-bold">{modeToast.message}</p>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Left Side: Audio Visualizer (The Main Experience) */}
        <div className="flex-[1.5] flex flex-col items-center justify-center glass-card rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute top-6 left-6 flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isAudioActive ? 'bg-cyan-500 animate-pulse' : 'bg-slate-600'}`}></div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               {voiceState === 'idle' ? 'Ready to listen' : `System: ${voiceState.toUpperCase()}`}
             </span>
          </div>

          <AudioVisualizer state={voiceState} isActive={isAudioActive} />

          <div className="mt-8 text-center max-w-md">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {voiceState === 'idle' && "AXEL is standby"}
              {voiceState === 'listening' && "AXEL is listening..."}
              {voiceState === 'thinking' && "AXEL is processing..."}
              {voiceState === 'speaking' && "AXEL is responding..."}
            </h2>
            
            {/* Tool call indicator */}
            {lastToolCall && (
              <div className="mt-2 mb-4 flex items-center justify-center gap-2 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                <span className="text-xs font-mono text-amber-400/80">⚡ {lastToolCall}</span>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={toggleAudioInteraction}
                className={`group relative px-8 py-4 rounded-2xl font-bold transition-all shadow-2xl overflow-hidden ${
                  isAudioActive 
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 text-white shadow-cyan-500/20'
                }`}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 relative z-10">
                  {isAudioActive ? (
                     <>
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       <span>Stop Listening</span>
                     </>
                  ) : (
                     <>
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                       <span>Start AI Voice Mode</span>
                     </>
                  )}
                </div>
              </button>

              {modeCapabilities.allowVisionAnalysis && (
                <button
                  onClick={toggleVideo}
                  className={`group relative px-6 py-4 rounded-2xl font-bold transition-all shadow-2xl overflow-hidden ${
                    isVideoActive 
                      ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/20' 
                      : 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{isVideoActive ? 'Stop Vision' : 'Enable Vision'}</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Mode Details & Selection */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {/* Active Mode Card */}
          <div className={`rounded-3xl border-2 p-6 transition-all duration-500 relative overflow-hidden ${modeCapabilities.borderColor} ${modeCapabilities.bgColor}`}>
             <div className="absolute top-4 right-4 opacity-10">
               <ModeIcon iconName={modeCapabilities.icon} className="w-24 h-24" />
             </div>
             <div className="relative z-10">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Active Configuration</span>
               <div className="flex items-center gap-3 mb-3">
                 <ModeIcon iconName={modeCapabilities.icon} className={`w-10 h-10 ${modeCapabilities.color}`} />
                 <h3 className={`text-2xl font-bold ${modeCapabilities.color}`}>{modeCapabilities.label}</h3>
               </div>
               <p className="text-sm text-slate-300 leading-relaxed">
                 {modeCapabilities.description}
               </p>
             </div>
          </div>

          {/* Mode Selection List */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-2">Available Modes</h4>
            {Object.values(ROBOT_MODES).map((mode) => {
              const isActive = mode.mode === currentMode;
              return (
                <button
                  key={mode.mode}
                  onClick={() => handleModeChange(mode.mode as RobotMode)}
                  disabled={isChanging || isActive}
                  className={`w-full group glass-card rounded-2xl p-4 flex items-center justify-between transition-all hover:scale-[1.02] ${
                    isActive ? 'ring-2 ring-cyan-500/50 bg-cyan-500/5 border-cyan-500/30' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                       <ModeIcon iconName={mode.icon} className={`w-6 h-6 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className={`font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>{mode.label}</p>
                      <p className="text-xs text-slate-500">{mode.description.substring(0, 40)}...</p>
                    </div>
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlModePage;
