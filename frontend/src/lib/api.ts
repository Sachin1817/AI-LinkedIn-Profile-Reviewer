const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000";

export interface ProfileInput {
  headline: string;
  about: string;
  experience: string;
  skills: string[];
  targetRole: string;
}

export interface ProfileAnalysisResponse {
  strengths: string[];
  weaknesses: string[];
  missingSections: string[];
  toneFeedback: string;
  overallSummary: string;
}

export interface HeadlineInput {
  currentHeadline: string;
  role: string;
  industry: string;
  keywords: string[];
}

export interface HeadlineItem {
  headline: string;
  reasoning: string;
}

export interface HeadlineSuggestionsResponse {
  suggestions: HeadlineItem[];
}

export interface SkillsInput {
  currentSkills: string[];
  role: string;
  industry: string;
}

export interface SkillItem {
  skill: string;
  demandLevel: "High" | "Medium" | "Trending";
  reason: string;
}

export interface SkillsRecommendationsResponse {
  recommendedSkills: SkillItem[];
}

export interface SeoInput {
  fullProfileText: string;
  targetRole: string;
}

export interface SeoBreakdown {
  keywordDensity: number;
  headlineStrength: number;
  completeness: number;
  summaryQuality: number;
}

export interface SeoScoreResponse {
  score: number;
  breakdown: SeoBreakdown;
  fixes: string[];
}

// Premium SaaS API Models
export interface DashboardScores {
  overall: number;
  ats: number;
  recruiter: number;
  seo: number;
  personalBranding: number;
  visibility: number;
}

export interface BeforeAfterItem {
  original: string;
  improved: string;
  changes: string[];
  impact: string;
}

export interface BeforeAfterComparison {
  headline: BeforeAfterItem;
  about: BeforeAfterItem;
  skills: BeforeAfterItem;
  experience: BeforeAfterItem;
  projects: BeforeAfterItem;
}

export interface RecruiterReview {
  strengths: string[];
  weaknesses: string[];
  summary: string;
  actionableFeedback: string;
}

export interface KeywordItem {
  keyword: string;
  status: "existing" | "missing" | "high-impact" | "trending";
  coverage: number;
  importance: "High" | "Medium" | "Low";
}

export interface RadarData {
  subject: string;
  value: number;
}

export interface RoadmapSection {
  technologies: string[];
  certifications: string[];
  projects: string[];
  githubImprovements: string[];
  portfolioImprovements: string[];
  linkedinImprovements: string[];
}

export interface CareerRoadmap {
  beginner: RoadmapSection;
  intermediate: RoadmapSection;
  advanced: RoadmapSection;
}

export interface IndustryBenchmark {
  entryLevel: number;
  midLevel: number;
  seniorLevel: number;
  topTenPercent: number;
  userPercentile: number;
}

export interface ProfileCompleteness {
  headline: boolean;
  about: boolean;
  experience: boolean;
  projects: boolean;
  skills: boolean;
  education: boolean;
  certifications: boolean;
  recommendations: boolean;
  percentage: number;
}

export interface PremiumAnalysisResponse {
  scores: DashboardScores;
  beforeAfter: BeforeAfterComparison;
  recruiterReview: RecruiterReview;
  keywords: KeywordItem[];
  radarData: RadarData[];
  roadmap: CareerRoadmap;
  benchmark: IndustryBenchmark;
  completeness: ProfileCompleteness;
  badges: string[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatInput {
  message: string;
  history: { role: string; content: string }[];
  profileContext?: Record<string, any> | null;
}

export interface ChatResponse {
  response: string;
}

/**
 * Common request dispatcher. Auto-injects token and handles errors.
 */
async function postRequest<T>(endpoint: string, body: any, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    let detailMessage = errorDetails;
    try {
      const parsed = JSON.parse(errorDetails);
      detailMessage = parsed.detail || errorDetails;
    } catch (_) {
      // Keep original text if JSON parse fails
    }
    throw new Error(detailMessage);
  }

  return response.json();
}

export const api = {
  analyzeProfile: (profileData: ProfileInput, token?: string) => 
    postRequest<ProfileAnalysisResponse>("/api/analyze-profile", profileData, token),
    
  getHeadlineSuggestions: (headlineData: HeadlineInput, token?: string) => 
    postRequest<HeadlineSuggestionsResponse>("/api/headline-suggestions", headlineData, token),
    
  getSkillsRecommendations: (skillsData: SkillsInput, token?: string) => 
    postRequest<SkillsRecommendationsResponse>("/api/skills-recommendations", skillsData, token),
    
  getSeoScore: (seoData: SeoInput, token?: string) => 
    postRequest<SeoScoreResponse>("/api/seo-score", seoData, token),

  // Premium Endpoints
  analyzeProfilePremium: (profileData: ProfileInput, token?: string) =>
    postRequest<PremiumAnalysisResponse>("/api/analyze-profile-premium", profileData, token),

  chat: (chatData: ChatInput, token?: string) =>
    postRequest<ChatResponse>("/api/chat", chatData, token)
};
