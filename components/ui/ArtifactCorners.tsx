import React from 'react';

interface ArtifactCornersProps {
  color?: string;
}

export const ArtifactCorners: React.FC<ArtifactCornersProps> = ({ color = '#888' }) => {
  return (
    <>
      <svg aria-hidden="true" className="absolute top-3 left-3 w-3.5 h-3.5 pointer-events-none" viewBox="0 0 16 16" fill="none">
        <path d="M1 9 L1 1 L9 1" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </svg>
      <svg aria-hidden="true" className="absolute top-3 right-3 w-3.5 h-3.5 pointer-events-none" viewBox="0 0 16 16" fill="none">
        <path d="M15 9 L15 1 L7 1" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </svg>
      <svg aria-hidden="true" className="absolute bottom-3 left-3 w-3.5 h-3.5 pointer-events-none" viewBox="0 0 16 16" fill="none">
        <path d="M1 7 L1 15 L9 15" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </svg>
      <svg aria-hidden="true" className="absolute bottom-3 right-3 w-3.5 h-3.5 pointer-events-none" viewBox="0 0 16 16" fill="none">
        <path d="M15 7 L15 15 L7 15" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </svg>
    </>
  );
};
