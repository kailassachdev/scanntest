'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Question } from '@/types';

interface TestContextType {
  imagePreview: string | null;
  setImagePreview: (url: string | null) => void;
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  userAnswers: (number | null)[];
  setUserAnswer: (questionIndex: number, answerIndex: number) => void;
  startTime: number | null;
  setStartTime: () => void;
  endTime: number | null;
  setEndTime: () => void;
  resetTest: () => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  generationProgress: number; // 0-100
  setGenerationProgress: (progress: number) => void;
  generationStatus: string;
  setGenerationStatus: (status: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider = ({ children }: { children: ReactNode }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [questions, setQuestionsState] = useState<Question[]>([]);
  const [userAnswers, setUserAnswersState] = useState<(number | null)[]>([]);
  const [startTime, setStartTimeState] = useState<number | null>(null);
  const [endTime, setEndTimeState] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const setQuestions = useCallback((newQuestions: Question[]) => {
    setQuestionsState(newQuestions);
    setUserAnswersState(new Array(newQuestions.length).fill(null));
  }, []);

  const setUserAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    setUserAnswersState(prevAnswers => {
      const newAnswers = [...prevAnswers];
      newAnswers[questionIndex] = answerIndex;
      return newAnswers;
    });
  }, []);

  const setStartTime = useCallback(() => {
    setStartTimeState(Date.now());
  }, []);

  const setEndTime = useCallback(() => {
    setEndTimeState(Date.now());
  }, []);

  const resetTest = useCallback(() => {
    setImagePreview(null);
    setQuestionsState([]);
    setUserAnswersState([]);
    setStartTimeState(null);
    setEndTimeState(null);
    setIsGenerating(false);
    setGenerationProgress(0);
    setGenerationStatus('');
    setError(null);
  }, []);

  return (
    <TestContext.Provider
      value={{
        imagePreview,
        setImagePreview,
        questions,
        setQuestions,
        userAnswers,
        setUserAnswer,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
        resetTest,
        isGenerating,
        setIsGenerating,
        generationProgress,
        setGenerationProgress,
        generationStatus,
        setGenerationStatus,
        error,
        setError,
      }}
    >
      {children}
    </TestContext.Provider>
  );
};

export const useTestContext = () => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTestContext must be used within a TestProvider');
  }
  return context;
};
