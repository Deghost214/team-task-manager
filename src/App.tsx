/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, Project } from "./types";
import { api, getAuthToken, removeAuthToken } from "./lib/api";
import Auth from "./components/Auth";
import DashboardView from "./components/DashboardView";
import ProjectsView from "./components/ProjectsView";
import TasksView from "./components/TasksView";
import { LogOut, BarChart2, Briefcase, CalendarCheck, ShieldAlert, Zap, Activity } from "lucide-react";

type ActiveTab = "dashboard" | "projects" | "tasks";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  // Cache data across views to support instant, smooth updates
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Redirection helpers to support dynamic creation modal triggers
  const [triggerCreateProject, setTriggerCreateProject] = useState(false);
  const [triggerCreateTask, setTriggerCreateTask] = useState(false);

  // Authentication check on load
  const verifyIdentity = async () => {
    const token = getAuthToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    try {
      const user = await api.me();
      setCurrentUser(user);
      // Post-auth synchronizations
      syncWorkspaceIndices();
    } catch (e) {
      removeAuthToken();
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const syncWorkspaceIndices = async () => {
    try {
      const projs = await api.getProjects();
      setProjectsList(projs);
      
      const users = await api.getUsers();
      setUsersList(users);
    } catch (e) {
      // Fail-soft if indexes temporarily fail
    }
  };

  useEffect(() => {
    verifyIdentity();
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    syncWorkspaceIndices();
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Neon blur auroras */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse [animation-duration:10s]" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-4" />
          <p className="text-slate-300 text-xs font-bold font-mono tracking-widest uppercase">Initializing Secure TaskForge Link...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans" id="applet-root">
      
      {/* Background Neon Glow Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse [animation-duration:10s]" />
        <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[120px] animate-pulse [animation-duration:14s]" />

        {/* Laser Grid Layer */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.25]" />
        
        {/* Subtle dot overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      {/* Top Banner Navigation Row */}
      <header className="relative z-40 w-full border-b border-indigo-950/80 bg-slate-900/40 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8 sticky top-0" id="applet-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <div className="h-9 w-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 border border-indigo-500/20">
              <Zap className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold font-display text-base tracking-tight text-white flex items-center gap-1.5">
                TaskForge <span className="text-[9px] bg-indigo-950/80 text-indigo-400 border border-indigo-500/20 px-1 py-0.2 rounded font-mono uppercase tracking-wider">v2.4</span>
              </span>
              <span className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase flex items-center gap-1 -mt-0.5">
                <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block animate-ping shrink-0" /> node_synced
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-slate-950/60 border border-indigo-950/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                activeTab === "dashboard" 
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner" 
                  : "text-slate-400 hover:text-slate-100 border border-transparent"
              }`}
            >
              <BarChart2 className="h-4 w-4 text-indigo-400" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                activeTab === "projects" 
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner" 
                  : "text-slate-400 hover:text-slate-100 border border-transparent"
              }`}
            >
              <Briefcase className="h-4 w-4 text-indigo-400" /> Projects
            </button>
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                activeTab === "tasks" 
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-inner" 
                  : "text-slate-400 hover:text-slate-100 border border-transparent"
              }`}
            >
              <CalendarCheck className="h-4 w-4 text-indigo-400" /> Tasks Board
            </button>
          </nav>

          {/* User profile with logout actions */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-100 flex items-center justify-end gap-1.5">
                {currentUser.name} 
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                  currentUser.role === "Admin" 
                    ? "bg-amber-950/60 text-amber-400 border-amber-900/40" 
                    : "bg-indigo-950/60 text-indigo-400 border-indigo-900/40"
                }`}>
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium font-mono">{currentUser.email}</div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign out of workspace"
              className="p-2 border border-indigo-950 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Sticky Tab Footer to ensure beautiful small screen operations */}
      <div className="md:hidden bg-slate-900/80 backdrop-blur-md border-t border-indigo-950 fixed bottom-0 left-0 right-0 z-40 px-6 py-2 shadow-2xl flex justify-around">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center p-1.5 transition ${activeTab === "dashboard" ? "text-indigo-400 font-bold" : "text-slate-500"}`}
        >
          <BarChart2 className="h-4.5 w-4.5" />
          <span className="text-[9px] font-mono tracking-wider mt-1 uppercase">Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`flex flex-col items-center p-1.5 transition ${activeTab === "projects" ? "text-indigo-400 font-bold" : "text-slate-500"}`}
        >
          <Briefcase className="h-4.5 w-4.5" />
          <span className="text-[9px] font-mono tracking-wider mt-1 uppercase">Projects</span>
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex flex-col items-center p-1.5 transition ${activeTab === "tasks" ? "text-indigo-400 font-bold" : "text-slate-500"}`}
        >
          <CalendarCheck className="h-4.5 w-4.5" />
          <span className="text-[9px] font-mono tracking-wider mt-1 uppercase">Tasks</span>
        </button>
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12 relative z-10" id="applet-viewport">
        {activeTab === "dashboard" && (
          <DashboardView 
            onAddProjectClick={() => {
              setActiveTab("projects");
              setTriggerCreateProject(true);
            }}
            onAddTaskClick={() => {
              setActiveTab("tasks");
              setTriggerCreateTask(true);
            }}
            projects={projectsList}
            usersList={usersList}
          />
        )}

        {activeTab === "projects" && (
          <ProjectsView 
            currentUser={currentUser}
            usersList={usersList}
            projects={projectsList}
            onProjectsChange={syncWorkspaceIndices}
            openCreateImmediately={triggerCreateProject}
            onClearImmediatelyToggle={() => setTriggerCreateProject(false)}
          />
        )}

        {activeTab === "tasks" && (
          <TasksView 
            currentUser={currentUser}
            projects={projectsList}
            usersList={usersList}
            onTasksChange={syncWorkspaceIndices}
            openCreateImmediately={triggerCreateTask}
            onClearImmediatelyToggle={() => setTriggerCreateTask(false)}
          />
        )}
      </main>
    </div>
  );
}
