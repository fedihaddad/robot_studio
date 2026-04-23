import React, { useState } from 'react';

type BannerTone = 'info' | 'warning' | 'error';

type StatusBannerProps = {
  tone: BannerTone;
  title: string;
  description?: string;
  placement?: 'inline' | 'floating-left';
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
  }>;
  onDismiss?: () => void;
};

const toneStyles: Record<BannerTone, { wrap: string; icon: string; title: string; desc: string }> = {
  info: {
    wrap: 'bg-cyan-950/55 border-cyan-500/20',
    icon: 'bg-cyan-500',
    title: 'text-cyan-100',
    desc: 'text-cyan-200/80',
  },
  warning: {
    wrap: 'bg-amber-950/55 border-amber-500/20',
    icon: 'bg-amber-400',
    title: 'text-amber-100',
    desc: 'text-amber-200/80',
  },
  error: {
    wrap: 'bg-rose-950/55 border-rose-500/20',
    icon: 'bg-rose-400',
    title: 'text-rose-100',
    desc: 'text-rose-200/80',
  },
};

const StatusBanner: React.FC<StatusBannerProps> = ({ tone, title, description, placement, actions, onDismiss }) => {
  const s = toneStyles[tone];
  const isFloatingLeft = placement === 'floating-left';
  const [isMinimized, setIsMinimized] = useState<boolean>(isFloatingLeft);

  if (isFloatingLeft && isMinimized) {
    return (
      <button
        className={[
          'fixed left-4 top-[72px] z-[150] flex items-center gap-2 rounded-full border px-3 py-2 shadow-2xl backdrop-blur',
          'bg-slate-950/70 border-slate-700/60 text-slate-100 hover:bg-slate-950/85 transition-colors',
        ].join(' ')}
        onClick={() => setIsMinimized(false)}
        title={title}
        aria-label="Open status banner"
      >
        <span className={`w-2 h-2 rounded-full ${s.icon}`} />
        <span className={`text-xs font-bold ${s.title}`}>{title}</span>
        <span className="text-[11px] opacity-70">›</span>
      </button>
    );
  }

  return (
    <div
      className={[
        'rounded-2xl border px-4 py-3 flex items-start gap-3',
        s.wrap,
        isFloatingLeft
          ? 'fixed left-6 top-[72px] z-[150] w-[360px] max-w-[calc(100vw-2rem)] shadow-2xl backdrop-blur'
          : 'mx-6 mt-4',
      ].join(' ')}
    >
      <span className={`mt-1 w-2.5 h-2.5 rounded-full ${s.icon}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`font-bold text-sm ${s.title}`}>{title}</p>
            {description && <p className={`text-xs mt-1 ${s.desc} break-words`}>{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {isFloatingLeft && (
              <button
                onClick={() => setIsMinimized(true)}
                className="text-xs opacity-70 hover:opacity-100 transition-opacity text-white"
                aria-label="Minimize banner"
                title="Minimize"
              >
                –
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs opacity-70 hover:opacity-100 transition-opacity text-white"
                aria-label="Dismiss banner"
                title="Dismiss"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                disabled={a.disabled}
                className={
                  a.variant === 'primary'
                    ? 'axel-button-primary px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50'
                    : 'axel-button-secondary px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50'
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusBanner;

