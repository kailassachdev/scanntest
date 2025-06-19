
'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTestContext } from '@/context/test-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Icons } from '@/components/icons';
import { extractText } from '@/ai/flows/extract-text-from-image';
import { generateNeetLevelQuestions } from '@/ai/flows/generate-neet-level-questions';
import { assessQuestionDifficulty } from '@/ai/flows/assess-question-difficulty';
import type { RawQuestion, Question } from '@/types';


export default function ImageUploadClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    imagePreview,
    setImagePreview,
    setQuestions,
    resetTest,
    isGenerating,
    setIsGenerating,
    generationProgress,
    setGenerationProgress,
    generationStatus,
    setGenerationStatus,
    setError: setContextError,
  } = useTestContext();

  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setImagePreview(null);
    }
  };

  const handleGenerateTest = useCallback(async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please upload an image of a book page.',
        variant: 'destructive',
      });
      return;
    }

    resetTest();
    setIsGenerating(true);
    setContextError(null);
    setGenerationProgress(0);
    setGenerationStatus('Starting test generation...');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        if (!imageDataUrl) {
          throw new Error("Failed to read image data.");
        }

        try {
          setGenerationProgress(10);
          setGenerationStatus('Extracting text from image...');
          const { extractedText } = await extractText(imageDataUrl);
          if (!extractedText || extractedText.trim() === "") {
            throw new Error("No text could be extracted from the image. Please try a clearer image.");
          }

          setGenerationProgress(40);
          setGenerationStatus('Generating questions...');
          const { questions: rawQuestions }: { questions: RawQuestion[] } = await generateNeetLevelQuestions({ extractedText });
          
          setGenerationProgress(70);
          setGenerationStatus('Assessing question difficulty...');
          const assessedQuestions: Question[] = await Promise.all(
            rawQuestions.map(async (q, index) => {
              const assessment = await assessQuestionDifficulty({
                question: q.question,
                choices: q.options,
                extractedText,
              });
              // Update progress incrementally for each question assessment
              setGenerationProgress(70 + Math.round(((index + 1) / rawQuestions.length) * 30));
              return { ...q, difficultyAssessment: assessment };
            })
          );
          
          setQuestions(assessedQuestions);
          setGenerationStatus('Test generated successfully!');
          router.push('/test');

        } catch (aiError: any) {
          console.error('AI processing error:', aiError);
          const errorMessage = aiError.message || 'An unexpected error occurred during AI processing.';
          setContextError(errorMessage);
          toast({
            title: 'Error Generating Test',
            description: errorMessage,
            variant: 'destructive',
          });
          setIsGenerating(false);
          setGenerationProgress(0);
          setGenerationStatus('Failed. Please try again.');
        }
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        setContextError('Failed to read the uploaded file.');
        toast({
          title: 'File Error',
          description: 'Could not read the uploaded file. Please try again.',
          variant: 'destructive',
        });
        setIsGenerating(false);
        setGenerationProgress(0);
         setGenerationStatus('File reading failed.');
      };

    } catch (error: any) {
      console.error('Overall error:', error);
      const errorMessage = error.message || 'An unexpected error occurred.';
      setContextError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('Failed. Please try again.');
    }
  }, [file, router, setContextError, setIsGenerating, setImagePreview, setQuestions, toast, resetTest, setGenerationProgress, setGenerationStatus]);

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icons.Scan size={32} />
          </div>
          <CardTitle className="text-3xl font-bold">Scan N Test</CardTitle>
          <CardDescription className="text-md">
            Upload an image of a book page. We&apos;ll generate NEET-level questions for you!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="file-upload" className="block text-sm font-medium text-foreground">
              Upload Book Page Image
            </label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isGenerating}
              className="file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {imagePreview && (
            <div className="mt-4 overflow-hidden rounded-md border border-muted">
              <Image
                src={imagePreview}
                alt="Uploaded page preview"
                width={400}
                height={300}
                className="h-auto w-full object-contain"
                data-ai-hint="document scan"
              />
            </div>
          )}

          {isGenerating && (
            <div className="space-y-2 pt-4">
              <Progress value={generationProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">{generationStatus}</p>
            </div>
          )}

          <Button
            onClick={handleGenerateTest}
            disabled={!file || isGenerating}
            className="w-full text-lg"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Icons.Loading className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Icons.Sparkles className="mr-2 h-5 w-5" />
                Generate Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
