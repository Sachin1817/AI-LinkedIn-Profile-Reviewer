import React from "react";
import { Check, X, ShieldAlert, BadgeCheck } from "lucide-react";
import { ProfileCompleteness } from "../lib/api";

interface CompletenessTrackerProps {
  completeness: ProfileCompleteness;
}

export const CompletenessTracker: React.FC<CompletenessTrackerProps> = ({ completeness }) => {
  const items = [
    { label: "Headline & Role Target", checked: completeness.headline, desc: "A compelling hook that includes your target keywords." },
    { label: "About Summary Hook", checked: completeness.about, desc: "A paragraph that specifies your value proposition and main stack." },
    { label: "Experience & Bullet Metrics", checked: completeness.experience, desc: "Quantifiable history statements showing impact and details." },
    { label: "Projects Showcase", checked: completeness.projects, desc: "Hands-on engineering projects detailing technical stacks." },
    { label: "Skills Endorsements", checked: completeness.skills, desc: "Relevant technology lists tagged for ATS scanners." },
    { label: "Education Records", checked: completeness.education, desc: "University degree or technical academy completions." },
    { label: "Industry Certifications", checked: completeness.certifications, desc: "Valid certificates verifying specialized capabilities." },
    { label: "Profile Recommendations", checked: completeness.recommendations, desc: "Peer recommendations validating social proof." }
  ];

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return "bg-teal-500 text-teal-400";
    if (pct >= 60) return "bg-amber-500 text-amber-400";
    return "bg-rose-500 text-rose-500";
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {completeness.percentage >= 80 ? (
            <BadgeCheck className="w-5 h-5 text-teal-400" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          )}
          <span>Profile Completeness Checklist</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Recruiters prioritize profile listings that are structurally complete.</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Completion Level</span>
          <span className={`text-xl font-black ${getScoreColor(completeness.percentage).split(" ")[1]}`}>
            {completeness.percentage}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              getScoreColor(completeness.percentage).split(" ")[0]
            }`}
            style={{ width: `${completeness.percentage}%` }}
          />
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="space-y-3.5 flex-grow">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            <div
              className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border mt-0.5 ${
                item.checked
                  ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                  : "bg-slate-950 border-slate-800 text-slate-600"
              }`}
            >
              {item.checked ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
            </div>
            <div>
              <h5 className={`text-xs font-bold ${item.checked ? "text-slate-200" : "text-slate-500"}`}>
                {item.label}
              </h5>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
