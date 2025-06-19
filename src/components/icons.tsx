import {
  UploadCloud,
  FileScan,
  ListChecks,
  Timer,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  ClipboardCheck,
} from 'lucide-react';

export const Icons = {
  Upload: UploadCloud,
  Scan: FileScan,
  Test: ListChecks,
  Timer: Timer,
  Submit: CheckCircle2,
  Correct: CheckCircle2,
  Incorrect: XCircle,
  Loading: Loader2,
  Sparkles: Sparkles,
  Book: BookOpen,
  Next: ArrowRight,
  Retry: RotateCcw,
  Idea: Lightbulb,
  ClipboardCheck: ClipboardCheck,
};

export type IconName = keyof typeof Icons;
