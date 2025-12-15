/**
 * ================================================================
 * TEAM SYSTEM - TYPES
 * ================================================================
 * Przeniesione 1:1 z BetonCoat B.V.
 * Dostosowane do ZZP Werkplaats
 */

export enum TeamUserRole {
  ADMIN = "ADMIN",
  WORKER = "WORKER",
}

// Alias for BetonCoat compatibility
export const UserRole = TeamUserRole;
export type UserRole = TeamUserRole;

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// Alias for BetonCoat compatibility
export type User = TeamMember;

export interface TeamMember {
  id: string;
  name: string;
  role: TeamUserRole;
  specialization?: string; // e.g. Painter, Plumber
  email?: string;
  hourlyRate?: number;
  avatar?: string;
  phone?: string;
  isAvailable: boolean;
  completedTasksCount: number; // For ranking
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface WorkLog {
  id: string;
  userId: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  description?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedToIds: string[];
  status: TaskStatus;
  priority: Priority;
  dueDate: string; // ISO date
  estimatedHours?: number;
  toolsRequired: string[]; // List of specific tools e.g. "Drill", "Mixer"
  materialsRequired: Material[];
  materialsUsed: Material[];
  comments: Comment[];
  photos: string[]; // Base64 or URLs
  workLogs: WorkLog[];
}

export interface TaskTemplate {
  id: string;
  name: string; // Template display name
  title: string; // Default task title
  description: string;
  priority: Priority;
  estimatedHours: number;
  toolsRequired: string[];
  materialsRequired: Material[];
}

export interface Project {
  id: string;
  title: string;
  clientName: string;
  street: string;
  houseNumber: string;
  postalCode: string; // NL format: 1234 AB
  city: string;
  description: string;
  tasks: string[]; // Task IDs
  startDate: string;
  endDate?: string; // ISO date for project deadline
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}
