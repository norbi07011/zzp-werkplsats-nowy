export type UserRole =
  | "admin"
  | "worker"
  | "employer"
  | "accountant"
  | "cleaning_company"
  | "regular_user";

export interface Subscription {
  planId: "worker-basic" | "worker-plus" | "client-basic" | "client-pro";
  status: "ACTIVE" | "INACTIVE";
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  subscription?: Subscription;
}

export enum Level {
  Junior = "Junior",
  Regular = "Regular",
  Senior = "Senior",
}

export enum Availability {
  Available = "Dostępny",
  AvailableFrom = "Dostępny od",
  Busy = "Zajęty",
}

export enum JobRateType {
  Hourly = "h",
  Daily = "dzień",
  Fixed = "ryczałt",
}

export interface Skill {
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
}

export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  title: string;
  description: string;
  images: string[];
  tags: string[];
  date: string;
}

export interface Certificate {
  name: string;
  number?: string;
  validUntil: string;
  fileUrl?: string;
  verified: boolean;
}

// Extended Types for Rich Profiles
export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedDate: string;
  level?: "bronze" | "silver" | "gold" | "platinum";
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientCompany?: string;
  text: string;
  date: string;
  rating: number;
  projectType?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  recipientId: number;
  text: string;
  timestamp: string;
  isRead: boolean;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  type: "image" | "document" | "pdf";
  url: string;
  filename: string;
  size: number;
}

export interface Conversation {
  id: string;
  participants: number[]; // User IDs
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  jobRelated?: number; // Job ID if related to a job
}

export interface JobMilestone {
  id: string;
  jobId: number;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "pending" | "in-progress" | "completed" | "paid";
  completedDate?: string;
}

