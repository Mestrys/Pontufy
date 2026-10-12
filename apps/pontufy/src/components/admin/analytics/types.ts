export interface AnalyticsSummary {
  totalUsers: number;
  activeUsers: number;
  totalCompletions: number;
  totalPointsAwarded: number;
  totalPointsRedeemed: number;
  totalCourses: number;
}

export interface EngagementPoint {
  date: string;
  completions: number;
  points: number;
  redemptions: number;
}

export interface TopCourse {
  id: string;
  title: string;
  status: string;
  completions: number;
  enrolledUsers: number;
  pointsGenerated: number;
  lessonCount: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  engagement: EngagementPoint[];
  topCourses: TopCourse[];
}
