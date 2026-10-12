'use client';

import React, { useState } from 'react';

interface PlayerPhotoProps {
  src?: string | null;
  name?: string;
  className?: string;
  onClick?: () => void;
}

const PALETTE = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#4f46e5'];

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

// Player avatar that falls back to coloured initials when there is no photo or it fails to load.
// Size/shape come entirely from `className`, so it drops in wherever an <img> was used.
export default function PlayerPhoto({ src, name, className = '', onClick }: PlayerPhotoProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || ''}
        loading="lazy"
        onClick={onClick}
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }

  const color = PALETTE[[...(name || '')].reduce((h, c) => h + c.charCodeAt(0), 0) % PALETTE.length];
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={name} onClick={onClick} className={className}>
      <rect width="100" height="100" fill={color} />
      <text
        x="50" y="50" dy="0.35em" textAnchor="middle" fill="#fff"
        fontSize="38" fontWeight="700" fontFamily="system-ui, sans-serif"
      >
        {initialsOf(name)}
      </text>
    </svg>
  );
}
