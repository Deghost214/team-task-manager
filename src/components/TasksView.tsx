/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Task, Project, User, TaskPriority, TaskStatus, UserRole } from "../types";
import { Search, Kanban, List, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, Calendar, UserIcon, AlertCircle, Sparkles, X } from "lucide-react";

interface TasksViewProps {
  currentUser: User;
  projects: Project[];
  usersList: User[];
  onTasksChange: () => void;
  openCreateImmediately?: boolean;
  onClearImmediatelyToggle?: () => void;
}

export default function TasksView({ 
  currentUser, 
  projects, 
  usersList, 
  onTasksChange,
  openCreateImmediately = false,
  onClearImmediatelyToggle
}: TasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");

  // Edit / Close dialogs
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formPriority, setFormPriority] = useState<TaskPriority>("Medium");
  const [formStatus, setFormStatus] = useState<TaskStatus>("Todo");
  const [formDueDate, setFormDueDate] = useState("");

  const [formProjectMembers, setFormProjectMembers] = useState<User[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Fetch tasks helper
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTasks(filterProject === "all" ? undefined : filterProject);
      setTasks(data);
    } catch (e: any) {
      setError(e.message || "Failed to retrieve workspace tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterProject]);

  useEffect(() => {
    if (openCreateImmediately) {
      handleOpenCreate();
      if (onClearImmediatelyToggle) {
        onClearImmediatelyToggle();
      }
    }
  }, [openCreateImmediately]);

  // Load project members dynamically for assignment context
  useEffect(() => {
    const selectedProjId = formProject;
    if (!selectedProjId) {
      setFormProjectMembers(usersList);
      return;
    }

    const fetchProjMembers = async () => {
      try {
        const payload = await api.getProjectMembers(selectedProjId);
        const matchedUsers = payload.map((m: any) => ({
          id: m.userId,
          email: m.userEmail,
          name: m.userName,
          role: m.userRole
        }));
        setFormProjectMembers(matchedUsers.length > 0 ? matchedUsers : usersList);
      } catch (e) {
        setFormProjectMembers(usersList);
      }
    };

    fetchProjMembers();
  }, [formProject, usersList]);

  const handleOpenCreate = () => {
    setIsNewTask(true);
    setFormTitle("");
    setFormDesc("");
    setFormProject(projects.length > 0 ? projects[0].id : "");
    setFormAssignee(currentUser.id);
    setFormPriority("Medium");
    setFormStatus("Todo");
    setFormDueDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]); // 2 days ahead default
    setEditingTask(null);
    setShowConfigModal(true);
  };

  const handleOpenEdit = (task: Task) => {
    setIsNewTask(false);
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description);
    setFormProject(task.projectId);
    setFormAssignee(task.assignedTo);
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setShowConfigModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formProject) {
      alert("Task label and workspace channel are required.");
      return;
    }

    const payload = {
      projectId: formProject,
      title: formTitle.trim(),
      description: formDesc.trim(),
      dueDate: formDueDate ? new Date(formDueDate).toISOString() : new Date().toISOString(),
      priority: formPriority,
      status: formStatus,
      assignedTo: formAssignee || currentUser.id
    };

    try {
      if (isNewTask) {
        await api.createTask(payload);
      } else if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      }
      setShowConfigModal(false);
      loadTasks();
      onTasksChange(); // Update stats in header or parent scope
    } catch (err: any) {
      alert(err.message || "Failed to commit task item.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Disintegrate this task item permanently?")) {
      return;
    }
    try {
      await api.deleteTask(taskId);
      loadTasks();
      onTasksChange();
    } catch (err: any) {
      alert(err.message || "Operation denied.");
    }
  };

  // Move task status transition buttons
  const handleTransitionStatus = async (task: Task, direction: "prev" | "next") => {
    const statuses: TaskStatus[] = ["Todo", "InProgress", "Review", "Done"];
    const idx = statuses.indexOf(task.status);
    let nextIdx = idx;

    if (direction === "prev" && idx > 0) nextIdx--;
    if (direction === "next" && idx < statuses.length - 1) nextIdx++;

    if (nextIdx !== idx) {
      try {
        await api.updateTask(task.id, { status: statuses[nextIdx] });
        loadTasks();
        onTasksChange();
      } catch (err: any) {
        alert(err.message || "Priority updates denied.");
      }
    }
  };

  // Perform client side search matches
  const filteredTasks = tasks.filter(task => {
    const projectMatch = filterProject === "all" || task.projectId === filterProject;
    const priorityMatch = filterPriority === "all" || task.priority === filterPriority;
    const assigneeMatch = filterAssignee === "all" || task.assignedTo === filterAssignee;
    
    const term = searchQuery.toLowerCase();
    const searchMatch = !term || 
      task.title.toLowerCase().includes(term) || 
      task.description.toLowerCase().includes(term);

    return projectMatch && priorityMatch && assigneeMatch && searchMatch;
  });

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case "High": return "bg-rose-950/40 border-rose-909/35 text-rose-400";
      case "Medium": return "bg-amber-955/40 border-amber-900/35 text-amber-400";
      case "Low": return "bg-emerald-950/40 border-emerald-900/35 text-emerald-400";
    }
  };

  return (
    <div className="space-y-6" id="tasks-panel">
      {/* Search and view toggle Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-950/40 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono">Workflow Queues</span>
          </div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight">Tasks Operations</h1>
          <p className="text-slate-400 text-xs">Assign coordinates, timeline benchmarks, and update workflow queues.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto">
          {/* Custom style View Toggler */}
          <div className="inline-flex rounded-xl bg-slate-950 border border-indigo-950 p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                viewMode === "kanban" 
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 shadow-inner" 
                  : "text-slate-500 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" /> KANBAN
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                viewMode === "list" 
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 shadow-inner" 
                  : "text-slate-500 hover:text-slate-200 border border-transparent"
              }`}
            >
              <List className="h-3.5 w-3.5" /> SPREADSHEET
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            disabled={projects.length === 0}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer w-full md:w-auto justify-center"
          >
            <Plus className="h-4 w-4" /> ADD TASK
          </button>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="bg-amber-950/40 border border-amber-900/40 text-amber-300 p-4 rounded-xl text-xs flex items-center space-x-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>Launch at least one <strong className="font-bold">Project Workspace channel</strong> before allocating workforce tasks.</span>
        </div>
      )}

      {/* Structured Filters control panel */}
      <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-2xl p-4 shadow-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center" id="filters-bar">
        {/* Keyword Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-4 py-2.5 pl-9 bg-slate-950 hover:bg-slate-950/80 border border-indigo-950/70 focus:border-indigo-500 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition font-sans"
          />
        </div>

        {/* Project Filter */}
        <div>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="block w-full px-3 py-2.5 bg-slate-950 border border-indigo-950/70 focus:border-indigo-500 rounded-xl text-xs text-slate-300 focus:outline-none transition font-mono"
          >
            <option value="all">📁 All Workspaces</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="block w-full px-3 py-2.5 bg-slate-950 border border-indigo-950/70 focus:border-indigo-505 rounded-xl text-xs text-slate-300 focus:outline-none transition font-mono"
          >
            <option value="all">⚡ All Priorities</option>
            <option value="High">🔴 High Priority Only</option>
            <option value="Medium">🟡 Medium Priority</option>
            <option value="Low">🟢 Low Priority</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="block w-full px-3 py-2.5 bg-slate-950 border border-indigo-950/70 focus:border-indigo-500 rounded-xl text-xs text-slate-300 focus:outline-none transition font-mono"
          >
            <option value="all">👤 Family / Team Members</option>
            {usersList.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Kanban Board Layout */}
          {viewMode === "kanban" ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start" id="kanban-stages-grid">
              
              {/* Kanban lane mappings */}
              {(["Todo", "InProgress", "Review", "Done"] as TaskStatus[]).map(status => {
                const laneTasks = filteredTasks.filter(t => t.status === status);
                let laneTitle = "To Do";
                let headerBorder = "border-t-2 border-t-slate-700";
                let badgeColor = "bg-slate-900 border border-indigo-950/60 text-slate-400";

                if (status === "InProgress") {
                  laneTitle = "In Progress";
                  headerBorder = "border-t-2 border-t-indigo-500";
                  badgeColor = "bg-indigo-950/80 text-indigo-400 border border-indigo-900/40 font-mono";
                } else if (status === "Review") {
                  laneTitle = "In Review";
                  headerBorder = "border-t-2 border-t-amber-500";
                  badgeColor = "bg-amber-950/80 text-amber-400 border border-amber-900/40 font-mono";
                } else if (status === "Done") {
                  laneTitle = "Done";
                  headerBorder = "border-t-2 border-t-emerald-500";
                  badgeColor = "bg-emerald-950/80 text-emerald-400 border border-emerald-900/45 font-mono";
                }

                return (
                  <div key={status} className={`bg-slate-900/35 border border-indigo-950/70 rounded-2xl p-4 flex flex-col min-h-[500px] ${headerBorder}`} id={`lane-${status}`}>
                    <div className="flex justify-between items-center mb-4 pb-1.5 border-b border-indigo-950/45">
                      <span className="text-[11px] font-extrabold text-slate-300 tracking-wider uppercase font-mono">{laneTitle}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{laneTasks.length}</span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                      {laneTasks.length === 0 ? (
                        <div className="py-12 border border-dashed border-indigo-950 bg-slate-950/20 rounded-xl text-center text-slate-600 text-xs font-mono">
                          Queue Empty
                        </div>
                      ) : (
                        laneTasks.map(task => {
                          const project = projects.find(p => p.id === task.projectId);
                          const assignee = usersList.find(u => u.id === task.assignedTo);
                          const isOverdue = task.status !== "Done" && task.dueDate && task.dueDate < new Date().toISOString();

                          return (
                            <div
                              key={task.id}
                              onClick={() => handleOpenEdit(task)}
                              className="bg-slate-950/70 border border-indigo-950/80 p-4 rounded-xl shadow-md hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 text-left group"
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-start gap-1">
                                  <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                  {project && (
                                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider line-clamp-1 max-w-[85px] font-mono">
                                      {project.name}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition leading-snug line-clamp-2">
                                  {task.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {task.description || "No description specified."}
                                </p>
                              </div>

                              <div className="pt-2.5 border-t border-indigo-950/50 flex justify-between items-end gap-1.5 font-mono">
                                <div className="truncate">
                                  {assignee && (
                                    <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1.5 bg-slate-900 border border-indigo-950/60 px-2 py-1 rounded inline-flex">
                                      <UserIcon className="h-3 w-3 text-slate-500 shrink-0" /> <span className="truncate max-w-[80px]">{assignee.name}</span>
                                    </span>
                                  )}
                                  <div className={`text-[9px] mt-1.5 flex items-center gap-1 font-bold ${isOverdue ? "text-rose-400 animate-pulse" : "text-slate-500"}`}>
                                    <Calendar className="h-3 w-3 shrink-0" /> 
                                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </div>
                                </div>

                                {/* Lane transition arrows */}
                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleTransitionStatus(task, "prev")}
                                    className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded disabled:opacity-20 cursor-pointer"
                                    disabled={status === "Todo"}
                                    title="Move Left"
                                  >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleTransitionStatus(task, "next")}
                                    className="p-1 hover:bg-slate-900 text-slate-400 hover:text-white rounded disabled:opacity-20 cursor-pointer"
                                    disabled={status === "Done"}
                                    title="Move Right"
                                  >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          ) : (
            /* Spreadsheet List Layout */
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/80 rounded-2xl overflow-hidden shadow-lg text-left" id="tasks-table">
              {filteredTasks.length === 0 ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center">
                  <List className="h-10 w-10 text-slate-700 mb-2" />
                  <p className="text-sm font-semibold font-mono uppercase tracking-wider">No matching task rows.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-indigo-950/60 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        <th className="px-6 py-4">TASK DESCRIPTION</th>
                        <th className="px-4 py-4">WORKSPACE</th>
                        <th className="px-4 py-4">ASSIGNEE</th>
                        <th className="px-4 py-4">PRIORITY</th>
                        <th className="px-4 py-4">TIMELINE DUE</th>
                        <th className="px-4 py-4">LANE STATUS</th>
                        <th className="px-6 py-4 text-right font-sans">MODIFY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-950/50 text-xs">
                      {filteredTasks.map(task => {
                        const project = projects.find(p => p.id === task.projectId);
                        const assignee = usersList.find(u => u.id === task.assignedTo);
                        const isOverdue = task.status !== "Done" && task.dueDate && task.dueDate < new Date().toISOString();

                        return (
                          <tr key={task.id} className="hover:bg-slate-950/40 transition-colors">
                            <td className="px-6 py-4.5">
                              <div className="max-w-xs sm:max-w-md">
                                <h4 className="font-bold text-slate-200 truncate">{task.title}</h4>
                                <p className="text-[11px] text-slate-500 truncate mt-1">{task.description || "None Specified"}</p>
                              </div>
                            </td>
                            <td className="px-4 py-4.5 whitespace-nowrap text-slate-300 font-semibold font-mono text-[11px]">
                              📁 {project ? project.name : "Unmapped"}
                            </td>
                            <td className="px-4 py-4.5 whitespace-nowrap font-mono text-[11px]">
                              {assignee ? (
                                <span className="font-medium inline-flex items-center gap-1 text-slate-300 bg-slate-950 border border-indigo-950/50 px-2 py-0.5 rounded-full">
                                  {assignee.name}
                                </span>
                              ) : (
                                <span className="text-slate-600">Unassigned</span>
                              )}
                            </td>
                            <td className="px-4 py-4.5 whitespace-nowrap">
                              <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded border inline-block ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="px-4 py-4.5 whitespace-nowrap">
                              <span className={`font-bold inline-flex items-center gap-1 font-mono text-[11px] ${isOverdue ? "text-rose-400" : "text-slate-400"}`}>
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </td>
                            <td className="px-4 py-4.5 whitespace-nowrap">
                              <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-full inline-block ${
                                task.status === "Done" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-990/45" :
                                task.status === "Review" ? "bg-amber-955/60 text-amber-400 border border-amber-900/40" :
                                task.status === "InProgress" ? "bg-indigo-955/60 text-indigo-400 border border-indigo-900/40" : "bg-slate-900 text-slate-400 border border-indigo-950/40"
                              }`}>
                                {task.status === "InProgress" ? "In Progress" : task.status}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap text-right text-slate-400 space-x-1.5 font-mono text-[11px]">
                              <button
                                onClick={() => handleOpenEdit(task)}
                                className="p-1 px-2 text-indigo-400 hover:bg-slate-950 border border-indigo-950 hover:border-indigo-500 rounded-lg inline-flex items-center gap-1 font-bold cursor-pointer"
                                title="Edit task"
                              >
                                <Edit2 className="h-3 w-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 p-1 rounded-xl hover:bg-slate-950 transition-colors cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Task Creation / Editing overlays Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-950 rounded-3xl p-6 shadow-2xl w-full max-w-lg relative text-left">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white mb-5 pb-2 border-b border-indigo-950/45">
              {isNewTask ? "Declare Workspace Directive" : "Reprogram Task Guidelines"}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label htmlFor="taskTitle" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Task Label / core Goal
                </label>
                <input
                  id="taskTitle"
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Wireframe Dashboard Canvas"
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-indigo-950 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label htmlFor="taskDesc" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                  Supplemental Guidance
                </label>
                <textarea
                  id="taskDesc"
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Provide parameters to help fellow workspace team members understand objectives..."
                  className="block w-full px-4 py-2.5 bg-slate-950 border border-indigo-950 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-505 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="taskProj" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Workspace Project
                  </label>
                  <select
                    id="taskProj"
                    required
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    disabled={!isNewTask}
                    className="block w-full px-3 py-2.5 bg-slate-950 border border-indigo-950 rounded-xl text-sm font-semibold text-slate-300 disabled:opacity-40 focus:outline-none font-mono"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="taskAssign" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                    Assignee
                  </label>
                  <select
                    id="taskAssign"
                    required
                    value={formAssignee}
                    onChange={(e) => setFormAssignee(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-950 border border-indigo-950 rounded-xl text-sm font-semibold text-slate-300 focus:outline-none font-mono"
                  >
                    <option value="">-- Unassigned --</option>
                    {formProjectMembers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="taskPriority" className="block text-[10px] font-bold text-slate-400 tracking-widest font-mono mb-1.5">
                    Priority
                  </label>
                  <select
                    id="taskPriority"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-indigo-950 rounded-xl text-xs font-bold text-slate-300 focus:outline-none font-mono"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="taskStatus" className="block text-[10px] font-bold text-slate-400 tracking-widest font-mono mb-1.5">
                    Status Lane
                  </label>
                  <select
                    id="taskStatus"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                    className="block w-full px-3 py-2 bg-slate-950 border border-indigo-950 rounded-xl text-xs font-bold text-slate-300 focus:outline-none font-mono"
                  >
                    <option value="Todo">Todo</option>
                    <option value="InProgress">InProgress</option>
                    <option value="Review">Review</option>
                    <option value="Done font-bold">Done</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="taskDueDate" className="block text-[10px] font-bold text-slate-400 tracking-widest font-mono mb-1.5">
                    Due Date
                  </label>
                  <input
                    id="taskDueDate"
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="block w-full px-2 py-2 bg-slate-950 border border-indigo-950 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end border-t border-indigo-950/45">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-indigo-950 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
