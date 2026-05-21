/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { DashboardStats, Project, User } from "../types";
import { Calendar, AlertTriangle, CheckCircle2, CircleDot, RefreshCw, BarChart2, Briefcase, Plus, Users, Sparkles, TrendingUp } from "lucide-react";

interface DashboardViewProps {
  onAddProjectClick: () => void;
  onAddTaskClick: () => void;
  projects: Project[];
  usersList: User[];
}

export default function DashboardView({ onAddProjectClick, onAddTaskClick, projects, usersList }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve dashboard insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [projects]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 text-xs font-mono uppercase tracking-widest animate-pulse">Aggregating workspace analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-rose-950/80 text-rose-200 p-8 rounded-2xl flex flex-col items-center text-center max-w-lg mx-auto">
        <AlertTriangle className="h-10 w-10 text-rose-500 mb-3 animate-bounce" />
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-rose-400 mb-1">Analytics Unavailable</h3>
        <p className="text-xs text-slate-400 mb-4">{error || "The analytical service is offline."}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-rose-400 border border-rose-900/30 rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  // Render SVG Ring Chart data
  const statusColors: Record<string, { stroke: string; bg: string; text: string }> = {
    Todo: { stroke: "#64748b", bg: "bg-slate-900/60 border border-slate-800", text: "text-slate-400" },
    InProgress: { stroke: "#6366f1", bg: "bg-indigo-950/40 border border-indigo-900/30", text: "text-indigo-400" },
    Review: { stroke: "#f59e0b", bg: "bg-amber-950/40 border border-amber-900/30", text: "text-amber-400" },
    Done: { stroke: "#10b981", bg: "bg-emerald-950/40 border border-emerald-900/30", text: "text-emerald-400" },
  };

  // Pre-calculate max for visual bars
  const maxUserTasks = stats.tasksPerUser.length > 0 
    ? Math.max(...stats.tasksPerUser.map(u => u.count), 1) 
    : 1;

  return (
    <div className="space-y-8" id="dashboard-container">
      
      {/* Overview Metric Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-950/40 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono">Workspace Intel Feed</span>
          </div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight">Workspace Dashboard</h1>
          <p className="text-slate-400 text-xs">Real-time status overview of the workspace pipelines.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchStats}
            title="Refresh statistics"
            className="p-2.5 bg-slate-900/65 border border-indigo-950 hover:bg-slate-900 text-slate-400 hover:text-white rounded-xl shadow-md transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={onAddProjectClick}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900/65 border border-indigo-950 hover:bg-slate-900 text-indigo-300 hover:bg-indigo-950/25 text-xs font-bold font-mono rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> CREATE PROJECT
          </button>
          
          <button
            onClick={onAddTaskClick}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono rounded-xl shadow-lg shadow-indigo-950/55 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" /> CREATE TASK
          </button>
        </div>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between group hover:border-indigo-500/30 transition-all duration-200" id="stat-total-tasks">
          <div>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono block">Active Tasks</span>
            <div className="text-3xl font-black font-display text-white mt-1.5">{stats.totalTasks}</div>
          </div>
          <div className="mt-4 flex items-center text-[10px] text-slate-400 font-mono">
            <CircleDot className="h-3.5 w-3.5 mr-1 text-indigo-500 animate-pulse shrink-0" />
            Across {projects.length} projects
          </div>
        </div>

        {/* Completed */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-200" id="stat-completed-tasks">
          <div>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono block">Completed</span>
            <div className="text-3xl font-black font-display text-emerald-400 mt-1.5">{stats.completedTasks}</div>
          </div>
          <div className="mt-4 flex items-center text-[11px] text-emerald-400 font-bold font-mono bg-emerald-950/45 border border-emerald-900/30 px-1.5 py-0.5 rounded-md self-start shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            {completionRate}% rate
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between group hover:border-indigo-500/30 transition-all duration-200" id="stat-inprogress-tasks">
          <div>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono block">In Progress</span>
            <div className="text-3xl font-black font-display text-indigo-400 mt-1.5">{stats.inProgressTasks}</div>
          </div>
          <div className="mt-4 flex items-center text-[10px] text-indigo-300 font-mono">
            <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
            Active execution
          </div>
        </div>

        {/* Review */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between group hover:border-amber-500/30 transition-all duration-200" id="stat-review-tasks">
          <div>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono block">In Review</span>
            <div className="text-3xl font-black font-display text-amber-400 mt-1.5">{stats.reviewTasks}</div>
          </div>
          <div className="mt-4 flex items-center text-[10px] text-amber-400 font-mono">
            <Users className="h-3.5 w-3.5 mr-1 shrink-0" />
            Signing buffer
          </div>
        </div>

        {/* Overdue */}
        <div className={stats.overdueTasks.length > 0 
          ? "bg-slate-900/40 backdrop-blur-2xl border border-rose-900/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between col-span-2 lg:col-span-1"
          : "bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between col-span-2 lg:col-span-1"
        } id="stat-overdue-tasks">
          <div>
            <span className="text-[10px] font-bold text-rose-500 tracking-wider uppercase font-mono block">Overdue Alert</span>
            <div className="text-3xl font-black font-display text-rose-400 mt-1.5">{stats.overdueTasks.length}</div>
          </div>
          <div className="mt-4 flex items-center text-[10px] text-rose-400 font-mono">
            <AlertTriangle className={`h-3.5 w-3.5 mr-1 shrink-0 ${stats.overdueTasks.length > 0 ? "animate-bounce" : ""}`} />
            {stats.overdueTasks.length > 0 ? "Requires action" : "All dates aligned"}
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status doughnut SVG summary */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-3xl p-6 shadow-lg flex flex-col" id="chart-status-distribution">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-1">Status Distributions</h3>
          <p className="text-xs text-slate-500 mb-6 font-medium">Workflow status ratio analytics.</p>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {stats.totalTasks > 0 ? (
              <div className="w-40 h-40 relative flex items-center justify-center">
                {/* SVG Dial representing Completion */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    className="text-slate-900"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Completion Fill */}
                  <path
                    className="text-indigo-500 transition-all duration-700"
                    strokeDasharray={`${completionRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="url(#g-color)"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  
                  {/* Gradient definitions */}
                  <defs>
                    <linearGradient id="g-color" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-3xl font-black font-display text-white">{completionRate}%</span>
                  <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase font-mono">Finished</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <BarChart2 className="h-12 w-12 text-slate-800 mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Create tasks to launch index</p>
              </div>
            )}

            {/* List breakdown */}
            <div className="w-full mt-6 space-y-2">
              {stats.tasksByStatus.map(item => {
                const colors = statusColors[item.status] || { stroke: "#cbd5e1", bg: "bg-slate-900", text: "text-slate-400" };
                const percentage = stats.totalTasks > 0 ? Math.round((item.count / stats.totalTasks) * 100) : 0;
                return (
                  <div key={item.status} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-indigo-950/40">
                    <div className="flex items-center space-x-2">
                      <span className="h-2 w-2 rounded-full ring-4" style={{ backgroundColor: colors.stroke, transition: "background 0.3s" }}></span>
                      <span className="text-xs font-semibold text-slate-300">
                        {item.status === "InProgress" ? "In Progress" : item.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-slate-500 font-mono">{item.count} items</span>
                      <span className="text-xs font-extrabold text-indigo-400 bg-indigo-950/45 border border-indigo-900/35 px-1.5 py-0.5 rounded font-mono">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Priority breakdown visual meters */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-3xl p-6 shadow-lg flex flex-col" id="chart-priority-distribution">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-1">Priority Categorization</h3>
          <p className="text-xs text-slate-500 mb-6 font-medium">Severity classification breakdown.</p>

          <div className="flex-1 flex flex-col justify-center space-y-6">
            {stats.tasksByPriority.map(item => {
              const percentage = stats.totalTasks > 0 ? Math.round((item.count / stats.totalTasks) * 100) : 0;
              let barColor = "bg-slate-700";
              let badgeColor = "text-slate-400 bg-slate-950/80 border border-slate-900";
              if (item.priority === "High") {
                barColor = "bg-rose-500";
                badgeColor = "text-rose-400 bg-rose-950/50 border border-rose-905/30";
              } else if (item.priority === "Medium") {
                barColor = "bg-amber-500";
                badgeColor = "text-amber-400 bg-amber-950/50 border border-amber-900/30";
              } else if (item.priority === "Low") {
                barColor = "bg-emerald-500";
                badgeColor = "text-emerald-400 bg-emerald-950/50 border border-emerald-990/30";
              }

              return (
                <div key={item.priority} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase ${badgeColor}`}>{item.priority} Priority</span>
                    <span className="text-slate-400 font-semibold font-mono">{item.count} Tasks ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-indigo-950/50">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t border-indigo-950/50 p-3.5 bg-slate-950/40 rounded-2xl flex items-start space-x-3 text-slate-400 text-xs">
              <Calendar className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-mono text-[10px]">
                System advisory notes: ensure High priority task objects are certified and committed via review queues before critical sprint window ends.
              </div>
            </div>
          </div>
        </div>

        {/* User workload balance check */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-3xl p-6 shadow-lg flex flex-col" id="chart-user-load">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono mb-1">Team Assignments</h3>
          <p className="text-xs text-slate-500 mb-6 font-medium">Workload share across registered collaborators.</p>

          <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {stats.tasksPerUser.length > 0 ? (
              stats.tasksPerUser.map(item => {
                const ratio = Math.round((item.count / maxUserTasks) * 100);
                return (
                  <div key={item.userName} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 truncate max-w-[170px]">{item.userName}</span>
                      <span className="text-slate-500 font-semibold font-mono">{item.count} tasks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2.5 flex-1 bg-slate-950 rounded-lg overflow-hidden border border-indigo-950/60">
                        <div className="h-full bg-indigo-500 rounded-lg transition-all duration-300" style={{ width: `${ratio}%` }}></div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold min-w-[24px] text-right font-mono">{ratio}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                <Users className="h-8 w-8 text-slate-800 mx-auto mb-2" />
                <p>No active staff assignments calculated.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Critical Overdue section */}
      {stats.overdueTasks.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-rose-950 shadow-lg p-6 rounded-3xl" id="overdue-tasks-board">
          <div className="flex items-center space-x-2 text-rose-400 mb-4 pb-1">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-200 font-mono tracking-widest uppercase">Attention Required: Overdue Sprints</h3>
          </div>
          <div className="divide-y divide-indigo-950/65">
            {stats.overdueTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              const assignee = usersList.find(u => u.id === task.assignedTo);
              return (
                <div key={task.id} className="py-3 sm:flex justify-between items-center gap-4 group hover:bg-slate-950/20 -mx-4 px-4 rounded-xl transition">
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-rose-400 bg-rose-950/40 border border-rose-900/30 px-1.5 py-0.5 rounded font-mono uppercase">Overdue</span>
                      <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">{task.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[400px]">
                      {task.description || "No supplemental descriptions."}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0 text-[10px] font-mono">
                    <span className="text-[10px] text-slate-400 bg-slate-950 border border-indigo-950/80 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                      📁 {project ? project.name : "System"}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                      👤 {assignee ? assignee.name : "Unassigned"}
                    </span>
                    <span className="text-[10px] font-bold text-rose-400">
                      Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
