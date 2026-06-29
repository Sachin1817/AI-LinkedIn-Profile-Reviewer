import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { Cpu } from "lucide-react";
import { RadarData } from "../lib/api";

interface RadarMetricsProps {
  data: RadarData[];
}

export const RadarMetrics: React.FC<RadarMetricsProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl text-xs shadow-2xl">
          <span className="font-extrabold text-slate-100">{payload[0].name}: </span>
          <span className="font-black text-brand-accentBlue">{payload[0].value}%</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-slate-800/80 flex flex-col items-center justify-between h-full min-h-[350px]">
      <div className="w-full text-left mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-accentTeal" />
          <span>Competency Vectors</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Vector view of primary profile performance pillars.</p>
      </div>

      <div className="w-full h-64 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "600" }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: "#64748b", fontSize: 8 }} 
              axisLine={false} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#0072b1"
              fill="#38bdf8"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
