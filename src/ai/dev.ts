import { config } from 'dotenv';
config();

import '@/ai/flows/assess-question-difficulty.ts';
import '@/ai/flows/extract-text-from-image.ts';
import '@/ai/flows/generate-neet-level-questions.ts';