import React, { useState } from 'react';

interface BookCoverProps {
  title: string;
  author: string;
  category: string;
  edition?: string;
  publisher?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface CoverPalette {
  bg: string;
  spine: string;
  rule: string;
  accent: string;
  text: string;
  muted: string;
  motif: 'grid' | 'arch' | 'circles' | 'lines' | 'columns' | 'compass';
}

const CATEGORY_PALETTES: Record<string, CoverPalette> = {
  'Management & Finance': {
    bg: '#163A2E',
    spine: '#0F2920',
    rule: 'rgba(232, 224, 205, 0.28)',
    accent: '#D9A760',
    text: '#F7F4EC',
    muted: 'rgba(247, 244, 236, 0.72)',
    motif: 'arch',
  },
  'Computer Science & IT': {
    bg: '#1B2A41',
    spine: '#121D2E',
    rule: 'rgba(226, 232, 240, 0.24)',
    accent: '#7CA5D8',
    text: '#F5F7FA',
    muted: 'rgba(245, 247, 250, 0.72)',
    motif: 'grid',
  },
  'Commerce & Accounting': {
    bg: '#4A202A',
    spine: '#34151C',
    rule: 'rgba(243, 232, 220, 0.26)',
    accent: '#E2B48D',
    text: '#FAF5F0',
    muted: 'rgba(250, 245, 240, 0.72)',
    motif: 'columns',
  },
  'Engineering & Sciences': {
    bg: '#24343B',
    spine: '#182429',
    rule: 'rgba(226, 236, 238, 0.25)',
    accent: '#7BB6A6',
    text: '#F4F8F8',
    muted: 'rgba(244, 248, 248, 0.72)',
    motif: 'circles',
  },
  'Law & Humanities': {
    bg: '#3B2F23',
    spine: '#292017',
    rule: 'rgba(245, 236, 222, 0.26)',
    accent: '#D5B27A',
    text: '#FAF6EE',
    muted: 'rgba(250, 246, 238, 0.74)',
    motif: 'lines',
  },
  'Competitive & Entrance': {
    bg: '#2A2F3B',
    spine: '#1C2029',
    rule: 'rgba(233, 236, 242, 0.24)',
    accent: '#D29B6B',
    text: '#F6F7F9',
    muted: 'rgba(246, 247, 249, 0.72)',
    motif: 'compass',
  },
};

const DEFAULT_PALETTE = CATEGORY_PALETTES['Management & Finance'];

function CoverMotif({ motif, color }: { motif: CoverPalette['motif']; color: string }) {
  if (motif === 'grid') {
    return (
      <svg viewBox="0 0 120 56" className="w-full h-10 opacity-45" aria-hidden="true">
        <line x1="0" y1="14" x2="120" y2="14" stroke={color} strokeWidth="0.75" />
        <line x1="0" y1="28" x2="120" y2="28" stroke={color} strokeWidth="0.75" />
        <line x1="0" y1="42" x2="120" y2="42" stroke={color} strokeWidth="0.75" />
        <line x1="24" y1="0" x2="24" y2="56" stroke={color} strokeWidth="0.75" />
        <line x1="60" y1="0" x2="60" y2="56" stroke={color} strokeWidth="0.75" />
        <line x1="96" y1="0" x2="96" y2="56" stroke={color} strokeWidth="0.75" />
        <circle cx="60" cy="28" r="10" fill="none" stroke={color} strokeWidth="1.2" />
      </svg>
    );
  }
  if (motif === 'circles') {
    return (
      <svg viewBox="0 0 120 56" className="w-full h-10 opacity-45" aria-hidden="true">
        <circle cx="38" cy="28" r="20" fill="none" stroke={color} strokeWidth="0.9" />
        <circle cx="60" cy="28" r="20" fill="none" stroke={color} strokeWidth="0.9" />
        <circle cx="82" cy="28" r="20" fill="none" stroke={color} strokeWidth="0.9" />
      </svg>
    );
  }
  if (motif === 'columns') {
    return (
      <svg viewBox="0 0 120 56" className="w-full h-10 opacity-45" aria-hidden="true">
        <rect x="12" y="28" width="14" height="24" fill="none" stroke={color} strokeWidth="0.9" />
        <rect x="34" y="18" width="14" height="34" fill="none" stroke={color} strokeWidth="0.9" />
        <rect x="56" y="10" width="14" height="42" fill="none" stroke={color} strokeWidth="0.9" />
        <rect x="78" y="22" width="14" height="30" fill="none" stroke={color} strokeWidth="0.9" />
        <line x1="4" y1="52" x2="112" y2="52" stroke={color} strokeWidth="0.9" />
      </svg>
    );
  }
  if (motif === 'lines') {
    return (
      <svg viewBox="0 0 120 56" className="w-full h-10 opacity-45" aria-hidden="true">
        <path d="M10 46 L60 10 L110 46" fill="none" stroke={color} strokeWidth="1" />
        <path d="M26 46 L60 22 L94 46" fill="none" stroke={color} strokeWidth="0.8" />
        <line x1="10" y1="46" x2="110" y2="46" stroke={color} strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 56" className="w-full h-10 opacity-45" aria-hidden="true">
      <path d="M16 50 A44 44 0 0 1 104 50" fill="none" stroke={color} strokeWidth="1" />
      <path d="M32 50 A28 28 0 0 1 88 50" fill="none" stroke={color} strokeWidth="0.8" />
      <line x1="8" y1="50" x2="112" y2="50" stroke={color} strokeWidth="0.9" />
    </svg>
  );
}

export const BookCover: React.FC<BookCoverProps> = ({
  title,
  author,
  category,
  edition,
  publisher,
  imageUrl,
  size = 'md',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const palette = CATEGORY_PALETTES[category] ?? DEFAULT_PALETTE;
  const hasPhoto = Boolean(imageUrl && imageUrl.trim().length > 0 && !imgFailed);

  if (hasPhoto) {
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#EAE7E0] border border-black/8">
        <img
          src={imageUrl}
          alt={`Cover of ${title} by ${author}`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const paddingClass =
    size === 'sm' ? 'p-3 pl-4' : size === 'lg' ? 'p-7 pl-9' : 'p-5 pl-6';
  const titleClass =
    size === 'sm'
      ? 'text-xs leading-snug line-clamp-3'
      : size === 'lg'
        ? 'text-2xl leading-tight line-clamp-4'
        : 'text-base leading-snug line-clamp-3';

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg select-none flex flex-col justify-between ${paddingClass}`}
      style={{
        backgroundColor: palette.bg,
        color: palette.text,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
      aria-label={`Textbook cover: ${title} by ${author}`}
    >
      {/* Tactile cloth book spine crease */}
      <div
        className="absolute inset-y-0 left-0 w-2.5"
        style={{ backgroundColor: palette.spine }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 left-2.5 w-px"
        style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
        aria-hidden="true"
      />

      {/* Top edition / category line */}
      <div className="relative z-10 flex items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: palette.rule }}>
        <span
          className="text-[10px] font-medium tracking-wider truncate"
          style={{ color: palette.accent }}
        >
          {category}
        </span>
        {edition && size !== 'sm' && (
          <span
            className="text-[10px] font-mono-tabular shrink-0"
            style={{ color: palette.muted }}
          >
            {edition}
          </span>
        )}
      </div>

      {/* Central Title & Author */}
      <div className="relative z-10 my-auto py-3">
        <h3 className={`font-display font-semibold tracking-tight ${titleClass}`}>
          {title || 'Untitled Textbook'}
        </h3>
        {size !== 'sm' && (
          <p
            className="mt-2 text-xs line-clamp-2"
            style={{ color: palette.muted }}
          >
            {author || 'Academic Author'}
          </p>
        )}
      </div>

      {/* Geometric Academic Motif & Publisher Colophon */}
      <div className="relative z-10 pt-2 border-t" style={{ borderColor: palette.rule }}>
        {size !== 'sm' && <CoverMotif motif={palette.motif} color={palette.accent} />}
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px]" style={{ color: palette.muted }}>
          <span className="truncate">{publisher || 'Academic Press'}</span>
          <span className="font-mono-tabular shrink-0">BookLoop</span>
        </div>
      </div>
    </div>
  );
};
