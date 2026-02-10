import { useState, useEffect, useCallback } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypewriterText({ text, speed = 25, className = '', onComplete }: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  const skip = useCallback(() => {
    if (!done) {
      setDisplayed(text);
      setDone(true);
      onComplete?.();
    }
  }, [done, text, onComplete]);

  return (
    <span className={className} onClick={skip} style={{ cursor: done ? 'default' : 'pointer' }}>
      {displayed}
      {!done && <span className="animate-pulse text-gold">▌</span>}
    </span>
  );
}
