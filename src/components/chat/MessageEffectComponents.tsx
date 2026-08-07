import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { MessageEffectType } from '../../types/chat';

interface MessageEffectSelectorProps {
  selectedEffect: MessageEffectType | null;
  onSelectEffect: (effect: MessageEffectType | null) => void;
  isOpen: boolean;
  onClose: () => void;
  currentText?: string;
}

export const EFFECT_OPTIONS: { id: MessageEffectType; label: string; icon: string; desc: string; color: string }[] = [
  {
    id: 'GIFT',
    label: 'Hộp quà bí mật',
    icon: '🎁',
    desc: 'Che nội dung, người nhận phải bấm mở quà',
    color: 'from-amber-500 to-red-500',
  },
  {
    id: 'FIRE',
    label: 'Tin nhắn Bốc cháy',
    icon: '🔥',
    desc: 'Viền lửa rực rỡ xung quanh bong bóng chat',
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'BALLOON',
    label: 'Bóng bay rực rỡ',
    icon: '🎈',
    desc: 'Phun chùm bóng bay bay khắp màn hình',
    color: 'from-sky-400 to-indigo-500',
  },
  {
    id: 'HEART',
    label: 'Trái tim yêu thương',
    icon: '❤️',
    desc: 'Bắn hàng loạt trái tim lãng mạn',
    color: 'from-pink-500 to-rose-500',
  },
];

interface EffectLiveBubblePreviewProps {
  effectType: MessageEffectType;
  text: string;
  isSelected?: boolean;
  onSelect: () => void;
}

export const EffectLiveBubblePreview: React.FC<EffectLiveBubblePreviewProps> = ({
  effectType,
  text,
  isSelected,
  onSelect,
}) => {
  const displayText = text.trim() || 'Xin chào';
  const isGift = effectType === 'GIFT';

  return (
    /* Outer wrapper gives space for floating emoji decorations outside the bubble */
    <button
      type="button"
      onClick={onSelect}
      className="relative flex flex-col items-center gap-2 select-none cursor-pointer group"
      style={{ padding: '12px 8px 6px 8px' }}
    >
      {/* Floating emoji decorations — positioned relative to outer wrapper */}
      {effectType === 'HEART' && (
        <>
          <span className="pointer-events-none absolute top-0 left-1 text-base leading-none animate-bounce">💖</span>
          <span className="pointer-events-none absolute top-0 right-1 text-sm leading-none animate-pulse">💕</span>
          <span className="pointer-events-none absolute bottom-7 -right-1 text-sm leading-none animate-bounce">💗</span>
        </>
      )}
      {effectType === 'FIRE' && (
        <>
          <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-3 text-2xl leading-none animate-bounce">🔥</span>
          <span className="pointer-events-none absolute top-1/2 -translate-y-1/2 -right-3 text-2xl leading-none animate-pulse">🔥</span>
        </>
      )}
      {effectType === 'BALLOON' && (
        <>
          <span className="pointer-events-none absolute top-0 left-0 text-base leading-none animate-bounce">🎈</span>
          <span className="pointer-events-none absolute top-0 right-0 text-sm leading-none animate-pulse">🎈</span>
          <span className="pointer-events-none absolute bottom-7 right-0 text-xs leading-none animate-bounce">✨</span>
        </>
      )}

      {/* The actual chat bubble */}
      <div
        className={`relative z-10 overflow-hidden px-4 py-2 rounded-[20px] shadow-md transition-all duration-150 group-hover:scale-105 group-active:scale-95 ${
          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-purple-500 scale-105' : ''
        }`}
        style={{
          background: isGift
            ? 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #e11d48 100%)'
            : effectType === 'FIRE'
              ? 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)'
              : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
          minWidth: '90px',
          maxWidth: '160px',
        }}
      >
        {isGift ? (
          <>
            {/* Horizontal ribbon bar */}
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2.5 bg-white/90 shadow-sm" />
            {/* Vertical ribbon bar */}
            <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2.5 bg-white/90 shadow-sm" />
            {/* Center ribbon bow */}
            <div className="relative z-10 flex items-center justify-center py-0.5">
              <span className="text-base leading-none drop-shadow-md animate-pulse">🎀</span>
            </div>
          </>
        ) : (
          <span className="text-white font-bold text-xs whitespace-nowrap overflow-hidden text-ellipsis block max-w-[130px] drop-shadow-sm">
            {displayText}
          </span>
        )}
      </div>

      {/* Effect label */}
      <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
        {effectType === 'HEART' ? 'Trái tim' : effectType === 'FIRE' ? 'Bốc cháy' : effectType === 'GIFT' ? 'Hộp quà' : 'Bóng bay'}
      </span>
    </button>
  );
};

export const MessageEffectSelector: React.FC<MessageEffectSelectorProps> = ({
  selectedEffect,
  onSelectEffect,
  isOpen,
  onClose,
  currentText = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 z-50 mb-3 w-80 sm:w-96 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-3 shadow-2xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-600 dark:text-purple-400">
          <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
          <span>HIỆU ỨNG TIN NHẮN (MESSENGER)</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 px-2 pt-2 pb-1 truncate">
        Xem trước với tin nhắn: <span className="font-bold text-purple-600 dark:text-purple-400">"{currentText.trim() || 'Xin chào'}"</span>
      </div>

      {/* Horizontal scrollable row of live preview bubbles */}
      <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar px-1 py-3" style={{ scrollbarWidth: 'none' }}>
        {EFFECT_OPTIONS.map((opt) => {
          const isSelected = selectedEffect === opt.id;
          return (
            <div key={opt.id} className="flex-shrink-0">
              <EffectLiveBubblePreview
                effectType={opt.id}
                text={currentText}
                isSelected={isSelected}
                onSelect={() => {
                  onSelectEffect(isSelected ? null : opt.id);
                  onClose();
                }}
              />
            </div>
          );
        })}
      </div>

      {selectedEffect && (
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between px-2">
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
            ✨ Đã chọn: {EFFECT_OPTIONS.find(o => o.id === selectedEffect)?.label}
          </span>
          <button
            type="button"
            onClick={() => {
              onSelectEffect(null);
            }}
            className="text-xs font-bold text-rose-500 hover:underline px-2 py-0.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
          >
            Hủy chọn
          </button>
        </div>
      )}
    </div>
  );
};

