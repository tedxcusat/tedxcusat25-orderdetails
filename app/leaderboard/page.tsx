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
        const res = await fetch("/api/orders");
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
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-white">
          Referral <span className="text-white">Leaderboard</span>
        </h1>

        {isLoading ? (
          <div className="flex justify-center text-zinc-500 animate-pulse">
            Loading data...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center p-12 border border-zinc-800 rounded-2xl bg-zinc-900/30">
            <p className="text-zinc-400">No accepted referrals yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: entry.rank * 0.05 }}
                key={entry.name}
                className={`relative p-6 rounded-xl border flex items-center justify-between group overflow-hidden ${entry.rank === 1
                  ? "bg-gradient-to-r from-yellow-900/20 to-black border-yellow-600/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]"
                  : entry.rank === 2
                    ? "bg-gradient-to-r from-zinc-800/20 to-black border-zinc-400/50"
                    : entry.rank === 3
                      ? "bg-gradient-to-r from-orange-900/20 to-black border-orange-600/50"
                      : "bg-zinc-900/30 border-zinc-800"
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
                          : "bg-zinc-800 border-zinc-700 text-zinc-500"
                      }`}
                  >
                    #{entry.rank}
                  </div>
                  <div>
                    <h3 className={`text-lg md:text-xl font-bold ${entry.rank <= 3 ? "text-white" : "text-zinc-300"
                      }`}>
                      {entry.name}
                    </h3>
                    <p className="text-sm text-zinc-500">{entry.dept}</p>
                  </div>
                </div>

                <div className="z-10 text-right">
                  <p className="text-2xl md:text-3xl font-bold text-white">
                    {entry.count}
                  </p>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest">
                    Referrals
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
