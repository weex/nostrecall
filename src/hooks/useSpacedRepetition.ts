import { useCallback } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { useLocalStorage } from './useLocalStorage';

export interface ReviewRecord {
  eventId: string;
  reviews: number[]; // Array of timestamps when reviews were completed
  level: number; // Current spaced repetition level (0-4)
}

export interface ReviewStats {
  total: number;
  dueForReview: number;
  mastered: number;
  learning: number;
}

// Spaced repetition intervals in days
const REVIEW_INTERVALS = [1, 3, 7, 14]; // 1 day, 3 days, 1 week, 2 weeks

export function useSpacedRepetition() {
  const [reviewRecords, setReviewRecords] = useLocalStorage<Record<string, ReviewRecord>>('spaced-repetition-reviews', {});

  const getReviewRecord = useCallback((eventId: string): ReviewRecord => {
    return reviewRecords[eventId] || {
      eventId,
      reviews: [],
      level: 0,
    };
  }, [reviewRecords]);

  const markReviewed = useCallback((eventId: string) => {
    const now = Date.now();
    const record = getReviewRecord(eventId);
    
    const updatedRecord: ReviewRecord = {
      ...record,
      reviews: [...record.reviews, now],
      level: Math.min(record.level + 1, REVIEW_INTERVALS.length),
    };

    setReviewRecords(prev => ({
      ...prev,
      [eventId]: updatedRecord,
    }));
  }, [getReviewRecord, setReviewRecords]);

  const getNextReviewDate = useCallback((event: NostrEvent): Date | null => {
    const record = getReviewRecord(event.id);
    
    // If never reviewed, next review is based on creation date + first interval
    if (record.reviews.length === 0) {
      const createdAt = new Date(event.created_at * 1000);
      const nextReview = new Date(createdAt);
      nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[0]);
      return nextReview;
    }

    // If completed all levels, no more reviews needed
    if (record.level >= REVIEW_INTERVALS.length) {
      return null;
    }

    // Calculate next review based on last review + current interval
    const lastReview = new Date(record.reviews[record.reviews.length - 1]);
    const nextReview = new Date(lastReview);
    nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[record.level]);
    
    return nextReview;
  }, [getReviewRecord]);

  const isDueForReview = useCallback((event: NostrEvent): boolean => {
    const nextReview = getNextReviewDate(event);
    if (!nextReview) return false; // Mastered notes don't need review
    
    return nextReview <= new Date();
  }, [getNextReviewDate]);

  const getNotesForReview = useCallback((notes: NostrEvent[]): NostrEvent[] => {
    return notes.filter(isDueForReview);
  }, [isDueForReview]);

  const getReviewStats = useCallback((notes: NostrEvent[]): ReviewStats => {
    const total = notes.length;
    const dueForReview = notes.filter(isDueForReview).length;
    const mastered = notes.filter(note => {
      const record = getReviewRecord(note.id);
      return record.level >= REVIEW_INTERVALS.length;
    }).length;
    const learning = total - mastered;

    return {
      total,
      dueForReview,
      mastered,
      learning,
    };
  }, [isDueForReview, getReviewRecord]);

  const getReviewProgress = useCallback((event: NostrEvent) => {
    const record = getReviewRecord(event.id);
    const nextReview = getNextReviewDate(event);
    const isMastered = record.level >= REVIEW_INTERVALS.length;
    
    return {
      level: record.level,
      maxLevel: REVIEW_INTERVALS.length,
      reviewCount: record.reviews.length,
      nextReview,
      isDue: isDueForReview(event),
      isMastered,
      progress: (record.level / REVIEW_INTERVALS.length) * 100,
    };
  }, [getReviewRecord, getNextReviewDate, isDueForReview]);

  const resetProgress = useCallback((eventId: string) => {
    setReviewRecords(prev => {
      const updated = { ...prev };
      delete updated[eventId];
      return updated;
    });
  }, [setReviewRecords]);

  return {
    markReviewed,
    getNextReviewDate,
    isDueForReview,
    getNotesForReview,
    getReviewStats,
    getReviewProgress,
    getReviewRecord,
    resetProgress,
  };
}