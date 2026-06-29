import React, { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";

interface SeoGaugeProps {
  score: number;
}

export const SeoGauge: React.FC<SeoGaugeProps> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState<number>(0);

  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (value) => setDisplayScore(Math.round(value)),
    });
    return () => controls.stop();
  }, [score]);

  const getScoreColor = (val: number): string => {
    if (val >= 80) return "text-teal-400 stroke-teal-400 shadow-teal-500/20";
    if (val >= 60) return "text-amber-400 stroke-amber-400 shadow-amber-500/20";
    return "text-rose-500 stroke-rose-500 shadow-rose-500/20";
  };

  const getScoreLabel = (val: number): string => {
    if (val >= 80) return "Excellent";
    if (val >= 60) return "Good";
    return "Needs Improvement";
  };

  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl glass-panel relative">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-indigo-500/5 rounded-2xl pointer-events-none" />
      
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Decorative outer glow ring */}
        <div className="absolute w-32 h-32 rounded-full border border-slate-800/80 bg-slate-950/80 shadow-[0_0_30px_rgba(15,23,42,0.8)]" />
        
        {/* Animated Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-slate-800/40 fill-none"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            className={`fill-none ${getScoreColor(score)}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Text values */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(score)}`}>
            {displayScore}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">SEO SCORE</span>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <span className="text-sm font-medium text-slate-300">Rating: </span>
        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
};
