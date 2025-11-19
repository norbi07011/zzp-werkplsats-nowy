export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string | null;
          avatar_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          assigned_at: string | null;
          assigned_to: string | null;
          attachments: Json | null;
          category: string;
          closed_at: string | null;
          created_at: string | null;
          description: string;
          first_response_at: string | null;
          id: string;
          internal_notes: string | null;
          priority: string;
          rating: number | null;
          rating_comment: string | null;
          resolved_at: string | null;
          status: string;
          subject: string;
          tags: string[] | null;
          updated_at: string | null;
          user_email: string;
          user_id: string;
          user_name: string;
          user_role: string;
        };
        Insert: {
          assigned_at?: string | null;
          assigned_to?: string | null;
          attachments?: Json | null;
          category: string;
          closed_at?: string | null;
          created_at?: string | null;
          description: string;
          first_response_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          priority?: string;
          rating?: number | null;
          rating_comment?: string | null;
          resolved_at?: string | null;
          status?: string;
          subject: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_email: string;
          user_id: string;
          user_name: string;
          user_role: string;
        };
        Update: {
          assigned_at?: string | null;
          assigned_to?: string | null;
          attachments?: Json | null;
          category?: string;
          closed_at?: string | null;
          created_at?: string | null;
          description?: string;
          first_response_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          priority?: string;
          rating?: number | null;
          rating_comment?: string | null;
          resolved_at?: string | null;
          status?: string;
          subject?: string;
          tags?: string[] | null;
          updated_at?: string | null;
          user_email?: string;
          user_id?: string;
          user_name?: string;
          user_role?: string;
        };
        Relationships: [];
      };
      support_messages: {
        Row: {
          attachments: Json | null;
          created_at: string | null;
          id: string;
          is_internal: boolean | null;
          message: string;
          read_at: string | null;
          sender_id: string;
          sender_name: string;
          sender_role: string;
          ticket_id: string;
        };
        Insert: {
          attachments?: Json | null;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean | null;
          message: string;
          read_at?: string | null;
          sender_id: string;
          sender_name: string;
          sender_role: string;
          ticket_id: string;
        };
        Update: {
          attachments?: Json | null;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean | null;
          message?: string;
          read_at?: string | null;
          sender_id?: string;
          sender_name?: string;
          sender_role?: string;
          ticket_id?: string;
        };
        Relationships: [];
      };
      workers: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      employers: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      accountants: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      cleaning_companies: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      accountant_services: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      accountant_forms: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      form_submissions: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      accountant_reviews: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      availability: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      unavailable_dates: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      applications: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      jobs: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      reviews: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      certificates: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      projects: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      project_tasks: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      earnings: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      subscriptions: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      profile_views: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: [];
      };
      [key: string]: {
        Row: { [key: string]: any };
        Insert: { [key: string]: any };
        Update: { [key: string]: any };
        Relationships: any[];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"];
