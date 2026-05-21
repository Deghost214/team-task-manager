/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const API_BASE = "/api";

export function getAuthToken(): string | null {
  return localStorage.getItem("team_task_mgmt_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("team_task_mgmt_token", token);
}

export function removeAuthToken() {
  localStorage.removeItem("team_task_mgmt_token");
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json().catch(() => ({ success: true }));
}

export const api = {
  // Auth
  me: () => request("/auth/me"),
  login: (credentials: any) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (user: any) => request("/auth/register", { method: "POST", body: JSON.stringify(user) }),
  
  // Users
  getUsers: () => request("/users"),
  
  // Projects
  getProjects: () => request("/projects"),
  createProject: (data: any) => request("/projects", { method: "POST", body: JSON.stringify(data) }),
  deleteProject: (id: string) => request(`/projects/${id}`, { method: "DELETE" }),
  getProjectMembers: (projectId: string) => request(`/projects/${projectId}/members`),
  addProjectMember: (projectId: string, email: string, role?: string) => 
    request(`/projects/${projectId}/members`, { method: "POST", body: JSON.stringify({ email, role }) }),
  removeProjectMember: (projectId: string, userId: string) => 
    request(`/projects/${projectId}/members/${userId}`, { method: "DELETE" }),
    
  // Tasks
  getTasks: (projectId?: string) => request(`/tasks${projectId ? `?projectId=${projectId}` : ""}`),
  createTask: (data: any) => request("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: string) => request(`/tasks/${id}`, { method: "DELETE" }),
  
  // Statistics
  getStats: () => request("/dashboard/stats"),
};
