from app.models.schemas import ProfileInput, HeadlineInput, SkillsInput, SeoInput
from typing import Optional, List, Dict, Any

def build_analysis_system_prompt() -> str:
    return (
        "You are an expert LinkedIn Profile Reviewer and Career Coach.\n"
        "Analyze the provided LinkedIn profile details (headline, about, experience, skills) "
        "and their target career role. Provide professional, constructive feedback.\n"
        "You MUST respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        "  \"strengths\": [\"strength 1\", \"strength 2\", ...],\n"
        "  \"weaknesses\": [\"weakness 1\", \"weakness 2\", ...],\n"
        "  \"missingSections\": [\"missing section or critical element 1\", ...],\n"
        "  \"toneFeedback\": \"Professional analysis of tone and clarity (e.g. confident, too passive, etc.)\",\n"
        "  \"overallSummary\": \"A short, punchy 3-4 sentence professional summary of the profile review\"\n"
        "}\n"
        "Do not include any pre-text, post-text, or formatting other than raw JSON."
    )

def build_analysis_user_prompt(data: ProfileInput) -> str:
    skills_str = ", ".join(data.skills) if data.skills else "None listed"
    return (
        f"Target Role: {data.targetRole}\n"
        f"Headline: {data.headline}\n"
        f"About: {data.about}\n"
        f"Experience:\n{data.experience}\n"
        f"Skills: {skills_str}\n"
    )

def build_headline_system_prompt() -> str:
    return (
        "You are an expert copywriter specializing in LinkedIn headline optimization.\n"
        "Generate 5 high-impact, professional LinkedIn headline suggestions based on the user's current headline, "
        "role, industry, and desired keywords. Emphasize value proposition, skills, and searchability.\n"
        "You MUST respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        "  \"suggestions\": [\n"
        "    {\n"
        "      \"headline\": \"Optimized Headline Option\",\n"
        "      \"reasoning\": \"Brief explanation of why this headline works and its SEO/recruiter impact\"\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "Provide exactly 5 suggestions. Do not include any text outside the JSON structure."
    )

def build_headline_user_prompt(data: HeadlineInput) -> str:
    keywords_str = ", ".join(data.keywords) if data.keywords else "None specified"
    return (
        f"Current Headline: {data.currentHeadline}\n"
        f"Role: {data.role}\n"
        f"Industry: {data.industry}\n"
        f"Target Keywords: {keywords_str}\n"
    )

def build_skills_system_prompt() -> str:
    return (
        "You are a tech recruiter and industry skills researcher.\n"
        "Suggest exactly 6-8 relevant skills the user should add to their profile, based on their target role, "
        "industry, and their current list of skills. Categorize the demand level for each suggested skill "
        "as 'High', 'Medium', or 'Trending'.\n"
        "You MUST respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        "  \"recommendedSkills\": [\n"
        "    {\n"
        "      \"skill\": \"Name of skill\",\n"
        "      \"demandLevel\": \"High\" | \"Medium\" | \"Trending\",\n"
        "      \"reason\": \"Brief justification detailing why this skill is critical for a target role in this industry\"\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "Do not include any text outside the JSON structure."
    )

def build_skills_user_prompt(data: SkillsInput) -> str:
    current_skills_str = ", ".join(data.currentSkills) if data.currentSkills else "None listed"
    return (
        f"Target Role: {data.role}\n"
        f"Industry: {data.industry}\n"
        f"Current Skills: {current_skills_str}\n"
    )

def build_seo_system_prompt() -> str:
    return (
        "You are an expert in LinkedIn Search Engine Optimization (SEO) and Recruiter Search Algorithms.\n"
        "Evaluate the qualitative searchability factors of the full profile text for their target role.\n"
        "Provide score ratings out of 100 for key parameters and list critical fixes to rank higher in recruiter searches.\n"
        "You MUST respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        "  \"keywordDensity\": 85.0,\n"
        "  \"headlineStrength\": 75.0,\n"
        "  \"completeness\": 90.0,\n"
        "  \"summaryQuality\": 80.0,\n"
        "  \"fixes\": [\n"
        "    \"Add key industry keywords like X, Y to your summary\",\n"
        "    \"Incorporate measurable impact metrics (e.g. percentages, dollars saved) in experience section\",\n"
        "    ...\n"
        "  ]\n"
        "}\n"
        "Keep scores realistic and objective. Do not include any text outside the JSON structure."
    )

