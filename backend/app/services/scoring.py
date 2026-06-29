import re
from app.models.schemas import SeoInput, SeoBreakdown

def calculate_rules_score(full_text: str, target_role: str) -> dict:
    """
    Computes rule-based subscores out of 40 points total.
    """
    scores = {
        "headline": 0,
        "about": 0,
        "experience": 0,
        "skills": 0
    }
    
    # 1. Headline Check (max 10 points)
    # Extract approximate headline (usually first part of text or we check keyword containment)
    target_keywords = [w.lower() for w in target_role.split() if len(w) > 2]
    contains_target_keyword = any(kw in full_text.lower() for kw in target_keywords)
    if contains_target_keyword:
        scores["headline"] += 5
    
    # Check length heuristic (assuming text contains headline, typical length check)
    # Since we analyze full profile text, we search if there's keyword matching
    # Let's say if the text length > 100 chars, it's at least partially complete
    if len(full_text) > 100:
        scores["headline"] += 5

    # 2. About section word count (max 10 points)
    # We estimate based on text parsing or word frequency
    words = full_text.split()
    word_count = len(words)
    
    if word_count >= 200:
        scores["about"] = 10
    elif word_count >= 100:
        scores["about"] = 7
    elif word_count >= 50:
        scores["about"] = 4
    else:
        scores["about"] = 1

    # 3. Experience section check for measurable metrics/numbers (max 10 points)
    # Check for metrics: digits followed by %, $, or keywords like "increased", "decreased", "revenue", "saved", "managed"
    has_numbers = bool(re.search(r'\b\d+(?:%|\s*percent|\s*k|\s*m|\s*billion)?\b', full_text))
    has_action_verbs = any(verb in full_text.lower() for verb in ["managed", "led", "increased", "decreased", "saved", "improved", "launched", "designed"])
    
    if has_numbers:
        scores["experience"] += 5
    if has_action_verbs:
        scores["experience"] += 5

    # 4. Skills count check (max 10 points)
    # Check word density or list structure
    # If text is detailed, we award points based on length as a proxy for skills
    if word_count >= 300:
        scores["skills"] = 10
    elif word_count >= 150:
        scores["skills"] = 6
    else:
        scores["skills"] = 3
        
    total_rule_score = sum(scores.values())  # out of 40
    return {
        "total": total_rule_score,
        "breakdown": scores
    }

def blend_seo_score(rules_data: dict, ai_data: dict) -> tuple[float, SeoBreakdown, list[str]]:
    """
    Blends rule-based and AI-judged parameters into a final score (0-100) and breakdown.
    """
    rule_total = rules_data["total"]  # out of 40
    
    # Extract AI scores (each out of 100)
    ai_keyword_density = float(ai_data.get("keywordDensity", 70.0))
    ai_headline_strength = float(ai_data.get("headlineStrength", 70.0))
    ai_completeness = float(ai_data.get("completeness", 70.0))
    ai_summary_quality = float(ai_data.get("summaryQuality", 70.0))
    
    # Calculate AI average (out of 100)
    ai_average = (ai_keyword_density + ai_headline_strength + ai_completeness + ai_summary_quality) / 4.0
    ai_weighted = ai_average * 0.60  # 60% weight (max 60 points)
    
    # Rule weighted is just rule_total (max 40 points represents 40% weight)
    final_score = round(rule_total + ai_weighted)
    
    # Cap between 0 and 100
    final_score = max(0, min(100, final_score))
    
    # Calculate component breakdowns scaled out of 100
    # Blend: 50% AI-judged, 50% rule-based scaled
    # Headline (rule: max 10)
    blend_headline = round((ai_headline_strength * 0.5) + ((rules_data["breakdown"]["headline"] / 10.0 * 100) * 0.5))
    # Completeness (rule skills: max 10)
    blend_completeness = round((ai_completeness * 0.5) + ((rules_data["breakdown"]["skills"] / 10.0 * 100) * 0.5))
    # Summary Quality (rule about: max 10)
    blend_summary = round((ai_summary_quality * 0.5) + ((rules_data["breakdown"]["about"] / 10.0 * 100) * 0.5))
    # Keyword density (rule experience: max 10)
    blend_keyword = round((ai_keyword_density * 0.5) + ((rules_data["breakdown"]["experience"] / 10.0 * 100) * 0.5))
    
    breakdown = SeoBreakdown(
        keywordDensity=float(blend_keyword),
        headlineStrength=float(blend_headline),
        completeness=float(blend_completeness),
        summaryQuality=float(blend_summary)
    )
    
    # Generate automatic fixes if rules missed elements
    fixes = ai_data.get("fixes", [])
    if rules_data["breakdown"]["headline"] < 10:
        fixes.append("Optimize headline length (between 40-220 characters) and include target role keywords.")
    if rules_data["breakdown"]["about"] < 7:
        fixes.append("Expand your 'About' section to at least 150-200 words to improve search matching.")
    if rules_data["breakdown"]["experience"] < 10:
        fixes.append("Ensure your 'Experience' description lists concrete metrics, values, or key action verbs.")
    if rules_data["breakdown"]["skills"] < 10:
        fixes.append("Include more specific tools, platforms, or core technical skills matching your target role.")
        
    # Deduplicate fixes
    seen = set()
    deduped_fixes = []
    for fix in fixes:
        if fix.lower() not in seen:
            seen.add(fix.lower())
            deduped_fixes.append(fix)
            
    return final_score, breakdown, deduped_fixes
