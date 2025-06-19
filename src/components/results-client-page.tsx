
'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTestContext } from '@/context/test-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function ResultsClientPage() {
  const router = useRouter();
  const { questions, userAnswers, startTime, endTime, resetTest } = useTestContext();

  useEffect(() => {
    if (questions.length === 0 || startTime === null || endTime === null) {
      router.replace('/');
    }
  }, [questions, startTime, endTime, router]);

  const { score, totalQuestions, timeTakenFormatted, correctAnswersCount } = useMemo(() => {
    if (!questions || questions.length === 0 || !userAnswers) {
      return { score: 0, totalQuestions: 0, timeTakenFormatted: '00:00', correctAnswersCount: 0 };
    }

    let correct = 0;
    questions.forEach((q, index) => {
      if (q.correctAnswerIndex === userAnswers[index]) {
        correct++;
      }
    });

    const total = questions.length;
    const calculatedScore = total > 0 ? (correct / total) * 100 : 0;

    let timeDiffSeconds = 0;
    if (startTime && endTime) {
      timeDiffSeconds = Math.floor((endTime - startTime) / 1000);
    }
    const minutes = Math.floor(timeDiffSeconds / 60);
    const seconds = timeDiffSeconds % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return {
      score: Math.round(calculatedScore),
      totalQuestions: total,
      timeTakenFormatted: formattedTime,
      correctAnswersCount: correct
    };
  }, [questions, userAnswers, startTime, endTime]);

  if (questions.length === 0 || startTime === null || endTime === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Icons.Loading className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading results...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center p-4 py-8">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${score >= 50 ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'}`}>
            <Icons.ClipboardCheck size={32} />
          </div>
          <CardTitle className="text-3xl font-bold">Test Results</CardTitle>
          <CardDescription>
            You scored {correctAnswersCount} out of {totalQuestions} questions correctly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-2">
            <Card className="bg-secondary p-4">
              <p className="text-sm font-medium text-muted-foreground">Your Score</p>
              <p className={`text-4xl font-bold ${score >= 50 ? 'text-accent' : 'text-destructive'}`}>{score}%</p>
            </Card>
            <Card className="bg-secondary p-4">
              <p className="text-sm font-medium text-muted-foreground">Time Taken</p>
              <p className="text-4xl font-bold text-primary">{timeTakenFormatted}</p>
            </Card>
          </div>
          
          <Separator />

          <h3 className="text-xl font-semibold">Answer Breakdown:</h3>
          <ScrollArea className="h-[50vh] md:max-h-[60vh] w-full">
            <Accordion type="single" collapsible className="w-full">
              {questions.map((q, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = q.correctAnswerIndex === userAnswer;
                return (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className={`flex items-center justify-between text-left text-base hover:no-underline ${isCorrect ? 'text-accent' : 'text-destructive'}`}>
                      <div className="flex items-center">
                        {isCorrect ? <Icons.Correct className="mr-2 h-5 w-5 flex-shrink-0" /> : <Icons.Incorrect className="mr-2 h-5 w-5 flex-shrink-0" />}
                        Question {index + 1}
                      </div>
                       <Badge variant={isCorrect ? 'default' : 'destructive'} className={`${isCorrect ? 'bg-accent hover:bg-accent/90' : ''}`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 p-4">
                      <p className="font-medium">{q.question}</p>
                      <ul className="list-inside list-disc space-y-1 text-sm">
                        {q.options.map((opt, optIndex) => (
                          <li
                            key={optIndex}
                            className={`
                              ${optIndex === q.correctAnswerIndex ? 'font-semibold text-accent' : ''}
                              ${optIndex === userAnswer && optIndex !== q.correctAnswerIndex ? 'font-semibold text-destructive line-through' : ''}
                              ${optIndex === userAnswer && optIndex === q.correctAnswerIndex ? 'font-semibold text-accent' : ''}
                            `}
                          >
                            {opt}
                            {optIndex === q.correctAnswerIndex && <Badge variant="outline" className="ml-2 border-accent text-accent">Correct Answer</Badge>}
                            {optIndex === userAnswer && optIndex !== q.correctAnswerIndex && <Badge variant="outline" className="ml-2 border-destructive text-destructive">Your Answer</Badge>}
                          </li>
                        ))}
                      </ul>
                      {q.difficultyAssessment && (
                        <div className="mt-2 rounded-md border border-dashed border-yellow-500 bg-yellow-50 p-2 text-xs text-yellow-700">
                          <strong>AI Difficulty Assessment:</strong> {q.difficultyAssessment.isNeetLevel ? "Considered NEET level. " : "May not be NEET level. "}
                          {q.difficultyAssessment.reasoning}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => {
              resetTest();
              router.push('/');
            }}
            className="w-full text-lg"
            size="lg"
          >
            <Icons.Retry className="mr-2 h-5 w-5" />
            Start New Test
          </Button>
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; Kailas Sachdev 2025</p>
      </footer>
    </div>
  );
}
