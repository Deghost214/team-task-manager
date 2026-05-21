/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "Admin" | "Member";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdBy: string; // User ID
  createdAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole; // Role in the project/org
}

export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus = "Todo" | "InProgress" | "Review" | "Done";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string; // User ID
  createdBy: string;  // User ID
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithStats extends Project {
  memberCount: number;
  taskCount: number;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  reviewTasks: number;
  overdueTasks: Task[];
  tasksByPriority: { priority: TaskPriority; count: number }[];
  tasksByStatus: { status: TaskStatus; count: number }[];
  tasksPerUser: { userName: string; count: number }[];
}
