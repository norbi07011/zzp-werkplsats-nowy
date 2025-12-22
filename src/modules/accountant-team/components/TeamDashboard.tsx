/**
 * Team Dashboard - Overview with KPIs, Charts, Activity, and Deadlines
 * Based on boekhouder-connect Dashboard component
 */

import React, { useState, useEffect } from "react";
import { Language, TeamMember, TeamTask } from "../types";
import { DICTIONARY } from "../constants";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
  Activity,
  Layers,
  RefreshCw,
  PlusCircle,
  ArrowRight,
  Zap,
} from "lucide-react";

interface TeamDashboardProps {
  tasks: TeamTask[];
  language: Language;
  members: TeamMember[];
  setCurrentView: (view: string) => void;
}

// ============================================
// GLASS CARD COMPONENT
// ============================================
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  hoverEffect = false,
  onClick,
}) => (
  <div
    className={`
      relative overflow-hidden rounded-3xl backdrop-blur-xl border border-slate-200/60
      bg-gradient-to-br from-white/80 via-slate-50/50 to-white/40 shadow-sm
      ${
        hoverEffect
          ? "transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)] hover:border-indigo-300/50 hover:-translate-y-1"
          : ""
      }
      ${onClick ? "cursor-pointer" : ""}
      ${className}
    `}
    onClick={onClick}
  >
    {children}
  </div>
);

