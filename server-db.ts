/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { User, Project, ProjectMember, Task, UserRole, TaskPriority, TaskStatus } from "./src/types";

export interface DatabaseSchema {
  users: Array<User & { passwordHash: string; salt: string }>;
  projects: Project[];
  projectMembers: ProjectMember[];
  tasks: Task[];
}

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to hash passwords using standard PBKDF2 (native node crypto)
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateId(): string {
  return crypto.randomUUID();
}

function getInitialData(): DatabaseSchema {
  // Define default salts and passwords
  // All default users have passwords hashed for safety
  const defaultSalt = "f60f64bbf63e6ae229dcf5d1e4e5ee61";
  
  const creatorId = "admin-1";
  const member1Id = "member-1";
  const member2Id = "member-2";
  const member3Id = "member-3";

  return {
    users: [
      {
        id: creatorId,
        email: "admin@team.com",
        name: "Sarah Jenkins",
        role: "Admin",
        salt: defaultSalt,
        passwordHash: hashPassword("admin123", defaultSalt),
        createdAt: new Date("2026-05-01T08:00:00Z").toISOString()
      },
      {
        id: member1Id,
        email: "jane@team.com",
        name: "Jane Miller",
        role: "Member",
        salt: defaultSalt,
        passwordHash: hashPassword("member123", defaultSalt),
        createdAt: new Date("2026-05-02T09:00:00Z").toISOString()
      },
      {
        id: member2Id,
        email: "jack@team.com",
        name: "Jack Davidson",
        role: "Member",
        salt: defaultSalt,
        passwordHash: hashPassword("member123", defaultSalt),
        createdAt: new Date("2026-05-02T10:00:00Z").toISOString()
      },
      {
        id: member3Id,
        email: "olivia@team.com",
        name: "Olivia Patel",
        role: "Member",
        salt: defaultSalt,
        passwordHash: hashPassword("member123", defaultSalt),
        createdAt: new Date("2026-05-03T11:00:00Z").toISOString()
      }
    ],
    projects: [
      {
        id: "proj-1",
        name: "Aero Web Redesign",
        description: "Migration to React & Tailwind CSS for performance optimization, high-contrast typography, and enhanced accessibility.",
        createdBy: creatorId,
        createdAt: new Date("2026-05-05T10:00:00Z").toISOString()
      },
      {
        id: "proj-2",
        name: "Team Mobile Companion",
        description: "Preparing flutter/native companion widgets and offline synchronization architectures for critical workspace tasks.",
        createdBy: creatorId,
        createdAt: new Date("2026-05-10T11:00:00Z").toISOString()
      }
    ],
    projectMembers: [
      // Aero Web Redesign Members
      { projectId: "proj-1", userId: creatorId, userEmail: "admin@team.com", userName: "Sarah Jenkins", userRole: "Admin" },
      { projectId: "proj-1", userId: member1Id, userEmail: "jane@team.com", userName: "Jane Miller", userRole: "Member" },
      { projectId: "proj-1", userId: member3Id, userEmail: "olivia@team.com", userName: "Olivia Patel", userRole: "Member" },
      // Team Mobile Companion Members
      { projectId: "proj-2", userId: creatorId, userEmail: "admin@team.com", userName: "Sarah Jenkins", userRole: "Admin" },
      { projectId: "proj-2", userId: member2Id, userEmail: "jack@team.com", userName: "Jack Davidson", userRole: "Member" },
      { projectId: "proj-2", userId: member3Id, userEmail: "olivia@team.com", userName: "Olivia Patel", userRole: "Member" }
    ],
    tasks: [
      {
        id: "task-1",
        projectId: "proj-1",
        title: "Implement OAuth Signup Flows",
        description: "Secure JWT login endpoints, local storage sync tokens, and validation checks.",
        dueDate: "2026-05-24T18:00:00Z",
        priority: "High",
        status: "Review",
        assignedTo: member1Id,
        createdBy: creatorId,
        createdAt: new Date("2026-05-06T14:00:00Z").toISOString(),
        updatedAt: new Date("2026-05-15T09:30:00Z").toISOString()
      },
      {
        id: "task-2",
        projectId: "proj-1",
        title: "Design Landing Page Hero Section",
        description: "Create an elegant showcase section with space-grotesk styling and responsive negative spaces.",
        dueDate: "2026-05-18T18:00:00Z",
        priority: "Medium",
        status: "Done",
        assignedTo: member3Id,
        createdBy: creatorId,
        createdAt: new Date("2026-05-06T15:00:00Z").toISOString(),
        updatedAt: new Date("2026-05-18T12:00:00Z").toISOString()
      },
      {
        id: "task-3",
        projectId: "proj-2",
        title: "Configure CI/CD Automation Pipelines",
        description: "Set up fast builds, lint validations on pushes, and automated regression deployments.",
        dueDate: "2026-05-19T18:00:00Z", // OVERDUE relative to May 21 2026!
        priority: "High",
        status: "Todo",
        assignedTo: member2Id,
        createdBy: creatorId,
        createdAt: new Date("2026-05-11T09:00:00Z").toISOString(),
        updatedAt: new Date("2026-05-11T09:00:00Z").toISOString()
      },
      {
        id: "task-4",
        projectId: "proj-1",
        title: "Write Unit Tests for Auth Middleware",
        description: "Provide rigorous mocking setups for standard cookies and sign verification layers.",
        dueDate: "2026-05-28T18:00:00Z",
        priority: "Low",
        status: "InProgress",
        assignedTo: member1Id,
        createdBy: creatorId,
        createdAt: new Date("2026-05-07T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-05-12T16:00:00Z").toISOString()
      },
      {
        id: "task-5",
        projectId: "proj-2",
        title: "Verify Play Store Developer Console credentials",
        description: "Aesthetic check on standard licensing agreements and account metadata listings.",
        dueDate: "2026-05-15T18:00:00Z",
        priority: "Medium",
        status: "Done",
        assignedTo: creatorId,
        createdBy: creatorId,
        createdAt: new Date("2026-05-11T10:00:00Z").toISOString(),
        updatedAt: new Date("2026-05-14T11:00:00Z").toISOString()
      }
    ]
  };
}

