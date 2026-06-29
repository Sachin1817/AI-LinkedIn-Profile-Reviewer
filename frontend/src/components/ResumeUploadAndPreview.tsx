import React, { useState, useRef } from "react";
import { api, StructuredResumeData, ResumeAnalysis, ResumeUploadResponse } from "../lib/api";
import { UploadCloud, FileText, CheckCircle2, Loader2, Play, RefreshCw, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

interface ResumeUploadAndPreviewProps {
  token: string | null;
  onAnalysisComplete: (
    analysis: ResumeAnalysis,
    rawText: string,
    fileName: string,
    structuredData: StructuredResumeData
  ) => void;
  onLoadIntoLinkedIn?: (structuredData: StructuredResumeData) => void;
  onError: (error: string) => void;
}

export const ResumeUploadAndPreview: React.FC<ResumeUploadAndPreviewProps> = ({
  token,
  onAnalysisComplete,
  onLoadIntoLinkedIn,
  onError
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extracted states
  const [extraction, setExtraction] = useState<ResumeUploadResponse | null>(null);
  const [editedText, setEditedText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      onError("Invalid file type. Only PDF resumes are accepted.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      onError("File too large. Maximum size is 10 MB.");
      return;
    }

    setUploading(true);
    setExtraction(null);
    onError("");

    try {
      const response = await api.uploadResume(selectedFile, token || undefined);
      setExtraction(response);
      setEditedText(response.text);
    } catch (err: any) {
      onError(err.message || "Failed to upload and parse resume.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!extraction) return;
    setAnalyzing(true);
    onError("");

    try {
      const analysis = await api.analyzeResume(
        {
          fileName: extraction.fileName,
          text: editedText,
          structuredData: extraction.structuredData
        },
        token || undefined
      );

      onAnalysisComplete(analysis, editedText, extraction.fileName, extraction.structuredData);
    } catch (err: any) {
      onError(err.message || "Failed to analyze resume.");
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Upload Drag & Drop Box */}
      {!extraction && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative p-10 rounded-2xl border-2 border-dashed transition-all duration-300 ${
            dragActive
              ? "border-brand-accentBlue bg-brand-blue/5 shadow-[0_0_20px_rgba(0,114,177,0.15)]"
              : "border-slate-800 bg-slate-950/20 hover:border-slate-700"
          } flex flex-col items-center justify-center min-h-[300px] text-center`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf"
            onChange={handleChange}
          />

          {uploading ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-12 h-12 text-brand-accentBlue animate-spin" />
              <div className="space-y-1">
                <p className="text-white font-semibold text-lg">Parsing Resume Details</p>
                <p className="text-slate-400 text-xs">PyMuPDF is extracting layout and textual segments...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-5">
              <div className="p-4 rounded-full bg-slate-900 border border-slate-800">
                <UploadCloud className="w-10 h-10 text-brand-accentBlue" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold text-lg">Drag & Drop Resume PDF</p>
                <p className="text-slate-400 text-sm max-w-sm">
                  Upload your resume to extract metadata details, experience bullet points, and competencies.
                </p>
              </div>
              <button
                type="button"
                onClick={onButtonClick}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-sky-600 hover:from-sky-600 hover:to-brand-blue text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all duration-300"
              >
                Choose PDF File
              </button>
              <p className="text-slate-500 text-xs">PDF format only (Max 10 MB)</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Extraction Success & Preview Panel */}
      {extraction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Stats Bar */}
          <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
              <FileText className="w-48 h-48 text-white" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">Resume Uploaded Successfully!</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{extraction.fileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setExtraction(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400 hover:text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Different Resume</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-900">
              <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-900">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pages Extracted</p>
                <p className="text-xl font-bold text-white mt-1">{extraction.pages}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-900">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Character Count</p>
                <p className="text-xl font-bold text-white mt-1">{extraction.characters}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-900">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Word Count</p>
                <p className="text-xl font-bold text-white mt-1">{extraction.wordCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-900">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reading Time</p>
                <p className="text-xl font-bold text-white mt-1">{extraction.estimatedReadingTime}</p>
              </div>
            </div>
          </div>

          {/* Side-by-Side Raw Text Preview and Structured Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Raw Text Preview */}
            <div className="p-6 rounded-2xl glass-panel flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white">Extracted Resume Text Preview</h3>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 text-slate-400 hover:text-white transition"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Review and make corrections to the extracted PDF text before running the final AI Optimization analysis.
              </p>

              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-80 px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-accentBlue focus:ring-1 focus:ring-brand-accentBlue/20 text-xs font-mono resize-none leading-relaxed"
              />
            </div>

            {/* Extracted Metadata / Structure View */}
            <div className="p-6 rounded-2xl glass-panel flex flex-col space-y-4">
              <h3 className="text-base font-bold text-white">Extracted Profile Metadata</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Here are the parsed data segments recognized by the parser.
              </p>

              <div className="space-y-4 h-80 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Name</span>
                    <p className="text-xs font-medium text-white bg-slate-950/30 p-2.5 rounded-lg border border-slate-900">
                      {extraction.structuredData.name || "Not Found"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email</span>
                    <p className="text-xs font-medium text-white bg-slate-950/30 p-2.5 rounded-lg border border-slate-900 truncate">
                      {extraction.structuredData.email || "Not Found"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone</span>
                    <p className="text-xs font-medium text-white bg-slate-950/30 p-2.5 rounded-lg border border-slate-900">
                      {extraction.structuredData.phone || "Not Found"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">LinkedIn</span>
                    <p className="text-xs font-medium text-brand-accentBlue bg-slate-950/30 p-2.5 rounded-lg border border-slate-900 truncate">
                      {extraction.structuredData.linkedin || "Not Found"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Skills Extracted</span>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/30 border border-slate-900 rounded-lg max-h-24 overflow-y-auto">
                    {extraction.structuredData.skills && extraction.structuredData.skills.length > 0 ? (
                      extraction.structuredData.skills.map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 text-[10px] border border-slate-800">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic p-1">No skills detected</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Experience Found</span>
                  <div className="space-y-1.5">
                    {extraction.structuredData.experience && extraction.structuredData.experience.length > 0 ? (
                      extraction.structuredData.experience.map((exp, i) => (
                        <div key={i} className="p-2.5 bg-slate-950/20 border border-slate-900 rounded-lg text-[11px]">
                          <span className="font-bold text-white">{exp.role}</span>
                          <span className="text-slate-400"> @ {exp.company}</span>
                          <p className="text-slate-500 text-[10px] mt-0.5">{exp.duration}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No experience blocks recognized</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            {onLoadIntoLinkedIn && (
              <button
                type="button"
                onClick={() => onLoadIntoLinkedIn(extraction.structuredData)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <FileText className="w-4 h-4 text-brand-accentTeal" />
                <span>Load into LinkedIn Reviewer</span>
              </button>
            )}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-blue to-sky-600 hover:from-sky-600 hover:to-brand-blue text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Running AI Resume Audit...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Analyze Extracted Resume</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
