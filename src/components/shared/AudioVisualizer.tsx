import React, { useEffect, useState, useRef } from 'react';

interface AudioVisualizerProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ state, isActive }) => {
  const [pulseScale, setPulseScale] = useState(1);
  const [morph, setMorph] = useState(0);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      setPulseScale(1);
      setMorph(0);
      return;
    }

    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (state === 'listening') {
        setPulseScale(1 + Math.sin(elapsed / 140) * 0.06 + Math.cos(elapsed / 260) * 0.02);
        setMorph((Math.sin(elapsed / 420) + 1) / 2);
      } else if (state === 'speaking') {
        setPulseScale(1.08 + Math.sin(elapsed / 90) * 0.09 + Math.cos(elapsed / 170) * 0.04);
        setMorph((Math.sin(elapsed / 180) + 1) / 2);
      } else if (state === 'thinking') {
        setPulseScale(1.02 + Math.sin(elapsed / 300) * 0.03);
        setMorph((Math.sin(elapsed / 700) + 1) / 2);
      } else {
        setPulseScale(1 + Math.sin(elapsed / 1200) * 0.015);
        setMorph((Math.sin(elapsed / 1000) + 1) / 2);
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, state]);

  const getTheme = () => {
    switch (state) {
      case 'listening':
        return {
          base: 'from-teal-300 via-cyan-500 to-sky-600',
          glow: 'bg-cyan-400/30',
          line: 'rgba(45, 212, 191, 0.92)',
        };
      case 'speaking':
        return {
          base: 'from-violet-400 via-fuchsia-500 to-pink-500',
          glow: 'bg-pink-500/30',
          line: 'rgba(236, 72, 153, 0.92)',
          extraGlow: 'rgba(251, 191, 36, 0.48)',
        };
      case 'thinking':
        return {
          base: 'from-blue-400 via-indigo-500 to-violet-600',
          glow: 'bg-indigo-400/25',
          line: 'rgba(99, 102, 241, 0.86)',
        };
      default:
        return {
        base: 'from-slate-600 via-slate-700 to-slate-900',
        glow: 'bg-slate-600/20',
        line: 'rgba(148, 163, 184, 0.72)',
        extraGlow: 'rgba(148, 163, 184, 0)',
        };
    }
  };

  const theme = getTheme();
  const shapeRadius = `${38 + Math.round(morph * 14)}% ${62 - Math.round(morph * 12)}% ${48 + Math.round(morph * 8)}% ${52 - Math.round(morph * 10)}% / ${44 + Math.round(morph * 16)}% ${56 - Math.round(morph * 8)}% ${58 - Math.round(morph * 10)}% ${42 + Math.round(morph * 12)}%`;

  return (
    <div className="relative flex items-center justify-center w-full h-80 py-10 perspective-1000">
      <div
        className={`absolute w-72 h-72 rounded-full blur-[100px] transition-all duration-1000 mix-blend-screen ${theme.glow}`}
        style={{ transform: `scale(${pulseScale * 1.3})` }}
      />
      <div
        className={`absolute w-56 h-56 rounded-full blur-[60px] transition-all duration-700 mix-blend-screen opacity-60 ${theme.glow}`}
        style={{ transform: `scale(${pulseScale * 1.1})` }}
      />

      <div className="relative w-60 h-60 flex items-center justify-center">
        <div
          className="absolute inset-1 border border-white/15 transition-all duration-200"
          style={{
            borderRadius: shapeRadius,
            transform: `scale(${1.03 + (pulseScale - 1) * 0.55})`,
            opacity: isActive ? 0.95 : 0.45,
            borderColor: theme.line,
          }}
        />

        <div
          className="absolute inset-7 border border-white/10 transition-all duration-200"
          style={{
            borderRadius: shapeRadius,
            transform: `scale(${1 + (pulseScale - 1) * 0.95})`,
            borderColor: theme.line,
          }}
        />

        <div
          className={`relative w-36 h-36 overflow-hidden border border-white/15 ${theme.base} bg-gradient-to-br transition-all duration-150`}
          style={{
            borderRadius: shapeRadius,
            transform: `scale(${1 + (pulseScale - 1) * 1.08})`,
            borderColor: theme.line,
            boxShadow: `0 0 80px ${theme.line.replace(/0\.\d+\)$/, '0.22)')}, 0 0 120px ${theme.extraGlow}`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.22)_0%,_transparent_68%)]" />
          <div className={`absolute inset-0 opacity-40 ${state === 'thinking' ? 'animate-spin-slow' : 'animate-spin-extra-slow'}`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent" />
          </div>
          <div className="absolute inset-[32%] rounded-full bg-white/15 blur-xl" />
        </div>

      </div>
    </div>
  );
};

export default AudioVisualizer;
