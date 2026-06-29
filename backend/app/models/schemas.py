from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# -----------------
# Original Schemas
# -----------------
class ProfileInput(BaseModel):
    headline: str
    about: str
    experience: str
    skills: List[str]
    targetRole: str

class ProfileAnalysisResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    missingSections: List[str]
    toneFeedback: str
    overallSummary: str

class HeadlineInput(BaseModel):
    currentHeadline: str
    role: str
    industry: str
    keywords: List[str]

class HeadlineItem(BaseModel):
    headline: str
    reasoning: str

class HeadlineSuggestionsResponse(BaseModel):
    suggestions: List[HeadlineItem]

class SkillsInput(BaseModel):
    currentSkills: List[str]
    role: str
    industry: str

class SkillItem(BaseModel):
    skill: str
    demandLevel: str  # e.g. "High", "Medium", "Trending"
    reason: str

class SkillsRecommendationsResponse(BaseModel):
    recommendedSkills: List[SkillItem]

class SeoInput(BaseModel):
    fullProfileText: str
    targetRole: str

class SeoBreakdown(BaseModel):
    keywordDensity: float  # e.g., score out of 100
    headlineStrength: float
    completeness: float
    summaryQuality: float

class SeoScoreResponse(BaseModel):
    score: float
    breakdown: SeoBreakdown
    fixes: List[str]

# -----------------
# Upgraded Premium Schemas
# -----------------
class DashboardScores(BaseModel):
    overall: int
    ats: int
    recruiter: int
    seo: int
    personalBranding: int
    visibility: int

class BeforeAfterItem(BaseModel):
    original: str
    improved: str
    changes: List[str]
    impact: str

class BeforeAfterComparison(BaseModel):
    headline: BeforeAfterItem
    about: BeforeAfterItem
    skills: BeforeAfterItem
    experience: BeforeAfterItem
    projects: BeforeAfterItem

class RecruiterReview(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    summary: str
    actionableFeedback: str

class KeywordItem(BaseModel):
    keyword: str
    status: str  # "existing", "missing", "high-impact", "trending"
    coverage: int  # percentage or count
    importance: str  # "High", "Medium", "Low"

class RadarData(BaseModel):
    subject: str
    value: int

class RoadmapSection(BaseModel):
    technologies: List[str]
    certifications: List[str]
    projects: List[str]
    githubImprovements: List[str]
    portfolioImprovements: List[str]
    linkedinImprovements: List[str]

class CareerRoadmap(BaseModel):
    beginner: RoadmapSection
    intermediate: RoadmapSection
    advanced: RoadmapSection

class IndustryBenchmark(BaseModel):
    entryLevel: int
    midLevel: int
    seniorLevel: int
    topTenPercent: int
    userPercentile: int

class ProfileCompleteness(BaseModel):
    headline: bool
    about: bool
    experience: bool
    projects: bool
    skills: bool
    education: bool
    certifications: bool
    recommendations: bool
    percentage: int

class PremiumAnalysisResponse(BaseModel):
    scores: DashboardScores
    beforeAfter: BeforeAfterComparison
    recruiterReview: RecruiterReview
    keywords: List[KeywordItem]
    radarData: List[RadarData]
    roadmap: CareerRoadmap
    benchmark: IndustryBenchmark
    completeness: ProfileCompleteness
    badges: List[str]

# -----------------
# Chat Assistant
# -----------------
class ChatInput(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    profileContext: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    response: str
