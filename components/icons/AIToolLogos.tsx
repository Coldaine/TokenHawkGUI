'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

// Authentic SVG brand marks for major AI tools
export const ClaudeLogo = ({ className = 'w-4 h-4', size = 16 }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ color: '#d97706' }}
  >
    <path d="M4.5 12a7.5 7.5 0 0 1 15 0 7.5 7.5 0 0 1-15 0Zm7.5-6a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V7a1 1 0 0 0-1-1Zm0 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-4.24-8.24a1 1 0 0 0-1.42 1.41l2.83 2.83a1 1 0 0 0 1.42-1.41L7.76 7.76Zm9.9 9.9a1 1 0 0 0-1.42 1.41l2.83 2.83a1 1 0 0 0 1.42-1.41l-2.83-2.83ZM6.34 17.66a1 1 0 0 0 1.42 1.41l2.83-2.83a1 1 0 0 0-1.42-1.41l-2.83 2.83Zm9.9-9.9a1 1 0 0 0 1.42 1.41l2.83-2.83a1 1 0 0 0-1.42-1.41l-2.83 2.83Z" />
  </svg>
);

export const OpenAILogo = ({ className = 'w-4 h-4', size = 16 }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ color: '#10b981' }}
  >
    <path d="M22.28 9.37a5.98 5.98 0 0 0-.52-4.83 6.07 6.07 0 0 0-6.22-2.95A6.03 6.03 0 0 0 11.2 0a6.05 6.05 0 0 0-5.77 4.2A6.03 6.03 0 0 0 1.7 7.07a6.07 6.07 0 0 0 .52 6.84 6.03 6.03 0 0 0 .52 4.83 6.07 6.07 0 0 0 6.22 2.95 6.03 6.03 0 0 0 4.33 1.59 6.05 6.05 0 0 0 5.77-4.2 6.03 6.03 0 0 0 3.73-2.87 6.07 6.07 0 0 0-.51-6.84Zm-8.4 12.3a4.53 4.53 0 0 1-2.93-1.07l.14-.08 4.86-2.8a.78.78 0 0 0 .39-.68v-6.86l2.06 1.19a.07.07 0 0 1 .04.06v5.7a4.56 4.56 0 0 1-4.56 4.54ZM3.88 17.58a4.52 4.52 0 0 1-.54-3.08l.14.08 4.86 2.8a.77.77 0 0 0 .78 0l5.94-3.43v2.38a.07.07 0 0 1-.03.06l-4.94 2.85a4.56 4.56 0 0 1-6.25-1.66ZM2.4 8.78a4.54 4.54 0 0 1 2.39-2.01v5.76a.77.77 0 0 0 .39.67l5.94 3.43-2.06 1.19a.07.07 0 0 1-.07 0L4.05 15a4.56 4.56 0 0 1-1.66-6.22Zm15.5 3.12-5.94-3.43 2.06-1.19a.07.07 0 0 1 .07 0l4.94 2.85a4.55 4.55 0 0 1-.74 8.2v-5.76a.77.77 0 0 0-.39-.67Zm2.22-3.8-4.86-2.8a.77.77 0 0 0-.78 0L8.54 8.73V6.35a.07.07 0 0 1 .03-.06l4.94-2.85a4.56 4.56 0 0 1 6.79 4.74l-.14-.08ZM10.87 13.5l-2.65-1.53 2.65-1.53 2.65 1.53-2.65 1.53Z" />
  </svg>
);

export const CursorLogo = ({ className = 'w-4 h-4', size = 16 }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ color: '#3b82f6' }}
  >
    <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

export const MidjourneyLogo = ({ className = 'w-4 h-4', size = 16 }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ color: '#ec4899' }}
  >
    <path d="M2 18h20" />
    <path d="M5 18 12 4l7 14" />
    <path d="m9 18 3-7 3 7" />
  </svg>
);

export const PerplexityLogo = ({ className = 'w-4 h-4', size = 16 }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ color: '#06b6d4' }}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v18" />
    <path d="M3 12h18" />
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </svg>
);

export const ElevenLabsLogo = ({ className = 'w-4 h-4', size = 16 }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ color: '#8b5cf6' }}
  >
    <rect x="7" y="4" width="3.5" height="16" rx="1.5" />
    <rect x="13.5" y="4" width="3.5" height="16" rx="1.5" />
  </svg>
);

export const CopilotLogo = ({ className = 'w-4 h-4', size = 16 }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ color: '#94a3b8' }}
  >
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.8c.85 0 1.7.11 2.5.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);

export const GeminiLogo = ({ className = 'w-4 h-4', size = 16 }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ color: '#38bdf8' }}
  >
    <path d="M12 24c0-6.627-5.373-12-12-12 6.627 0 12-5.373 12-12 0 6.627 5.373 12 12 12-6.627 0-12 5.373-12 12Z" />
  </svg>
);

export function getToolLogo(name: string, size = 16) {
  const lower = name.toLowerCase();
  if (lower.includes('claude')) return <ClaudeLogo size={size} />;
  if (lower.includes('chatgpt') || lower.includes('openai')) return <OpenAILogo size={size} />;
  if (lower.includes('cursor')) return <CursorLogo size={size} />;
  if (lower.includes('midjourney')) return <MidjourneyLogo size={size} />;
  if (lower.includes('perplexity')) return <PerplexityLogo size={size} />;
  if (lower.includes('eleven')) return <ElevenLabsLogo size={size} />;
  if (lower.includes('copilot') || lower.includes('github')) return <CopilotLogo size={size} />;
  if (lower.includes('gemini')) return <GeminiLogo size={size} />;
  return <OpenAILogo size={size} />;
}
