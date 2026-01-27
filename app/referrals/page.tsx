"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ReferralsPage() {
  const [formData, setFormData] = useState({
    name: "",
    dept: "",
    phone: "",
  });
  const [generatedData, setGeneratedData] = useState<{
    code: string;
    url: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setGeneratedData(null);

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        const url = `https://merch.tedxcusat.in/merch?ref=${data.code}`;
        setGeneratedData({ code: data.code, url });
        setFormData({ name: "", dept: "", phone: "" }); // Reset form
      } else {
        setError(data.message || "Failed to generate code");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans pt-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
          Generate <span className="text-red-600">Referral</span>
        </h1>

        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
          <form onSubmit={generateReferral} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Volunteer Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-600 focus:outline-none transition-colors"
                placeholder="Ex: John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Department</label>
              <input
                type="text"
                name="dept"
                value={formData.dept}
                onChange={handleChange}
                required
                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-600 focus:outline-none transition-colors"
                placeholder="Ex: Marketing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 focus:border-red-600 focus:outline-none transition-colors"
                placeholder="Ex: 9876543210"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Generating..." : "Generate Code"}
            </button>

            {error && <p className="text-red-500 text-center">{error}</p>}
          </form>
        </div>

        <AnimatePresence>
          {generatedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 bg-zinc-900 border border-red-900/30 p-6 rounded-xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Referral Generated!</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Referral Code</p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-black/50 p-3 rounded-lg font-mono text-red-500 text-lg border border-zinc-800">
                      {generatedData.code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedData.code)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700 text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-zinc-400 mb-1">Shareable URL</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={generatedData.url}
                      className="flex-1 bg-black/50 p-3 rounded-lg font-mono text-sm text-zinc-300 border border-zinc-800 focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedData.url)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700 text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {copySuccess && (
                  <p className="text-green-500 text-sm text-right">{copySuccess}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
