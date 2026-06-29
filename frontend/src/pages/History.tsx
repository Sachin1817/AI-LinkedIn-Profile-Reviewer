import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronDown, ChevronUp, Copy, Check, TrendingUp, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { 
  SeoScoreResponse, 
  ProfileAnalysisResponse, 
  HeadlineSuggestionsResponse, 
  SkillsRecommendationsResponse 
} from "../lib/api";

interface HistoryRecord {
  targetRole: string;
  timestamp: string;
  seo?: SeoScoreResponse;
  analysis?: ProfileAnalysisResponse;
  headlines?: HeadlineSuggestionsResponse;
  skills?: SkillsRecommendationsResponse;
}

export const History: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      // Scoped local storage key
      const localKey = `history_${user.uid}`;
      let localRecords: HistoryRecord[] = [];
      try {
        const localHistoryStr = localStorage.getItem(localKey);
        if (localHistoryStr) {
          localRecords = JSON.parse(localHistoryStr);
        }
      } catch (err) {
        console.error("Error reading history from localStorage:", err);
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const dbHistory = (data.analysisHistory || []) as HistoryRecord[];

          // Merge local and db history, using timestamps to filter duplicates
          const mergedMap = new Map<string, HistoryRecord>();
          [...localRecords, ...dbHistory].forEach(rec => {
            if (rec.timestamp) {
              mergedMap.set(rec.timestamp, rec);
            }
          });

          const sortedHistory = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setHistory(sortedHistory);

          // Update local cache
          localStorage.setItem(localKey, JSON.stringify(sortedHistory));
        } else {
          // No doc snap in database but local records exist
          const sortedHistory = localRecords.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setHistory(sortedHistory);
        }
      } catch (err) {
        console.error("Error loading history from Firestore, falling back to local:", err);
        // Fallback to local history
        const sortedHistory = localRecords.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setHistory(sortedHistory);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const formatDate = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "text-teal-400 border-teal-500/30 bg-teal-500/5";
    if (score >= 60) return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    return "text-rose-500 border-rose-500/30 bg-rose-500/5";
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-4">
        <div className="h-8 w-48 bg-slate-900 rounded animate-pulse" />
        <div className="h-28 rounded-2xl glass-panel animate-pulse bg-slate-900/30" />
        <div className="h-28 rounded-2xl glass-panel animate-pulse bg-slate-900/30" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Your Optimization History</h1>
        <p className="text-slate-400 mt-1">Review past resume grades and optimization audits.</p>
      </div>

      {history.length === 0 ? (
        <div className="p-8 rounded-2xl glass-panel text-center space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No history records found</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            You haven't run any profile analyses yet. Let's optimize your profile now!
          </p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-sky-600 hover:from-sky-600 hover:to-brand-blue text-white font-bold text-sm shadow-md transition-all duration-300"
          >
            Optimize Profile
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((record, index) => {
            const isExpanded = expandedIndex === index;
            const scoreClass = getScoreColorClass(record.seo?.score || 0);

            return (
              <div 
                key={index} 
                className="rounded-2xl glass-panel overflow-hidden border border-slate-800/80 hover:border-slate-800 transition duration-200"
              >
                {/* Accordion Trigger Header */}
                <div 
                  onClick={() => toggleExpand(index)}
                  className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-950/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Circle Score badge */}
                    <div className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center font-black ${scoreClass}`}>
                      <span className="text-base leading-none">{record.seo?.score || 0}</span>
                      <span className="text-[7px] uppercase font-semibold mt-0.5">Score</span>
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">{record.targetRole}</h3>
                      <span className="text-xs text-slate-500">{formatDate(record.timestamp)}</span>
                    </div>
                  </div>
                  <button className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Expanded Details Body */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-slate-800/60 bg-slate-950/20"
                    >
                      <div className="p-6 space-y-6">
                        
                        {/* 1. Score Breakdown sliders */}
                        <div className="space-y-3.5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SEO Parameters</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                              { label: "Headline Strength", val: record.seo?.breakdown?.headlineStrength },
                              { label: "Keyword Match", val: record.seo?.breakdown?.keywordDensity },
                              { label: "Completeness", val: record.seo?.breakdown?.completeness },
                              { label: "Summary Quality", val: record.seo?.breakdown?.summaryQuality }
                            ].map((item, subIdx) => (
                              <div key={subIdx} className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-300">
                                  <span>{item.label}</span>
                                  <span>{item.val || 0}/100</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-brand-blue to-brand-accentTeal"
                                    style={{ width: `${item.val || 0}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Critiques (Strengths, Weaknesses, Tone) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800/40">
                          {/* Strengths */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Strengths</h4>
                            {record.analysis?.strengths?.map((str, sIdx) => (
                              <div key={sIdx} className="flex gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                                <span>{str}</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Weaknesses */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weaknesses</h4>
                            {record.analysis?.weaknesses?.map((weak, wIdx) => (
                              <div key={wIdx} className="flex gap-2 text-xs text-slate-300">
                                <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                                <span>{weak}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. Tone Feedback / Summary */}
                        <div className="pt-4 border-t border-slate-800/40 space-y-2.5">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tone & Summary</h4>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-900">
                            {record.analysis?.toneFeedback}
                          </p>
                          <p className="text-xs text-slate-400 leading-relaxed italic">
                            {record.analysis?.overallSummary}
                          </p>
                        </div>

                        {/* 4. Actionable Fixes */}
                        {record.seo?.fixes && record.seo.fixes.length > 0 && (
                          <div className="pt-4 border-t border-slate-800/40 space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SEO Fixes Applied</h4>
                            <div className="space-y-1.5">
                              {record.seo.fixes.map((fix, fIdx) => (
                                <div key={fIdx} className="flex gap-2 text-xs text-slate-300">
                                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <span>{fix}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Headlines Suggested */}
                        <div className="pt-4 border-t border-slate-800/40 space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generated Headlines</h4>
                          <div className="space-y-2.5">
                            {record.headlines?.suggestions?.map((item, hIdx) => (
                              <div key={hIdx} className="p-3 rounded-lg border border-slate-900 bg-slate-950/30 flex justify-between items-start gap-4">
                                <div>
                                  <h5 className="text-xs font-bold text-white">{item.headline}</h5>
                                  <p className="text-[10px] text-slate-400 italic mt-0.5">{item.reasoning}</p>
                                </div>
                                <button
                                  onClick={() => handleCopy(item.headline, `h-${index}-${hIdx}`)}
                                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-brand-accentBlue transition duration-150"
                                >
                                  {copiedId === `h-${index}-${hIdx}` ? (
                                    <Check className="w-3 h-3 text-teal-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 6. Skills Recommended */}
                        <div className="pt-4 border-t border-slate-800/40 space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                            <span>Recommended Skills</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {record.skills?.recommendedSkills?.map((item, skIdx) => (
                              <div key={skIdx} className="p-2.5 rounded-lg border border-slate-900 bg-slate-950/30 flex justify-between items-center gap-2">
                                <span className="text-xs text-white font-medium">{item.skill}</span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  item.demandLevel === "High" ? "bg-rose-500/10 text-rose-400" :
                                  item.demandLevel === "Trending" ? "bg-teal-500/10 text-teal-400" :
                                  "bg-amber-500/10 text-amber-400"
                                }`}>
                                  {item.demandLevel}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
