import React, { useEffect, useState, useRef } from 'react';

interface AudioVisualizerProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ state, isActive }) => {
  const [pulseScale, setPulseScale] = useState(1);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!isActive) return;

    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (state === 'listening') {
        // Mocking voice activity with some randomness
        setPulseScale(1 + Math.sin(elapsed / 100) * 0.1 + Math.random() * 0.05);
      } else if (state === 'speaking') {
        setPulseScale(1.1 + Math.sin(elapsed / 80) * 0.15);
      } else if (state === 'thinking') {
        setPulseScale(1.05 + Math.sin(elapsed / 200) * 0.05);
      } else {
        setPulseScale(1 + Math.sin(elapsed / 1000) * 0.03);
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, state]);

  return (
    <div className="relative flex items-center justify-center w-full h-80 py-10">
      {/* Outer Glows */}
      <div 
        className={`absolute w-64 h-64 rounded-full blur-[80px] transition-all duration-1000 ${
          state === 'listening' ? 'bg-cyan-500/30' : 
          state === 'thinking' ? 'bg-purple-500/30' : 
          state === 'speaking' ? 'bg-blue-500/30' : 
          'bg-slate-700/20'
        }`}
        style={{ transform: `scale(${pulseScale * 1.2})` }}
      />
      
      <div 
        className={`absolute w-48 h-48 rounded-full blur-[40px] transition-all duration-700 ${
          state === 'listening' ? 'bg-cyan-400/40' : 
          state === 'thinking' ? 'bg-indigo-400/40' : 
          state === 'speaking' ? 'bg-blue-400/40' : 
          'bg-slate-600/30'
        }`}
        style={{ transform: `scale(${pulseScale * 1.1})` }}
      />

      {/* Main Orb Container */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Rotating Rings (Thinking state) */}
        {state === 'thinking' && (
          <div className="absolute inset-0 border-2 border-dashed border-indigo-400/30 rounded-full animate-spin-slow" />
        )}
        
        {/* Waveform Circles (Listening state) */}
        {state === 'listening' && (
          <>
            <div className="absolute inset-0 border border-cyan-400/40 rounded-full animate-ping opacity-20" />
            <div className="absolute inset-[-10px] border border-cyan-300/20 rounded-full animate-ping opacity-10" style={{ animationDelay: '0.5s' }} />
          </>
        )}

        {/* The Central Gem / Orb */}
        <div 
          className={`relative w-32 h-32 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden transition-all duration-500 border border-white/10 ${
            state === 'listening' ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600' :
            state === 'thinking' ? 'bg-gradient-to-tr from-purple-500 via-indigo-600 to-blue-500' :
            state === 'speaking' ? 'bg-gradient-to-bl from-blue-400 via-cyan-500 to-teal-400' :
            'bg-slate-800'
          }`}
          style={{ transform: `scale(${pulseScale})` }}
        >
          {/* Animated Interior Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
          
          {/* Fluid movement inside the orb */}
          <div 
            className={`absolute -inset-full opacity-60 mix-blend-overlay transition-transform duration-1000 ${
              isActive ? 'animate-pulse' : ''
            }`}
            style={{ 
              background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.2), transparent)',
              transform: `rotate(${Date.now() / 20}deg)`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioVisualizer;