// ============================================
// KPI CARD COMPONENT
// ============================================
interface KPICardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  delay: string;
  loading?: boolean;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon: Icon,
  colorClass,
  delay,
  loading,
  onClick,
}) => (
  <div
    className={`
      group relative p-5 rounded-3xl overflow-hidden transition-all duration-500 ease-out
      bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50
      hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)] hover:border-indigo-500/50 hover:scale-[1.02]
      ${delay} animate-[fadeIn_0.5s_ease-out_both]
      ${onClick ? "cursor-pointer" : "cursor-default"}
    `}
    onClick={onClick}
  >
    {/* Inner Glow Effect */}
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-300 transition-colors truncate">
          {title}
        </p>
        {loading ? (
          <div className="h-10 w-16 animate-pulse bg-slate-700 rounded" />
        ) : (
          <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">
            {value}
          </h3>
        )}
      </div>
      <div
        className={`p-3 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-300 group-hover:bg-slate-700`}
      >
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClass}`} />
      </div>
    </div>
  </div>
);

// ============================================
// TAX DEADLINE TYPE
// ============================================
interface TaxDeadline {
  id: string;
  date: string;
  descriptionPL: string;
  descriptionNL: string;
}

// ============================================
// MAIN COMPONENT
// ============================================
export const TeamDashboard: React.FC<TeamDashboardProps> = ({
  tasks,
  language,
  members,
  setCurrentView,
}) => {
  const t = DICTIONARY[language];
  const [loading, setLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Calculate stats from tasks
  const stats = {
    todoCount: tasks.filter((t) => t.status === "todo").length,
    inProgressCount: tasks.filter((t) => t.status === "in_progress").length,
    reviewCount: tasks.filter((t) => t.status === "review").length,
    doneCount: tasks.filter((t) => t.status === "done").length,
    highPriorityCount: tasks.filter(
      (t) => t.priority === "high" || t.priority === "urgent"
    ).length,
    overdueCount: tasks.filter(
      (t) => t.status !== "done" && new Date(t.dueDate) < new Date()
    ).length,
    totalTasks: tasks.length,
  };

  // Chart data - Task Distribution
  const statusData = [
    { name: t.todo, value: stats.todoCount, color: "#94a3b8" },
    { name: t.in_progress, value: stats.inProgressCount, color: "#6366f1" },
    { name: t.done, value: stats.doneCount, color: "#10b981" },
    { name: t.review, value: stats.reviewCount, color: "#8b5cf6" },
  ];

  // Chart data - Team Workload
  const workloadData = members.slice(0, 5).map((member, idx) => ({
    name: member.name.split(" ")[0],
    tasks: Math.floor(Math.random() * 10) + 1, // Mock - w przyszłości z bazy
    full_name: member.name,
  }));

  // Tax Deadlines (Dutch calendar)
  const taxDeadlines: TaxDeadline[] = [
    {
      id: "1",
      date: "2025-01-31",
      descriptionPL: "BTW Q4 2024 - termin",
      descriptionNL: "BTW Q4 2024 - deadline",
    },
    {
      id: "2",
      date: "2025-02-28",
      descriptionPL: "ICP raport - luty",
      descriptionNL: "ICP rapport - februari",
    },
    {
      id: "3",
      date: "2025-03-31",
      descriptionPL: "Loonheffingen Q1",
      descriptionNL: "Loonheffingen Q1",
    },
    {
      id: "4",
      date: "2025-04-01",
      descriptionPL: "Inkomstenbelasting - start",
      descriptionNL: "Inkomstenbelasting - start",
    },
    {
      id: "5",
      date: "2025-05-01",
      descriptionPL: "Inkomstenbelasting - termin",
      descriptionNL: "Inkomstenbelasting - deadline",
    },
  ];

  const getNextDeadline = () => {
    const now = new Date();
    return taxDeadlines.find((d) => new Date(d.date) > now) || taxDeadlines[0];
  };

  const daysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nextDeadline = getNextDeadline();
  const daysUntilDeadline = daysUntil(nextDeadline.date);

  // Recent Activity
  const recentActivity = tasks
    .sort(
      (a, b) =>
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
    )
    .slice(0, 4)
    .map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    }));

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-8">
      {/* ============================================ */}
      {/* TOP ROW: WELCOME & QUICK ACTIONS */}
      {/* ============================================ */}
      <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl border border-slate-700/50 group">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
        </div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/30 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-indigo-200/80 text-xs font-semibold tracking-wider uppercase mb-1">
              {new Date().toLocaleDateString(
                language === "NL" ? "nl-NL" : "pl-PL",
                { weekday: "long", day: "numeric", month: "long" }
              )}
            </p>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1">
              {language === "PL"
                ? "Witaj w Drużynie! 👋"
                : "Welkom bij het Team! 👋"}
            </h1>
            <p className="text-slate-400 flex items-center text-sm">
              <Zap className="w-4 h-4 text-yellow-400 mr-2 animate-pulse" />
              <span className="text-slate-300 font-semibold">
                {stats.totalTasks}
              </span>
              &nbsp;
              {language === "PL" ? "zadań aktywnych" : "taken actief"}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-700/50 border border-slate-600 hover:bg-slate-600/50 text-slate-300 hover:text-white font-semibold text-sm transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Ładowanie..." : "Odśwież"}
            </button>
            <button
              onClick={() => setCurrentView("tasks")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              {t.add_task}
            </button>
            <button
              onClick={() => setCurrentView("calendar")}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-700/50 border border-slate-600 hover:bg-slate-600/50 text-slate-300 hover:text-white font-semibold text-sm transition-all"
            >
              <CalendarIcon className="w-4 h-4" />
              {t.calendar}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* KPI CARDS */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title={t.in_progress}
          value={stats.inProgressCount}
          icon={Activity}
          colorClass="text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          delay="delay-[0ms]"
          loading={loading}
          onClick={() => setCurrentView("tasks")}
        />
        <KPICard
          title={t.high_priority}
          value={stats.highPriorityCount}
          icon={AlertTriangle}
          colorClass="text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]"
          delay="delay-[100ms]"
          loading={loading}
          onClick={() => setCurrentView("tasks")}
        />
        <KPICard
          title={t.overdue}
          value={stats.overdueCount}
          icon={Clock}
          colorClass={`text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)] ${
            stats.overdueCount > 0 ? "animate-pulse" : ""
          }`}
          delay="delay-[200ms]"
          loading={loading}
          onClick={() => setCurrentView("tasks")}
        />
        <KPICard
          title={t.done}
          value={stats.doneCount}
          icon={CheckCircle}
          colorClass="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]"
          delay="delay-[300ms]"
          loading={loading}
        />
      </div>

      {/* ============================================ */}
      {/* MAIN CONTENT: CHARTS + DEADLINES */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* LEFT COLUMN: CHARTS */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Pie Chart - Task Distribution */}
            <GlassCard hoverEffect className="p-4 md:p-6">
              <h3 className="font-bold text-slate-700 mb-6 flex items-center text-lg">
                <div className="p-2 bg-slate-100 rounded-lg mr-3">
                  <Layers className="w-5 h-5 text-slate-500" />
                </div>
                {t.task_distribution}
              </h3>
              <div className="h-64 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "16px",
                          border: "1px solid rgba(255,255,255,0.2)",
                          background: "rgba(30, 41, 59, 0.9)",
                          color: "#fff",
                          backdropFilter: "blur(10px)",
                          boxShadow: "0 10px 30px -5px rgba(0,0,0,0.3)",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>

            {/* Bar Chart - Team Workload */}
            <GlassCard hoverEffect className="p-4 md:p-6">
              <h3 className="font-bold text-slate-700 mb-6 flex items-center text-lg">
                <div className="p-2 bg-slate-100 rounded-lg mr-3">
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                {t.team_workload}
              </h3>
              <div className="h-64 w-full">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                ) : workloadData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    {language === "PL"
                      ? "Brak danych o zespole"
                      : "Geen teamgegevens"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workloadData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                        strokeOpacity={0.5}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "#f1f5f9" }}
                        contentStyle={{
                          borderRadius: "16px",
                          border: "1px solid rgba(255,255,255,0.2)",
                          background: "rgba(30, 41, 59, 0.9)",
                          color: "#fff",
                          backdropFilter: "blur(10px)",
                          boxShadow: "0 10px 30px -5px rgba(0,0,0,0.3)",
                        }}
                      />
                      <Bar
                        dataKey="tasks"
                        fill="#6366f1"
                        radius={[6, 6, 0, 0]}
                        barSize={30}
                      >
                        {workloadData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index % 2 === 0 ? "#6366f1" : "#8b5cf6"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Recent Activity Table */}
          <GlassCard hoverEffect className="p-0">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-bold text-slate-700 flex items-center text-lg">
                <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                  <Activity className="w-5 h-5 text-indigo-500" />
                </div>
                {t.recent_activity}
              </h3>
              <button
                onClick={() => setCurrentView("tasks")}
                className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                {t.all_tasks} &rarr;
              </button>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  {language === "PL"
                    ? "Brak ostatniej aktywności"
                    : "Geen recente activiteit"}
                </div>
              ) : (
                recentActivity.map((task) => (
                  <div
                    key={task.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/80 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100 mb-1 gap-2"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                          task.priority === "high" || task.priority === "urgent"
                            ? "bg-red-50 text-red-500"
                            : task.priority === "medium"
                            ? "bg-blue-50 text-blue-500"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {task.priority === "high" ||
                        task.priority === "urgent" ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[250px]">
                          {task.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          task.status === "done"
                            ? "bg-emerald-100 text-emerald-700"
                            : task.status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : task.status === "review"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {task.status === "done"
                          ? t.done
                          : task.status === "in_progress"
                          ? t.in_progress
                          : task.status === "review"
                          ? t.review
                          : t.todo}
                      </span>
                      <div className="flex items-center text-xs font-medium text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        {task.dueDate || "-"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN: DEADLINES */}
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          {/* Next Deadline Card */}
          <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-2xl group">
            <div className="absolute inset-0 bg-indigo-600">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600"></div>
              <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-purple-300/20 rounded-full blur-2xl"></div>
            </div>

            <div className="relative z-10 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider">
                  {t.next_deadline}
                </span>
                <TrendingUp className="w-5 h-5 text-indigo-200" />
              </div>

              {loading ? (
                <div className="animate-pulse">
                  <div className="h-16 w-24 bg-white/20 rounded mb-6" />
                  <div className="h-20 bg-white/10 rounded-2xl" />
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2 mb-6">
                    <span
                      className={`text-6xl font-black tracking-tighter drop-shadow-md ${
                        daysUntilDeadline < 0
                          ? "text-red-300"
                          : daysUntilDeadline <= 7
                          ? "text-yellow-300"
                          : ""
                      }`}
                    >
                      {daysUntilDeadline}
                    </span>
                    <span className="text-indigo-100 font-medium mb-2 text-lg">
                      {t.days_left}
                    </span>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-colors cursor-default">
                    <p className="font-bold text-lg leading-snug shadow-black drop-shadow-sm">
                      {language === "PL"
                        ? nextDeadline.descriptionPL
                        : nextDeadline.descriptionNL}
                    </p>
                    <div className="mt-3 flex items-center text-indigo-100 text-sm font-mono">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {new Date(nextDeadline.date).toLocaleDateString(
                        language === "NL" ? "nl-NL" : "pl-PL"
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines List */}
          <GlassCard hoverEffect className="p-6">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center text-lg">
              <div className="p-2 bg-orange-50 rounded-lg mr-3">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              {t.upcoming_deadlines}
            </h3>
            {loading ? (
              <div className="p-8 flex justify-center">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 relative pl-2">
                {/* Connector Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent"></div>

                {taxDeadlines.slice(0, 4).map((deadline, idx) => {
                  const daysLeft = daysUntil(deadline.date);
                  const isNext = idx === 0;
                  const isPast = daysLeft < 0;
                  return (
                    <div
                      key={deadline.id}
                      className={`relative flex items-start group ${
                        isPast ? "opacity-50" : ""
                      }`}
                    >
                      <div
                        className={`
                        relative z-10 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-4 border-white shadow-lg shrink-0 transition-transform group-hover:scale-110
                        ${
                          isNext
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                            : "bg-white text-slate-600 border-slate-50"
                        }
                      `}
                      >
                        <span className="text-lg font-black leading-none">
                          {new Date(deadline.date).getDate()}
                        </span>
                        <span className="text-[10px] font-bold uppercase mt-0.5">
                          {new Date(deadline.date).toLocaleDateString(
                            undefined,
                            { month: "short" }
                          )}
                        </span>
                      </div>
                      <div className="ml-4 pt-1">
                        <p
                          className={`text-sm font-medium leading-snug transition-colors ${
                            isNext
                              ? "text-indigo-700 font-bold"
                              : "text-slate-600 group-hover:text-slate-800"
                          }`}
                        >
                          {language === "PL"
                            ? deadline.descriptionPL
                            : deadline.descriptionNL}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-block text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Tax / Belasting
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              daysLeft <= 7
                                ? "text-orange-500"
                                : daysLeft <= 30
                                ? "text-blue-500"
                                : "text-slate-400"
                            }`}
                          >
                            {daysLeft} {language === "PL" ? "dni" : "dagen"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
