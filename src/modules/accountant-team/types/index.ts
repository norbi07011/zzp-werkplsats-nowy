/**
 * Types for Accountant Team Module
 * Simplified types for team collaboration system
 */

export type Language = "PL" | "NL";

// Simple string-based status/priority for easy comparison
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type MemberStatus = "Online" | "Away" | "Offline";
export type TaskCategory =
  | "General"
  | "Tax"
  | "Payroll"
  | "Meeting"
  | "Audit"
  | "Advisory";

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  bio?: string;
  status?: MemberStatus;
  linkedin?: string;
  company_name?: string;
  specializations?: string[];
}

export interface TaskAttachment {
  id: string;
  type: "image" | "file" | "voice";
  name: string;
  url: string;
  size?: string;
  timestamp: string;
}

export interface TeamTask {
  id: string;
  title: string;
  description: string;
  assigneeId?: string | null;
  assigneeIds?: string[];
  dueDate: string;
  dueTime?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: TaskCategory | string;
  estimatedHours?: number;
  tags?: string[];
  attachments?: TaskAttachment[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  groupId?: string;
}

export interface ChatAttachment {
  id: string;
  type: "image" | "file" | "voice";
  url: string;
  name?: string;
  size?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  type: "text" | "file" | "sticker" | "system";
  attachments?: ChatAttachment[];
}

export interface ChatChannel {
  id: string;
  name: string;
  type: "public" | "private" | "group" | "dm";
  color?: string;
  members?: string[];
  unreadCount: number;
}

export interface AccountantGroup {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  avatar_url?: string;
  member_count?: number;
  created_at: string;
}

export interface AccountantGroupMember {
  id: string;
  group_id: string;
  accountant_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  accountant?: TeamMember;
}

export interface AccountantInvite {
  id: string;
  group_id?: string;
  invited_email: string;
  invited_by: string;
  token: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  inviter?: TeamMember;
  group?: AccountantGroup;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  label?: string;
  color?: string;
  priority: TaskPriority;
  category?: TaskCategory | string;
  defaultDays?: number;
}

export interface TeamDashboardStats {
  todoCount: number;
  inProgressCount: number;
  reviewCount: number;
  doneCount: number;
  overdueCount: number;
  totalTasks: number;
  teamMembersOnline: number;
}
