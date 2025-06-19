
export interface DifficultyAssessment {
  isNeetLevel: boolean;
  reasoning: string;
}

export interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  difficultyAssessment?: DifficultyAssessment; // Added from AI flow
}

// Raw question type from generate-neet-level-questions flow
export interface RawQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}
