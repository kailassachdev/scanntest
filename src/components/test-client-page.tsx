
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTestContext } from '@/context/test-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Timer } from '@/components/timer';
import { Icons } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function TestClientPage() {
  const router = useRouter();
  const {
    questions,
    userAnswers,
    setUserAnswer,
    startTime,
    setStartTime,
    setEndTime,
    resetTest,
  } = useTestContext();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (questions.length === 0) {
      // If no questions, redirect to home, perhaps after a brief message or if page is directly accessed.
      router.replace('/');
    } else if (startTime === null) {
      setStartTime();
    }
  }, [questions, router, startTime, setStartTime]);

  const handleSubmitTest = () => {
    setEndTime();
    router.push('/results');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleAnswerSelection = (answerIndex: string) => {
     setUserAnswer(currentQuestionIndex, parseInt(answerIndex,10));
  };

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Icons.Loading className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading test...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center p-4 py-8">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">NEET Practice Test</CardTitle>
            <CardDescription>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardDescription>
          </div>
          <Timer startTime={startTime} />
        </CardHeader>
        
        <ScrollArea className="h-[calc(100vh-300px)] sm:h-[calc(100vh-350px)] md:h-auto md:max-h-[60vh]">
          <CardContent className="space-y-6 p-6">
            {currentQuestion.difficultyAssessment && !currentQuestion.difficultyAssessment.isNeetLevel && (
              <Alert variant="destructive" className="mb-4">
                <Icons.Idea className="h-4 w-4" />
                <AlertTitle>Difficulty Note</AlertTitle>
                <AlertDescription>
                  AI Assessment: This question might not be perfectly aligned with NEET difficulty. {currentQuestion.difficultyAssessment.reasoning}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <p className="text-lg font-semibold leading-relaxed">{currentQuestion.question}</p>
              {currentQuestion.question.includes('```') && (
                 <p className="text-xs text-muted-foreground font-code">Note: Content in ```ticks``` might represent formulas or special formatting.</p>
              )}
            </div>

            <RadioGroup 
              onValueChange={handleAnswerSelection} 
              value={userAnswers[currentQuestionIndex]?.toString()}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => (
                <Label
                  key={index}
                  htmlFor={`option-${currentQuestionIndex}-${index}`}
                  className={`flex items-center space-x-3 rounded-md border p-4 transition-all hover:bg-secondary/80 has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:checked]:shadow-md ${userAnswers[currentQuestionIndex] === index ? 'border-primary bg-secondary shadow-md' : 'border-muted'}`}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${currentQuestionIndex}-${index}`} />
                  <span className="text-base">{option}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </ScrollArea>
        
        <Separator />

        <CardFooter className="flex flex-col gap-4 p-6 sm:flex-row sm:justify-between">
           <Button
            variant="outline"
            onClick={() => {
              resetTest();
              router.push('/');
            }}
            className="w-full sm:w-auto"
          >
            <Icons.Retry className="mr-2 h-4 w-4" />
            Cancel Test
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex-1 sm:flex-none"
            >
              Previous
            </Button>
            {currentQuestionIndex < questions.length - 1 ? (
              <Button onClick={handleNextQuestion} className="flex-1 bg-primary hover:bg-primary/90 sm:flex-none">
                Next Question
                <Icons.Next className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmitTest} className="flex-1 bg-accent hover:bg-accent/90 sm:flex-none">
                <Icons.Submit className="mr-2 h-4 w-4" />
                Submit Test
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; Kailas Sachdev 2025</p>
      </footer>
    </div>
  );
}
