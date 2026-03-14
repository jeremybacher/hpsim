'use client';

import { useState, useRef, useEffect } from 'react';
import type { Annotation } from '@/types/petriNet';

interface AnnotationNodeProps {
  annotation: Annotation;
  isSelected: boolean;
  isEditing: boolean;
  onCommitText: (id: string, text: string) => void;
  onCancelEdit: (id: string) => void;
}

export function AnnotationNode({
  annotation,
  isSelected,
  isEditing,
  onCommitText,
  onCancelEdit,
}: AnnotationNodeProps) {
  const [editText, setEditText] = useState(annotation.text || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditText(annotation.text || '');
      // Focus after a tick so the foreignObject is rendered
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, annotation.text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      onCommitText(annotation.id, editText);
    } else if (e.key === 'Escape') {
      onCancelEdit(annotation.id);
    }
  };

  const { x, y } = annotation.position;

  if (isEditing) {
    return (
      <foreignObject x={x - 80} y={y - 14} width={160} height={28}>
        <input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCommitText(annotation.id, editText)}
          style={{
            width: '100%',
            height: '100%',
            border: '1.5px solid hsl(var(--primary))',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '13px',
            fontFamily: 'inherit',
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            outline: 'none',
          }}
        />
      </foreignObject>
    );
  }

  const text = annotation.text || '';

  return (
    <g>
      {isSelected && (
        <rect
          x={x - 82}
          y={y - 14}
          width={164}
          height={28}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          rx={3}
        />
      )}
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fill="currentColor"
        style={{ userSelect: 'none', cursor: 'default' }}
      >
        {text || '(empty)'}
      </text>
    </g>
  );
}
