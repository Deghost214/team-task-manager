/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api, setAuthToken } from "../lib/api";
import { User, UserRole } from "../types";
import { 
  LogIn, 
  UserPlus, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  CheckCircle, 
  Mail, 
  Key, 
  UserIcon, 
  Sparkles, 
  Activity, 
  CheckSquare, 
  Square, 
  Users, 
  Terminal, 
  Zap,
  ArrowRight,
  MessageSquare,
  Plus,
  Trash2,
  Clock,
  Layers,
  ChevronRight,
  Monitor,
  CheckCircle2,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

interface SandboxTask {
  id: string;
  title: string;
  assignee: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Member");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Collaboration Showcase Interactive States
  const [sandboxTasks, setSandboxTasks] = useState<SandboxTask[]>([
    { id: "1", title: "✨ Redesign executive login portal", assignee: "Rahul S.", priority: "High", completed: false },
    { id: "2", title: "🚀 Establish persistent auth schema", assignee: "Sarah J.", priority: "High", completed: true },
    { id: "3", title: "⚡ Integrate micro-frontends with Vite", assignee: "Chloe A.", priority: "Medium", completed: false },
    { id: "4", title: "🎨 Style ambient glow background canvas", assignee: "Jane M.", priority: "Low", completed: false }
  ]);

  const [feedEvents, setFeedEvents] = useState<string[]>([
    "Sarah Jenkins updated database schema structure",
    "Jane Miller changed priority of UI styling task to 'Low'",
    "WebSocket connected to channel: #production-tasks"
  ]);

  const [activeUsersCount, setActiveUsersCount] = useState(5);
  const [showcaseMessage, setShowcaseMessage] = useState<string | null>(
    "Feel the instant feedback of real-time task orchestration below!"
  );

  // Custom task builder states
  const [customTitle, setCustomTitle] = useState("");
  const [customPriority, setCustomPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [customAssignee, setCustomAssignee] = useState("Sarah Jenkins");

  // Advanced Landing page tab feature state
  const [activeTab, setActiveTab] = useState<"sync" | "analytics" | "security">("sync");

  // Password Strength states
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "Too Short", color: "bg-rose-500" });

  useEffect(() => {
    // Generate periodic simulated active team events to give actual collaborative vibes
    const interval = setInterval(() => {
      const mockNames = ["Sarah Jenkins", "Jane Miller", "Rahul Sharma", "Chloe Adams", "Arjun Roy", "Sophia Lim"];
      const mockActions = [
        "is writing code inside server.ts",
        "marked flat-iron prototype task as Achieved",
        "changed task status to In-Progress",
        "updated client-side UI configurations",
        "initiated live testing on staging container",
        "verified websocket synchronization latency (12ms)",
        "edited tasks schema representation in RAM"
      ];

      const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
      const randomAction = mockActions[Math.floor(Math.random() * mockActions.length)];
      const newEvent = `${randomName} ${randomAction}`;

      setFeedEvents(prev => [newEvent, ...prev.slice(0, 4)]);
      // Randomly change active user count slightly
      setActiveUsersCount(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next >= 3 && next <= 12 ? next : prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (!val) {
      setPasswordStrength({ score: 0, text: "Empty", color: "bg-slate-700" });
      return;
    }
    if (val.length < 6) {
      setPasswordStrength({ score: 1, text: "Weak", color: "bg-rose-500" });
    } else if (val.length < 10) {
      setPasswordStrength({ score: 2, text: "Medium Strength", color: "bg-amber-500" });
    } else {
      setPasswordStrength({ score: 3, text: "Excellent and Secure", color: "bg-emerald-500" });
    }
  };

  const handleToggleSandboxTask = (id: string) => {
    setSandboxTasks(prev => 
      prev.map(task => {
        if (task.id === id) {
          const nextState = !task.completed;
          if (nextState) {
            setShowcaseMessage(`Success! You marked '${task.title}' as completed.`);
            setFeedEvents(curr => [`You checked off: '${task.title}'`, ...curr]);
          } else {
            setShowcaseMessage(`Reverted '${task.title}' to list stack.`);
          }
          return { ...task, completed: nextState };
        }
        return task;
      })
    );
  };

  const handleAddCustomSandboxTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) {
      setShowcaseMessage("Please specify a task phrase first.");
      return;
    }

    const newTask: SandboxTask = {
      id: Date.now().toString(),
      title: customTitle.trim(),
      assignee: customAssignee,
      priority: customPriority,
      completed: false
    };

    setSandboxTasks(prev => [...prev, newTask]);
    setFeedEvents(curr => [`You forged a new task: '${newTask.title}'`, ...curr]);
    setShowcaseMessage(`Forged task successfully! Added under ${customAssignee}'s responsibility.`);
    setCustomTitle("");
  };

  const handleDeleteSandboxTask = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSandboxTasks(prev => prev.filter(t => t.id !== id));
    setFeedEvents(curr => [`Disolved sandbox task: '${title}'`, ...curr]);
    setShowcaseMessage(`Removed task: '${title}' from sandbox buffer.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({ email, password });
        setAuthToken(res.token);
        onAuthSuccess(res.user);
      } else {
        const res = await api.register({ email, name, password, role });
        setSuccessMsg("Account successfully provisioned! Logging you in...");
        setTimeout(() => {
          setAuthToken(res.token);
          onAuthSuccess(res.user);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "An authentication exception occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleType: "Admin" | "Member") => {
    setError(null);
    setEmail(roleType === "Admin" ? "admin@team.com" : "jane@team.com");
    setPassword(roleType === "Admin" ? "admin123" : "member123");
    handlePasswordChange(roleType === "Admin" ? "admin123" : "member123");
    setIsLogin(true);
    setShowcaseMessage(`Loaded demo access for ${roleType === "Admin" ? "Sarah (Admin)" : "Jane (Member)"}! Press Unlock to proceed.`);
  };

  const completedCount = sandboxTasks.filter(t => t.completed).length;
  const completionPercentage = sandboxTasks.length > 0 
    ? Math.round((completedCount / sandboxTasks.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans" id="auth-root-layout">
      
      {/* Dynamic Animated HighTech Aura and Blur Backdrops */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Neon blur auroras */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 rounded-full blur-[160px] animate-pulse [animation-duration:10s]" />
        <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[120px] animate-pulse [animation-duration:14s]" />

        {/* Laser Grid Layer */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.35]" />
        
        {/* Subtle dot overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Modern High-End Nav Header */}
      <header className="relative z-10 w-full border-b border-indigo-950/80 bg-slate-900/45 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold font-display text-lg tracking-tight text-white flex items-center gap-1.5">
                TaskForge <span className="text-[10px] bg-indigo-900/80 text-indigo-400 border border-indigo-500/30 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">v2.4</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono tracking-widest lowercase">system.collaborative_active</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-8 text-xs text-slate-300 font-medium">
            <a href="#playground" className="hover:text-indigo-400 transition cursor-pointer">Live Playground</a>
            <a href="#features" className="hover:text-indigo-400 transition cursor-pointer">Platform Capability</a>
            <a href="#credentials" className="hover:text-indigo-400 transition cursor-pointer">Quick Access Portals</a>
          </div>

          <div className="flex items-center space-x-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider uppercase hidden sm:inline">
              Secure Relational Link Established
            </span>
          </div>
        </div>
      </header>

      {/* Main Interactive Landing Page Sections */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-center space-y-16">
        
        {/* HERO SECTION & DUAL COLUMN SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-4">
          
          {/* LHS: TaskForge Premium Intro & Interactive Sandbox */}
          <div className="lg:col-span-7 space-y-8 text-left" id="lhs-collab-showcase">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-950/65 border border-indigo-500/30 rounded-full shadow-md">
                <Sparkles className="h-4 w-4 text-indigo-400 animate-spin" />
                <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase">Live Real-time Collaboration Engine</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-display">
                Forge Your Workflows.<br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-sky-400 bg-clip-text text-transparent">
                  Align Your Team.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Connect your engineering workforce with role-based dashboard metrics, responsive Kanban tasks, and high-fidelity timeline calendars. Experience an instant relational database feel right in your browser.
              </p>
            </div>

            {/* INTERACTIVE WORKSPACE SANDBOX CARD */}
            <div 
              id="playground"
              className="bg-slate-900/40 backdrop-blur-xl border border-indigo-950 hover:border-indigo-900/60 transition-all rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Highlight Aura */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Interface Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-indigo-950/80 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8.5 w-8.5 rounded-lg bg-indigo-900/30 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                    <Terminal className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-1.5">
                      TaskForge Interactive Core 
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">Build, toggle, or wipe objects on the sandbox live heap</p>
                  </div>
                </div>

                {/* Progress Wheel Stats */}
                <div className="flex items-center space-x-2 bg-slate-950/85 border border-indigo-950 rounded-xl px-3 py-1.5 shadow-inner">
                  <span className="text-[10px] text-slate-400 font-medium font-mono">Sync Progress</span>
                  <div className="w-16 bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-500" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-indigo-400 font-mono">{completionPercentage}%</span>
                </div>
              </div>

              {/* LIVE DEMO: Add Custom Task Widget */}
              <form onSubmit={handleAddCustomSandboxTask} className="mb-4 grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-950/50 p-3 rounded-xl border border-indigo-950">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="E.g. Setup client CORS proxy"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={customAssignee}
                    onChange={(e) => setCustomAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Sarah Jenkins">Sarah J. (Admin)</option>
                    <option value="Jane Miller">Jane M. (Member)</option>
                    <option value="Rahul Sharma">Rahul S. (Dev)</option>
                    <option value="You (Guest)">You (Guest)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={customPriority}
                    onChange={(e) => setCustomPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Med</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-1.5 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Forge
                  </button>
                </div>
              </form>

              {/* Sandbox Stack Rows Container */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {sandboxTasks.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-mono">
                    Sandbox heap empty. Write above to forge objects!
                  </div>
                ) : (
                  sandboxTasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => handleToggleSandboxTask(task.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group/item ${
                        task.completed 
                          ? "bg-indigo-950/15 border-indigo-950/60 text-slate-400" 
                          : "bg-slate-950/45 border-slate-900 hover:bg-slate-900/60 hover:border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="text-indigo-400 shrink-0">
                          {task.completed ? (
                            <CheckSquare className="h-4.5 w-4.5 text-indigo-400 fill-indigo-900/20" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-slate-700 group-hover/item:text-slate-500 transition" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${task.completed ? "line-through text-slate-500" : ""}`}>
                            {task.title}
                          </p>
                          <span className="text-[9px] text-slate-500 font-mono block">Owner: {task.assignee}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          task.priority === "High" 
                            ? "bg-rose-950/50 text-rose-400 border border-rose-900/30" 
                            : task.priority === "Medium"
                            ? "bg-amber-950/50 text-amber-400 border border-amber-900/30"
                            : "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}>
                          {task.priority}
                        </span>
                        <button
                          onClick={(e) => handleDeleteSandboxTask(task.id, task.title, e)}
                          className="p-1 text-slate-600 hover:text-rose-400 rounded-md hover:bg-rose-950/30 opacity-0 group-hover/item:opacity-100 transition duration-150"
                          title="Purge Object"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ticker Action Logger System Panel */}
              <div className="mt-4 bg-slate-950 rounded-xl max-h-[85px] overflow-y-auto border border-indigo-950 pb-2.5 pt-2 px-3 font-mono text-[10px] space-y-1 scrollbar-thin">
                <div className="text-[9px] font-bold text-slate-400 tracking-wider uppercase border-b border-indigo-950/60 pb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-indigo-500 animate-ping" /> Real-Time Sync Event Log</span>
                  <span className="text-[8px] text-indigo-400 font-bold bg-indigo-950 px-1 py-0.2 rounded-sm uppercase tracking-widest leading-none">Wss Online</span>
                </div>
                {feedEvents.map((evt, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-400">
                    <span className="truncate text-slate-300">● {evt}</span>
                    <span className="text-slate-600 select-none text-[9px] shrink-0 ml-2">latest</span>
                  </div>
                ))}
              </div>

              {/* Real-time reactive feedback strip */}
              {showcaseMessage && (
                <div className="mt-3 bg-indigo-950/35 border border-indigo-950 p-2.5 rounded-xl text-[10px] flex items-center justify-between text-indigo-300">
                  <span className="flex items-center gap-2 font-medium">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> {showcaseMessage}
                  </span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-widest bg-slate-950 px-1.5 py-0.5 rounded border border-indigo-950">
                    State Mutated
                  </span>
                </div>
              )}
            </div>

            {/* Quick Benefits metrics under playground */}
            <div className="grid grid-cols-3 gap-3.5">
              <div className="bg-slate-900/30 border border-indigo-950/50 p-3 rounded-xl hover:bg-slate-900/50 transition">
                <div className="text-xs font-mono text-slate-500 mb-0.5">EST. LATENCY</div>
                <div className="text-base sm:text-lg font-extrabold text-indigo-400 font-display">~12ms Ping</div>
              </div>
              <div className="bg-slate-900/30 border border-indigo-950/50 p-3 rounded-xl hover:bg-slate-900/50 transition">
                <div className="text-xs font-mono text-slate-500 mb-0.5">ACTIVE WORKFORCE</div>
                <div className="text-base sm:text-lg font-extrabold text-violet-400 font-display">{activeUsersCount} Online</div>
              </div>
              <div className="bg-slate-900/30 border border-indigo-950/50 p-3 rounded-xl hover:bg-slate-900/50 transition">
                <div className="text-xs font-mono text-slate-500 mb-0.5">PROTECTED BY</div>
                <div className="text-base sm:text-lg font-extrabold text-sky-400 font-display">HMAC Ciphers</div>
              </div>
            </div>
          </div>

          {/* RHS: The Glassmorphic Secure Authentication Module */}
          <div className="lg:col-span-5" id="rhs-auth-form">
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950 p-6 sm:p-8 shadow-2xl rounded-2xl relative">
              <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-950/40 mx-auto mb-4 transition border border-indigo-500/30">
                  {isLogin ? <LogIn className="h-5.5 w-5.5" /> : <UserPlus className="h-5.5 w-5.5" />}
                </div>
                <h2 className="text-2xl font-black font-display text-white tracking-tight">
                  {isLogin ? "Access Launchpad" : "Register Credentials"}
                </h2>
                <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {isLogin 
                    ? "Log in to enter the collaborative system or trigger the demo sessions below." 
                    : "Create a verified developer workspace profile with strict permissions attributes."}
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-rose-950/40 border border-rose-500/30 p-3 rounded-xl flex items-start space-x-2.5">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-xs text-rose-200">{error}</div>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-start space-x-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-200">{successMsg}</div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {!isLogin && (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="name" className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                        Full Name
                      </label>
                      <div className="relative">
                        <input
                          id="name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Sarah Jenkins"
                          className="block w-full px-4 py-2.5 pl-10 border border-indigo-950 rounded-xl bg-slate-950/75 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-white placeholder-slate-600 text-xs transition"
                        />
                        <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="role" className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                        Workspace Assignment Role
                      </label>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="block w-full px-3 py-2.5 border border-indigo-950 rounded-xl bg-slate-950/75 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-white text-xs transition"
                      >
                        <option value="Member">Team Member (Task Board Operations)</option>
                        <option value="Admin">Executive Administrator (Full Organization Workspace)</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                    System Work Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@team.com"
                      className="block w-full px-4 py-2.5 pl-10 border border-indigo-950 rounded-xl bg-slate-950/75 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-white placeholder-slate-600 text-xs transition"
                    />
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                      Secure Password
                    </label>
                    {password && (
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Security: <strong className={passwordStrength.text === "Excellent and Secure" ? "text-emerald-400 animate-pulse" : "text-indigo-400"}>{passwordStrength.text}</strong>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full px-4 py-2.5 pl-10 pr-10 border border-indigo-950 rounded-xl bg-slate-950/75 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-white placeholder-slate-600 text-xs transition"
                    />
                    <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  {/* Strength track lines */}
                  {password && (
                    <div className="h-1 grid grid-cols-3 gap-1 mt-1.5">
                      <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 1 ? passwordStrength.color : "bg-slate-800"}`} />
                      <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 2 ? passwordStrength.color : "bg-slate-800"}`} />
                      <div className={`h-full rounded-full transition-colors ${passwordStrength.score >= 3 ? passwordStrength.color : "bg-slate-800"}`} />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative group overflow-hidden flex justify-center items-center py-3 px-4 rounded-xl shadow-lg shadow-indigo-950/40 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 transition cursor-pointer"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10" />
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : null}
                    {isLogin ? "Unlock Workspace Portal" : "Establish Authorized Account"}
                    <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>

              {/* Toggle switch link option */}
              <div className="mt-5 border-t border-indigo-950/80 pt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {isLogin ? (
                    <>
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Requesting workspace registration? Sign up
                    </>
                  ) : (
                    <>
                      <LogIn className="h-3.5 w-3.5 mr-1.5" /> Back to certified logins? Access portal
                    </>
                  )}
                </button>
              </div>

              {/* DEMO ACCOUNTS TESTING AREA */}
              <div id="credentials" className="mt-6 border-t border-indigo-950/80 pt-5">
                <div className="text-center mb-3">
                  <span className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase bg-slate-950/85 border border-indigo-950 px-2.5 py-1 rounded-full inline-block">
                    DEMO ACCESS PORTALS
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("Admin")}
                    className="flex flex-col items-start p-3 border border-indigo-950 rounded-xl bg-slate-950/50 hover:bg-indigo-950/30 hover:border-indigo-500/40 transition text-left cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors block truncate">Sarah Jenkins</span>
                    <span className="text-[9px] text-slate-500">admin@team.com</span>
                    <span className="text-[8px] text-indigo-400 font-extrabold font-mono tracking-wider bg-indigo-950/60 border border-indigo-500/20 px-1.5 py-0.5 rounded mt-2.5">Executive Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("Member")}
                    className="flex flex-col items-start p-3 border border-indigo-950 rounded-xl bg-slate-950/50 hover:bg-emerald-950/30 hover:border-emerald-500/40 transition text-left cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors block truncate">Jane Miller</span>
                    <span className="text-[9px] text-slate-500">jane@team.com</span>
                    <span className="text-[8px] text-emerald-400 font-extrabold font-mono tracking-wider bg-emerald-950/60 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-2.5">Team Member</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* SECTION 2: PLATFORM CAPABILITY WORKFLOW SHOWCASE TABS */}
        <section id="features" className="pt-8 border-t border-indigo-950/60">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              A Platform Engineered for Speed and Integrity
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Unlike static mockups, TaskForge provides authentic transactional reactivity across your organizational divisions.
            </p>

            {/* Showcase Tab Toggles */}
            <div className="flex flex-wrap justify-center gap-2 p-1 bg-slate-900/60 border border-indigo-950 rounded-xl max-w-md mx-auto">
              <button
                onClick={() => setActiveTab("sync")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "sync" 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Activity className="h-3.5 w-3.5" /> Real-Time Sync
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "analytics" 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="h-3.5 w-3.5" /> Board Analytics
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "security" 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Lock className="h-3.5 w-3.5" /> State Isolation
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature Column 1: Sync info or active display */}
            <div className={`p-6 rounded-2xl border transition-all ${
              activeTab === "sync" 
                ? "bg-indigo-950/20 border-indigo-500/40 shadow-inner scale-[1.01]" 
                : "bg-slate-900/25 border-indigo-950 opacity-70"
            }`}>
              <div className="h-8 w-8 rounded-lg bg-indigo-900/40 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-800/20">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-2">
                Ultra-Low Relational Sync
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Watch tasks cascade instantly to targeted collaborators. Transactions write with fully atomic reliability mapped directly to project members.
              </p>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-indigo-950/60 font-mono text-[10px] text-indigo-300">
                <span className="text-emerald-400">sqlite3_atomic_commit()</span> {"->"} SUCCESS <br />
                <span className="text-slate-500">Bytes mutated: 512 bytes | 12ms</span>
              </div>
            </div>

            {/* Feature Column 2: Board summary or active display */}
            <div className={`p-6 rounded-2xl border transition-all ${
              activeTab === "analytics" 
                ? "bg-indigo-950/20 border-indigo-500/40 shadow-inner scale-[1.01]" 
                : "bg-slate-900/25 border-indigo-950 opacity-70"
            }`}>
              <div className="h-8 w-8 rounded-lg bg-indigo-900/40 flex items-center justify-center text-violet-400 mb-4 border border-indigo-800/20">
                <Layers className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-2">
                Executive Overview Indicators
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Instant visual gauge counters representing team throughput, active project milestones achievements, and overdue task warnings in a single pane.
              </p>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-indigo-950/60 space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">High Priority Task Rate</span>
                  <span className="text-rose-400 font-bold">12% Limit</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-[12%]" />
                </div>
              </div>
            </div>

            {/* Feature Column 3: Isolation role checks */}
            <div className={`p-6 rounded-2xl border transition-all ${
              activeTab === "security" 
                ? "bg-indigo-950/20 border-indigo-500/40 shadow-inner scale-[1.01]" 
                : "bg-slate-900/25 border-indigo-950 opacity-70"
            }`}>
              <div className="h-8 w-8 rounded-lg bg-indigo-900/40 flex items-center justify-center text-sky-400 mb-4 border border-indigo-800/20">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-2">
                Role-Based Guardrails
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Strict write limitations prevent unassigned members from mutating team data, ensuring administrative sovereignty remains absolute.
              </p>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-indigo-950/60 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Sarah Jenkins (Admin)</span>
                <span className="text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-2 py-0.5 rounded uppercase tracking-wider text-[8px] font-bold">Write Ok</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Cybernetic HighTech Base Footer */}
      <footer className="relative z-10 w-full bg-slate-950 border-t border-indigo-950/80 px-4 py-6 sm:px-6 lg:px-8 mt-12 bg-slate-950/90 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-indigo-500" />
            <span>&copy; 2026 TaskForge Workspace Node. Session key signatures certified under AES-256 criteria.</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5"><Terminal className="h-3.5 w-3.5 text-indigo-500" /> Host API: v2.4-active</span>
            <span className="text-indigo-400">Active Stage Ingress Port: 3000</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
