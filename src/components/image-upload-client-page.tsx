
'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTestContext } from '@/context/test-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    isGenerating,
    setIsGenerating,
    generationProgress,
    setGenerationProgress,
    generationStatus,
    setGenerationStatus,
    setError: setContextError,
    setUserAnswer: _setUserAnswerInternal,
    setStartTime: _setStartTimeInternal,
    setEndTime: _setEndTimeInternal,
  } = useTestContext();

  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'camera'>('upload');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);


  useEffect(() => {
    let streamInstance: MediaStream | null = null;
    let active = true;

    const cleanupCamera = () => {
      active = false;
      if (streamInstance) {
        streamInstance.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraStream(null);
    };

    if (inputMode === 'camera') {
      setHasCameraPermission(null); 
      const getCameraPermissionAsync = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (active) {
            toast({
              variant: 'destructive',
              title: 'Camera Not Supported',
              description: 'Your browser does not support camera access.',
            });
            setHasCameraPermission(false);
          }
          return;
        }
        try {
          streamInstance = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (active) {
            setCameraStream(streamInstance);
            setHasCameraPermission(true);
            if (videoRef.current) {
              videoRef.current.srcObject = streamInstance;
            }
          } else {
            streamInstance?.getTracks().forEach(track => track.stop());
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          if (active) {
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings. If the back camera is not available, it might use the front camera or fail.',
            });
          }
        }
      };
      getCameraPermissionAsync();
    } else {
      cleanupCamera();
    }

    return cleanupCamera;
  }, [inputMode, toast, setHasCameraPermission, setCameraStream]);


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

  const handleCapturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current && cameraStream && hasCameraPermission === true) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState < video.HAVE_METADATA || video.videoWidth === 0 || video.videoHeight === 0) {
        toast({
          title: 'Camera Not Ready',
          description: 'Video stream is not ready or dimensions are unavailable. Please wait a moment and try again.',
          variant: 'destructive',
        });
        return;
      }

      const aspectRatio = video.videoWidth / video.videoHeight;
      let drawWidth = 640;
      let drawHeight = drawWidth / aspectRatio;

      if (video.videoWidth < drawWidth) {
        drawWidth = video.videoWidth;
        drawHeight = video.videoHeight;
      }

      canvas.width = drawWidth;
      canvas.height = drawHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImagePreview(imageDataUrl);
        setFile(null);
        toast({ title: 'Photo Captured!', description: 'Ready to generate test.' });
      }
    } else {
      toast({ title: 'Camera Error', description: 'Could not capture photo. Camera might not be active or permission denied.', variant: 'destructive' });
    }
  }, [cameraStream, hasCameraPermission, setImagePreview, toast]);

  const prepareForNewTest = () => {
    setQuestions([]);
    // @ts-ignore
    if (typeof _setUserAnswerInternal === 'function' && _setUserAnswerInternal.name === 'setUserAnswersState') {
    } else {
    }
    // @ts-ignore
    if (typeof _setStartTimeInternal === 'function') _setStartTimeInternal(null);
    // @ts-ignore
    if (typeof _setEndTimeInternal === 'function') _setEndTimeInternal(null);
  };


  const handleGenerateTest = useCallback(async () => {
    if (!imagePreview) {
      toast({
        title: 'No image available',
        description: 'Please upload an image or capture one using your camera.',
        variant: 'destructive',
      });
      return;
    }

    prepareForNewTest();
    setIsGenerating(true);
    setContextError(null);
    setGenerationProgress(0);
    setGenerationStatus('Starting test generation...');

    const imageDataUrlToProcess = imagePreview;

    try {
      setGenerationProgress(10);
      setGenerationStatus('Extracting text from image...');
      const { extractedText } = await extractText(imageDataUrlToProcess);
      if (!extractedText || extractedText.trim() === "") {
        throw new Error("No text could be extracted from the image. Please try a clearer or different image.");
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
          setGenerationProgress(70 + Math.round(((index + 1) / rawQuestions.length) * 25));
          return { ...q, difficultyAssessment: assessment };
        })
      );

      setQuestions(assessedQuestions);
      setGenerationProgress(95);
      setGenerationStatus('Test generated successfully!');
      setGenerationProgress(100);
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
  }, [
      imagePreview,
      router,
      setContextError,
      setIsGenerating,
      setQuestions,
      toast,
      setGenerationProgress,
      setGenerationStatus
    ]);

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icons.Scan size={32} />
          </div>
          <CardTitle className="text-3xl font-bold">Scan N Test</CardTitle>
          <CardDescription className="text-md">
            Upload or capture a book page image. Your brother will generate NEET-level questions!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'upload' | 'camera')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" disabled={isGenerating}>
                <Icons.ImageUp className="mr-2 h-4 w-4" /> Upload Image
              </TabsTrigger>
              <TabsTrigger value="camera" disabled={isGenerating}>
                <Icons.Camera className="mr-2 h-4 w-4" /> Use Camera
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4 space-y-4">
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
            </TabsContent>
            <TabsContent value="camera" className="mt-4 space-y-4">
              <div className="relative w-full aspect-video rounded-md bg-muted overflow-hidden">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${ (hasCameraPermission === true && cameraStream) ? '' : 'hidden'}`}
                  autoPlay
                  muted
                  playsInline
                />
                {inputMode === 'camera' && hasCameraPermission === null && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground p-4">
                    Initializing camera...
                  </div>
                )}
                 {inputMode === 'camera' && hasCameraPermission === false && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
                    <Icons.VideoOff className="h-12 w-12 mb-2 text-destructive" />
                    <p className="font-semibold text-destructive">Camera Access Denied</p>
                    <p className="text-xs text-center">Please allow camera access in your browser settings. You might need to refresh.</p>
                  </div>
                )}
                {inputMode === 'camera' && hasCameraPermission === true && !cameraStream && (
                     <div className="absolute inset-0 flex items-center justify-center text-muted-foreground p-4">
                        Attempting to start camera. Grant permission if prompted.
                     </div>
                )}
              </div>

              {hasCameraPermission === true && cameraStream && (
                <Button onClick={handleCapturePhoto} className="w-full" disabled={isGenerating || !cameraStream}>
                  <Icons.Camera className="mr-2 h-5 w-5" /> Capture Photo
                </Button>
              )}
            </TabsContent>
          </Tabs>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {imagePreview && (
            <div className="mt-4 overflow-hidden rounded-md border border-muted">
              <p className="p-2 text-sm font-medium text-center bg-secondary">Image Preview</p>
              <Image
                src={imagePreview}
                alt="Selected page preview"
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
            disabled={!imagePreview || isGenerating}
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
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; Kailas Sachdev 2025</p>
      </footer>
    </div>
  );
}
