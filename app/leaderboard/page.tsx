"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Order } from "../types/order";

interface LeaderboardEntry {
  rank: number;
  name: string;
  dept: string;
  count: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = await res.json();

        if (data.success && data.orders) {
          const orders: Order[] = data.orders;

          // 1. Filter Accepted Orders with Referrals
          const referralOrders = orders.filter(
            (o) => o.status === "accepted" && o.referral
          );

          // 2. Aggregate Counts
          const counts: Record<string, { count: number; dept: string }> = {};

          referralOrders.forEach((order) => {
            const referrerName = order.referral?.referrer?.name || "Unknown";
            const referrerDept = order.referral?.referrer?.dept || "Unknown";

            if (!counts[referrerName]) {
              counts[referrerName] = { count: 0, dept: referrerDept };
            }
            counts[referrerName].count += 1;
          });

          // 3. Convert to Array and Sort
          const sortedEntries = Object.entries(counts)
            .map(([name, data]) => ({
              name,
              dept: data.dept,
              count: data.count,
            }))
            .sort((a, b) => b.count - a.count)
            .map((entry, index) => ({
              ...entry,
              rank: index + 1,
            }));

          setEntries(sortedEntries);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl md:text-5xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
          Affiliation <span className="text-red-600">Leaderboard</span>
        </h1>

        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 min-h-[600px]">
          {isLoading ? (
            <div className="flex justify-center py-12 text-[var(--muted)] animate-pulse">
              Loading data...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <p>No accepted affiliations yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: entry.rank * 0.05 }}
                  key={entry.name}
                  className={`relative p-4 rounded-lg border flex items-center justify-between group overflow-hidden ${entry.rank === 1
                    ? "bg-yellow-900/10 border-yellow-500/50"
                    : entry.rank === 2
                      ? "bg-zinc-800/50 border-zinc-500/50"
                      : entry.rank === 3
                        ? "bg-orange-900/10 border-orange-500/50"
                        : "bg-zinc-900/30 border-[var(--card-border)]"
                    }`}
                >
                  {/* Rank Badge */}
                  <div className="flex items-center gap-6 z-10">
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-full text-xl font-bold border ${entry.rank === 1
                        ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
                        : entry.rank === 2
                          ? "bg-zinc-400/10 border-zinc-400 text-zinc-400"
                          : entry.rank === 3
                            ? "bg-orange-600/10 border-orange-600 text-orange-600"
                            : "bg-zinc-800 border-zinc-700 text-[var(--muted)]"
                        }`}
                    >
                      #{entry.rank}
                    </div>
                    <div>
                      <h3 className={`text-lg md:text-xl font-medium ${entry.rank <= 3 ? "text-white" : "text-white"
                        }`}>
                        {entry.name}
                      </h3>
                      <p className="text-sm text-[var(--muted)]">{entry.dept}</p>
                    </div>
                  </div>

                  <div className="z-10 text-right">
                    <p className="text-2xl md:text-3xl font-bold text-white">
                      {entry.count}
                    </p>
                    <p className="text-xs text-[var(--muted)] uppercase tracking-widest">
                      Affiliations
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
