import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, User, Compass, HelpCircle } from "lucide-react";
import { api, ChatMessage } from "../lib/api";

interface ChatAssistantProps {
  token?: string | null;
  profileContext: {
    headline: string;
    about: string;
    experience: string;
    skills: string[];
    targetRole: string;
  } | null;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ token, profileContext }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Career Coach. Ask me how to improve specific bullet points, rewrite summary hooks, or close skills gaps!"
    }
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    // Format history for backend (list of objects with role, content)
    // Exclude the initial assistant greeting or send it too
    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const res = await api.chat(
        {
          message: userMessage,
          history: historyPayload,
          profileContext: profileContext
        },
        token || undefined
      );

      setMessages((prev) => [...prev, { role: "assistant", content: res.response }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Error: Failed to fetch advisor advice. Please verify API configuration." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Write a bullet point for my work experience using metrics.",
    "Draft a professional summary hook for my target role.",
    "Which skills in my stack should I highlight first?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {/* Chat Widget Panel */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[340px] sm:w-[380px] h-[500px] rounded-2xl glass-panel border border-slate-800/80 shadow-2xl flex flex-col justify-between overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800/60 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-accentTeal flex items-center justify-center text-white">
                  <Compass className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">AI Profile Advisor</h4>
                  <span className="text-[9px] text-teal-400 font-semibold uppercase tracking-wider mt-1 block">Online</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat History Messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-slate-950/10">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 max-w-[85%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border text-xs font-bold ${
                      msg.role === "user"
                        ? "bg-slate-900 border-slate-800 text-brand-accentBlue"
                        : msg.role === "system"
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-brand-blue/10 border-brand-blue/20 text-brand-accentTeal"
                    }`}
                  >
                    {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5" />}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand-blue text-white rounded-tr-none"
                        : msg.role === "system"
                        ? "bg-rose-500/5 text-rose-300 border border-rose-500/10"
                        : "bg-slate-900/60 border border-slate-800/80 text-slate-200 rounded-tl-none whitespace-pre-line"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2.5 mr-auto max-w-[80%]">
                  <div className="w-7 h-7 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-accentTeal">
                    <Compass className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-slate-900 bg-slate-950/20 space-y-1.5">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> Quick suggestions
                </span>
                <div className="space-y-1">
                  {samplePrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setInput(prompt)}
                      className="w-full text-left p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-slate-200 truncate transition duration-150"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-900 bg-slate-950/50 flex gap-2">
              <input
                type="text"
                placeholder="Ask advice..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-grow px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-accentBlue"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-brand-blue hover:bg-sky-600 text-white disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-blue to-blue-600 hover:from-blue-600 hover:to-brand-blue text-white flex items-center justify-center shadow-2xl cursor-pointer shadow-brand-blue/20"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};