def build_seo_user_prompt(data: SeoInput) -> str:
    return (
        f"Target Role: {data.targetRole}\n"
        f"Profile Content:\n{data.fullProfileText}\n"
    )

# ----------------------------
# Upgraded Premium Prompts
# ----------------------------
def build_premium_analysis_system_prompt() -> str:
    return (
        "You are an elite LinkedIn profile SEO expert, tech recruiter, and career consultant.\n"
        "Analyze the user's profile details and target role to generate a comprehensive, premium analysis.\n"
        "You MUST respond ONLY with a valid JSON object matching this schema:\n"
        "{\n"
        "  \"scores\": {\n"
        "    \"overall\": 85,\n"
        "    \"ats\": 78,\n"
        "    \"recruiter\": 82,\n"
        "    \"seo\": 88,\n"
        "    \"personalBranding\": 80,\n"
        "    \"visibility\": 85\n"
        "  },\n"
        "  \"beforeAfter\": {\n"
        "    \"headline\": {\n"
        "      \"original\": \"Original headline here\",\n"
        "      \"improved\": \"Improved premium headline suggestion\",\n"
        "      \"changes\": [\"Added keyword X\", \"Removed buzzwords\"],\n"
        "      \"impact\": \"Increased SEO ranking and click-through rates\"\n"
        "    },\n"
        "    \"about\": {\n"
        "      \"original\": \"Original about content here\",\n"
        "      \"improved\": \"Improved premium about content draft\",\n"
        "      \"changes\": [\"Added value proposition\", \"Added metrics\"],\n"
        "      \"impact\": \"Stronger recruiter hooks and keyword indexing\"\n"
        "    },\n"
        "    \"skills\": {\n"
        "      \"original\": \"Original skills here\",\n"
        "      \"improved\": \"Recommended optimized skills list list\",\n"
        "      \"changes\": [\"Aligned with industry standard\"],\n"
        "      \"impact\": \"Direct match against job description criteria\"\n"
        "    },\n"
        "    \"experience\": {\n"
        "      \"original\": \"Original experience description\",\n"
        "      \"improved\": \"Improved description with bullet points using action-verbs + quantifiable metrics\",\n"
        "      \"changes\": [\"Quantified achievements\", \"Stronger verbs\"],\n"
        "      \"impact\": \"Clear ATS optimization and recruiter appeal\"\n"
        "    },\n"
        "    \"projects\": {\n"
        "      \"original\": \"None or basic project listing\",\n"
        "      \"improved\": \"Optimized project showcase section layout draft\",\n"
        "      \"changes\": [\"Suggested 2 highly relevant AI/Engineering projects with technologies\"],\n"
        "      \"impact\": \"Demonstrates hands-on mastery of required stack\"\n"
        "    }\n"
        "  },\n"
        "  \"recruiterReview\": {\n"
        "    \"strengths\": [\"Technical strength 1\", \"Branding strength 1\", \"ATS strength 1\"],\n"
        "    \"weaknesses\": [\"Missing keyword X\", \"Weak descriptions\", \"Missing achievements\", \"Missing certifications\"],\n"
        "    \"summary\": \"Overall recruiter review summary\",\n"
        "    \"actionableFeedback\": \"Clear next steps for immediate improvements\"\n"
        "  },\n"
        "  \"keywords\": [\n"
        "    {\"keyword\": \"React\", \"status\": \"existing\", \"coverage\": 90, \"importance\": \"High\"},\n"
        "    {\"keyword\": \"System Design\", \"status\": \"missing\", \"coverage\": 0, \"importance\": \"High\"},\n"
        "    {\"keyword\": \"Docker\", \"status\": \"missing\", \"coverage\": 0, \"importance\": \"Medium\"},\n"
        "    {\"keyword\": \"TailwindCSS\", \"status\": \"existing\", \"coverage\": 100, \"importance\": \"Low\"}\n"
        "  ],\n"
        "  \"radarData\": [\n"
        "    {\"subject\": \"Technical Skills\", \"value\": 80},\n"
        "    {\"subject\": \"Leadership\", \"value\": 70},\n"
        "    {\"subject\": \"Branding\", \"value\": 85},\n"
        "    {\"subject\": \"SEO\", \"value\": 90},\n"
        "    {\"subject\": \"ATS Compatibility\", \"value\": 75},\n"
        "    {\"subject\": \"Recruiter Appeal\", \"value\": 80}\n"
        "  ],\n"
        "  \"roadmap\": {\n"
        "    \"beginner\": {\n"
        "      \"technologies\": [\"HTML/CSS\", \"JavaScript\"],\n"
        "      \"certifications\": [\"AWS Cloud Practitioner\"],\n"
        "      \"projects\": [\"Personal Portfolio\"],\n"
        "      \"githubImprovements\": [\"Add detailed README files\"],\n"
        "      \"portfolioImprovements\": [\"Build clean glassmorphic site\"],\n"
        "      \"linkedinImprovements\": [\"Complete profile basics\"]\n"
        "    },\n"
        "    \"intermediate\": {\n"
        "      \"technologies\": [\"TypeScript\", \"React\", \"Tailwind\"],\n"
        "      \"certifications\": [\"AWS Certified Developer\"],\n"
        "      \"projects\": [\"E-Commerce Platform\"],\n"
        "      \"githubImprovements\": [\"Contribute to Open Source\"],\n"
        "      \"portfolioImprovements\": [\"Include interactive projects\"],\n"
        "      \"linkedinImprovements\": [\"Write industry articles\"]\n"
        "    },\n"
        "    \"advanced\": {\n"
        "      \"technologies\": [\"Node.js\", \"Docker\", \"GraphQL\"],\n"
        "      \"certifications\": [\"AWS Solutions Architect\"],\n"
        "      \"projects\": [\"Real-time Chat App\"],\n"
        "      \"githubImprovements\": [\"Publish package to npm\"],\n"
        "      \"portfolioImprovements\": [\"Include custom dashboard metrics\"],\n"
        "      \"linkedinImprovements\": [\"Build an audience and post weekly\"]\n"
        "    }\n"
        "  },\n"
        "  \"benchmark\": {\n"
        "    \"entryLevel\": 60,\n"
        "    \"midLevel\": 75,\n"
        "    \"seniorLevel\": 85,\n"
        "    \"topTenPercent\": 95,\n"
        "    \"userPercentile\": 70\n"
        "  },\n"
        "  \"completeness\": {\n"
        "    \"headline\": true,\n"
        "    \"about\": true,\n"
        "    \"experience\": true,\n"
        "    \"projects\": false,\n"
        "    \"skills\": true,\n"
        "    \"education\": true,\n"
        "    \"certifications\": false,\n"
        "    \"recommendations\": false,\n"
        "    \"percentage\": 65\n"
        "  },\n"
        "  \"badges\": [\"ATS Friendly\", \"Recruiter Approved\", \"SEO Optimized\"]\n"
        "}\n"
        "Keep scores realistic and objective. Ensure the output matches the required JSON keys exactly. "
        "Do not include any pre-text, post-text, or markdown formatting tags. Return raw, clean JSON."
    )

