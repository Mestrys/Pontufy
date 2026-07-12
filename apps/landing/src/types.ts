export interface Lesson {
  title: string;
  content: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  points: number;
}

export interface IndustryData {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  lesson: Lesson;
}

export interface Reward {
  id: string;
  name: string;
  logo: string;
  color: string;
  requiredPoints: number;
  value: string;
  gradient: string;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'warning' | 'info';
  details: string;
}
