import React from 'react';

interface CoffeeLogoIconProps {
  className?: string;
}

export const CoffeeLogoIcon: React.FC<CoffeeLogoIconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <g transform="rotate(-24 32 32)">
      <ellipse cx="32" cy="32" rx="19" ry="26" fill="#6F4427" stroke="#2D180C" strokeWidth="2.5" />
      <ellipse cx="27" cy="24" rx="7.5" ry="12.5" fill="#8C5935" opacity="0.55" />
      <path
        d="M32 7 C25 18.5, 39 29, 32 32 C25 35, 39 45.5, 32 57"
        stroke="#241208"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M33.2 9 C26.6 19.5, 39.8 29, 33.2 32 C26.6 35, 39.8 44.5, 33.2 55"
        stroke="#E4AE74"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
        fill="none"
      />
    </g>
  </svg>
);
