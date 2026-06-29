import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion, Variants } from "framer-motion";
import { Search, Award, MessageSquare, ArrowRight, Zap, Sparkles } from "lucide-react";

export const Landing: React.FC = () => {
  const { user } = useAuth();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  const features = [
    {
      icon: <Search className="w-6 h-6 text-sky-400" />,
      title: "SEO Searchability Audit",
      description: "Analyze how you rank in recruiter searches with a hybrid AI and rule-based score from 0-100."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-teal-400" />,
      title: "Headline Refinement",
      description: "Receive 5 optimized, industry-targeted headlines designed to grab immediate recruiter attention."
    },
    {
      icon: <Award className="w-6 h-6 text-indigo-400" />,
      title: "Skills Gap Analysis",
      description: "Identify key trending and high-demand skills you need to add to stand out in your field."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-purple-400" />,
      title: "Clarity & Tone Review",
      description: "Get constructive recommendations on your overall profile tone, weaknesses, and missing details."
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-100px)] flex flex-col items-center justify-center px-4 md:px-8 py-16 overflow-hidden">
      
      {/* Mesh Glow elements */}
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 rounded-full blur-3xl -top-40 -left-40 pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-br from-purple-500/5 to-teal-500/10 rounded-full blur-3xl -bottom-40 -right-40 pointer-events-none" />

      {/* Hero section */}
      <motion.div 
        className="max-w-4xl mx-auto text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Banner badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Real-time AI Analysis</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white mb-6">
          Optimize Your <span className="bg-gradient-to-r from-brand-accentBlue to-brand-accentTeal bg-clip-text text-transparent">LinkedIn Profile</span> For Recruiters
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Get real-time SEO grading, profile audits, custom headline suggestions, and skills advisory powered by Groq and Gemini AI. 
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to={user ? "/dashboard" : "/auth"}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-brand-blue via-sky-600 to-sky-500 hover:from-sky-600 hover:to-brand-blue text-white font-bold shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 group transition-all duration-300 transform hover:scale-[1.03]"
          >
            <span>{user ? "Go to Dashboard" : "Optimize My Profile"}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 font-medium transition-all duration-200"
          >
            How it works
          </a>
        </div>
      </motion.div>

      {/* Features Grid */}
      <div id="features" className="max-w-6xl mx-auto w-full z-10 mt-12 scroll-mt-28">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white">Full-Stack Features</h2>
          <p className="text-slate-500 mt-2">Tailored analytics designed to audit and boost your profile search rank.</p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feat, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="p-6 rounded-2xl glass-panel glass-panel-hover flex gap-5"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                {feat.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </div>
  );
};
