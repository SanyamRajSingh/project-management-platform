import React from 'react';

interface FlowtideMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Flowtide Brand Mark
 * A clean, minimalist geometric "F" / flowing-wave inspired symbol.
 * Communicates clarity, flow, and modern productivity.
 */
export function FlowtideMark({ size = 20, className = 'h-5 w-5', ...props }: FlowtideMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Top flow wave / upper bar of 'F' */}
      <path
        d="M4 6C7.5 4.5 12.5 4.5 20 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Middle flow wave / central bar of 'F' */}
      <path
        d="M4 12C7 10.8 11 10.8 16.5 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Dynamic vertical stem of 'F' */}
      <path
        d="M4.5 5.5V18.5C4.5 19.3 5.2 20 6 20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default FlowtideMark;
