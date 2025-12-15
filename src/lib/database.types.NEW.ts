export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      regular_users: {
        Row: {
          address: string | null;
          average_rating: number | null;
          city: string | null;
          created_at: string | null;
          email_notifications: boolean | null;
          first_name: string | null;
          free_requests_limit: number | null;
          id: string;
          is_premium: boolean | null;
          last_name: string | null;
          phone: string | null;
          postal_code: string | null;
          premium_until: string | null;
          profile_id: string;
          requests_completed: number | null;
          requests_posted: number | null;
          requests_this_month: number | null;
          sms_notifications: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          average_rating?: number | null;
          city?: string | null;
          created_at?: string | null;
          email_notifications?: boolean | null;
          first_name?: string | null;
          free_requests_limit?: number | null;
          id?: string;
          is_premium?: boolean | null;
          last_name?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          premium_until?: string | null;
          profile_id: string;
          requests_completed?: number | null;
          requests_posted?: number | null;
          requests_this_month?: number | null;
          sms_notifications?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          average_rating?: number | null;
          city?: string | null;
          created_at?: string | null;
          email_notifications?: boolean | null;
          first_name?: string | null;
          free_requests_limit?: number | null;
          id?: string;
          is_premium?: boolean | null;
          last_name?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          premium_until?: string | null;
          profile_id?: string;
          requests_completed?: number | null;
          requests_posted?: number | null;
          requests_this_month?: number | null;
          sms_notifications?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "regular_users_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      service_request_responses: {
        Row: {
          availability_date: string | null;
          created_at: string;
          estimated_hours: number | null;
          id: string;
          message: string;
          offered_price: number | null;
          post_id: string;
          status: string;
          updated_at: string;
          worker_id: string;
        };
        Insert: {
          availability_date?: string | null;
          created_at?: string;
          estimated_hours?: number | null;
          id?: string;
          message: string;
          offered_price?: number | null;
          post_id: string;
          status?: string;
          updated_at?: string;
          worker_id: string;
        };
        Update: {
          availability_date?: string | null;
          created_at?: string;
          estimated_hours?: number | null;
          id?: string;
          message?: string;
          offered_price?: number | null;
          post_id?: string;
          status?: string;
          updated_at?: string;
          worker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_request_responses_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_request_responses_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          }
        ];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id: string;
          author_type: "admin" | "employer" | "regular_user";
          type: "announcement" | "ad" | "service_request";
          visibility: "public" | "workers_only" | "employers_only";
          media_urls: string[] | null;
          is_featured: boolean | null;
          is_premium: boolean | null;
          expires_at: string | null;
          likes_count: number | null;
          comments_count: number | null;
          views_count: number | null;
          created_at: string;
          updated_at: string;
          // Service request specific fields
          request_category: string | null;
          request_location: string | null;
          request_budget_min: number | null;
          request_budget_max: number | null;
          request_urgency: string | null;
          request_preferred_date: string | null;
          request_contact_method: string | null;
          request_status: string | null;
          request_responses_count: number | null;
          request_selected_worker_id: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          author_id: string;
          author_type: "admin" | "employer" | "regular_user";
          type: "announcement" | "ad" | "service_request";
          visibility?: "public" | "workers_only" | "employers_only";
          media_urls?: string[] | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          expires_at?: string | null;
          likes_count?: number | null;
          comments_count?: number | null;
          views_count?: number | null;
          created_at?: string;
          updated_at?: string;
          request_category?: string | null;
          request_location?: string | null;
          request_budget_min?: number | null;
          request_budget_max?: number | null;
          request_urgency?: string | null;
          request_preferred_date?: string | null;
          request_contact_method?: string | null;
          request_status?: string | null;
          request_responses_count?: number | null;
          request_selected_worker_id?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          author_id?: string;
          author_type?: "admin" | "employer" | "regular_user";
          type?: "announcement" | "ad" | "service_request";
          visibility?: "public" | "workers_only" | "employers_only";
          media_urls?: string[] | null;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          expires_at?: string | null;
          likes_count?: number | null;
          comments_count?: number | null;
          views_count?: number | null;
          created_at?: string;
          updated_at?: string;
          request_category?: string | null;
          request_location?: string | null;
          request_budget_min?: number | null;
          request_budget_max?: number | null;
          request_urgency?: string | null;
          request_preferred_date?: string | null;
          request_contact_method?: string | null;
          request_status?: string | null;
          request_responses_count?: number | null;
          request_selected_worker_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role:
            | "worker"
            | "employer"
            | "admin"
            | "accountant"
            | "cleaning_company"
            | "regular_user";
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role:
            | "worker"
            | "employer"
            | "admin"
            | "accountant"
            | "cleaning_company"
            | "regular_user";
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?:
            | "worker"
            | "employer"
            | "admin"
            | "accountant"
            | "cleaning_company"
            | "regular_user";
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      workers: {
        Row: {
          id: string;
          profile_id: string;
          specialization: string | null;
          hourly_rate: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          specialization?: string | null;
          hourly_rate?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          specialization?: string | null;
          hourly_rate?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      reset_monthly_requests: { Args: never; Returns: undefined };
    };
    Enums: {};
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
