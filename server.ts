/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { db } from "./server-db";
import { Task, TaskPriority, TaskStatus, UserRole } from "./src/types";

// Define custom Request properties for Auth
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

const app = express();
const PORT = 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "default_super_secret_654321";

app.use(express.json());

// Token Utility (HMAC digest signature based session token)
function generateToken(userId: string, role: UserRole): string {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const data = `${userId}:${role}:${expiry}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(data);
  const signature = hmac.digest("hex");
  return Buffer.from(`${data}:${signature}`).toString("base64");
}

function verifyToken(token: string): { userId: string; role: UserRole } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;
    const [userId, role, expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || expiry < Date.now()) return null;

    const hmac = crypto.createHmac("sha256", SESSION_SECRET);
    hmac.update(`${userId}:${role}:${expiry}`);
    const expectedSignature = hmac.digest("hex");
    if (signature === expectedSignature) {
      return { userId, role: role as UserRole };
    }
  } catch (e) {
    // Fail silently return null
  }
  return null;
}

// Authentication Middleware
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Sign-in required to inspect or modify workspace assets." });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: "Session has expired. Please sign back in." });
  }

  req.user = payload;
  next();
};

// Global Admin Middleware wrapper
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({ error: "Permission denied. Restricted to system administrators only." });
  }
  next();
};

// --- AUTH API ---

// User details
app.get("/api/auth/me", authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const user = db.findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: "User identity no longer exists." });
  }
  const { id, email, name, role, createdAt } = user;
  res.json({ id, email, name, role, createdAt });
});

// Registration
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { email, name, password, role } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: "Full credentials (email, name, password) must be specified." });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: "Account with this email already registered." });
  }

  try {
    const userRole: UserRole = role === "Admin" ? "Admin" : "Member";
    const user = db.createUser(email, name, password, userRole);
    const token = generateToken(user.id, user.role);
    res.status(201).json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create user account." });
  }
});

// Sign-in
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Please enter both search email and authentication key." });
  }

  const u = db.findUserByEmail(email);
  if (!u) {
    return res.status(400).json({ error: "Incorrect email, account not found." });
  }

  const checkHash = crypto.pbkdf2Sync(password, u.salt, 1000, 64, "sha512").toString("hex");
  if (checkHash !== u.passwordHash) {
    return res.status(400).json({ error: "Credential password signature mismatch." });
  }

  const token = generateToken(u.id, u.role);
  res.json({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt
    },
    token
  });
});

// List Users (useful for assignment search)
app.get("/api/users", authenticateToken, (req: AuthRequest, res: Response) => {
  res.json(db.getUsers());
});


// --- PROJECT API ---

// Fetch list of active accessible projects
app.get("/api/projects", authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Admins can see all projects; members see projects they are assigned to
  const projects = userRole === "Admin" ? db.getProjects() : db.getProjects(userId);
  
  // Calculate task statistics and member details for projects
  const detailedProjects = projects.map(proj => {
    const members = db.getProjectMembers(proj.id);
    const tasks = db.getTasks(proj.id);
    return {
      ...proj,
      memberCount: members.length,
      taskCount: tasks.length
    };
  });

  res.json(detailedProjects);
});

// Create a new collaborative project workspace
app.post("/api/projects", authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: "Workspace label and background description are mandatory." });
  }

  const userId = req.user!.userId;
  try {
    const proj = db.createProject(name, description, userId);
    res.status(201).json(proj);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to establish workspace." });
  }
});

// Remove a workspace
app.delete("/api/projects/:id", authenticateToken, (req: AuthRequest, res: Response) => {
  const projectId = req.params.id;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const projects = db.getProjects();
  const proj = projects.find(p => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ error: "Project workspace details missing." });
  }

  // Permission: Creator or global Admin
  if (proj.createdBy !== userId && userRole !== "Admin") {
    return res.status(403).json({ error: "Only project owner/admins can archive or destroy workspace catalogs." });
  }

  try {
    db.deleteProject(projectId);
    res.json({ success: true, message: "Workspace portfolio successfully dismounted." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed workspace teardown." });
  }
});


// --- PROJECT MEMBER ENDPOINTS ---

// Fetch interactive staff listings
app.get("/api/projects/:id/members", authenticateToken, (req: AuthRequest, res: Response) => {
  const projectId = req.params.id;
  // Verify access
  const userId = req.user!.userId;
  const userRole = req.user!.role;
  const projects = userRole === "Admin" ? db.getProjects() : db.getProjects(userId);
  if (!projects.some(p => p.id === projectId)) {
    return res.status(403).json({ error: "You do not have access to this project." });
  }

  res.json(db.getProjectMembers(projectId));
});

// Add Member to Project workspace (Owner or Admin role required)
app.post("/api/projects/:id/members", authenticateToken, (req: AuthRequest, res: Response) => {
  const projectId = req.params.id;
  const { email, role } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (!email) {
    return res.status(400).json({ error: "Collaborator's destination email required." });
  }

  const projects = db.getProjects();
  const proj = projects.find(p => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ error: "Workspace catalog not found." });
  }

  // Ensure owner or admin
  const isOwner = proj.createdBy === userId;
  const isAdmin = userRole === "Admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Access Denied: Admin role or Owner access required to mount accounts." });
  }

  try {
    const memberRole: UserRole = role === "Admin" ? "Admin" : "Member";
    const payload = db.addProjectMember(projectId, email, memberRole);
    res.status(201).json(payload);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Enrollment failure." });
  }
});

// Remove Member from Project workspace
app.delete("/api/projects/:id/members/:userId", authenticateToken, (req: AuthRequest, res: Response) => {
  const projectId = req.params.id;
  const targetUserId = req.params.userId;
  const callerId = req.user!.userId;
  const callerRole = req.user!.role;

  const proj = db.getProjects().find(p => p.id === projectId);
  if (!proj) {
    return res.status(404).json({ error: "Target workspace metadata absent." });
  }

  const isOwner = proj.createdBy === callerId;
  const isCallerAdmin = callerRole === "Admin";
  // Users can remove themselves, or owners/admins can remove members
  if (!isOwner && !isCallerAdmin && callerId !== targetUserId) {
    return res.status(403).json({ error: "Authorization breach: Owner roles required to modify workforce panels." });
  }

  try {
    db.removeProjectMember(projectId, targetUserId);
    res.json({ success: true, message: "Collaborator disengaged." });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to remove member." });
  }
});


// --- TASK MANAGEMENT (CRUD APIs) ---

// List all active tasks
app.get("/api/tasks", authenticateToken, (req: AuthRequest, res: Response) => {
  const { projectId } = req.query;
  const userId = req.user!.userId;

  try {
    const activeTasks = db.getTasks(projectId as string, userId);
    res.json(activeTasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Unable to acquire workflow listings." });
  }
});

// Add a brand new task item
app.post("/api/tasks", authenticateToken, (req: AuthRequest, res: Response) => {
  const { projectId, title, description, dueDate, priority, status, assignedTo } = req.body;
  const callerId = req.user!.userId;

  if (!projectId || !title || !priority || !status) {
    return res.status(400).json({ error: "Incomplete details (projectId, title, priority, status are required)." });
  }

  // Ensure caller has project access
  const userProjects = db.getProjects(callerId);
  if (!userProjects.some(p => p.id === projectId) && req.user!.role !== "Admin") {
    return res.status(403).json({ error: "You can only assign tasks in projects you actively belong to." });
  }

  try {
    const newTask = db.createTask({
      projectId,
      title,
      description: description || "",
      dueDate: dueDate || new Date().toISOString(),
      priority: priority as TaskPriority,
      status: status as TaskStatus,
      assignedTo: assignedTo || callerId,
      createdBy: callerId
    });
    res.status(201).json(newTask);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed item deployment." });
  }
});

// Edit/Modify/Transition a task item
app.put("/api/tasks/:id", authenticateToken, (req: AuthRequest, res: Response) => {
  const taskId = req.params.id;
  const updates = req.body;
  const callerId = req.user!.userId;

  const currentTask = db.getTaskById(taskId);
  if (!currentTask) {
    return res.status(404).json({ error: "Task item is unavailable or deleted." });
  }

  // Ensure access
  const userProjects = db.getProjects(callerId);
  const belongs = userProjects.some(p => p.id === currentTask.projectId) || req.user!.role === "Admin";
  if (!belongs) {
    return res.status(403).json({ error: "Access denied to task workspace." });
  }

  try {
    const updated = db.updateTask(taskId, updates);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Task update failed." });
  }
});

// Delete deep workflow item
app.delete("/api/tasks/:id", authenticateToken, (req: AuthRequest, res: Response) => {
  const taskId = req.params.id;
  const callerId = req.user!.userId;

  const currentTask = db.getTaskById(taskId);
  if (!currentTask) {
    return res.status(404).json({ error: "Task item already expunged." });
  }

  // Owner, task creator, or admin
  const isCreator = currentTask.createdBy === callerId;
  const isAssignee = currentTask.assignedTo === callerId;
  const isGlobalAdmin = req.user!.role === "Admin";
  
  if (!isCreator && !isAssignee && !isGlobalAdmin) {
    return res.status(403).json({ error: "You do not have administrative clearance to remove this task." });
  }

  try {
    db.deleteTask(taskId);
    res.json({ success: true, message: "Task item successfully expunged." });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Task deletion failed." });
  }
});


// --- INTERACTIVE METRIC API (DASHBOARD) ---
app.get("/api/dashboard/stats", authenticateToken, (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Admins analyze everything; individuals oversee their domain
  const activeProjects = userRole === "Admin" ? db.getProjects() : db.getProjects(userId);
  const activeTasks = userRole === "Admin" ? db.getTasks() : db.getTasks(undefined, userId);
  const users = db.getUsers();

  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter(t => t.status === "Done").length;
  const inProgressTasks = activeTasks.filter(t => t.status === "InProgress").length;
  const reviewTasks = activeTasks.filter(t => t.status === "Review").length;
  const pendingTasks = activeTasks.filter(t => t.status === "Todo").length;

  const currentDate = new Date().toISOString();
  const overdueTasks = activeTasks.filter(t => {
    return t.status !== "Done" && t.dueDate && t.dueDate < currentDate;
  });

  // Calculate high/medium/low charts
  const priorityMap: Record<TaskPriority, number> = { Low: 0, Medium: 0, High: 0 };
  activeTasks.forEach(t => {
    priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
  });
  const tasksByPriority = [
    { priority: "Low" as TaskPriority, count: priorityMap.Low },
    { priority: "Medium" as TaskPriority, count: priorityMap.Medium },
    { priority: "High" as TaskPriority, count: priorityMap.High }
  ];

  // Calculate progress statuses
  const statusMap: Record<TaskStatus, number> = { Todo: 0, InProgress: 0, Review: 0, Done: 0 };
  activeTasks.forEach(t => {
    statusMap[t.status] = (statusMap[t.status] || 0) + 1;
  });
  const tasksByStatus = [
    { status: "Todo" as TaskStatus, count: statusMap.Todo },
    { status: "InProgress" as TaskStatus, count: statusMap.InProgress },
    { status: "Review" as TaskStatus, count: statusMap.Review },
    { status: "Done" as TaskStatus, count: statusMap.Done }
  ];

  // Map Tasks Count per assigned User (Top contributors dashboard)
  const userTaskRecords: Record<string, number> = {};
  activeTasks.forEach(t => {
    if (t.assignedTo) {
      userTaskRecords[t.assignedTo] = (userTaskRecords[t.assignedTo] || 0) + 1;
    }
  });

  const tasksPerUser = Object.keys(userTaskRecords).map(uId => {
    const found = users.find(u => u.id === uId);
    return {
      userName: found ? found.name : "Unassigned Team Member",
      count: userTaskRecords[uId]
    };
  });

  res.json({
    totalTasks,
    completedTasks,
    inProgressTasks,
    pendingTasks,
    reviewTasks,
    overdueTasks,
    tasksByPriority,
    tasksByStatus,
    tasksPerUser
  });
});


// FRONTEND ASSETS & DEVELOPMENT FRAMEWORK ROUTING
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for lightning-fast standard development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static standard React artifacts in clean production modes
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[STATION INTERLINK COMPLETE] Team Task Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
