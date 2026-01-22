import { useEffect, useCallback, useRef } from 'react';

const STORAGE_PREFIX = 'practice_answers_';

interface UseAutoSaveOptions {
  questionId: string | null;
  debounceMs?: number;
}

export function useAutoSave({ questionId, debounceMs = 1000 }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getStorageKey = useCallback((qId: string) => {
    return `${STORAGE_PREFIX}${qId}`;
  }, []);

  // Load saved answers from localStorage
  const loadSavedAnswers = useCallback((): Record<string, string> | null => {
    if (!questionId) return null;
    
    try {
      const saved = localStorage.getItem(getStorageKey(questionId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed as Record<string, string>;
        }
      }
    } catch (e) {
      console.warn('Error loading saved answers:', e);
    }
    return null;
  }, [questionId, getStorageKey]);

  // Save answers to localStorage with debounce
  const saveAnswers = useCallback((answers: Record<string, string>) => {
    if (!questionId) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      try {
        const hasContent = Object.values(answers).some(a => a.trim().length > 0);
        if (hasContent) {
          localStorage.setItem(getStorageKey(questionId), JSON.stringify(answers));
        }
      } catch (e) {
        console.warn('Error saving answers:', e);
      }
    }, debounceMs);
  }, [questionId, debounceMs, getStorageKey]);

  // Clear saved answers (call after successful submit)
  const clearSavedAnswers = useCallback(() => {
    if (!questionId) return;
    
    try {
      localStorage.removeItem(getStorageKey(questionId));
    } catch (e) {
      console.warn('Error clearing saved answers:', e);
    }
  }, [questionId, getStorageKey]);

  // Check if there are saved answers
  const hasSavedAnswers = useCallback((): boolean => {
    const saved = loadSavedAnswers();
    return saved !== null && Object.values(saved).some(a => a.trim().length > 0);
  }, [loadSavedAnswers]);

  // Get last save timestamp
  const getLastSaveTime = useCallback((): Date | null => {
    if (!questionId) return null;
    
    try {
      const timestampKey = `${getStorageKey(questionId)}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      return timestamp ? new Date(timestamp) : null;
    } catch {
      return null;
    }
  }, [questionId, getStorageKey]);

  // Update timestamp when saving
  const saveWithTimestamp = useCallback((answers: Record<string, string>) => {
    if (!questionId) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const hasContent = Object.values(answers).some(a => a.trim().length > 0);
        if (hasContent) {
          localStorage.setItem(getStorageKey(questionId), JSON.stringify(answers));
          localStorage.setItem(`${getStorageKey(questionId)}_timestamp`, new Date().toISOString());
        }
      } catch (e) {
        console.warn('Error saving answers:', e);
      }
    }, debounceMs);
  }, [questionId, debounceMs, getStorageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    loadSavedAnswers,
    saveAnswers: saveWithTimestamp,
    clearSavedAnswers,
    hasSavedAnswers,
    getLastSaveTime,
  };
}
