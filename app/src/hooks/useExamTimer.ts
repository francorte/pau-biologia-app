import { useState, useEffect, useCallback, useRef } from 'react';

interface UseExamTimerProps {
  initialMinutes: number;
  onTimeUp?: () => void;
  onWarning?: () => void;
  warningMinutes?: number;
  autoStart?: boolean;
}

interface UseExamTimerReturn {
  timeRemaining: number; // in seconds
  isRunning: boolean;
  isTimeUp: boolean;
  isWarning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  formattedTime: string;
  percentageRemaining: number;
}

export function useExamTimer({
  initialMinutes,
  onTimeUp,
  onWarning,
  warningMinutes = 5,
  autoStart = false,
}: UseExamTimerProps): UseExamTimerReturn {
  const initialSeconds = initialMinutes * 60;
  const warningSeconds = warningMinutes * 60;
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);
  const onWarningRef = useRef(onWarning);
  const warningTriggeredRef = useRef(false);

  // Keep callback refs updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    onWarningRef.current = onWarning;
  }, [onWarning]);

  // Reset warning triggered when timer is reset
  useEffect(() => {
    if (timeRemaining === initialSeconds) {
      warningTriggeredRef.current = false;
      setIsWarning(false);
    }
  }, [timeRemaining, initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          
          // Check for warning threshold
          if (newTime === warningSeconds && !warningTriggeredRef.current) {
            warningTriggeredRef.current = true;
            setIsWarning(true);
            onWarningRef.current?.();
          }
          
          if (newTime <= 0) {
            setIsRunning(false);
            setIsTimeUp(true);
            onTimeUpRef.current?.();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, warningSeconds]);

  const start = useCallback(() => {
    if (timeRemaining > 0) {
      setIsRunning(true);
    }
  }, [timeRemaining]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(initialSeconds);
    setIsRunning(false);
    setIsTimeUp(false);
    setIsWarning(false);
    warningTriggeredRef.current = false;
  }, [initialSeconds]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const percentageRemaining = (timeRemaining / initialSeconds) * 100;

  return {
    timeRemaining,
    isRunning,
    isTimeUp,
    isWarning,
    start,
    pause,
    reset,
    formattedTime: formatTime(timeRemaining),
    percentageRemaining,
  };
}
