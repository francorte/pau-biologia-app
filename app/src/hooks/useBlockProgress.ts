import { useEffect, useCallback, useRef } from 'react';

const STORAGE_PREFIX = 'practice_block_';

interface BlockProgress {
  answers: Record<string, Record<string, string>>; // questionId -> partId -> answer
  currentQuestionIndex: number;
  lastUpdated: string;
}

interface UseBlockProgressOptions {
  blockId: string | null;
  debounceMs?: number;
}

export function useBlockProgress({ blockId, debounceMs = 1000 }: UseBlockProgressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getStorageKey = useCallback((bId: string) => {
    return `${STORAGE_PREFIX}${bId}`;
  }, []);

  // Load saved block progress from localStorage
  const loadBlockProgress = useCallback((): BlockProgress | null => {
    if (!blockId) return null;
    
    try {
      const saved = localStorage.getItem(getStorageKey(blockId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.answers) {
          return parsed as BlockProgress;
        }
      }
    } catch (e) {
      console.warn('Error loading block progress:', e);
    }
    return null;
  }, [blockId, getStorageKey]);

  // Save block progress to localStorage with debounce
  const saveBlockProgress = useCallback((
    answers: Record<string, Record<string, string>>,
    currentQuestionIndex: number
  ) => {
    if (!blockId) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      try {
        const hasContent = Object.values(answers).some(
          questionAnswers => Object.values(questionAnswers).some(a => a.trim().length > 0)
        );
        
        if (hasContent || currentQuestionIndex > 0) {
          const progress: BlockProgress = {
            answers,
            currentQuestionIndex,
            lastUpdated: new Date().toISOString(),
          };
          localStorage.setItem(getStorageKey(blockId), JSON.stringify(progress));
        }
      } catch (e) {
        console.warn('Error saving block progress:', e);
      }
    }, debounceMs);
  }, [blockId, debounceMs, getStorageKey]);

  // Clear saved block progress (call after successful submit of all questions)
  const clearBlockProgress = useCallback(() => {
    if (!blockId) return;
    
    try {
      localStorage.removeItem(getStorageKey(blockId));
    } catch (e) {
      console.warn('Error clearing block progress:', e);
    }
  }, [blockId, getStorageKey]);

  // Check if there is saved progress
  const hasBlockProgress = useCallback((): boolean => {
    const saved = loadBlockProgress();
    if (!saved) return false;
    
    return Object.values(saved.answers).some(
      questionAnswers => Object.values(questionAnswers).some(a => a.trim().length > 0)
    ) || saved.currentQuestionIndex > 0;
  }, [loadBlockProgress]);

  // Get last save timestamp
  const getLastSaveTime = useCallback((): Date | null => {
    const progress = loadBlockProgress();
    return progress ? new Date(progress.lastUpdated) : null;
  }, [loadBlockProgress]);

  // Get answers for a specific question
  const getQuestionAnswers = useCallback((questionId: string): Record<string, string> => {
    const progress = loadBlockProgress();
    return progress?.answers[questionId] || {};
  }, [loadBlockProgress]);

  // Get total answered questions count
  const getAnsweredQuestionsCount = useCallback((): number => {
    const progress = loadBlockProgress();
    if (!progress) return 0;
    
    return Object.values(progress.answers).filter(
      questionAnswers => Object.values(questionAnswers).some(a => a.trim().length > 0)
    ).length;
  }, [loadBlockProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    loadBlockProgress,
    saveBlockProgress,
    clearBlockProgress,
    hasBlockProgress,
    getLastSaveTime,
    getQuestionAnswers,
    getAnsweredQuestionsCount,
  };
}
