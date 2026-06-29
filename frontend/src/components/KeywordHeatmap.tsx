import React, { useState } from "react";
import { Search } from "lucide-react";
import { KeywordItem } from "../lib/api";

interface KeywordHeatmapProps {
  keywords: KeywordItem[];
}

export const KeywordHeatmap: React.FC<KeywordHeatmapProps> = ({ keywords }) => {
  const [filter, setFilter] = useState<"all" | "existing" | "missing" | "high">("all");

  const filteredKeywords = keywords.filter((item) => {
    if (filter === "existing") return item.status === "existing";
    if (filter === "missing") return item.status === "missing";
    if (filter === "high") return item.importance === "High";
    return true;
  });

  const getStatusStyle = (status: KeywordItem["status"]) => {
    switch (status) {
      case "existing":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "missing":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "high-impact":
        return "bg-brand-blue/15 text-brand-accentBlue border-brand-blue/30";
      case "trending":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-800/40 text-slate-300 border-slate-700/30";
    }
  };

  const getImportanceStyle = (importance: KeywordItem["importance"]) => {
    switch (importance) {
      case "High":
        return "text-rose-400 border-rose-500/30 bg-rose-500/5";
      case "Medium":
        return "text-amber-400 border-amber-500/30 bg-amber-500/5";
      default:
        return "text-slate-400 border-slate-700/50 bg-slate-800/10";
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 flex flex-col h-full">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-brand-accentTeal" />
            <span>Keyword Density & Indexing</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Critical ATS and search indexing metrics for your target role.</p>
        </div>

        {/* Filters */}
        <div className="flex bg-slate-950/40 border border-slate-800 rounded-xl p-1 text-xs">
          {(["all", "existing", "missing", "high"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider transition-colors duration-150 ${
                filter === opt
                  ? "bg-brand-blue text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt === "high" ? "High Priority" : opt}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Grid */}
      {filteredKeywords.length === 0 ? (
        <div className="flex-grow flex items-center justify-center py-12 text-slate-500 text-xs italic">
          No keywords match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-grow">
          {filteredKeywords.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200 ${getStatusStyle(
                item.status
              )}`}
            >
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-sm tracking-tight truncate">{item.keyword}</span>
                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border rounded-full ${getImportanceStyle(item.importance)}`}>
                  {item.importance}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Coverage</span>
                <div className="flex-grow h-1.5 bg-slate-950/60 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full ${
                      item.status === "existing" ? "bg-teal-400" :
                      item.status === "missing" ? "bg-rose-400" :
                      "bg-brand-accentBlue"
                    }`}
                    style={{ width: `${item.coverage}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-300">{item.coverage}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