export interface Invoice {
  id: string;
  jobId: number;
  workerId: number;
  clientId: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  vat: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  paidDate?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentMethod {
  id: string;
  type: "ideal" | "creditcard" | "sepa" | "paypal";
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export interface Analytics {
  userId: number;
  period: "week" | "month" | "quarter" | "year";

  // Worker Analytics
  jobsCompleted?: number;
  totalEarnings?: number;
  averageRating?: number;
  profileViews?: number;
  applicationsSent?: number;
  acceptanceRate?: number;

  // Client Analytics
  jobsPosted?: number;
  totalSpent?: number;
  workersHired?: number;
  averageJobCost?: number;
  satisfactionRate?: number;

  // Chart Data
  earningsOverTime?: ChartDataPoint[];
  jobsByCategory?: { category: string; count: number }[];
  ratingTrend?: ChartDataPoint[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface SavedSearch {
  id: string;
  userId: number;
  name: string;
  filters: SearchFilters;
  createdAt: string;
  notifyOnMatch: boolean;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  radius?: number;
  rateMin?: number;
  rateMax?: number;
  availability?: Availability;
  level?: Level;
  hasVca?: boolean;
  isVerified?: boolean;
  languages?: string[];
  skills?: string[];
}

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type NotificationType =
  | "NEW_JOB"
  | "NEW_APPLICATION"
  | "STATUS_CHANGE"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED"
  | "VERIFICATION_BOOKED"
  | "COURSE_REMINDER"
  | "NEW_MESSAGE"
  | "PAYMENT_RECEIVED"
  | "MILESTONE_COMPLETED";

export interface Review {
  id: string;
  workerId: number;
  clientId: number;
  clientName: string;
  isProClient?: boolean;
  date: string;
  rating: number;
  comment: string;
  jobScope: string;
  checklist: {
    quality: boolean;
    punctuality: boolean;
    safety: boolean;
  };
  photos: string[];
  status: ReviewStatus;
  verifiedByPlatform: boolean;
}

export interface Profile {
  id: number; // Corresponds to User ID
  avatarUrl: string;
  firstName: string;
  lastName: string;
  email?: string; // ✅ NEW: needed for AddToTeamButton
  category: string;
  level: Level;
  location: string;
  availability: Availability;
  availableFrom?: string;
  rate?: number;
  hasVca: boolean;
  isVerified: boolean;
  verifiedUntil?: string;
  bio: string;
  languages: string[];
  skills: Skill[];
  experience: Experience[];
  gallery: Project[];
  certificates: Certificate[];
  reviews: Review[];
  reviewCount: number;
  avgRating: number;

  // Extended Profile Fields
  phone?: string;
  website?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  yearsOfExperience?: number;
  completionRate?: number;
  responseTime?: string; // e.g. "< 2h"
  profileViews?: number;
  savedByClients?: number;

  // Company Details (for registered businesses)
  companyName?: string;
  kvkNumber?: string;
  vatNumber?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;

  // Tools & Equipment
  ownTools?: string[];
  ownVehicle?: boolean;
  vehicleType?: string;

  // Availability Details
  availabilityCalendar?: AvailabilitySlot[];
  preferredWorkRadius?: number; // in km
  willingToTravel?: boolean;

  // Social Proof
  badges?: Badge[];
  featuredWork?: string[]; // Featured project IDs
  testimonials?: Testimonial[];

  // Settings
  profileVisibility?: "public" | "private" | "clients-only";
  allowDirectMessages?: boolean;
  emailNotifications?: boolean;

  // Stats
  joinedDate?: string;
  lastActive?: string;
  totalJobsCompleted?: number;
  repeatClientRate?: number;
}

export interface Job {
  id: number;
  clientId: number;
  title: string;
  clientName: string;
  logoUrl: string;
  location: string;
  startDate: string;
  endDate: string;
  rateType: JobRateType;
  rateValue: number;
  peopleNeeded: number;
  requiredCerts: string[];
  description: string;
  isPriority: boolean;
}

export enum ApplicationStatus {
  New = "NEW",
  Shortlisted = "SHORTLISTED",
  Accepted = "ACCEPTED",
  Declined = "DECLINED",
}

export interface Application {
  id: number;
  jobId: number;
  workerId: number;
  date: string;
  status: ApplicationStatus;
}

export interface VerificationSlot {
  id: string;
  dateTime: string;
  isBooked: boolean;
}

export interface VerificationBooking {
  id: string;
  workerId: number;
  slotId: string;
  status: "BOOKED" | "COMPLETED" | "CANCELED";
  assessment?: {
    finalLevel: Level;
    verifiedUntil: string;
    reportUrl: string;
    assessedSkills: Skill[];
  };
}

export type CourseType = "VCA_BASIS" | "VCA_VOL" | "BHV" | "GPI";

export interface Course {
  id: string;
  title: string;
  type: CourseType;
  price: number;
  dates: string[];
  seatLimit: number;
}

export interface Enrollment {
  id: string;
  courseId: string;
  workerId: number;
  status: "ENROLLED" | "PASSED" | "FAILED";
}

export interface Plan {
  id: "worker-basic" | "worker-plus" | "client-basic" | "client-pro";
  name: string;
  role: UserRole;
  price: number;
  perks: string[];
}

export interface Notification {
  id: string;
  userId: number; // The user who receives the notification
  type: NotificationType;
  message: string;
  isRead: boolean;
  timestamp: string;
  link?: string;
}

// ==========================================
// SYSTEM KOMUNIKACJI BUDOWLANEJ
// ==========================================

export type ProjectRole = "worker" | "supervisor" | "employer" | "accountant";
export type MessageType =
  | "text"
  | "image"
  | "document"
  | "location"
  | "progress_update"
  | "safety_alert";
export type ChatGroupType =
  | "project_general"
  | "team"
  | "supervisor"
  | "safety"
  | "progress";
export type SafetyLevel = "low" | "medium" | "high" | "critical";
export type ProgressStatus =
  | "on_track"
  | "delayed"
  | "ahead"
  | "completed"
  | "blocked";

export interface BuildingChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: ProjectRole;
  message_type: MessageType;
  content: string;
  metadata?: {
    file_url?: string;
    file_name?: string;
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
    progress_data?: {
      task_name: string;
      completion_percentage: number;
      photos?: string[];
    };
    safety_data?: {
      level: SafetyLevel;
      category: string;
      location_description: string;
    };
  };
  created_at: string;
  updated_at: string;
  is_read: boolean;
  parent_message_id?: string; // For replies
}

export interface ProjectChatGroup {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  group_type: ChatGroupType;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: BuildingChatMessage;
  unread_count: number;
  members: ProjectChatMember[];
}

export interface ProjectChatMember {
  user_id: string;
  user_name: string;
  user_role: ProjectRole;
  joined_at: string;
  is_admin: boolean;
  last_seen_at?: string;
}

export interface BuildingNotification {
  id: string;
  user_id: string;
  project_id: string;
  notification_type:
    | "message"
    | "progress_update"
    | "safety_alert"
    | "task_assignment"
    | "deadline_reminder";
  title: string;
  content: string;
  metadata?: {
    chat_group_id?: string;
    message_id?: string;
    progress_report_id?: string;
    safety_alert_id?: string;
    task_id?: string;
  };
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

export interface ProgressReport {
  id: string;
  project_id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_role: ProjectRole;
  task_name: string;
  task_description: string;
  completion_percentage: number;
  status: ProgressStatus;
  notes?: string;
  photos: string[];
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  hours_worked?: number;
  materials_used?: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  issues_encountered?: string;
  next_steps?: string;
  created_at: string;
  updated_at: string;
}

export interface SafetyAlert {
  id: string;
  project_id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_role: ProjectRole;
  title: string;
  description: string;
  safety_level: SafetyLevel;
  category: string; // e.g., 'fall_hazard', 'equipment_malfunction', 'weather', 'unauthorized_access'
  location_description: string;
  location_coordinates?: {
    lat: number;
    lng: number;
  };
  photos: string[];
  actions_taken?: string;
  status: "open" | "investigating" | "resolved" | "false_alarm";
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// Helper functions for communication system
export const getMessageTypeLabel = (type: MessageType): string => {
  const labels: Record<MessageType, string> = {
    text: "Wiadomość",
    image: "Zdjęcie",
    document: "Dokument",
    location: "Lokalizacja",
    progress_update: "Raport postępu",
    safety_alert: "Alert bezpieczeństwa",
  };
  return labels[type];
};

export const getSafetyLevelColor = (level: SafetyLevel): string => {
  const colors: Record<SafetyLevel, string> = {
    low: "text-green-600 bg-green-50",
    medium: "text-yellow-600 bg-yellow-50",
    high: "text-orange-600 bg-orange-50",
    critical: "text-red-600 bg-red-50",
  };
  return colors[level];
};

export const getProgressStatusColor = (status: ProgressStatus): string => {
  const colors: Record<ProgressStatus, string> = {
    on_track: "text-green-600 bg-green-50",
    ahead: "text-blue-600 bg-blue-50",
    delayed: "text-orange-600 bg-orange-50",
    blocked: "text-red-600 bg-red-50",
    completed: "text-gray-600 bg-gray-50",
  };
  return colors[status];
};

export const formatProjectRole = (role: ProjectRole): string => {
  const roleLabels: Record<ProjectRole, string> = {
    worker: "Pracownik",
    supervisor: "Kierownik",
    employer: "Pracodawca",
    accountant: "Księgowy",
  };
  return roleLabels[role];
};

// ==========================================
// FIRMY SPRZĄTAJĄCE PO BUDOWACH
// ==========================================

export type CleaningSpecialization =
  | "cleaning_after_construction" // sprzątanie po budowach
  | "deep_cleaning" // gruntowne sprzątanie
  | "office_cleaning" // sprzątanie biur
  | "window_cleaning" // mycie okien
  | "maintenance_cleaning"; // utrzymanie czystości

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface WeeklyAvailability {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

// Blocked/Unavailable dates
export type UnavailableDateType =
  | "vacation"
  | "holiday"
  | "fully_booked"
  | "other";

export interface UnavailableDate {
  date: string; // YYYY-MM-DD format
  reason: string;
  type: UnavailableDateType;
}

export interface CleaningCompany {
  id: string;

  // Powiązanie z profiles
  user_id: string;
  profile_id?: string;

  // Podstawowe dane firmy
  company_name: string;
  owner_name: string;
  phone?: string;
  email?: string;
  kvk_number?: string;

  // Lokalizacja
  location_city?: string;
  location_province?: string;
  service_radius_km: number; // promień działania w km

  // Specjalizacja
  specialization: CleaningSpecialization[];
  additional_services: string[]; // np: 'own_equipment', 'eco_products', 'same_day_service', 'weekend_available'

  // KALENDARZ DOSTĘPNOŚCI - kluczowa funkcjonalność!
  availability: WeeklyAvailability;
  preferred_days_per_week: number; // zwykle 2
  unavailable_dates: UnavailableDate[]; // zablokowane daty (urlop, święta, zajęte)

  // Stawka
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  rate_negotiable: boolean;

  // Doświadczenie
  years_experience: number;
  team_size: number; // ile osób w ekipie

  // Opis
  bio?: string;

  // Portfolio
  portfolio_images: string[]; // URLe do zdjęć prac
  avatar_url?: string; // Zdjęcie profilowe firmy (logo/avatar) - alias dla logo_url
  logo_url?: string; // Logo firmy (kompatybilność z employers)
  cover_image_url?: string; // Zdjęcie okładki profilu (background)

  // Oceny
  average_rating: number;
  total_reviews: number;

  // Subskrypcja
  subscription_tier: "basic" | "pro" | "premium";
  subscription_status: "active" | "inactive" | "suspended";

  // Widoczność
  profile_visibility: "public" | "private" | "draft";
  accepting_new_clients: boolean;

  // Timestamps
  last_active: string;
  created_at: string;
  updated_at: string;
}

// Helper functions dla cleaning companies

export const getDayLabel = (day: DayOfWeek): string => {
  const labels: Record<DayOfWeek, string> = {
    monday: "Poniedziałek",
    tuesday: "Wtorek",
    wednesday: "Środa",
    thursday: "Czwartek",
    friday: "Piątek",
    saturday: "Sobota",
    sunday: "Niedziela",
  };
  return labels[day];
};

export const getDayShortLabel = (day: DayOfWeek): string => {
  const labels: Record<DayOfWeek, string> = {
    monday: "Pn",
    tuesday: "Wt",
    wednesday: "Śr",
    thursday: "Cz",
    friday: "Pt",
    saturday: "So",
    sunday: "Nd",
  };
  return labels[day];
};

export const getCleaningSpecializationLabel = (
  spec: CleaningSpecialization
): string => {
  const labels: Record<CleaningSpecialization, string> = {
    cleaning_after_construction: "Sprzątanie po budowach",
    deep_cleaning: "Gruntowne sprzątanie",
    office_cleaning: "Sprzątanie biur",
    window_cleaning: "Mycie okien",
    maintenance_cleaning: "Utrzymanie czystości",
  };
  return labels[spec];
};

export const countAvailableDays = (
  availability: WeeklyAvailability
): number => {
  return Object.values(availability).filter(Boolean).length;
};

export const getAvailableDaysList = (
  availability: WeeklyAvailability
): DayOfWeek[] => {
  return (Object.keys(availability) as DayOfWeek[]).filter(
    (day) => availability[day]
  );
};

// ============================================
// CLEANING REVIEWS
// ============================================

export interface CleaningReview {
  id: string;
  cleaning_company_id: string;
  employer_id?: string | null;
  worker_id?: string | null;
  accountant_id?: string | null;

  // Oceny
  rating: number; // 1-5 (ogólna ocena)
  quality_rating?: number | null; // 1-5 (jakość pracy)
  punctuality_rating?: number | null; // 1-5 (punktualność)
  communication_rating?: number | null; // 1-5 (komunikacja)
  safety_rating?: number | null; // 1-5 (BHP)
  would_recommend?: boolean | null;
  review_text?: string;

  // Szczegóły pracy (opcjonalne - legacy fields)
  work_date?: string;
  work_duration_hours?: number;
  work_type?: string;

  // Odpowiedź od firmy
  response_text?: string;
  response_date?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Relacje (opcjonalne, JOIN)
  employer?: {
    id: string;
    company_name: string;
    profile_id: string;
  };
}
