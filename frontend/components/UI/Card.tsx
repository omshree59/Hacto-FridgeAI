import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function Card({
  children,
  className = '',
  style,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-light)',
        ...style,
      }}
      className={`rounded-2xl border transition-all duration-200 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}
