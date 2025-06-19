'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '@/components/icons';

interface TimerProps {
  startTime: number | null;
  onTick?: (elapsedSeconds: number) => void;
}

export function Timer({ startTime, onTick }: TimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (startTime === null) {
      setElapsedSeconds(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const seconds = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(seconds);
      if (onTick) onTick(seconds);
    };

    updateTimer(); // Initial call to set timer immediately
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, onTick]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2 rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground shadow-inner">
      <Icons.Timer className="h-5 w-5" />
      <span>Time Elapsed: {formatTime(elapsedSeconds)}</span>
    </div>
  );
}
