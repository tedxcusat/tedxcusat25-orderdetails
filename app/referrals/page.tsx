"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Copy, Check, X, Link2 } from "lucide-react";

interface Referral {
  code: string;
  referrer: {
    name: string;
    dept: string;
    phone: string;
  };
  createdAt: string;
}

export default function ReferralsPage() {
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    dept: "",
    phone: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // List State
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Success Overlay State
  const [newReferral, setNewReferral] = useState<{
    code: string;
    url: string;
  } | null>(null);

  // Copy Feedback State
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Fetch Referrals
  const fetchReferrals = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/referrals");
      const data = await res.json();
      if (data.success && data.referrals) {
        setReferrals(data.referrals);
      }
    } catch (error) {
      console.error("Failed to fetch referrals", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerateError("");

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setNewReferral({ code: data.code, url: data.url });
        setFormData({ name: "", dept: "", phone: "" });
        fetchReferrals(); // Refresh list
      } else {
        setGenerateError(data.message || "Failed to generate code");
      }
    } catch (err) {
      setGenerateError("An error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    if (!text) return;

    try {
      // Try using the modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopyFeedback(id);
        setTimeout(() => setCopyFeedback(null), 2000);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback...", err);

      // Fallback method using textarea
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure textarea is not visible but part of DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.setAttribute("readonly", "");

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopyFeedback(id);
          setTimeout(() => setCopyFeedback(null), 2000);
        } else {
          throw new Error("Fallback copy failed");
        }
      } catch (fallbackErr) {
        console.error("Failed to copy:", fallbackErr);
      }
    }
  };

  const filteredReferrals = referrals.filter((ref) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      ref.referrer.name.toLowerCase().includes(searchLower) ||
      ref.code.toLowerCase().includes(searchLower) ||
      ref.referrer.dept.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans pt-8 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
          Affiliation <span className="text-red-600">Management</span>
        </h1>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Generate Form (4 columns) */}
          <div className="lg:col-span-4 h-fit sticky top-24">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-red-600 rounded-full" />
                Create New Affiliation
              </h2>
              <form onSubmit={generateReferral} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:border-red-600 focus:outline-none transition-colors"
                    placeholder="Volunteer Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Department</label>
                  <input
                    type="text"
                    name="dept"
                    value={formData.dept}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:border-red-600 focus:outline-none transition-colors"
                    placeholder="Department"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{10}"
                    className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:border-red-600 focus:outline-none transition-colors"
                    placeholder="Phone Number"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm uppercase tracking-wide"
                >
                  {isGenerating ? "Generating..." : "Generate Code"}
                </button>

                {generateError && <p className="text-red-500 text-xs text-center">{generateError}</p>}
              </form>
            </div>
          </div>

          {/* Right Column: List (8 columns) */}
          <div className="lg:col-span-8">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col min-h-[600px]">
              {/* Header & Search */}
              <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900/50">
                <h2 className="text-xl font-bold text-white">All Affiliations <span className="text-zinc-500 text-sm font-normal ml-2">({filteredReferrals.length})</span></h2>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-700 rounded-full pl-10 pr-4 py-2 text-sm focus:border-zinc-500 focus:outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto max-h-[700px] p-4 space-y-3">
                {isLoadingList ? (
                  <div className="flex justify-center py-12 text-zinc-500 animate-pulse">Loading referrals...</div>
                ) : filteredReferrals.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">No referrals found</div>
                ) : (
                  filteredReferrals.map((ref) => (
                    <div key={ref.code} className="bg-black/40 border border-zinc-800/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-zinc-700 transition-colors group">
                      <div className="flex items-center gap-4 flex-1 w-full">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold shrink-0">
                          {ref.referrer.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white truncate">{ref.referrer.name}</h3>
                          <p className="text-xs text-zinc-500 truncate">{ref.referrer.dept} • {ref.referrer.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <code className="bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-red-500 font-mono font-bold text-sm tracking-widest shrink-0">
                          {ref.code}
                        </code>

                        <div className="flex gap-2 shrink-0 ml-auto md:ml-0">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ref.code, `code-${ref.code}`)}
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors relative"
                            title="Copy Code"
                          >
                            {copyFeedback === `code-${ref.code}` ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`https://tedxcusat.in/merch?ref=${ref.code}`, `link-${ref.code}`)}
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            title="Copy Link"
                          >
                            {copyFeedback === `link-${ref.code}` ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {newReferral && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 border border-red-900/50 rounded-2xl p-8 max-w-md w-full relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <button
                  onClick={() => setNewReferral(null)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-500/20">
                    <Check size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Referral Generated!</h2>
                  <p className="text-zinc-400 text-sm mt-2">Ready to share with {formData.name}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 text-center">Referral Code</p>
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-center text-xl font-bold text-red-500 tracking-widest font-mono">{newReferral.code}</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(newReferral.code, "modal-code")}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        {copyFeedback === "modal-code" ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 text-center">Share Link</p>
                    <div className="flex items-center gap-3">
                      <p className="flex-1 text-xs text-zinc-400 truncate font-mono bg-zinc-900/50 p-2 rounded">{newReferral.url}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(newReferral.url, "modal-url")}
                        className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        {copyFeedback === "modal-url" ? <Check size={20} className="text-green-500" /> : <Link2 size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setNewReferral(null)}
                  className="w-full mt-8 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Done
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
