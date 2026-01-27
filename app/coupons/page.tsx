"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CouponsPage() {
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

  const generateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setGeneratedData(null);

    try {
      const res = await fetch("/api/coupons/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        // Use 'coupon=' param
        const url = `https://merch.tedxcusat.in/merch?coupon=${data.code}`;
        setGeneratedData({ code: data.code, url });
        setFormData({ name: "", dept: "", phone: "" });
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
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
          Generate <span className="text-red-600">Coupon</span>
        </h1>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Form */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-xl backdrop-blur-sm h-fit">
            <h2 className="text-xl font-bold text-white mb-6">Volunteer Details</h2>
            <form onSubmit={generateCoupon} className="space-y-6">
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
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? "Generating..." : "Generate Code"}
              </button>

              {error && <p className="text-red-500 text-center">{error}</p>}
            </form>
          </div>

          {/* Right Column: Generated Details */}
          <div className="lg:pl-8">
            <AnimatePresence mode="wait">
              {generatedData ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-zinc-900 border border-red-900/30 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
                >
                  {/* Decorative background glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                  <h2 className="text-2xl font-bold text-white mb-8">Coupon Generated!</h2>

                  <div className="space-y-8 relative z-10">
                    <div>
                      <p className="text-sm text-zinc-400 mb-2 uppercase tracking-wider">Coupon Code</p>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-black/50 p-4 rounded-xl font-mono text-red-500 text-2xl font-bold border border-zinc-800 text-center tracking-widest">
                          {generatedData.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(generatedData.code)}
                          className="px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700 font-medium"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-400 mb-2 uppercase tracking-wider">Shareable URL</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={generatedData.url}
                          className="flex-1 bg-black/50 p-4 rounded-xl font-mono text-sm text-zinc-300 border border-zinc-800 focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(generatedData.url)}
                          className="px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700 font-medium"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  {copySuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-4 right-8 bg-green-500/10 text-green-500 px-4 py-2 rounded-full text-sm border border-green-500/20"
                    >
                      {copySuccess}
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-600 p-8 text-center bg-zinc-900/20"
                >
                  <p className="text-lg font-medium mb-2">No Coupon Generated Yet</p>
                  <p className="text-sm max-w-xs">Fill out the form on the left to generate a new referral code.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