interface GiftBoxMessageProps {
  isOpened: boolean;
  onOpen: () => void;
  children: React.ReactNode;
}

export const GiftBoxMessage: React.FC<GiftBoxMessageProps> = ({ isOpened, onOpen, children }) => {
  const [opening, setOpening] = useState(false);

  const handleOpenClick = () => {
    if (isOpened || opening) return;
    setOpening(true);
    setTimeout(() => {
      onOpen();
      setOpening(false);
    }, 300);
  };

  if (!isOpened) {
    return (
      <div
        className={`relative overflow-hidden rounded-[20px] bg-[#ec4899] px-4 py-2.5 text-white shadow-sm cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center min-w-[85px] min-h-[38px] ${
          opening ? 'animate-gift-unwrap' : ''
        }`}
        onClick={handleOpenClick}
      >
        {/* Horizontal Ribbon */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2.5 bg-white/90 shadow-sm" />
        {/* Vertical Ribbon */}
        <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2.5 bg-white/90 shadow-sm" />

        {/* Center Ribbon Bow (Static, no bounce, no text) */}
        <span className="relative z-10 text-lg leading-none drop-shadow-sm">
          🎀
        </span>
      </div>
    );
  }

  return <>{children}</>;
};

interface FireMessageWrapperProps {
  children: React.ReactNode;
}

export const FireMessageWrapper: React.FC<FireMessageWrapperProps> = ({ children }) => {
  return (
    <div className="relative p-1 rounded-3xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 animate-pulse shadow-lg shadow-orange-500/30">
      <div className="absolute -top-3 left-4 text-sm animate-bounce select-none">🔥</div>
      <div className="absolute -bottom-2 right-4 text-sm animate-bounce select-none delay-150">🔥</div>
      {children}
    </div>
  );
};

interface MessageEffectFrameProps {
  effectType?: MessageEffectType;
  children: React.ReactNode;
}

/** Keeps the selected effect attached to the message bubble after it is sent. */
export const MessageEffectFrame: React.FC<MessageEffectFrameProps> = ({ effectType, children }) => {
  if (!effectType) return <>{children}</>;

  return (
    <div
      className={`message-effect-frame relative isolate w-fit overflow-visible ${
        effectType === 'FIRE'
          ? 'rounded-[22px] ring-2 ring-orange-400/90 shadow-lg shadow-orange-500/35'
          : ''
      }`}
      data-message-effect={effectType}
    >
      {effectType === 'HEART' && (
        <>
          <span className="message-effect-particle absolute -left-3 -top-4 z-20 text-2xl" aria-hidden="true">💖</span>
          <span className="message-effect-particle message-effect-particle-delay absolute -right-3 -top-3 z-20 text-lg" aria-hidden="true">💕</span>
          <span className="message-effect-particle absolute -bottom-3 -left-2 z-20 text-lg" aria-hidden="true">💗</span>
          <span className="message-effect-particle message-effect-particle-delay absolute -bottom-2 -right-3 z-20 text-xl" aria-hidden="true">💓</span>
        </>
      )}
      {effectType === 'FIRE' && (
        <>
          <span className="pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 z-20 text-2xl leading-none animate-bounce" aria-hidden="true">🔥</span>
          <span className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 z-20 text-2xl leading-none animate-pulse" aria-hidden="true">🔥</span>
        </>
      )}
      {effectType === 'BALLOON' && (
        <>
          <span className="message-effect-particle absolute -left-3 -top-5 z-20 text-2xl" aria-hidden="true">🎈</span>
          <span className="message-effect-particle message-effect-particle-delay absolute -right-3 -top-4 z-20 text-xl" aria-hidden="true">🎈</span>
          <span className="message-effect-particle absolute -bottom-3 right-3 z-20 text-base" aria-hidden="true">✨</span>
        </>
      )}
      {children}
    </div>
  );
};

interface ParticleEffectOverlayProps {
  type: 'BALLOON' | 'HEART' | 'FIRE';
  onFinished?: () => void;
}

export const ParticleEffectOverlay: React.FC<ParticleEffectOverlayProps> = ({ type, onFinished }) => {
  const [particles] = useState(() => {
    const items = [];
    const emoji =
      type === 'BALLOON'
        ? ['🎈', '🎈', '🎉', '🎊', '✨', '🎈']
        : type === 'HEART'
        ? ['❤️', '💖', '💕', '💗', '💓', '❤️']
        : ['🔥', '💥', '✨', '🔥', '⚡', '🔥'];
    for (let i = 0; i < 32; i++) {
      items.push({
        id: i,
        char: emoji[Math.floor(Math.random() * emoji.length)],
        left: Math.random() * 92 + 4, // 4% to 96%
        size: Math.random() * 1.6 + 1.5, // 1.5rem to 3.1rem
        duration: Math.random() * 1.2 + 2.6, // 2.6s to 3.8s
        delay: Math.random() * 0.9,
      });
    }
    return items;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinished) onFinished();
    }, 4200);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 select-none animate-float-up opacity-95 drop-shadow-lg"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}rem`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
};
