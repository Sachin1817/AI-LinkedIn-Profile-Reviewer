import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { api, PremiumAnalysisResponse } from "../lib/api";
import { MultiScoreCard } from "../components/MultiScoreCard";
import { BeforeAfterView } from "../components/BeforeAfterView";
import { KeywordHeatmap } from "../components/KeywordHeatmap";
import { RoadmapAdvisory } from "../components/RoadmapAdvisory";
import { RadarMetrics } from "../components/RadarMetrics";
import { CompletenessTracker } from "../components/CompletenessTracker";
import { ChatAssistant } from "../components/ChatAssistant";
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

  // Input states
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [targetRole, setTargetRole] = useState("");

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
      
      // Document Styling
      doc.setFillColor(3, 7, 18); // Dark BG
      doc.rect(0, 0, 210, 297, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("LinkReviewer Optimization Report", 20, 25);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`Target Position: ${targetRole}`, 20, 33);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 39);
      
      // Horizontal Rule
      doc.setDrawColor(30, 41, 59);
      doc.line(20, 45, 190, 45);
      
      // Scores Block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(56, 189, 248); // Accent blue
      doc.text("Optimization Scorecard", 20, 55);
      
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`Overall score: ${report.scores.overall}/100`, 20, 65);
      doc.text(`ATS compatibility: ${report.scores.ats}/100`, 20, 72);
      doc.text(`Recruiter appeal: ${report.scores.recruiter}/100`, 20, 79);
      doc.text(`SEO discoverability: ${report.scores.seo}/100`, 20, 86);
      doc.text(`Personal Branding score: ${report.scores.personalBranding}/100`, 20, 93);
      doc.text(`Completeness score: ${report.completeness.percentage}%`, 20, 100);
      
      // Bullet Critiques
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(45, 212, 191); // Accent teal
      doc.text("Core Strengths", 20, 115);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240); // Slate 200
      let yOffset = 123;
      report.recruiterReview.strengths.slice(0, 4).forEach((str) => {
        doc.text(`- ${str}`, 25, yOffset);
        yOffset += 7;
      });
      
      yOffset += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(244, 63, 94); // Rose
      doc.text("Areas of Weakness", 20, yOffset);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240);
      yOffset += 8;
      report.recruiterReview.weaknesses.slice(0, 4).forEach((weak) => {
        doc.text(`- ${weak}`, 25, yOffset);
        yOffset += 7;
      });

      // Page 2: Recommendations and improvements
      doc.addPage();
      doc.setFillColor(3, 7, 18); // Dark BG
      doc.rect(0, 0, 210, 297, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(56, 189, 248);
      doc.text("Draft Suggestions Comparison", 20, 25);
      
      // Headline Comparison
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Headline Hook:", 20, 38);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Original: ${report.beforeAfter.headline.original}`, 25, 45);
      doc.setTextColor(45, 212, 191);
      doc.text(`Optimized: ${report.beforeAfter.headline.improved}`, 25, 52);
      
      // Summary Comparison
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Summary Hook:", 20, 65);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      const splitOrigAbout = doc.splitTextToSize(`Original: ${report.beforeAfter.about.original}`, 170);
      doc.text(splitOrigAbout, 25, 72);
      
      let nextY = 72 + (splitOrigAbout.length * 4.5) + 3;
      doc.setTextColor(45, 212, 191);
      const splitImpAbout = doc.splitTextToSize(`Optimized: ${report.beforeAfter.about.improved}`, 170);
      doc.text(splitImpAbout, 25, nextY);
      
      nextY += (splitImpAbout.length * 4.5) + 8;
      
      // Recommended Keywords List
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(45, 212, 191);
      doc.text("Key Target Competencies to Index", 20, nextY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(226, 232, 240);
      nextY += 8;
      
      const missingKeywords = report.keywords.filter(k => k.status === "missing").map(k => k.keyword).slice(0, 10).join(", ");
      doc.text(`Missing terms: ${missingKeywords}`, 20, nextY);
      
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
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <Cpu className="w-8 h-8 text-brand-accentBlue" />
          <span>Profile Optimization Workspace</span>
        </h1>
        <p className="text-slate-400 mt-1">Provide your current LinkedIn details to run an analysis against your target role.</p>
      </div>

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
