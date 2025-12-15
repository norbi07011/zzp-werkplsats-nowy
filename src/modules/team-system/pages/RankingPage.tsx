import React from "react";
import { useStore } from "../context/StoreContext";
import { Trophy, Medal, Star, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export const RankingPage = () => {
  const { users, t, isLoading } = useStore();

  // Sort users by completed tasks desc
  const sortedUsers = [...users]
    .filter((u) => u.role === "WORKER")
    .sort((a, b) => b.completedTasksCount - a.completedTasksCount);
  const top3 = sortedUsers.slice(0, 3);

  const chartData = sortedUsers.map((u) => ({
    name: u.name.split(" ")[0],
    points: u.completedTasksCount,
  }));

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Empty state - no team members
  if (sortedUsers.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            {t("leaderboard")}
          </h2>
          <p className="text-slate-500">Who is the BouwMaster of the month?</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-100">
          <Users size={64} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">
            Brak członków zespołu
          </h3>
          <p className="text-slate-400 text-center max-w-md">
            Ranking zostanie wyświetlony gdy do zespołu dołączą pracownicy i
            zaczną wykonywać zadania.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
          {t("leaderboard")}
        </h2>
        <p className="text-slate-500">Who is the BouwMaster of the month?</p>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end space-x-4 h-64 mb-8">
        {top3[1] && (
          <div className="flex flex-col items-center">
            <img
              src={top3[1].avatar}
              className="w-16 h-16 rounded-full border-4 border-slate-300 mb-2"
              alt={top3[1].name}
            />
            <div className="h-32 w-24 bg-slate-200 rounded-t-lg flex flex-col items-center justify-center shadow-lg">
              <span className="font-bold text-2xl text-slate-500">2</span>
              <p className="text-xs font-semibold mt-2">{top3[1].name}</p>
              <p className="text-xs text-slate-500">
                {top3[1].completedTasksCount} pts
              </p>
            </div>
          </div>
        )}
        {top3[0] && (
          <div className="flex flex-col items-center z-10">
            <Trophy className="text-yellow-500 mb-2" size={32} />
            <img
              src={top3[0].avatar}
              className="w-20 h-20 rounded-full border-4 border-yellow-400 mb-2"
              alt={top3[0].name}
            />
            <div className="h-40 w-28 bg-yellow-100 rounded-t-lg flex flex-col items-center justify-center shadow-xl border-t-4 border-yellow-400">
              <span className="font-bold text-3xl text-yellow-600">1</span>
              <p className="text-xs font-semibold mt-2">{top3[0].name}</p>
              <p className="text-xs text-yellow-700 font-bold">
                {top3[0].completedTasksCount} pts
              </p>
            </div>
          </div>
        )}
        {top3[2] && (
          <div className="flex flex-col items-center">
            <img
              src={top3[2].avatar}
              className="w-16 h-16 rounded-full border-4 border-orange-300 mb-2"
              alt={top3[2].name}
            />
            <div className="h-24 w-24 bg-orange-100 rounded-t-lg flex flex-col items-center justify-center shadow-lg">
              <span className="font-bold text-2xl text-orange-400">3</span>
              <p className="text-xs font-semibold mt-2">{top3[2].name}</p>
              <p className="text-xs text-slate-500">
                {top3[2].completedTasksCount} pts
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-700 mb-6">Performance Chart</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "#f59e0b" : "#0ea5e9"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
