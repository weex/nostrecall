import { useState, useCallback } from 'react';

interface FeedbackState {
  isOpen: boolean;
  hasSubmitted: boolean;
}

export function useFeedback() {
  const [state, setState] = useState<FeedbackState>({
    isOpen: false,
    hasSubmitted: false,
  });

  const openFeedback = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeFeedback = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const markSubmitted = useCallback(() => {
    setState(prev => ({ ...prev, hasSubmitted: true, isOpen: false }));
    sessionStorage.setItem('feedback-submitted', 'true');
  }, []);

  return {
    isOpen: state.isOpen,
    hasSubmitted: state.hasSubmitted,
    openFeedback,
    closeFeedback,
    markSubmitted,
  };
}