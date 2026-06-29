import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Copy, AlertCircle, ArrowUpRight } from "lucide-react";
import { BeforeAfterComparison, BeforeAfterItem } from "../lib/api";

interface BeforeAfterViewProps {
  data: BeforeAfterComparison;
}

export const BeforeAfterView: React.FC<BeforeAfterViewProps> = ({ data }) => {
  const [activeSection, setActiveSection] = useState<keyof BeforeAfterComparison>("headline");
  const [copied, setCopied] = useState<boolean>(false);

  const sections: { key: keyof BeforeAfterComparison; label: string }[] = [
    { key: "headline", label: "Headline" },
    { key: "about", label: "About" },
    { key: "experience", label: "Experience" },
    { key: "skills", label: "Skills" },
    { key: "projects", label: "Projects" },
  ];

  const currentItem: BeforeAfterItem = data[activeSection];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentItem.improved);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl glass-panel overflow-hidden border border-slate-800/80 flex flex-col h-full">
      {/* Sections Tab Header */}
      <div className="flex border-b border-slate-800/60 bg-slate-950/40 overflow-x-auto scrollbar-none">
        {sections.map((sect) => (
          <button
            key={sect.key}
            onClick={() => {
              setActiveSection(sect.key);
              setCopied(false);
            }}
            className={`flex-1 min-w-[90px] py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 ${
              activeSection === sect.key
                ? "border-brand-accentBlue text-brand-accentBlue bg-slate-900/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {sect.label}
          </button>
        ))}
      </div>

      {/* Body Content */}
      <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Before (Original) */}
            <div className="space-y-2 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Before (Original)
              </span>
              <div className="flex-grow p-4 rounded-xl border border-slate-900 bg-slate-950/20 text-sm text-slate-400 whitespace-pre-line leading-relaxed font-mono min-h-[140px] max-h-[220px] overflow-y-auto">
                {currentItem.original || "No original text provided."}
              </div>
            </div>

            {/* After (Improved Draft) */}
            <div className="space-y-2 flex flex-col relative group">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> After (AI-Optimized Draft)
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-brand-accentBlue transition duration-200 flex items-center gap-1 text-[10px] font-bold uppercase"
                  title="Copy improved draft"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-teal-400" />
                      <span className="text-teal-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex-grow p-4 rounded-xl border border-slate-800/80 bg-brand-blue/5 text-sm text-slate-100 whitespace-pre-line leading-relaxed min-h-[140px] max-h-[220px] overflow-y-auto font-sans shadow-inner">
                {currentItem.improved}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Changes & Impact Info Footer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-800/55">
          {/* Key Changes */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Modifications</span>
            <ul className="space-y-1.5">
              {currentItem.changes.map((change, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-slate-300">
                  <ArrowRight className="w-3.5 h-3.5 text-brand-accentBlue flex-shrink-0 mt-0.5" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Strategic Impact */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Strategic Impact</span>
            <div className="p-3.5 rounded-xl border border-brand-accentTeal/20 bg-brand-accentTeal/5 flex items-start gap-2.5">
              <ArrowUpRight className="w-4 h-4 text-brand-accentTeal flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs text-slate-200 leading-relaxed font-medium">
                {currentItem.impact}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
