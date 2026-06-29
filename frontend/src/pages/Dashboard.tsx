import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api, PremiumAnalysisResponse, ResumeAnalysis, StructuredResumeData } from "../lib/api";
import { MultiScoreCard } from "../components/MultiScoreCard";
import { BeforeAfterView } from "../components/BeforeAfterView";
import { KeywordHeatmap } from "../components/KeywordHeatmap";
import { RoadmapAdvisory } from "../components/RoadmapAdvisory";
import { RadarMetrics } from "../components/RadarMetrics";
import { CompletenessTracker } from "../components/CompletenessTracker";
import { ChatAssistant } from "../components/ChatAssistant";
import { ResumeUploadAndPreview } from "../components/ResumeUploadAndPreview";
import { db } from "../lib/firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import confetti from "canvas-confetti";
import {
  Sparkles, ArrowLeft, RefreshCw, AlertTriangle,
  Cpu, Download, Share2, Award, Zap, HelpCircle
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();

  // Input Mode state
  const [inputMode, setInputMode] = useState<"manual" | "resume">("manual");

  // Input states
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [targetRole, setTargetRole] = useState("");

  // Helper mapper for Resume Analysis
  const mapResumeToPremiumAnalysis = (
    analysis: ResumeAnalysis,
    _rawText: string,
    fileName: string,
    structuredData: StructuredResumeData
  ): PremiumAnalysisResponse => {
    return {
      scores: {
        overall: analysis.profileStrength,
        ats: analysis.atsScore,
        recruiter: analysis.recruiterScore,
        seo: analysis.seoScore,
        personalBranding: Math.max(30, analysis.profileStrength - 4),
        visibility: Math.min(100, analysis.seoScore + 3)
      },
      beforeAfter: {
        headline: {
          original: structuredData.name || "N/A",
          improved: "Optimized Resume Profile for " + (targetRole || "Target Industry"),
          changes: ["Standardized layout for scanning", "Highlighted name clarity"],
          impact: "Improved recruiter immediate impression rate"
        },
        about: {
          original: structuredData.summary || "No summary found",
          improved: analysis.optimizedSummary,
          changes: ["Quantified achievements", "Integrated missing skills"],
          impact: "Significant bump in SEO visibility and recruiter search triggers"
        },
        skills: {
          original: structuredData.skills?.join(", ") || "",
          improved: [...(structuredData.skills || []), ...analysis.missingSkills].join(", "),
          changes: ["Included high demand target keywords"],
          impact: "Maximizes ATS keyword matches"
        },
        experience: {
          original: structuredData.experience?.map(e => e.description).join("\n") || "",
          improved: "Enhanced descriptions leveraging active metrics and results (see recommendations below)",
          changes: analysis.weakBulletPoints.slice(0, 2),
          impact: "Shows clear accountability and outcome-driven results"
        },
        projects: {
          original: structuredData.projects?.map(p => p.title).join(", ") || "",
          improved: "Refined Project Showcase layout",
          changes: ["Standardized bullet outlines"],
          impact: "Demonstrates practical execution capability"
        }
      },
      recruiterReview: {
        strengths: [
          "Logical resume structure makes parsed indexing easy for ATS systems",
          "Includes strong baseline of skills",
          "Clear educational background matches standard job definitions"
        ],
        weaknesses: [...analysis.weakBulletPoints, ...analysis.suggestedImprovements],
        summary: `Recruiter audit report of resume: ${fileName}. The ATS compatibility is calculated at ${analysis.atsScore}/100.`,
        actionableFeedback: analysis.suggestedImprovements.join(" ")
      },
      keywords: [
        ...analysis.missingKeywords.map(kw => ({
          keyword: kw,
          status: "missing" as const,
          coverage: 0,
          importance: "High" as const
        })),
        ...(structuredData.skills || []).slice(0, 10).map(sk => ({
          keyword: sk,
          status: "existing" as const,
          coverage: 100,
          importance: "Medium" as const
        }))
      ],
      radarData: [
        { subject: "ATS Score", value: analysis.atsScore },
        { subject: "Recruiter Appeal", value: analysis.recruiterScore },
        { subject: "SEO Search", value: analysis.seoScore },
        { subject: "Experience Structure", value: analysis.profileStrength - 5 },
        { subject: "Skills Gap", value: Math.max(20, 100 - analysis.missingSkills.length * 10) },
        { subject: "Summary Hook", value: analysis.profileStrength }
      ],
      roadmap: {
        beginner: {
          technologies: analysis.careerRoadmap.skillsToAcquire?.slice(0, 2) || [],
          certifications: analysis.careerRoadmap.certificationRecommendations?.slice(0, 1) || [],
          projects: [],
          githubImprovements: [],
          portfolioImprovements: [],
          linkedinImprovements: analysis.careerRoadmap.shortTermGoals?.slice(0, 1) || []
        },
        intermediate: {
          technologies: analysis.careerRoadmap.skillsToAcquire?.slice(2, 4) || [],
          certifications: analysis.careerRoadmap.certificationRecommendations?.slice(1, 2) || [],
          projects: [],
          githubImprovements: [],
          portfolioImprovements: [],
          linkedinImprovements: analysis.careerRoadmap.shortTermGoals?.slice(1, 2) || []
        },
        advanced: {
          technologies: analysis.careerRoadmap.skillsToAcquire?.slice(4) || [],
          certifications: [],
          projects: [],
          githubImprovements: [],
          portfolioImprovements: [],
          linkedinImprovements: analysis.careerRoadmap.longTermGoals?.slice(0, 1) || []
        }
      },
      benchmark: {
        entryLevel: analysis.industryBenchmark.entryLevel || 60,
        midLevel: analysis.industryBenchmark.midLevel || 75,
        seniorLevel: analysis.industryBenchmark.seniorLevel || 85,
        topTenPercent: analysis.industryBenchmark.topTenPercent || 95,
        userPercentile: analysis.industryBenchmark.userPercentile || 70
      },
      completeness: {
        headline: !!structuredData.name,
        about: !!structuredData.summary,
        experience: (structuredData.experience?.length || 0) > 0,
        projects: (structuredData.projects?.length || 0) > 0,
        skills: (structuredData.skills?.length || 0) > 0,
        education: (structuredData.education?.length || 0) > 0,
        certifications: (structuredData.certifications?.length || 0) > 0,
        recommendations: false,
        percentage: Math.min(100, (
          (structuredData.name ? 15 : 0) +
          (structuredData.summary ? 20 : 0) +
          (structuredData.experience?.length ? 25 : 0) +
          (structuredData.projects?.length ? 15 : 0) +
          (structuredData.skills?.length ? 15 : 0) +
          (structuredData.education?.length ? 10 : 0)
        ))
      },
      badges: ["ATS Match", "SEO Optimized", "Quantified Experience"]
    };
  };

  // Heuristic Live score state
  const [liveScores, setLiveScores] = useState({
    overall: 0,
    ats: 0,
    seo: 0,
  });

  // UI/Loading/Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  
  // Results state
  const [report, setReport] = useState<PremiumAnalysisResponse | null>(null);

  // Trigger celebration on successful premium analysis
  const triggerCelebration = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#0072b1", "#38bdf8", "#2dd4bf", "#ffffff"]
    });
  };

  // Evaluate live scores client-side based on heuristics
  useEffect(() => {
    if (!headline.trim() && !about.trim() && !experience.trim() && !skills.trim()) {
      setLiveScores({
        overall: 0,
        ats: 0,
        seo: 0
      });
      return;
    }

    let atsPoints = 15;
    let seoPoints = 20;

    // Evaluate headline
    if (headline.length > 25) seoPoints += 15;
    if (headline.includes("|") || headline.includes("/")) seoPoints += 10;

    // Evaluate skills
    const skillList = skills.split(",").map(s => s.trim()).filter(s => s.length > 0);
    seoPoints += Math.min(skillList.length * 4, 25);
    atsPoints += Math.min(skillList.length * 3, 20);

    // Evaluate About (Summary)
    if (about.length > 100) atsPoints += 15;
    if (about.length > 300) seoPoints += 15;

    // Evaluate Experience (Action verbs + metrics)
    const actionVerbs = ["managed", "built", "implemented", "scaled", "led", "developed", "designed", "optimized", "created", "reduced", "increased"];
    let verbCount = 0;
    actionVerbs.forEach(verb => {
      if (experience.toLowerCase().includes(verb)) verbCount++;
    });
    atsPoints += Math.min(verbCount * 6, 30);

    // Look for numbers or percentages (quantifiable impact)
    const matchesMetrics = experience.match(/\d+%|\d+\s*%/g) || experience.match(/\$\d+|\d+\s*USD/g);
    if (matchesMetrics) atsPoints += 20;

    // Normalize
    const finalAts = Math.min(atsPoints, 100);
    const finalSeo = Math.min(seoPoints, 100);
    const finalOverall = Math.round((finalAts + finalSeo) / 2);

    setLiveScores({
      overall: finalOverall,
      ats: finalAts,
      seo: finalSeo
    });
  }, [headline, about, experience, skills]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !about.trim() || !experience.trim() || !skills.trim() || !targetRole.trim()) {
      setError("Please complete all sections of the form before submitting.");
      return;
    }

    if (
      targetRole.trim().length < 3 ||
      headline.trim().length < 3 ||
      about.trim().length < 10 ||
      experience.trim().length < 10
    ) {
      setError(
        "Insufficient profile details. Please provide realistic descriptions (minimum 3 characters for Role and Headline, 10 characters for About and Experience) so that the AI can generate an accurate audit."
      );
      return;
    }

    setError("");
    setLoading(true);
    setReport(null);

    const skillsArray = skills
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      const res = await api.analyzeProfilePremium({
        headline,
        about,
        experience,
        skills: skillsArray,
        targetRole
      }, token || undefined);

      setReport(res);
      triggerCelebration();

      // Save to Firestore History & local fallback for logged-in users
      if (user) {
        const historyPayload = {
          targetRole,
          timestamp: new Date().toISOString(),
          // Map premium report structures back to database compatible format
          seo: {
            score: res.scores.overall,
            breakdown: {
              headlineStrength: res.scores.personalBranding,
              keywordDensity: res.scores.seo,
              completeness: res.completeness.percentage,
              summaryQuality: res.scores.ats
            },
            fixes: res.recruiterReview.weaknesses
          },
          analysis: {
            strengths: res.recruiterReview.strengths,
            weaknesses: res.recruiterReview.weaknesses,
            missingSections: res.recruiterReview.weaknesses.slice(0, 2),
            toneFeedback: res.recruiterReview.summary,
            overallSummary: res.recruiterReview.actionableFeedback
          },
          headlines: {
            suggestions: [
              { headline: res.beforeAfter.headline.improved, reasoning: res.beforeAfter.headline.impact }
            ]
          },
          skills: {
            recommendedSkills: res.keywords.map(kw => ({
              skill: kw.keyword,
              demandLevel: kw.importance === "High" ? "High" : "Trending",
              reason: `In demand keyword with ${kw.coverage}% relevance.`
            }))
          }
        };

        // Scoped local storage key
        const localKey = `history_${user.uid}`;
        try {
          const localHistoryStr = localStorage.getItem(localKey);
          let localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];
          localHistory.push(historyPayload);
          localStorage.setItem(localKey, JSON.stringify(localHistory));
        } catch (localErr) {
          console.error("Failed to save report to localStorage history:", localErr);
        }

        try {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, {
            analysisHistory: arrayUnion(historyPayload)
          }, { merge: true });
        } catch (dbErr) {
          console.error("Failed to save report to database history:", dbErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze profile. Please verify api routes or fallback status.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!report) return;
    setExporting(true);

    try {
      const doc = new jsPDF();
      
      // Helper to clean non-ASCII characters & emojis that mess up jsPDF standard font kerning
      const cleanText = (text: string): string => {
        if (!text) return "";
        return text.replace(/[^\x20-\x7E\n\r\t]/g, "");
      };

      // Document Styling Page 1
      doc.setFillColor(3, 7, 18); // Dark BG
      doc.rect(0, 0, 210, 297, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("LinkReviewer Optimization Report", 20, 25);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`Target Position: ${cleanText(targetRole)}`, 20, 33);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 39);
      
      // Horizontal Rule
      doc.setDrawColor(30, 41, 59);
      doc.line(20, 45, 190, 45);
      
      // Scores Block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(56, 189, 248); // Accent blue
      doc.text("Optimization Scorecard", 20, 55);
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      
      // Grid style layout: two columns
      doc.text(`Overall Score:             ${report.scores.overall}/100`, 20, 65);
      doc.text(`ATS Compatibility:         ${report.scores.ats}/100`, 20, 72);
      doc.text(`Recruiter Appeal:          ${report.scores.recruiter}/100`, 20, 79);
      
      doc.text(`SEO Discoverability:       ${report.scores.seo}/100`, 110, 65);
      doc.text(`Personal Branding:         ${report.scores.personalBranding}/100`, 110, 72);
      doc.text(`Profile Completeness:      ${report.completeness.percentage}%`, 110, 79);
      
      // Bullet Critiques
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(45, 212, 191); // Accent teal
      doc.text("Core Strengths", 20, 95);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240); // Slate 200
      let yOffset = 103;
      report.recruiterReview.strengths.slice(0, 4).forEach((str) => {
        const splitStr = doc.splitTextToSize(`- ${cleanText(str)}`, 170);
        doc.text(splitStr, 20, yOffset);
        yOffset += (splitStr.length * 5) + 2;
      });
      
      yOffset += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(244, 63, 94); // Rose
      doc.text("Areas of Weakness", 20, yOffset);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240);
      yOffset += 8;
      report.recruiterReview.weaknesses.slice(0, 4).forEach((weak) => {
        const splitWeak = doc.splitTextToSize(`- ${cleanText(weak)}`, 170);
        doc.text(splitWeak, 20, yOffset);
        yOffset += (splitWeak.length * 5) + 2;
      });

      // Flow content dynamically on Page 2 and onwards
      doc.addPage();
      doc.setFillColor(3, 7, 18); // Dark BG
      doc.rect(0, 0, 210, 297, "F");
      
      let nextY = 25;
      
      const ensureSpace = (heightNeeded: number) => {
        if (nextY + heightNeeded > 255) {
          doc.addPage();
          doc.setFillColor(3, 7, 18); // Dark BG
          doc.rect(0, 0, 210, 297, "F");
          nextY = 25; // Reset to top
        }
      };

      // Title for suggestions
      ensureSpace(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(56, 189, 248);
      doc.text("Draft Suggestions Comparison", 20, nextY);
      nextY += 12;
      
      // Headline Comparison
      const splitOrigHeadline = doc.splitTextToSize(`Original: ${cleanText(report.beforeAfter.headline.original)}`, 170);
      const splitImpHeadline = doc.splitTextToSize(`Optimized: ${cleanText(report.beforeAfter.headline.improved)}`, 170);
      const headlineHeight = (splitOrigHeadline.length * 4.5) + (splitImpHeadline.length * 4.5) + 15;
      
      ensureSpace(headlineHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Headline Hook:", 20, nextY);
      nextY += 7;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(splitOrigHeadline, 25, nextY);
      nextY += (splitOrigHeadline.length * 4.5) + 2;
      
      doc.setTextColor(45, 212, 191);
      doc.text(splitImpHeadline, 25, nextY);
      nextY += (splitImpHeadline.length * 4.5) + 8;
      
      // Summary Comparison
      const splitOrigAbout = doc.splitTextToSize(`Original: ${cleanText(report.beforeAfter.about.original)}`, 170);
      const splitImpAbout = doc.splitTextToSize(`Optimized: ${cleanText(report.beforeAfter.about.improved)}`, 170);
      const summaryHeight = (splitOrigAbout.length * 4.5) + (splitImpAbout.length * 4.5) + 15;
      
      ensureSpace(summaryHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Summary Hook (About Section):", 20, nextY);
      nextY += 7;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(splitOrigAbout, 25, nextY);
      nextY += (splitOrigAbout.length * 4.5) + 2;
      
      doc.setTextColor(45, 212, 191);
      doc.text(splitImpAbout, 25, nextY);
      nextY += (splitImpAbout.length * 4.5) + 8;
      
      // Recommended Keywords List
      const missingKeywords = report.keywords.filter(k => k.status === "missing").map(k => k.keyword).slice(0, 10).join(", ");
      const splitMissing = doc.splitTextToSize(`Missing terms: ${missingKeywords || "None"}`, 170);
      const keywordsHeight = (splitMissing.length * 4.5) + 15;
      
      ensureSpace(keywordsHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Key Target Competencies to Index", 20, nextY);
      nextY += 7;
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(226, 232, 240);
      doc.text(splitMissing, 20, nextY);
      nextY += (splitMissing.length * 4.5) + 12;
      
      // Career Growth Roadmap section
      ensureSpace(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(56, 189, 248);
      doc.text("Career Growth Roadmap", 20, nextY);
      nextY += 12;
      
      const levels = [
        { key: "beginner" as const, label: "Beginner Milestone" },
        { key: "intermediate" as const, label: "Intermediate Milestone" },
        { key: "advanced" as const, label: "Advanced Milestone" }
      ];
      
      levels.forEach((level) => {
        const data = report.roadmap[level.key];
        const techList = data.technologies && data.technologies.length > 0 ? data.technologies.join(", ") : "None specified";
        const certList = data.certifications && data.certifications.length > 0 ? data.certifications.join(", ") : "None specified";
        
        const improvements: string[] = [];
        if (data.projects && data.projects.length > 0) improvements.push(...data.projects);
        if (data.githubImprovements && data.githubImprovements.length > 0) improvements.push(...data.githubImprovements);
        if (data.portfolioImprovements && data.portfolioImprovements.length > 0) improvements.push(...data.portfolioImprovements);
        if (data.linkedinImprovements && data.linkedinImprovements.length > 0) improvements.push(...data.linkedinImprovements);
        
        const stepsText = improvements.length > 0 ? improvements.slice(0, 3).join(" | ") : "None specified";
        
        const splitTech = doc.splitTextToSize(`- Target Technologies: ${techList}`, 165);
        const splitCert = doc.splitTextToSize(`- Recommended Certifications: ${certList}`, 165);
        const splitImprov = doc.splitTextToSize(`- Strategic Steps: ${stepsText}`, 165);
        
        const levelHeight = 6 + (splitTech.length * 4.5) + 1.5 + (splitCert.length * 4.5) + 1.5 + (splitImprov.length * 4.5) + 12;
        
        ensureSpace(levelHeight);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(45, 212, 191); // Accent teal
        doc.text(level.label, 20, nextY);
        nextY += 6;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(226, 232, 240);
        
        doc.text(splitTech, 25, nextY);
        nextY += (splitTech.length * 4.5) + 1.5;
        
        doc.text(splitCert, 25, nextY);
        nextY += (splitCert.length * 4.5) + 1.5;
        
        doc.text(splitImprov, 25, nextY);
        nextY += (splitImprov.length * 4.5) + 4;
        
        // Separator line
        doc.setDrawColor(30, 41, 59);
        doc.line(20, nextY, 190, nextY);
        nextY += 8;
      });

      // Thank You Message at the bottom of the current final page
      if (nextY + 30 > 297) {
        doc.addPage();
        doc.setFillColor(3, 7, 18); // Dark BG
        doc.rect(0, 0, 210, 297, "F");
        nextY = 20;
      }
      
      const footerY = Math.max(260, nextY + 15);
      
      doc.setDrawColor(30, 41, 59);
      doc.line(20, footerY - 5, 190, footerY - 5);
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("Thank you for using LinkReviewer! We are thrilled to support your career growth.", 105, footerY, { align: "center" });
      doc.text("Optimize your profile, share your report, and take the next step in your professional journey!", 105, footerY + 6, { align: "center" });

      // Save Report
      doc.save(`LinkReviewer_Report_${targetRole.replace(/\s+/g, "_")}.pdf`);
    } catch (pdfErr) {
      console.error("Failed to generate PDF document:", pdfErr);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = () => {
    if (!report) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LinkReviewer_Data_${targetRole.replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const resetForm = () => {
    setReport(null);
    setError("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative">
      
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Cpu className="w-8 h-8 text-brand-accentBlue" />
          <span>Profile Optimization Workspace</span>
        </h1>
        <p className="text-slate-400 mt-1">Choose between manual profile optimization or automated PDF resume analysis.</p>
      </div>

      {/* Input Mode Tabs */}
      {!loading && !report && (
        <div className="flex gap-3 mb-8 border-b border-slate-900 pb-4">
          <button
            onClick={() => { setInputMode("manual"); resetForm(); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              inputMode === "manual"
                ? "bg-slate-900 border border-slate-800 text-white shadow-[0_0_15px_rgba(0,114,177,0.1)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            LinkedIn Text Optimization
          </button>
          <button
            onClick={() => { setInputMode("resume"); resetForm(); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              inputMode === "resume"
                ? "bg-slate-900 border border-slate-800 text-white shadow-[0_0_15px_rgba(0,114,177,0.1)]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Upload PDF Resume
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {error}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* State 1: Input Form */}
        {!loading && !report && (
          inputMode === "manual" ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Form Left Side - Inputs */}
              <form onSubmit={handleAnalyze} className="lg:col-span-2 space-y-6">
                <div className="space-y-5">
                  <div className="p-6 rounded-2xl glass-panel space-y-4">
                    <h3 className="text-lg font-bold text-white mb-2">Target Profile</h3>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Job Role</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Senior Frontend Engineer"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-accentBlue focus:ring-1 focus:ring-brand-accentBlue/20 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Headline</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Software Engineer | React | JavaScript"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-accentBlue focus:ring-1 focus:ring-brand-accentBlue/20 text-sm"
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl glass-panel space-y-4">
                    <h3 className="text-lg font-bold text-white mb-2">Skills Inventory</h3>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skills (Comma-separated)</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="e.g. React, JavaScript, HTML, CSS, Tailwind, TypeScript, Git"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-accentBlue focus:ring-1 focus:ring-brand-accentBlue/20 text-sm resize-none"
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl glass-panel space-y-4">
                    <h3 className="text-lg font-bold text-white mb-2">Profile Body Sections</h3>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">About Section (Summary)</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Paste your LinkedIn 'About' description here..."
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-accentBlue focus:ring-1 focus:ring-brand-accentBlue/20 text-sm resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Experience Details</label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Paste your work history descriptions (e.g. job titles, metrics, and bullet points)..."
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-accentBlue focus:ring-1 focus:ring-brand-accentBlue/20 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="w-full lg:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-brand-blue to-sky-600 hover:from-sky-600 hover:to-brand-blue text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.01]"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Analyze My Profile</span>
                  </button>
                </div>
              </form>

              {/* Form Right Side - Heuristic Preview */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl glass-panel relative flex flex-col justify-between">
                  <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 via-transparent to-teal-500/5 rounded-2xl pointer-events-none" />
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-5 h-5 text-brand-accentTeal" />
                      <h3 className="text-lg font-bold text-white">Live Evaluation Preview</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      Watch your scores update in real time as you refine your text inputs. Incorporating metric counts and action verbs increases your score immediately.
                    </p>

                    <div className="space-y-6">
                      {[
                        { label: "Overall Estimate", value: liveScores.overall },
                        { label: "ATS Keyword Parse", value: liveScores.ats },
                        { label: "SEO Keyterm Indexing", value: liveScores.seo }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold text-slate-300">
                            <span>{item.label}</span>
                            <span>{item.value}/100</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-blue to-brand-accentTeal rounded-full transition-all duration-500"
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 p-4 rounded-xl border border-slate-900 bg-slate-950/20 text-xs text-slate-500 flex items-start gap-2.5">
                    <HelpCircle className="w-5 h-5 text-slate-600 flex-shrink-0" />
                    <span className="leading-relaxed">
                      Once satisfied with the live metrics draft estimation, hit **Analyze My Profile** to query the advanced AI audit.
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <ResumeUploadAndPreview
              token={token}
              onAnalysisComplete={(analysis, rawText, fileName, structuredData) => {
                const mappedReport = mapResumeToPremiumAnalysis(analysis, rawText, fileName, structuredData);
                setTargetRole("Resume Optimized Profile");
                setHeadline(structuredData.name || "Resume Owner");
                setAbout(structuredData.summary || "");
                setExperience(structuredData.experience?.map(e => `${e.role} @ ${e.company}: ${e.description}`).join("\n") || "");
                setSkills(structuredData.skills?.join(", ") || "");

                setReport(mappedReport);
                triggerCelebration();
              }}
              onLoadIntoLinkedIn={(structuredData) => {
                setAbout(structuredData.summary || "");
                setSkills(structuredData.skills?.join(", ") || "");
                const formattedExp = structuredData.experience?.map(e => 
                  `Role: ${e.role}\nCompany: ${e.company}\nDuration: ${e.duration || ""}\nDescription: ${e.description || ""}`
                ).join("\n\n") || "";
                setExperience(formattedExp);
                
                const firstRole = structuredData.experience?.[0]?.role || "";
                const firstCompany = structuredData.experience?.[0]?.company || "";
                if (firstRole && firstCompany) {
                  setHeadline(`${firstRole} at ${firstCompany}`);
                  setTargetRole(firstRole);
                } else if (firstRole) {
                  setHeadline(firstRole);
                  setTargetRole(firstRole);
                } else {
                  setHeadline(structuredData.name || "");
                  setTargetRole("");
                }
                
                setInputMode("manual");
              }}
              onError={(err) => setError(err)}
            />
          )
        )}

        {/* State 2: Shimmer Skeleton Loader */}
        {loading && (
          <motion.div 
            key="loading-shimmer"
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="p-6 rounded-2xl glass-panel flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-brand-accentBlue animate-spin" />
              <span className="text-slate-300 font-medium">Extracting profile semantics and conducting deep premium audit...</span>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 rounded-2xl glass-panel animate-pulse bg-slate-900/30" />
              <div className="h-64 lg:col-span-2 rounded-2xl glass-panel animate-pulse bg-slate-900/30" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 rounded-2xl glass-panel animate-pulse bg-slate-900/30" />
              <div className="h-80 rounded-2xl glass-panel animate-pulse bg-slate-900/30" />
            </div>
          </motion.div>
        )}

        {/* State 3: Analysis Results Report */}
        {!loading && report && (
          <motion.div 
            key="analysis-report"
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/20 p-4 rounded-2xl border border-slate-900">
              <div>
                <span className="text-xs font-bold text-brand-accentTeal uppercase tracking-wider">Report generated for</span>
                <h4 className="text-lg font-bold text-white">{targetRole}</h4>
              </div>
              <div className="flex items-center gap-3.5 w-full md:w-auto">
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? "Compiling PDF..." : "Export PDF"}</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Download JSON</span>
                </button>
                <button
                  onClick={resetForm}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">New Review</span>
                </button>
              </div>
            </div>

            {/* Premium Scores Dashboard */}
            <MultiScoreCard scores={report.scores} />

            {/* Charts & checklist block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radar chart */}
              <RadarMetrics data={report.radarData} />
              
              {/* Profile Checklist */}
              <div className="lg:col-span-2">
                <CompletenessTracker completeness={report.completeness} />
              </div>
            </div>

            {/* Split Before/After Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BeforeAfterView data={report.beforeAfter} />
              </div>

              {/* Recruiter Strengths & Weaknesses Panel */}
              <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-brand-accentTeal" />
                    <span>Recruiter Summary Overview</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                    {report.recruiterReview.summary}
                  </p>
                  
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-5 mb-2.5">Quick Actions</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {report.recruiterReview.actionableFeedback}
                  </p>
                </div>
              </div>
            </div>

            {/* Heatmap & Roadmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <KeywordHeatmap keywords={report.keywords} />
              <RoadmapAdvisory roadmap={report.roadmap} />
            </div>

            {/* Context aware career coach assistant */}
            <ChatAssistant token={token} profileContext={{
              headline,
              about,
              experience,
              skills: skills.split(",").map(s => s.trim()).filter(s => s.length > 0),
              targetRole
            }} />

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