def build_premium_analysis_user_prompt(data: ProfileInput) -> str:
    skills_str = ", ".join(data.skills) if data.skills else "None listed"
    return (
        f"Target Role: {data.targetRole}\n"
        f"Current Headline: {data.headline}\n"
        f"Current About Section: {data.about}\n"
        f"Current Experience Details: {data.experience}\n"
        f"Current Skills: {skills_str}\n"
    )

def build_chat_system_prompt(profile_context: Optional[Dict[str, Any]]) -> str:
    context_str = ""
    if profile_context:
        context_str = (
            f"The user is optimizing their profile for the target role: {profile_context.get('targetRole', 'N/A')}.\n"
            f"Here is their current profile details:\n"
            f"Headline: {profile_context.get('headline', 'N/A')}\n"
            f"About: {profile_context.get('about', 'N/A')}\n"
            f"Experience: {profile_context.get('experience', 'N/A')}\n"
            f"Skills: {', '.join(profile_context.get('skills', [])) if isinstance(profile_context.get('skills'), list) else 'N/A'}\n"
        )
    return (
        "You are an expert AI Career Coach and LinkedIn Profile Optimizer.\n"
        "Provide constructive, motivational, and extremely practical answers in markdown format.\n"
        f"{context_str}\n"
        "Respond ONLY with a valid JSON object matching the schema:\n"
        "{\n"
        "  \"response\": \"Your markdown formatted answer here\"\n"
        "}\n"
        "Do not include any other text."
    )

def build_chat_user_prompt(message: str, history: List[Dict[str, str]]) -> str:
    history_str = ""
    for msg in history:
        history_str += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
    return (
        f"Chat History:\n{history_str}\n"
        f"User Message: {message}\n"
    )
