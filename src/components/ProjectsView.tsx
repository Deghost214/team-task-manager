/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Project, ProjectMember, User, UserRole } from "../types";
import { Briefcase, Users, Plus, Trash2, X, ShieldAlert, CheckCircle2, UserPlus, UserMinus, PlusCircle, HelpCircle, Activity } from "lucide-react";

interface ProjectsViewProps {
  currentUser: User;
  usersList: User[];
  projects: Project[];
  onProjectsChange: () => void;
  openCreateImmediately?: boolean;
  onClearImmediatelyToggle?: () => void;
}

export default function ProjectsView({ 
  currentUser, 
  usersList, 
  projects, 
  onProjectsChange,
  openCreateImmediately = false,
  onClearImmediatelyToggle
}: ProjectsViewProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<UserRole>("Member");
  
  const [creating, setCreating] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (openCreateImmediately) {
      setCreating(true);
      if (onClearImmediatelyToggle) {
        onClearImmediatelyToggle();
      }
    }
  }, [openCreateImmediately]);

  // Handle opening member panel
  const handleSelectProj = async (proj: Project) => {
    setSelectedProject(proj);
    setLoadingMembers(true);
    setError(null);
    setSuccessMsg(null);
    setNewMemberEmail("");
    
    try {
      const data = await api.getProjectMembers(proj.id);
      setMembers(data);
    } catch (e: any) {
      setError(e.message || "Failed to load project collaborators.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projDesc.trim()) return;
    
    setError(null);
    setSuccessMsg(null);
    try {
      await api.createProject({
        name: projName.trim(),
        description: projDesc.trim()
      });
      setSuccessMsg("Creative channel successfully established!");
      setProjName("");
      setProjDesc("");
      setTimeout(() => {
        setCreating(false);
        setSuccessMsg(null);
      }, 1500);
      onProjectsChange();
    } catch (err: any) {
      setError(err.message || "Failed to establish project.");
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you absolutely sure you want to remove this project? This will delete all tasks inside it permanently.")) {
      return;
    }

    try {
      await api.deleteProject(id);
      onProjectsChange();
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    } catch (err: any) {
      alert(err.message || "Teardown failed.");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newMemberEmail) return;

    setError(null);
    setSuccessMsg(null);
    try {
      await api.addProjectMember(selectedProject.id, newMemberEmail, newMemberRole);
      setSuccessMsg("Team collaborator successfully associated!");
      setNewMemberEmail("");
      
      // Reload members list
      const updatedMembers = await api.getProjectMembers(selectedProject.id);
      setMembers(updatedMembers);
      onProjectsChange(); // Refresh stats on projects
    } catch (err: any) {
      setError(err.message || "Failed to add workspace colleague.");
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!selectedProject) return;
    if (selectedProject.createdBy === targetUserId) {
      setError("Cannot remove the original designer/owner of this workspace.");
      return;
    }
    
    setError(null);
    setSuccessMsg(null);
    try {
      await api.removeProjectMember(selectedProject.id, targetUserId);
      setSuccessMsg("Collaborator removed successfully.");
      
      // Reload members list
      const updatedMembers = await api.getProjectMembers(selectedProject.id);
      setMembers(updatedMembers);
      onProjectsChange(); // Refresh dashboard counts
    } catch (err: any) {
      setError(err.message || "De-registration failed.");
    }
  };

  // Check permissions: is current user Admin or project creator?
  const isCreatorOrAdmin = (proj: Project | null) => {
    if (!proj) return false;
    return proj.createdBy === currentUser.id || currentUser.role === "Admin";
  };

  return (
    <div className="space-y-8" id="projects-view">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-indigo-950/40 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 mb-1">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase font-mono">Operations Directory</span>
          </div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight">Projects Workspace</h1>
          <p className="text-slate-400 text-xs text-left">Organize task channels and maintain role permissions.</p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-mono rounded-xl shadow-lg transition cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <Plus className="h-4 w-4" /> CREATE PROJECT
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/85 rounded-2xl p-6 shadow-xl max-w-2xl text-left" id="create-project-card">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-indigo-950/45">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Launch New Project channel</h3>
            <button
              onClick={() => {
                setCreating(false);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-slate-400 hover:text-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-rose-950/40 border border-rose-900/45 text-rose-300 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 bg-emerald-950/40 border border-emerald-900/45 text-emerald-300 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label htmlFor="pname" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                PROJECT NAME / IDENTIFIER
              </label>
              <input
                id="pname"
                type="text"
                required
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                placeholder="e.g. Apollo Web Redesign"
                className="block w-full px-4 py-2.5 bg-slate-950 hover:bg-slate-950/80 border border-indigo-950 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="pdesc" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1.5">
                PRIMARY OBJECTIVE DESCRIPTION
              </label>
              <textarea
                id="pdesc"
                required
                rows={3}
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                placeholder="Core milestone objectives and deliverables summary for team members..."
                className="block w-full px-4 py-2.5 bg-slate-950 hover:bg-slate-950/80 border border-indigo-950 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <div className="flex gap-3 pt-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="px-4 py-2 border border-indigo-950 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                Launch Workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Project Lists Grid */}
        <div className="lg:col-span-2 space-y-4" id="projects-grid">
          {projects.length === 0 ? (
            <div className="bg-slate-900/30 border border-dashed border-indigo-950 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center">
              <Briefcase className="h-10 w-10 text-slate-700 mb-2" />
              <p className="text-sm font-semibold font-mono tracking-wider">No active project channels.</p>
              <p className="text-xs text-slate-500 mt-1">Initialize a workspace above to allocate task assignments.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj: any) => {
                const isSelected = selectedProject?.id === proj.id;
                const canDelete = isCreatorOrAdmin(proj);
                const isOwner = proj.createdBy === currentUser.id;

                return (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectProj(proj)}
                    className={`bg-slate-900/40 backdrop-blur-2xl border text-left p-5 rounded-2xl shadow-lg transition-all duration-200 flex flex-col justify-between h-56 cursor-pointer relative ${
                      isSelected 
                        ? "border-indigo-500 ring-4 ring-indigo-500/15 bg-indigo-950/20" 
                        : "border-indigo-950/70 hover:border-indigo-900/40"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors">{proj.name}</h3>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {isOwner && (
                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-900/30 px-1.5 py-0.5 rounded-md font-mono">CREATOR</span>
                          )}
                          {canDelete && (
                            <button
                              onClick={(e) => handleDeleteProject(proj.id, e)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                        {proj.description || "No project goals specified."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-indigo-950/50 flex justify-between items-center text-[10px] text-slate-500 mt-4 font-mono">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-semibold text-slate-400 bg-slate-950 border border-indigo-950/80 rounded px-1.5 py-0.5" title="Team members count">
                          <Users className="h-3 w-3 text-slate-400" /> {proj.memberCount || 1}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-indigo-400">
                          📁 {proj.taskCount || 0} tasks
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Project Collaborators Side Container */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-indigo-950/70 rounded-3xl p-6 shadow-md text-left" id="collaborators-container">
          {selectedProject ? (
            <div className="space-y-6">
              <div>
                <span className="text-[9px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-900/30 px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">
                  ACTIVE CHANNEL INDEX
                </span>
                <h3 className="text-lg font-bold font-display text-white mt-2 line-clamp-1">
                  {selectedProject.name}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 truncate font-mono">
                  Creator token: {selectedProject.createdBy}
                </p>
              </div>

              {/* Add member action (Strict Admin / Owner view) */}
              {isCreatorOrAdmin(selectedProject) ? (
                <div className="bg-slate-950/60 rounded-2xl p-4 border border-indigo-950/70 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-mono uppercase tracking-widest">
                    <UserPlus className="h-4 w-4 text-indigo-400" /> ENROLL COLLABORATOR
                  </h4>
                  
                  {error && (
                    <div className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-900/30 leading-normal font-mono">
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/30 leading-normal font-mono">
                      {successMsg}
                    </div>
                  )}

                  <form onSubmit={handleAddMember} className="space-y-3">
                    <div>
                      <label htmlFor="memberEmail" className="sr-only">Email address</label>
                      <input
                        id="memberEmail"
                        type="email"
                        required
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Select registered email..."
                        className="block w-full px-3 py-2 bg-slate-950 border border-indigo-950 focus:border-indigo-500 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-0"
                        list="user-emails-datalist"
                      />
                      <datalist id="user-emails-datalist">
                        {usersList
                          .filter(u => u.id !== currentUser.id)
                          .map(u => (
                            <option key={u.id} value={u.email}>{u.name} ({u.role})</option>
                          ))}
                      </datalist>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                        className="block w-full px-2.5 py-2 bg-slate-950 border border-indigo-950 focus:border-indigo-505 rounded-xl text-xs text-slate-300 focus:outline-none font-mono"
                      >
                        <option value="Member">Basic Member node</option>
                        <option value="Admin">Admin clearances</option>
                      </select>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition whitespace-nowrap cursor-pointer"
                      >
                        Add Member
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-950/40 rounded-2xl p-4 border border-indigo-950/40">
                  <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                    Security lock: only workspace designers can authorize new collaborator assignments.
                  </p>
                </div>
              )}

              {/* Collaborators List */}
              <div className="pt-2 border-t border-indigo-950/50">
                <h4 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono mb-3 flex items-center justify-between">
                  <span>Workspace Colleagues</span>
                  <span className="text-indigo-400 bg-indigo-950 border border-indigo-900/30 px-1.5 py-0.2 rounded-md font-mono">{members.length}</span>
                </h4>

                {loadingMembers ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-indigo-500 mx-auto"></div>
                  </div>
                ) : (
                  <div className="divide-y divide-indigo-950/50 max-h-[250px] overflow-y-auto pr-1">
                    {members.map(member => {
                      const isTargetOwner = selectedProject.createdBy === member.userId;
                      const isCurrentUserMember = currentUser.id === member.userId;

                      return (
                        <div key={member.userId} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-200 block truncate">
                              {member.userName} {isCurrentUserMember && <span className="font-bold text-[9px] text-indigo-400 bg-indigo-950/60 border border-indigo-900/30 px-1 rounded font-mono ml-1">You</span>}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block truncate">{member.userEmail}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                              isTargetOwner
                                ? "text-indigo-400 bg-indigo-950 border border-indigo-900/40"
                                : member.userRole === "Admin"
                                ? "text-amber-400 bg-amber-950/40 border border-amber-900/20"
                                : "text-slate-400 bg-slate-900"
                            }`}>
                              {isTargetOwner ? "Owner" : member.userRole}
                            </span>

                            {/* Enable removal if currentUser has authority and they are not deleting the owner */}
                            {isCreatorOrAdmin(selectedProject) && !isTargetOwner && (
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                type="button"
                                className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-slate-950 rounded-xl transition cursor-pointer"
                                title="Remove colleague"
                              >
                                <UserMinus className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
              <Users className="h-10 w-10 text-slate-800 mb-3" />
              <p className="text-xs font-semibold text-slate-400">No Project channel selected</p>
              <p className="text-[10px] text-slate-500 font-mono mt-1 text-center leading-relaxed">
                Identify a project workspace pipeline on the left to review members index.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