export class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error("DB load error, fallback to seeding initial data", e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("DB write error", e);
    }
  }

  private persist(): void {
    this.saveData(this.data);
  }

  // --- Users ---
  getUsers() {
    return this.data.users.map(({ passwordHash, salt, ...rest }) => rest);
  }

  findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  createUser(email: string, name: string, passwordPlain: string, role: UserRole = "Member"): User {
    const salt = generateSalt();
    const hash = hashPassword(passwordPlain, salt);
    const newUser = {
      id: generateId(),
      email: email.toLowerCase(),
      name,
      role,
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.persist();
    const { passwordHash, salt: _, ...publicUser } = newUser;
    return publicUser;
  }

  // --- Projects ---
  getProjects(userId?: string): Project[] {
    if (!userId) return this.data.projects;
    // Return projects where user is a member
    const memberProjectIds = this.data.projectMembers
      .filter(m => m.userId === userId)
      .map(m => m.projectId);
    return this.data.projects.filter(p => p.createdBy === userId || memberProjectIds.includes(p.id));
  }

  getProjectMembers(projectId: string): ProjectMember[] {
    return this.data.projectMembers.filter(m => m.projectId === projectId);
  }

  createProject(name: string, description: string, createdByUserId: string): Project {
    const creatorUser = this.findUserById(createdByUserId);
    if (!creatorUser) {
      throw new Error("Creator user not found");
    }

    const newProject: Project = {
      id: generateId(),
      name,
      description,
      createdBy: createdByUserId,
      createdAt: new Date().toISOString()
    };

    this.data.projects.push(newProject);

    // Auto-add creator as Admin project member
    this.data.projectMembers.push({
      projectId: newProject.id,
      userId: createdByUserId,
      userEmail: creatorUser.email,
      userName: creatorUser.name,
      userRole: creatorUser.role // match their global role, or default Admin for creators
    });

    this.persist();
    return newProject;
  }

  addProjectMember(projectId: string, userEmail: string, userRole: UserRole = "Member"): ProjectMember {
    const u = this.findUserByEmail(userEmail);
    if (!u) {
      throw new Error(`User with email '${userEmail}' does not exist.`);
    }

    // Check if duplicate
    const exists = this.data.projectMembers.some(m => m.projectId === projectId && m.userId === u.id);
    if (exists) {
      throw new Error(`User is already a member of this project.`);
    }

    const member: ProjectMember = {
      projectId,
      userId: u.id,
      userEmail: u.email,
      userName: u.name,
      userRole: userRole
    };

    this.data.projectMembers.push(member);
    this.persist();
    return member;
  }

  removeProjectMember(projectId: string, userId: string): void {
    const p = this.data.projects.find(proj => proj.id === projectId);
    if (p && p.createdBy === userId) {
      throw new Error("Cannot remove the project owner/creator.");
    }

    this.data.projectMembers = this.data.projectMembers.filter(
      m => !(m.projectId === projectId && m.userId === userId)
    );

    // Unassign tasks of this user in this project to unassigned/creator or leave as-is? Let's leave tasks but reset assignment to creator
    this.data.tasks.forEach(t => {
      if (t.projectId === projectId && t.assignedTo === userId) {
        t.assignedTo = p ? p.createdBy : "";
      }
    });

    this.persist();
  }

  deleteProject(projectId: string): void {
    this.data.projects = this.data.projects.filter(p => p.id !== projectId);
    this.data.projectMembers = this.data.projectMembers.filter(m => m.projectId !== projectId);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== projectId);
    this.persist();
  }

  // --- Tasks ---
  getTasks(projectId?: string, userId?: string): Task[] {
    let list = this.data.tasks;
    if (projectId) {
      list = list.filter(t => t.projectId === projectId);
    }
    if (userId) {
      // Filter where assigned or inside projects they have access to
      const allowedProjectIds = this.getProjects(userId).map(p => p.id);
      list = list.filter(t => allowedProjectIds.includes(t.projectId));
    }
    return list;
  }

  getTaskById(taskId: string): Task | undefined {
    return this.data.tasks.find(t => t.id === taskId);
  }

  createTask(taskData: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const task: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.tasks.push(task);
    this.persist();
    return task;
  }

  updateTask(taskId: string, updates: Partial<Omit<Task, "id" | "projectId" | "createdAt">>): Task {
    const idx = this.data.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) {
      throw new Error("Task not found");
    }

    const current = this.data.tasks[idx];
    const updated: Task = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.data.tasks[idx] = updated;
    this.persist();
    return updated;
  }

  deleteTask(taskId: string): void {
    this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
    this.persist();
  }
}

export const db = new Database();
