import React, { useState, useEffect } from 'react';
import { RobotMode } from '../types';
import { ROBOT_MODES, getModeCapabilities } from '../config/robotModes.config';
import { useAppStore } from '../store/appStore';
import ModeIcon from '../components/shared/ModeIcon';
import AudioVisualizer from '../components/shared/AudioVisualizer';

interface ControlModePageProps {
  onModeChange?: (mode: RobotMode) => Promise<boolean>;
  isConnected?: boolean;
}

const ControlModePage: React.FC<ControlModePageProps> = ({ onModeChange, isConnected = true }) => {
  const { currentMode, setCurrentMode, saveModePreference } = useAppStore();
  const [isChanging, setIsChanging] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isAudioActive, setIsAudioActive] = useState(false);
  const modeCapabilities = getModeCapabilities(currentMode);

  // Mock interaction flow for demonstration
  const toggleAudioInteraction = () => {
    if (isAudioActive) {
      setIsAudioActive(false);
      setVoiceState('idle');
    } else {
      setIsAudioActive(true);
      setVoiceState('listening');
      
      // Simulate a conversation flow
      setTimeout(() => setVoiceState('thinking'), 3000);
      setTimeout(() => setVoiceState('speaking'), 5000);
      setTimeout(() => setVoiceState('listening'), 8000);
    }
  };

  const handleModeChange = async (newMode: RobotMode) => {
    if (newMode === currentMode) return;

    setIsChanging(true);
    try {
      let success = false;
      if (onModeChange && isConnected) {
        success = await onModeChange(newMode);
      } else {
        success = true;
      }

      if (success || !isConnected) {
        setCurrentMode(newMode);
        saveModePreference();
      }
    } catch (error) {
      console.error('Error changing mode:', error);
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
            AXEL AI Interaction
          </h1>
          <p className="text-slate-400 font-medium">Voice-activated robot control & operational modes</p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-bold border backdrop-blur-md ${
          isConnected ? 'bg-green-500/10 text-green-300 border-green-500/20' : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        }`}>
          {isConnected ? '● Online' : '○ Offline Mode'}
        </div>
      </div>

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
            
            {modeCapabilities.systemPrompt && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8 max-w-lg mx-auto backdrop-blur-sm">
                <p className="text-xs font-mono text-blue-400 uppercase tracking-widest mb-1">Operational Directive</p>
                <p className="text-sm text-slate-300 italic">
                  "{modeCapabilities.systemPrompt}"
                </p>
              </div>
            )}

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
