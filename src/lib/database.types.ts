export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accountant_forms: {
        Row: {
          accountant_id: string
          created_at: string | null
          form_fields: Json
          form_name: string
          form_type: string
          id: string
          is_active: boolean | null
          requires_approval: boolean | null
          updated_at: string | null
        }
        Insert: {
          accountant_id: string
          created_at?: string | null
          form_fields: Json
          form_name: string
          form_type: string
          id?: string
          is_active?: boolean | null
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Update: {
          accountant_id?: string
          created_at?: string | null
          form_fields?: Json
          form_name?: string
          form_type?: string
          id?: string
          is_active?: boolean | null
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accountant_forms_accountant_id_fkey"
            columns: ["accountant_id"]
            isOneToOne: false
            referencedRelation: "accountants"
            referencedColumns: ["id"]
          },
        ]
      }
      accountant_reviews: {
        Row: {
          accountant_id: string
          comment: string | null
          communication_rating: number | null
          created_at: string | null
          id: string
          professionalism_rating: number | null
          quality_rating: number | null
          rating: number
          reviewer_id: string
          reviewer_name: string | null
          reviewer_type: string
          status: string | null
          timeliness_rating: number | null
          would_recommend: boolean | null
        }
        Insert: {
          accountant_id: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          professionalism_rating?: number | null
          quality_rating?: number | null
          rating: number
          reviewer_id: string
          reviewer_name?: string | null
          reviewer_type: string
          status?: string | null
          timeliness_rating?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          accountant_id?: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          professionalism_rating?: number | null
          quality_rating?: number | null
          rating?: number
          reviewer_id?: string
          reviewer_name?: string | null
          reviewer_type?: string
          status?: string | null
          timeliness_rating?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "accountant_reviews_accountant_id_fkey"
            columns: ["accountant_id"]
            isOneToOne: false
            referencedRelation: "accountants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountant_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountant_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      accountant_services: {
        Row: {
          accountant_id: string
          created_at: string | null
          delivery_time: string | null
          description: string | null
          display_order: number | null
          id: string
          includes: string[] | null
          is_active: boolean | null
          name: string
          price_amount: number | null
          price_currency: string | null
          price_type: string | null
          service_type: string
          updated_at: string | null
        }
        Insert: {
          accountant_id: string
          created_at?: string | null
          delivery_time?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          name: string
          price_amount?: number | null
          price_currency?: string | null
          price_type?: string | null
          service_type: string
          updated_at?: string | null
        }
        Update: {
          accountant_id?: string
          created_at?: string | null
          delivery_time?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          includes?: string[] | null
          is_active?: boolean | null
          name?: string
          price_amount?: number | null
          price_currency?: string | null
          price_type?: string | null
          service_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accountant_services_accountant_id_fkey"
            columns: ["accountant_id"]
            isOneToOne: false
            referencedRelation: "accountants"
            referencedColumns: ["id"]
          },
        ]
      }
      accountant_team_members: {
        Row: {
          accountant_id: string
          avatar_url: string | null
          bio: string | null
          can_approve_forms: boolean
          can_handle_clients: boolean
          created_at: string
          id: string
          is_active: boolean
          member_email: string
          member_name: string
          member_phone: string | null
          role: string
          specialization: string[] | null
          updated_at: string
        }
        Insert: {
          accountant_id: string
          avatar_url?: string | null
          bio?: string | null
          can_approve_forms?: boolean
          can_handle_clients?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          member_email: string
          member_name: string
          member_phone?: string | null
          role?: string
          specialization?: string[] | null
          updated_at?: string
        }
        Update: {
          accountant_id?: string
          avatar_url?: string | null
          bio?: string | null
          can_approve_forms?: boolean
          can_handle_clients?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          member_email?: string
          member_name?: string
          member_phone?: string | null
          role?: string
          specialization?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountant_team_members_accountant_id_fkey"
            columns: ["accountant_id"]
            isOneToOne: false
            referencedRelation: "accountants"
            referencedColumns: ["id"]
          },
        ]
      }
      accountants: {
        Row: {
          address: string | null
          avatar_url: string | null
          bio: string | null
          btw_number: string | null
          city: string | null
          company_name: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          kvk_number: string | null
          languages: string[] | null
          license_number: string | null
          phone: string | null
          portfolio_images: string[] | null
          postal_code: string | null
          profile_id: string | null
          rating: number | null
          rating_count: number | null
          specializations: string[] | null
          subscription_status: string | null
          subscription_tier: string | null
          total_clients: number | null
          updated_at: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          kvk_number?: string | null
          languages?: string[] | null
          license_number?: string | null
          phone?: string | null
          portfolio_images?: string[] | null
          postal_code?: string | null
          profile_id?: string | null
          rating?: number | null
          rating_count?: number | null
          specializations?: string[] | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_clients?: number | null
          updated_at?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          kvk_number?: string | null
          languages?: string[] | null
          license_number?: string | null
          phone?: string | null
          portfolio_images?: string[] | null
          postal_code?: string | null
          profile_id?: string | null
          rating?: number | null
          rating_count?: number | null
          specializations?: string[] | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_clients?: number | null
          updated_at?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accountants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          event_type: string
          id: string
          ip_address: unknown
          properties: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          event_type: string
          id?: string
          ip_address?: unknown
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          available_from: string | null
          cover_letter: string | null
          created_at: string | null
          employer_id: string
          id: string
          job_id: string
          proposed_rate: number | null
          reviewed_at: string | null
          status: string | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          available_from?: string | null
          cover_letter?: string | null
          created_at?: string | null
          employer_id: string
          id?: string
          job_id: string
          proposed_rate?: number | null
          reviewed_at?: string | null
          status?: string | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          available_from?: string | null
          cover_letter?: string | null
          created_at?: string | null
          employer_id?: string
          id?: string
          job_id?: string
          proposed_rate?: number | null
          reviewed_at?: string | null
          status?: string | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string | null
          trigger_conditions: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_id?: string | null
          trigger_conditions?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string
          friday: boolean
          id: string
          monday: boolean
          preferred_end_time: string | null
          preferred_start_time: string | null
          profile_id: string
          saturday: boolean
          sunday: boolean
          thursday: boolean
          tuesday: boolean
          updated_at: string
          wednesday: boolean
        }
        Insert: {
          created_at?: string
          friday?: boolean
          id?: string
          monday?: boolean
          preferred_end_time?: string | null
          preferred_start_time?: string | null
          profile_id: string
          saturday?: boolean
          sunday?: boolean
          thursday?: boolean
          tuesday?: boolean
          updated_at?: string
          wednesday?: boolean
        }
        Update: {
          created_at?: string
          friday?: boolean
          id?: string
          monday?: boolean
          preferred_end_time?: string | null
          preferred_start_time?: string | null
          profile_id?: string
          saturday?: boolean
          sunday?: boolean
          thursday?: boolean
          tuesday?: boolean
          updated_at?: string
          wednesday?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "availability_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      building_notifications: {
        Row: {
          action_data: Json | null
          action_type: string | null
          created_at: string | null
          expires_at: string | null
          geofence_triggered: boolean | null
          id: string
          is_actionable: boolean | null
          is_read: boolean | null
          is_urgent: boolean | null
          location_id: string | null
          message: string
          notification_type: string
          project_id: string | null
          read_at: string | null
          related_data: Json | null
          task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          geofence_triggered?: boolean | null
          id?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          is_urgent?: boolean | null
          location_id?: string | null
          message: string
          notification_type: string
          project_id?: string | null
          read_at?: string | null
          related_data?: Json | null
          task_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          geofence_triggered?: boolean | null
          id?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          is_urgent?: boolean | null
          location_id?: string | null
          message?: string
          notification_type?: string
          project_id?: string | null
          read_at?: string | null
          related_data?: Json | null
          task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_name: string
          certificate_number: string | null
          certificate_type: string
          created_at: string | null
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          issuer: string | null
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          worker_id: string
        }
        Insert: {
          certificate_name: string
          certificate_number?: string | null
          certificate_type: string
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          worker_id: string
        }
        Update: {
          certificate_name?: string
          certificate_number?: string | null
          certificate_type?: string
          created_at?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string | null
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_companies: {
        Row: {
          accepting_new_clients: boolean | null
          additional_services: string[] | null
          availability: Json | null
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          company_name: string
          cover_image_url: string | null
          created_at: string | null
          email: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          kvk_number: string | null
          last_active: string | null
          location_city: string | null
          location_province: string | null
          owner_name: string
          phone: string | null
          portfolio_images: string[] | null
          preferred_days_per_week: number | null
          profile_id: string
          profile_visibility: string | null
          rate_negotiable: boolean | null
          service_radius_km: number | null
          specialization: string[] | null
          subscription_status: string | null
          subscription_tier: string | null
          team_size: number | null
          total_reviews: number | null
          unavailable_dates: Json | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          accepting_new_clients?: boolean | null
          additional_services?: string[] | null
          availability?: Json | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          company_name: string
          cover_image_url?: string | null
          created_at?: string | null
          email?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          kvk_number?: string | null
          last_active?: string | null
          location_city?: string | null
          location_province?: string | null
          owner_name: string
          phone?: string | null
          portfolio_images?: string[] | null
          preferred_days_per_week?: number | null
          profile_id: string
          profile_visibility?: string | null
          rate_negotiable?: boolean | null
          service_radius_km?: number | null
          specialization?: string[] | null
          subscription_status?: string | null
          subscription_tier?: string | null
          team_size?: number | null
          total_reviews?: number | null
          unavailable_dates?: Json | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          accepting_new_clients?: boolean | null
          additional_services?: string[] | null
          availability?: Json | null
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          company_name?: string
          cover_image_url?: string | null
          created_at?: string | null
          email?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          kvk_number?: string | null
          last_active?: string | null
          location_city?: string | null
          location_province?: string | null
          owner_name?: string
          phone?: string | null
          portfolio_images?: string[] | null
          preferred_days_per_week?: number | null
          profile_id?: string
          profile_visibility?: string | null
          rate_negotiable?: boolean | null
          service_radius_km?: number | null
          specialization?: string[] | null
          subscription_status?: string | null
          subscription_tier?: string | null
          team_size?: number | null
          total_reviews?: number | null
          unavailable_dates?: Json | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_companies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_companies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_reviews: {
        Row: {
          cleaning_company_id: string
          created_at: string | null
          employer_id: string
          id: string
          rating: number
          response_date: string | null
          response_text: string | null
          review_text: string | null
          updated_at: string | null
          work_date: string | null
          work_duration_hours: number | null
          work_type: string | null
        }
        Insert: {
          cleaning_company_id: string
          created_at?: string | null
          employer_id: string
          id?: string
          rating: number
          response_date?: string | null
          response_text?: string | null
          review_text?: string | null
          updated_at?: string | null
          work_date?: string | null
          work_duration_hours?: number | null
          work_type?: string | null
        }
        Update: {
          cleaning_company_id?: string
          created_at?: string | null
          employer_id?: string
          id?: string
          rating?: number
          response_date?: string | null
          response_text?: string | null
          review_text?: string | null
          updated_at?: string | null
          work_date?: string | null
          work_duration_hours?: number | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_reviews_cleaning_company_id_fkey"
            columns: ["cleaning_company_id"]
            isOneToOne: false
            referencedRelation: "cleaning_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_reviews_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cleaning_reviews_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
          user_type: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
          user_type: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_projects: {
        Row: {
          allow_worker_invite: boolean | null
          assigned_accountants: Json | null
          assigned_workers: Json | null
          budget: number | null
          communication_channels: Json | null
          created_at: string | null
          created_by: string
          default_language: string | null
          description: string | null
          employer_id: string | null
          employer_name: string | null
          end_date: string | null
          id: string
          location_address: string | null
          location_coordinates: Json | null
          max_members: number | null
          name: string
          project_members: Json | null
          project_type: string | null
          require_approval: boolean | null
          search_vector: unknown
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          allow_worker_invite?: boolean | null
          assigned_accountants?: Json | null
          assigned_workers?: Json | null
          budget?: number | null
          communication_channels?: Json | null
          created_at?: string | null
          created_by: string
          default_language?: string | null
          description?: string | null
          employer_id?: string | null
          employer_name?: string | null
          end_date?: string | null
          id?: string
          location_address?: string | null
          location_coordinates?: Json | null
          max_members?: number | null
          name: string
          project_members?: Json | null
          project_type?: string | null
          require_approval?: boolean | null
          search_vector?: unknown
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_worker_invite?: boolean | null
          assigned_accountants?: Json | null
          assigned_workers?: Json | null
          budget?: number | null
          communication_channels?: Json | null
          created_at?: string | null
          created_by?: string
          default_language?: string | null
          description?: string | null
          employer_id?: string | null
          employer_name?: string | null
          end_date?: string | null
          id?: string
          location_address?: string | null
          location_coordinates?: Json | null
          max_members?: number | null
          name?: string
          project_members?: Json | null
          project_type?: string | null
          require_approval?: boolean | null
          search_vector?: unknown
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_communication_projects_employer"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_communication_projects_employer"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_attempts: {
        Row: {
          cleaning_company_id: string
          contact_type: string
          created_at: string
          employer_id: string
          id: string
          notes: string | null
        }
        Insert: {
          cleaning_company_id: string
          contact_type: string
          created_at?: string
          employer_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          cleaning_company_id?: string
          contact_type?: string
          created_at?: string
          employer_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_attempts_cleaning_company_id_fkey"
            columns: ["cleaning_company_id"]
            isOneToOne: false
            referencedRelation: "cleaning_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_attempts_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_attempts_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
        ]
      }
      earnings: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          employer_id: string | null
          id: string
          invoice_number: string | null
          job_id: string | null
          payment_date: string
          payment_method: string | null
          status: string | null
          worker_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employer_id?: string | null
          id?: string
          invoice_number?: string | null
          job_id?: string | null
          payment_date: string
          payment_method?: string | null
          status?: string | null
          worker_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          employer_id?: string | null
          id?: string
          invoice_number?: string | null
          job_id?: string | null
          payment_date?: string
          payment_method?: string | null
          status?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earnings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "earnings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_saved_workers: {
        Row: {
          employer_id: string
          folder: string | null
          id: string
          last_viewed_at: string | null
          notes: string | null
          saved_at: string | null
          tags: string[] | null
          worker_id: string
        }
        Insert: {
          employer_id: string
          folder?: string | null
          id?: string
          last_viewed_at?: string | null
          notes?: string | null
          saved_at?: string | null
          tags?: string[] | null
          worker_id: string
        }
        Update: {
          employer_id?: string
          folder?: string | null
          id?: string
          last_viewed_at?: string | null
          notes?: string | null
          saved_at?: string | null
          tags?: string[] | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_saved_workers_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_saved_workers_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_saved_workers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_saved_workers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_search_history: {
        Row: {
          category: string | null
          employer_id: string
          filters: Json | null
          id: string
          level: string | null
          location_city: string | null
          max_rate: number | null
          min_rate: number | null
          radius_km: number | null
          results_count: number | null
          search_date: string | null
          skills: string[] | null
          subcategory: string | null
        }
        Insert: {
          category?: string | null
          employer_id: string
          filters?: Json | null
          id?: string
          level?: string | null
          location_city?: string | null
          max_rate?: number | null
          min_rate?: number | null
          radius_km?: number | null
          results_count?: number | null
          search_date?: string | null
          skills?: string[] | null
          subcategory?: string | null
        }
        Update: {
          category?: string | null
          employer_id?: string
          filters?: Json | null
          id?: string
          level?: string | null
          location_city?: string | null
          max_rate?: number | null
          min_rate?: number | null
          radius_km?: number | null
          results_count?: number | null
          search_date?: string | null
          skills?: string[] | null
          subcategory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_search_history_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_search_history_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_stats: {
        Row: {
          active_jobs: number | null
          contacts_this_month: number | null
          contacts_this_week: number | null
          created_at: string | null
          employer_id: string
          filled_jobs: number | null
          id: string
          last_contact_at: string | null
          last_search_at: string | null
          pending_applications: number | null
          searches_this_month: number | null
          searches_this_week: number | null
          total_applications_received: number | null
          total_contacts: number | null
          total_hires: number
          total_jobs_posted: number | null
          total_saved_workers: number | null
          total_searches: number | null
          updated_at: string | null
        }
        Insert: {
          active_jobs?: number | null
          contacts_this_month?: number | null
          contacts_this_week?: number | null
          created_at?: string | null
          employer_id: string
          filled_jobs?: number | null
          id?: string
          last_contact_at?: string | null
          last_search_at?: string | null
          pending_applications?: number | null
          searches_this_month?: number | null
          searches_this_week?: number | null
          total_applications_received?: number | null
          total_contacts?: number | null
          total_hires?: number
          total_jobs_posted?: number | null
          total_saved_workers?: number | null
          total_searches?: number | null
          updated_at?: string | null
        }
        Update: {
          active_jobs?: number | null
          contacts_this_month?: number | null
          contacts_this_week?: number | null
          created_at?: string | null
          employer_id?: string
          filled_jobs?: number | null
          id?: string
          last_contact_at?: string | null
          last_search_at?: string | null
          pending_applications?: number | null
          searches_this_month?: number | null
          searches_this_week?: number | null
          total_applications_received?: number | null
          total_contacts?: number | null
          total_hires?: number
          total_jobs_posted?: number | null
          total_saved_workers?: number | null
          total_searches?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_stats_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: true
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_stats_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: true
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
        ]
      }
      employers: {
        Row: {
          address: string | null
          avg_rating: number | null
          btw_number: string | null
          city: string | null
          company_name: string | null
          company_size: string | null
          company_type: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          google_maps_url: string | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number | null
          id: string
          industry: string | null
          kvk_number: string | null
          latitude: number | null
          location_city: string | null
          logo_url: string | null
          longitude: number | null
          phone: string | null
          postal_code: string | null
          profile_completed: boolean | null
          profile_id: string
          rating: number | null
          rating_count: number | null
          rsin_number: string | null
          subscription_expires_at: string | null
          subscription_start_date: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          total_hires: number | null
          total_jobs_posted: number | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          avg_rating?: number | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          company_size?: string | null
          company_type?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          id?: string
          industry?: string | null
          kvk_number?: string | null
          latitude?: number | null
          location_city?: string | null
          logo_url?: string | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          profile_completed?: boolean | null
          profile_id: string
          rating?: number | null
          rating_count?: number | null
          rsin_number?: string | null
          subscription_expires_at?: string | null
          subscription_start_date?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_hires?: number | null
          total_jobs_posted?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          avg_rating?: number | null
          btw_number?: string | null
          city?: string | null
          company_name?: string | null
          company_size?: string | null
          company_type?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          id?: string
          industry?: string | null
          kvk_number?: string | null
          latitude?: number | null
          location_city?: string | null
          logo_url?: string | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          profile_completed?: boolean | null
          profile_id?: string
          rating?: number | null
          rating_count?: number | null
          rsin_number?: string | null
          subscription_expires_at?: string | null
          subscription_start_date?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          total_hires?: number | null
          total_jobs_posted?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_notifications: {
        Row: {
          created_at: string | null
          email_sent: boolean | null
          error_message: string | null
          event_id: string
          id: string
          in_app_read: boolean | null
          message: string | null
          notification_type: string
          participant_id: string | null
          push_sent: boolean | null
          scheduled_at: string
          sent_at: string | null
          sms_sent: boolean | null
          status: string | null
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_sent?: boolean | null
          error_message?: string | null
          event_id: string
          id?: string
          in_app_read?: boolean | null
          message?: string | null
          notification_type: string
          participant_id?: string | null
          push_sent?: boolean | null
          scheduled_at: string
          sent_at?: string | null
          sms_sent?: boolean | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_sent?: boolean | null
          error_message?: string | null
          event_id?: string
          id?: string
          in_app_read?: boolean | null
          message?: string | null
          notification_type?: string
          participant_id?: string | null
          push_sent?: boolean | null
          scheduled_at?: string
          sent_at?: string | null
          sms_sent?: boolean | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "project_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_notifications_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "event_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          attendance_status:
            | Database["public"]["Enums"]["attendance_status"]
            | null
          created_at: string | null
          event_id: string
          id: string
          joined_at: string | null
          left_at: string | null
          notification_preferences: Json | null
          response_date: string | null
          response_note: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendance_status?:
            | Database["public"]["Enums"]["attendance_status"]
            | null
          created_at?: string | null
          event_id: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          notification_preferences?: Json | null
          response_date?: string | null
          response_note?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendance_status?:
            | Database["public"]["Enums"]["attendance_status"]
            | null
          created_at?: string | null
          event_id?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          notification_preferences?: Json | null
          response_date?: string | null
          response_note?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "project_events"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          accountant_files: string[] | null
          accountant_id: string
          accountant_response: string | null
          attachments: string[] | null
          completed_at: string | null
          form_data: Json
          form_id: string
          id: string
          status: string | null
          submitted_at: string | null
          submitter_email: string | null
          submitter_id: string
          submitter_name: string | null
          submitter_phone: string | null
          submitter_type: string
          updated_at: string | null
        }
        Insert: {
          accountant_files?: string[] | null
          accountant_id: string
          accountant_response?: string | null
          attachments?: string[] | null
          completed_at?: string | null
          form_data: Json
          form_id: string
          id?: string
          status?: string | null
          submitted_at?: string | null
          submitter_email?: string | null
          submitter_id: string
          submitter_name?: string | null
          submitter_phone?: string | null
          submitter_type: string
          updated_at?: string | null
        }
        Update: {
          accountant_files?: string[] | null
          accountant_id?: string
          accountant_response?: string | null
          attachments?: string[] | null
          completed_at?: string | null
          form_data?: Json
          form_id?: string
          id?: string
          status?: string | null
          submitted_at?: string | null
          submitter_email?: string | null
          submitter_id?: string
          submitter_name?: string | null
          submitter_phone?: string | null
          submitter_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_accountant_id_fkey"
            columns: ["accountant_id"]
            isOneToOne: false
            referencedRelation: "accountants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "accountant_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_certificates: {
        Row: {
          certificate_id: string
          created_at: string | null
          id: string
          issue_date: string
          issued_by_admin_id: string | null
          issued_by_admin_name: string | null
          last_verified_at: string | null
          pdf_storage_path: string
          pdf_url: string
          qr_code_scans: number | null
          revoked_at: string | null
          revoked_reason: string | null
          status: string | null
          updated_at: string | null
          valid_until: string | null
          verification_reason: string
          worker_btw_sofi: string
          worker_full_name: string
          worker_id: string | null
          worker_kvk: string
          worker_specialization: string
        }
        Insert: {
          certificate_id: string
          created_at?: string | null
          id?: string
          issue_date?: string
          issued_by_admin_id?: string | null
          issued_by_admin_name?: string | null
          last_verified_at?: string | null
          pdf_storage_path: string
          pdf_url: string
          qr_code_scans?: number | null
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: string | null
          updated_at?: string | null
          valid_until?: string | null
          verification_reason: string
          worker_btw_sofi: string
          worker_full_name: string
          worker_id?: string | null
          worker_kvk: string
          worker_specialization: string
        }
        Update: {
          certificate_id?: string
          created_at?: string | null
          id?: string
          issue_date?: string
          issued_by_admin_id?: string | null
          issued_by_admin_name?: string | null
          last_verified_at?: string | null
          pdf_storage_path?: string
          pdf_url?: string
          qr_code_scans?: number | null
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: string | null
          updated_at?: string | null
          valid_until?: string | null
          verification_reason?: string
          worker_btw_sofi?: string
          worker_full_name?: string
          worker_id?: string | null
          worker_kvk?: string
          worker_specialization?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_certificates_issued_by_admin_id_fkey"
            columns: ["issued_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_certificates_issued_by_admin_id_fkey"
            columns: ["issued_by_admin_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_certificates_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_certificates_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_btw_declarations: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          input_vat: number | null
          notes: string | null
          output_vat_21: number | null
          output_vat_9: number | null
          paid_at: string | null
          quarter: string
          revenue_0: number | null
          revenue_21: number | null
          revenue_9: number | null
          revenue_eu: number | null
          revenue_export: number | null
          status: string | null
          submitted_at: string | null
          total_output_vat: number | null
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          input_vat?: number | null
          notes?: string | null
          output_vat_21?: number | null
          output_vat_9?: number | null
          paid_at?: string | null
          quarter: string
          revenue_0?: number | null
          revenue_21?: number | null
          revenue_9?: number | null
          revenue_eu?: number | null
          revenue_export?: number | null
          status?: string | null
          submitted_at?: string | null
          total_output_vat?: number | null
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          input_vat?: number | null
          notes?: string | null
          output_vat_21?: number | null
          output_vat_9?: number | null
          paid_at?: string | null
          quarter?: string
          revenue_0?: number | null
          revenue_21?: number | null
          revenue_9?: number | null
          revenue_eu?: number | null
          revenue_export?: number | null
          status?: string | null
          submitted_at?: string | null
          total_output_vat?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_btw_declarations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_btw_declarations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_clients: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          kvk_number: string | null
          name: string
          nip_number: string | null
          notes: string | null
          payment_term_days: number | null
          phone: string | null
          postal_code: string | null
          tax_id: string | null
          type: string
          updated_at: string | null
          user_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          kvk_number?: string | null
          name: string
          nip_number?: string | null
          notes?: string | null
          payment_term_days?: number | null
          phone?: string | null
          postal_code?: string | null
          tax_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          kvk_number?: string | null
          name?: string
          nip_number?: string | null
          notes?: string | null
          payment_term_days?: number | null
          phone?: string | null
          postal_code?: string | null
          tax_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_companies: {
        Row: {
          address: string | null
          bank_name: string | null
          bic: string | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          default_payment_term_days: number | null
          default_vat_rate: number | null
          email: string | null
          eori_number: string | null
          iban: string | null
          id: string
          kvk_number: string | null
          logo_base64: string | null
          logo_url: string | null
          mobile: string | null
          name: string
          phone: string | null
          postal_code: string | null
          updated_at: string | null
          user_id: string
          vat_number: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          bank_name?: string | null
          bic?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          default_payment_term_days?: number | null
          default_vat_rate?: number | null
          email?: string | null
          eori_number?: string | null
          iban?: string | null
          id?: string
          kvk_number?: string | null
          logo_base64?: string | null
          logo_url?: string | null
          mobile?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id: string
          vat_number?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          bank_name?: string | null
          bic?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          default_payment_term_days?: number | null
          default_vat_rate?: number | null
          email?: string | null
          eori_number?: string | null
          iban?: string | null
          id?: string
          kvk_number?: string | null
          logo_base64?: string | null
          logo_url?: string | null
          mobile?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id?: string
          vat_number?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_companies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_expenses: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          created_at: string | null
          date: string
          deductible_percentage: number | null
          description: string
          id: string
          invoice_id: string | null
          is_deductible: boolean | null
          is_paid: boolean | null
          notes: string | null
          payment_method: string | null
          receipt_base64: string | null
          receipt_url: string | null
          supplier: string | null
          updated_at: string | null
          user_id: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount?: number
          category: string
          client_id?: string | null
          created_at?: string | null
          date: string
          deductible_percentage?: number | null
          description: string
          id?: string
          invoice_id?: string | null
          is_deductible?: boolean | null
          is_paid?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_base64?: string | null
          receipt_url?: string | null
          supplier?: string | null
          updated_at?: string | null
          user_id: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          created_at?: string | null
          date?: string
          deductible_percentage?: number | null
          description?: string
          id?: string
          invoice_id?: string | null
          is_deductible?: boolean | null
          is_paid?: boolean | null
          notes?: string | null
          payment_method?: string | null
          receipt_base64?: string | null
          receipt_url?: string | null
          supplier?: string | null
          updated_at?: string | null
          user_id?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "invoice_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_expenses_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_invoice_lines: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          line_gross: number
          line_net: number
          line_number: number
          line_vat: number
          product_id: string | null
          quantity: number
          unit: string | null
          unit_price: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          line_gross?: number
          line_net?: number
          line_number: number
          line_vat?: number
          product_id?: string | null
          quantity?: number
          unit?: string | null
          unit_price?: number
          vat_rate?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          line_gross?: number
          line_net?: number
          line_number?: number
          line_vat?: number
          product_id?: string | null
          quantity?: number
          unit?: string | null
          unit_price?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_invoice_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "invoice_products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_invoices: {
        Row: {
          client_id: string | null
          client_snapshot: Json | null
          created_at: string | null
          due_date: string
          footer_text: string | null
          id: string
          invoice_date: string
          invoice_number: string
          is_reverse_charge: boolean | null
          language: string | null
          notes: string | null
          paid_amount: number | null
          payment_date: string | null
          payment_qr_payload: string | null
          payment_reference: string | null
          status: string | null
          template_name: string | null
          total_gross: number
          total_net: number
          total_vat: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          client_snapshot?: Json | null
          created_at?: string | null
          due_date: string
          footer_text?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          is_reverse_charge?: boolean | null
          language?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_qr_payload?: string | null
          payment_reference?: string | null
          status?: string | null
          template_name?: string | null
          total_gross?: number
          total_net?: number
          total_vat?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          client_snapshot?: Json | null
          created_at?: string | null
          due_date?: string
          footer_text?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          is_reverse_charge?: boolean | null
          language?: string | null
          notes?: string | null
          paid_amount?: number | null
          payment_date?: string | null
          payment_qr_payload?: string | null
          payment_reference?: string | null
          status?: string | null
          template_name?: string | null
          total_gross?: number
          total_net?: number
          total_vat?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "invoice_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_kilometer_entries: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string | null
          date: string
          end_location: string
          id: string
          is_private_vehicle: boolean | null
          kilometers: number
          notes: string | null
          project_id: string | null
          purpose: string
          rate: number
          start_location: string
          updated_at: string | null
          user_id: string
          vehicle_type: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string | null
          date: string
          end_location: string
          id?: string
          is_private_vehicle?: boolean | null
          kilometers: number
          notes?: string | null
          project_id?: string | null
          purpose: string
          rate: number
          start_location: string
          updated_at?: string | null
          user_id: string
          vehicle_type: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          date?: string
          end_location?: string
          id?: string
          is_private_vehicle?: boolean | null
          kilometers?: number
          notes?: string | null
          project_id?: string | null
          purpose?: string
          rate?: number
          start_location?: string
          updated_at?: string | null
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_kilometer_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "invoice_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_kilometer_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_kilometer_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_products: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          unit: string | null
          unit_price: number
          updated_at: string | null
          user_id: string
          vat_rate: number
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
          user_id: string
          vat_rate?: number
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          unit?: string | null
          unit_price?: number
          updated_at?: string | null
          user_id?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string | null
          cover_letter: string | null
          id: string
          job_id: string | null
          status: string | null
          updated_at: string | null
          worker_id: string | null
        }
        Insert: {
          applied_at?: string | null
          cover_letter?: string | null
          id?: string
          job_id?: string | null
          status?: string | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Update: {
          applied_at?: string | null
          cover_letter?: string | null
          id?: string
          job_id?: string | null
          status?: string | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string | null
          allow_messages: boolean | null
          application_url: string | null
          applications_count: number | null
          benefits: string[] | null
          category: string | null
          city: string | null
          company_logo_url: string | null
          contract_duration_months: number | null
          country: string | null
          created_at: string | null
          description: string
          education_level: string | null
          employer_id: string
          employment_type: string | null
          end_date: string | null
          experience_level: string | null
          expires_at: string | null
          featured: boolean | null
          filled_at: string | null
          hourly_rate: number | null
          hours_per_week: number | null
          id: string
          languages: string[] | null
          latitude: number | null
          location: string | null
          location_type: string | null
          longitude: number | null
          metadata: Json | null
          postal_code: string | null
          preferred_skills: string[] | null
          published_at: string | null
          required_certificates: string[] | null
          required_skills: string[] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          salary_period: string | null
          salary_visible: boolean | null
          short_description: string | null
          start_date: string | null
          status: string | null
          subcategory: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          urgent: boolean | null
          views_count: number | null
          worker_id: string | null
        }
        Insert: {
          address?: string | null
          allow_messages?: boolean | null
          application_url?: string | null
          applications_count?: number | null
          benefits?: string[] | null
          category?: string | null
          city?: string | null
          company_logo_url?: string | null
          contract_duration_months?: number | null
          country?: string | null
          created_at?: string | null
          description: string
          education_level?: string | null
          employer_id: string
          employment_type?: string | null
          end_date?: string | null
          experience_level?: string | null
          expires_at?: string | null
          featured?: boolean | null
          filled_at?: string | null
          hourly_rate?: number | null
          hours_per_week?: number | null
          id?: string
          languages?: string[] | null
          latitude?: number | null
          location?: string | null
          location_type?: string | null
          longitude?: number | null
          metadata?: Json | null
          postal_code?: string | null
          preferred_skills?: string[] | null
          published_at?: string | null
          required_certificates?: string[] | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          salary_visible?: boolean | null
          short_description?: string | null
          start_date?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          urgent?: boolean | null
          views_count?: number | null
          worker_id?: string | null
        }
        Update: {
          address?: string | null
          allow_messages?: boolean | null
          application_url?: string | null
          applications_count?: number | null
          benefits?: string[] | null
          category?: string | null
          city?: string | null
          company_logo_url?: string | null
          contract_duration_months?: number | null
          country?: string | null
          created_at?: string | null
          description?: string
          education_level?: string | null
          employer_id?: string
          employment_type?: string | null
          end_date?: string | null
          experience_level?: string | null
          expires_at?: string | null
          featured?: boolean | null
          filled_at?: string | null
          hourly_rate?: number | null
          hours_per_week?: number | null
          id?: string
          languages?: string[] | null
          latitude?: number | null
          location?: string | null
          location_type?: string | null
          longitude?: number | null
          metadata?: Json | null
          postal_code?: string | null
          preferred_skills?: string[] | null
          published_at?: string | null
          required_certificates?: string[] | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string | null
          salary_visible?: boolean | null
          short_description?: string | null
          start_date?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          urgent?: boolean | null
          views_count?: number | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_jobs_employer"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_jobs_employer"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          job_id: string | null
          location_data: Json | null
          message_type: string | null
          priority: string | null
          project_id: string | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          subject: string | null
          task_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          location_data?: Json | null
          message_type?: string | null
          priority?: string | null
          project_id?: string | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          subject?: string | null
          task_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          location_data?: Json | null
          message_type?: string | null
          priority?: string | null
          project_id?: string | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          priority: string | null
          read_at: string | null
          related_id: string | null
          sent_email: boolean | null
          sent_push: boolean | null
          sent_sms: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          priority?: string | null
          read_at?: string | null
          related_id?: string | null
          sent_email?: boolean | null
          sent_push?: boolean | null
          sent_sms?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          priority?: string | null
          read_at?: string | null
          related_id?: string | null
          sent_email?: boolean | null
          sent_push?: boolean | null
          sent_sms?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          description: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          invoice_generated: boolean | null
          invoice_number: string | null
          invoice_url: string | null
          metadata: Json | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_type: string
          profile_id: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          refunded_by: string | null
          related_earning_id: string | null
          related_invoice_id: string | null
          related_job_id: string | null
          related_subscription_id: string | null
          status: string
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          invoice_generated?: boolean | null
          invoice_number?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type: string
          profile_id?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          related_earning_id?: string | null
          related_invoice_id?: string | null
          related_job_id?: string | null
          related_subscription_id?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          invoice_generated?: boolean | null
          invoice_number?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string
          profile_id?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
          related_earning_id?: string | null
          related_invoice_id?: string | null
          related_job_id?: string | null
          related_subscription_id?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_refunded_by_fkey"
            columns: ["refunded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_refunded_by_fkey"
            columns: ["refunded_by"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_related_earning_id_fkey"
            columns: ["related_earning_id"]
            isOneToOne: false
            referencedRelation: "earnings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_related_subscription_id_fkey"
            columns: ["related_subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          profile_id: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          profile_id: string
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          profile_id?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          share_type: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          share_type?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          share_type?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          post_id: string
          user_agent: string | null
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          post_id: string
          user_agent?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          post_id?: string
          user_agent?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          author_type: string
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          job_category: string | null
          job_deadline: string | null
          job_location: string | null
          job_requirements: string[] | null
          job_salary_max: number | null
          job_salary_min: number | null
          likes_count: number | null
          media_types: string[] | null
          media_urls: string[] | null
          profile_id: string
          published_at: string | null
          shares_count: number | null
          title: string | null
          type: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id: string
          author_type: string
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          job_category?: string | null
          job_deadline?: string | null
          job_location?: string | null
          job_requirements?: string[] | null
          job_salary_max?: number | null
          job_salary_min?: number | null
          likes_count?: number | null
          media_types?: string[] | null
          media_urls?: string[] | null
          profile_id: string
          published_at?: string | null
          shares_count?: number | null
          title?: string | null
          type: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string
          author_type?: string
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          job_category?: string | null
          job_deadline?: string | null
          job_location?: string | null
          job_requirements?: string[] | null
          job_salary_max?: number | null
          job_salary_min?: number | null
          likes_count?: number | null
          media_types?: string[] | null
          media_urls?: string[] | null
          profile_id?: string
          published_at?: string | null
          shares_count?: number | null
          title?: string | null
          type?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          cleaning_company_id: string | null
          employer_id: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
          viewed_at: string | null
          worker_id: string | null
        }
        Insert: {
          cleaning_company_id?: string | null
          employer_id?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          viewed_at?: string | null
          worker_id?: string | null
        }
        Update: {
          cleaning_company_id?: string | null
          employer_id?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          viewed_at?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_cleaning_company_id_fkey"
            columns: ["cleaning_company_id"]
            isOneToOne: false
            referencedRelation: "cleaning_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      progress_reports: {
        Row: {
          created_at: string | null
          description: string
          estimated_completion_time: string | null
          id: string
          issues: string[] | null
          location_data: Json | null
          materials_used: Json | null
          next_steps: string | null
          photos_after: string[] | null
          photos_before: string[] | null
          progress_percentage: number
          project_id: string | null
          quality_check_passed: boolean | null
          quality_score: number | null
          reported_by: string
          supervisor_approval: Json | null
          task_id: string | null
          updated_at: string | null
          weather_conditions: Json | null
          workers_present: string[] | null
        }
        Insert: {
          created_at?: string | null
          description: string
          estimated_completion_time?: string | null
          id?: string
          issues?: string[] | null
          location_data?: Json | null
          materials_used?: Json | null
          next_steps?: string | null
          photos_after?: string[] | null
          photos_before?: string[] | null
          progress_percentage: number
          project_id?: string | null
          quality_check_passed?: boolean | null
          quality_score?: number | null
          reported_by: string
          supervisor_approval?: Json | null
          task_id?: string | null
          updated_at?: string | null
          weather_conditions?: Json | null
          workers_present?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string
          estimated_completion_time?: string | null
          id?: string
          issues?: string[] | null
          location_data?: Json | null
          materials_used?: Json | null
          next_steps?: string | null
          photos_after?: string[] | null
          photos_before?: string[] | null
          progress_percentage?: number
          project_id?: string | null
          quality_check_passed?: boolean | null
          quality_score?: number | null
          reported_by?: string
          supervisor_approval?: Json | null
          task_id?: string | null
          updated_at?: string | null
          weather_conditions?: Json | null
          workers_present?: string[] | null
        }
        Relationships: []
      }
      project_activity_log: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          changes_after: Json | null
          changes_before: Json | null
          created_at: string
          description: string | null
          details: Json | null
          id: string
          ip_address: unknown
          project_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          changes_after?: Json | null
          changes_before?: Json | null
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          project_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          changes_after?: Json | null
          changes_before?: Json | null
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          project_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_chat_groups: {
        Row: {
          auto_join_roles: string[] | null
          color: string | null
          created_at: string | null
          created_by: string
          description: string | null
          group_type: string | null
          icon: string | null
          id: string
          location_zone: string | null
          members: string[] | null
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_join_roles?: string[] | null
          color?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          group_type?: string | null
          icon?: string | null
          id?: string
          location_zone?: string | null
          members?: string[] | null
          name: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_join_roles?: string[] | null
          color?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          group_type?: string | null
          icon?: string | null
          id?: string
          location_zone?: string | null
          members?: string[] | null
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_chat_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          is_pinned: boolean | null
          mentions: string[] | null
          message: string
          message_type: string | null
          parent_message_id: string | null
          project_id: string
          reactions: Json | null
          thread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          message: string
          message_type?: string | null
          parent_message_id?: string | null
          project_id: string
          reactions?: Json | null
          thread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          message?: string
          message_type?: string | null
          parent_message_id?: string | null
          project_id?: string
          reactions?: Json | null
          thread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_chat_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "project_chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_cleaning_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          company_id: string
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          company_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          company_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_cleaning_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_cleaning_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_cleaning_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "cleaning_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_cleaning_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "communication_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_communication_rooms: {
        Row: {
          allowed_members: Json | null
          banned_members: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_archived: boolean | null
          is_public: boolean | null
          max_members: number | null
          name: string
          project_id: string
          room_type: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_members?: Json | null
          banned_members?: Json | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          max_members?: number | null
          name: string
          project_id: string
          room_type?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_members?: Json | null
          banned_members?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_public?: boolean | null
          max_members?: number | null
          name?: string
          project_id?: string
          room_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_communication_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "communication_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_events: {
        Row: {
          agenda: string | null
          all_day: boolean | null
          color_hex: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          custom_fields: Json | null
          deleted_at: string | null
          description: string | null
          end_date: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_all_day: boolean | null
          is_online: boolean | null
          is_recurring: boolean | null
          location: string | null
          location_address: string | null
          location_geo_lat: number | null
          location_geo_lng: number | null
          location_type: string | null
          meeting_notes: string | null
          meeting_recording_url: string | null
          meeting_url: string | null
          organized_by: string
          parent_event_id: string | null
          project_id: string
          recurrence_end_date: string | null
          recurrence_exception_dates: Json | null
          recurrence_pattern: Json | null
          recurrence_rule: string | null
          related_task_id: string | null
          reminder_minutes: number[] | null
          reminder_minutes_before: number | null
          requires_confirmation: boolean | null
          send_reminders: boolean | null
          start_date: string
          status: Database["public"]["Enums"]["event_status"] | null
          tags: string[] | null
          timezone: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agenda?: string | null
          all_day?: boolean | null
          color_hex?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_all_day?: boolean | null
          is_online?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          location_address?: string | null
          location_geo_lat?: number | null
          location_geo_lng?: number | null
          location_type?: string | null
          meeting_notes?: string | null
          meeting_recording_url?: string | null
          meeting_url?: string | null
          organized_by: string
          parent_event_id?: string | null
          project_id: string
          recurrence_end_date?: string | null
          recurrence_exception_dates?: Json | null
          recurrence_pattern?: Json | null
          recurrence_rule?: string | null
          related_task_id?: string | null
          reminder_minutes?: number[] | null
          reminder_minutes_before?: number | null
          requires_confirmation?: boolean | null
          send_reminders?: boolean | null
          start_date: string
          status?: Database["public"]["Enums"]["event_status"] | null
          tags?: string[] | null
          timezone?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agenda?: string | null
          all_day?: boolean | null
          color_hex?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          custom_fields?: Json | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_all_day?: boolean | null
          is_online?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          location_address?: string | null
          location_geo_lat?: number | null
          location_geo_lng?: number | null
          location_type?: string | null
          meeting_notes?: string | null
          meeting_recording_url?: string | null
          meeting_url?: string | null
          organized_by?: string
          parent_event_id?: string | null
          project_id?: string
          recurrence_end_date?: string | null
          recurrence_exception_dates?: Json | null
          recurrence_pattern?: Json | null
          recurrence_rule?: string | null
          related_task_id?: string | null
          reminder_minutes?: number[] | null
          reminder_minutes_before?: number | null
          requires_confirmation?: boolean | null
          send_reminders?: boolean | null
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"] | null
          tags?: string[] | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "project_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "communication_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_events_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_events_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invitations: {
        Row: {
          created_at: string
          expires_at: string
          granted_permissions: Database["public"]["Enums"]["permission_scope"][]
          id: string
          invitation_token: string
          invited_by: string
          invited_email: string
          invited_user_id: string | null
          personal_message: string | null
          project_id: string
          responded_at: string | null
          role_title: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          granted_permissions?: Database["public"]["Enums"]["permission_scope"][]
          id?: string
          invitation_token?: string
          invited_by: string
          invited_email: string
          invited_user_id?: string | null
          personal_message?: string | null
          project_id: string
          responded_at?: string | null
          role_title?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          granted_permissions?: Database["public"]["Enums"]["permission_scope"][]
          id?: string
          invitation_token?: string
          invited_by?: string
          invited_email?: string
          invited_user_id?: string | null
          personal_message?: string | null
          project_id?: string
          responded_at?: string | null
          role_title?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_invites: {
        Row: {
          accepted_at: string | null
          can_invite: boolean | null
          can_manage_project: boolean | null
          can_view_reports: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          invite_message: string | null
          invite_token: string | null
          invitee_email: string
          invitee_id: string | null
          inviter_id: string
          metadata: Json | null
          project_id: string
          rejected_at: string | null
          role: string
          status: Database["public"]["Enums"]["invite_status"]
        }
        Insert: {
          accepted_at?: string | null
          can_invite?: boolean | null
          can_manage_project?: boolean | null
          can_view_reports?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_message?: string | null
          invite_token?: string | null
          invitee_email: string
          invitee_id?: string | null
          inviter_id: string
          metadata?: Json | null
          project_id: string
          rejected_at?: string | null
          role?: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Update: {
          accepted_at?: string | null
          can_invite?: boolean | null
          can_manage_project?: boolean | null
          can_view_reports?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_message?: string | null
          invite_token?: string | null
          invitee_email?: string
          invitee_id?: string | null
          inviter_id?: string
          metadata?: Json | null
          project_id?: string
          rejected_at?: string | null
          role?: string
          status?: Database["public"]["Enums"]["invite_status"]
        }
        Relationships: [
          {
            foreignKeyName: "project_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "communication_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_kpi_snapshots: {
        Row: {
          avg_completion_time_hours: number | null
          blocked_tasks: number | null
          budget_used_percentage: number | null
          client_satisfaction_score: number | null
          completed_tasks: number | null
          created_at: string | null
          id: string
          in_progress_tasks: number | null
          metadata: Json | null
          overdue_tasks: number | null
          project_id: string
          snapshot_date: string
          team_utilization_percentage: number | null
          total_tasks: number | null
        }
        Insert: {
          avg_completion_time_hours?: number | null
          blocked_tasks?: number | null
          budget_used_percentage?: number | null
          client_satisfaction_score?: number | null
          completed_tasks?: number | null
          created_at?: string | null
          id?: string
          in_progress_tasks?: number | null
          metadata?: Json | null
          overdue_tasks?: number | null
          project_id: string
          snapshot_date: string
          team_utilization_percentage?: number | null
          total_tasks?: number | null
        }
        Update: {
          avg_completion_time_hours?: number | null
          blocked_tasks?: number | null
          budget_used_percentage?: number | null
          client_satisfaction_score?: number | null
          completed_tasks?: number | null
          created_at?: string | null
          id?: string
          in_progress_tasks?: number | null
          metadata?: Json | null
          overdue_tasks?: number | null
          project_id?: string
          snapshot_date?: string
          team_utilization_percentage?: number | null
          total_tasks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_kpi_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          accountant_id: string | null
          avatar_url: string | null
          can_invite: boolean | null
          can_manage_project: boolean | null
          can_view_reports: boolean | null
          display_name: string | null
          id: string
          joined_at: string | null
          last_active: string | null
          profile_id: string | null
          project_id: string
          role: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          accountant_id?: string | null
          avatar_url?: string | null
          can_invite?: boolean | null
          can_manage_project?: boolean | null
          can_view_reports?: boolean | null
          display_name?: string | null
          id?: string
          joined_at?: string | null
          last_active?: string | null
          profile_id?: string | null
          project_id: string
          role?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          accountant_id?: string | null
          avatar_url?: string | null
          can_invite?: boolean | null
          can_manage_project?: boolean | null
          can_view_reports?: boolean | null
          display_name?: string | null
          id?: string
          joined_at?: string | null
          last_active?: string | null
          profile_id?: string | null
          project_id?: string
          role?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_members_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_members_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_accountant_id_fkey"
            columns: ["accountant_id"]
            isOneToOne: false
            referencedRelation: "accountants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "communication_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachment_data: Json | null
          created_at: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean | null
          location_data: Json | null
          message: string
          message_type: string | null
          pinned_at: string | null
          pinned_by: string | null
          priority: string | null
          project_id: string | null
          reactions: Json | null
          reply_to_id: string | null
          requires_approval: boolean | null
          sender_id: string
          status: string | null
          task_id: string | null
          thread_messages: string[] | null
          updated_at: string | null
          voice_note_data: Json | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_data?: Json | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          location_data?: Json | null
          message: string
          message_type?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          priority?: string | null
          project_id?: string | null
          reactions?: Json | null
          reply_to_id?: string | null
          requires_approval?: boolean | null
          sender_id: string
          status?: string | null
          task_id?: string | null
          thread_messages?: string[] | null
          updated_at?: string | null
          voice_note_data?: Json | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_data?: Json | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          location_data?: Json | null
          message?: string
          message_type?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          priority?: string | null
          project_id?: string | null
          reactions?: Json | null
          reply_to_id?: string | null
          requires_approval?: boolean | null
          sender_id?: string
          status?: string | null
          task_id?: string | null
          thread_messages?: string[] | null
          updated_at?: string | null
          voice_note_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "project_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          data: Json | null
          id: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority: number | null
          project_id: string | null
          read_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          priority?: number | null
          project_id?: string | null
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          priority?: number | null
          project_id?: string | null
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_permissions: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string
          id: string
          is_active: boolean
          last_modified_at: string | null
          last_modified_by: string | null
          permissions: Database["public"]["Enums"]["permission_scope"][]
          project_id: string
          role_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by: string
          id?: string
          is_active?: boolean
          last_modified_at?: string | null
          last_modified_by?: string | null
          permissions?: Database["public"]["Enums"]["permission_scope"][]
          project_id: string
          role_title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string
          id?: string
          is_active?: boolean
          last_modified_at?: string | null
          last_modified_by?: string | null
          permissions?: Database["public"]["Enums"]["permission_scope"][]
          project_id?: string
          role_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_permissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          created_at: string | null
          current_location: string | null
          description: string | null
          id: string
          is_available: boolean | null
          metadata: Json | null
          name: string
          owner_user_id: string | null
          project_id: string | null
          resource_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_location?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          metadata?: Json | null
          name: string
          owner_user_id?: string | null
          project_id?: string | null
          resource_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_location?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          metadata?: Json | null
          name?: string
          owner_user_id?: string | null
          project_id?: string | null
          resource_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          after_photos: Json | null
          area_m2: number | null
          assigned_to: string | null
          before_photos: Json | null
          building_address: string | null
          calculated_cost: number | null
          checklist: Json | null
          client_order_number: string | null
          client_signature_url: string | null
          client_signed_at: string | null
          color_paint: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          deleted_at: string | null
          depends_on: string[] | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          geo_lat: number | null
          geo_lng: number | null
          geo_timestamp: string | null
          hourly_rate: number | null
          id: string
          is_recurring: boolean | null
          is_subtask: boolean | null
          is_template: boolean | null
          materials: Json | null
          parent_task_id: string | null
          photo_proof_url: string | null
          photos: Json | null
          position: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          progress_percentage: number | null
          project_id: string
          recurrence_interval: number | null
          recurrence_pattern: string | null
          requires_photo_proof: boolean | null
          risk_level: string | null
          room_floor: string | null
          sla_hours: number | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          template_category: string | null
          template_name: string | null
          title: string
          updated_at: string | null
          voice_note_transcription: string | null
          voice_note_url: string | null
        }
        Insert: {
          actual_hours?: number | null
          after_photos?: Json | null
          area_m2?: number | null
          assigned_to?: string | null
          before_photos?: Json | null
          building_address?: string | null
          calculated_cost?: number | null
          checklist?: Json | null
          client_order_number?: string | null
          client_signature_url?: string | null
          client_signed_at?: string | null
          color_paint?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          depends_on?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          geo_lat?: number | null
          geo_lng?: number | null
          geo_timestamp?: string | null
          hourly_rate?: number | null
          id?: string
          is_recurring?: boolean | null
          is_subtask?: boolean | null
          is_template?: boolean | null
          materials?: Json | null
          parent_task_id?: string | null
          photo_proof_url?: string | null
          photos?: Json | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress_percentage?: number | null
          project_id: string
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          requires_photo_proof?: boolean | null
          risk_level?: string | null
          room_floor?: string | null
          sla_hours?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          template_category?: string | null
          template_name?: string | null
          title: string
          updated_at?: string | null
          voice_note_transcription?: string | null
          voice_note_url?: string | null
        }
        Update: {
          actual_hours?: number | null
          after_photos?: Json | null
          area_m2?: number | null
          assigned_to?: string | null
          before_photos?: Json | null
          building_address?: string | null
          calculated_cost?: number | null
          checklist?: Json | null
          client_order_number?: string | null
          client_signature_url?: string | null
          client_signed_at?: string | null
          color_paint?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          depends_on?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          geo_lat?: number | null
          geo_lng?: number | null
          geo_timestamp?: string | null
          hourly_rate?: number | null
          id?: string
          is_recurring?: boolean | null
          is_subtask?: boolean | null
          is_template?: boolean | null
          materials?: Json | null
          parent_task_id?: string | null
          photo_proof_url?: string | null
          photos?: Json | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress_percentage?: number | null
          project_id?: string
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          requires_photo_proof?: boolean | null
          risk_level?: string | null
          room_floor?: string | null
          sla_hours?: number | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          template_category?: string | null
          template_name?: string | null
          title?: string
          updated_at?: string | null
          voice_note_transcription?: string | null
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "communication_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          default_events: Json | null
          default_roles: Json | null
          default_tasks: Json | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          template_config: Json
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_events?: Json | null
          default_roles?: Json | null
          default_tasks?: Json | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          template_config?: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_events?: Json | null
          default_roles?: Json | null
          default_tasks?: Json | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          template_config?: Json
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      project_webhooks: {
        Row: {
          created_at: string | null
          event_types: string[] | null
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_response_status: number | null
          last_triggered_at: string | null
          name: string
          project_id: string
          secret_key: string | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          event_types?: string[] | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_response_status?: number | null
          last_triggered_at?: string | null
          name: string
          project_id: string
          secret_key?: string | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          event_types?: string[] | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_response_status?: number | null
          last_triggered_at?: string | null
          name?: string
          project_id?: string
          secret_key?: string | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_webhooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_total: number | null
          budget_used: number | null
          client_contact: string | null
          client_name: string | null
          created_at: string
          deadline: string | null
          description: string | null
          end_date: string | null
          id: string
          owner_id: string
          project_address: string | null
          project_manager_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_total?: number | null
          budget_used?: number | null
          client_contact?: string | null
          client_name?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          owner_id: string
          project_address?: string | null
          project_manager_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_total?: number | null
          budget_used?: number | null
          client_contact?: string | null
          client_name?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          owner_id?: string
          project_address?: string | null
          project_manager_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_bookings: {
        Row: {
          booked_by: string
          created_at: string | null
          end_time: string
          event_id: string | null
          id: string
          purpose: string | null
          resource_id: string
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booked_by: string
          created_at?: string | null
          end_time: string
          event_id?: string | null
          id?: string
          purpose?: string | null
          resource_id: string
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booked_by?: string
          created_at?: string | null
          end_time?: string
          event_id?: string | null
          id?: string
          purpose?: string | null
          resource_id?: string
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "project_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_bookings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "project_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved_at: string | null
          comment: string | null
          communication_rating: number | null
          created_at: string | null
          employer_id: string | null
          id: string
          job_id: string | null
          job_title: string | null
          photos: string[] | null
          punctuality_rating: number | null
          quality_rating: number | null
          rating: number
          response: string | null
          response_date: string | null
          reviewed_by_admin: string | null
          reviewee_id: string
          reviewer_id: string
          safety_rating: number | null
          status: string | null
          updated_at: string | null
          verified_by_platform: boolean | null
          worker_id: string | null
          would_recommend: boolean | null
        }
        Insert: {
          approved_at?: string | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          employer_id?: string | null
          id?: string
          job_id?: string | null
          job_title?: string | null
          photos?: string[] | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating: number
          response?: string | null
          response_date?: string | null
          reviewed_by_admin?: string | null
          reviewee_id: string
          reviewer_id: string
          safety_rating?: number | null
          status?: string | null
          updated_at?: string | null
          verified_by_platform?: boolean | null
          worker_id?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          approved_at?: string | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          employer_id?: string | null
          id?: string
          job_id?: string | null
          job_title?: string | null
          photos?: string[] | null
          punctuality_rating?: number | null
          quality_rating?: number | null
          rating?: number
          response?: string | null
          response_date?: string | null
          reviewed_by_admin?: string | null
          reviewee_id?: string
          reviewer_id?: string
          safety_rating?: number | null
          status?: string | null
          updated_at?: string | null
          verified_by_platform?: boolean | null
          worker_id?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "v_employers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_by_admin_fkey"
            columns: ["reviewed_by_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_by_admin_fkey"
            columns: ["reviewed_by_admin"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_alerts: {
        Row: {
          alert_type: string
          assigned_to: string[] | null
          created_at: string | null
          description: string
          emergency_services_contacted: boolean | null
          equipment_involved: string[] | null
          follow_up_required: boolean | null
          id: string
          immediate_action: string | null
          incident_number: string | null
          injuries_reported: boolean | null
          location_data: Json
          photos: string[] | null
          preventive_measures: string[] | null
          project_id: string | null
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string | null
          updated_at: string | null
          witnesses_present: string[] | null
        }
        Insert: {
          alert_type: string
          assigned_to?: string[] | null
          created_at?: string | null
          description: string
          emergency_services_contacted?: boolean | null
          equipment_involved?: string[] | null
          follow_up_required?: boolean | null
          id?: string
          immediate_action?: string | null
          incident_number?: string | null
          injuries_reported?: boolean | null
          location_data: Json
          photos?: string[] | null
          preventive_measures?: string[] | null
          project_id?: string | null
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          status?: string | null
          updated_at?: string | null
          witnesses_present?: string[] | null
        }
        Update: {
          alert_type?: string
          assigned_to?: string[] | null
          created_at?: string | null
          description?: string
          emergency_services_contacted?: boolean | null
          equipment_involved?: string[] | null
          follow_up_required?: boolean | null
          id?: string
          immediate_action?: string | null
          incident_number?: string | null
          injuries_reported?: boolean | null
          location_data?: Json
          photos?: string[] | null
          preventive_measures?: string[] | null
          project_id?: string | null
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          updated_at?: string | null
          witnesses_present?: string[] | null
        }
        Relationships: []
      }
      saved_workers: {
        Row: {
          created_at: string | null
          employer_id: string
          id: string
          notes: string | null
          saved_at: string | null
          tags: string[] | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string | null
          employer_id: string
          id?: string
          notes?: string | null
          saved_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string | null
          employer_id?: string
          id?: string
          notes?: string | null
          saved_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_workers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_workers_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          category: string | null
          created_at: string | null
          employer_id: string
          filters: Json | null
          id: string
          level: string | null
          location: string | null
          postal_code: string | null
          radius_km: number | null
          results_count: number | null
          search_date: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          employer_id: string
          filters?: Json | null
          id?: string
          level?: string | null
          location?: string | null
          postal_code?: string | null
          radius_km?: number | null
          results_count?: number | null
          search_date?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          employer_id?: string
          filters?: Json | null
          id?: string
          level?: string | null
          location?: string | null
          postal_code?: string | null
          radius_km?: number | null
          results_count?: number | null
          search_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          auto_renew: boolean | null
          created_at: string | null
          currency: string | null
          employer_id: string
          end_date: string | null
          id: string
          payment_id: string | null
          plan: string
          start_date: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          auto_renew?: boolean | null
          created_at?: string | null
          currency?: string | null
          employer_id: string
          end_date?: string | null
          id?: string
          payment_id?: string | null
          plan: string
          start_date?: string
          status: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          auto_renew?: boolean | null
          created_at?: string | null
          currency?: string | null
          employer_id?: string
          end_date?: string | null
          id?: string
          payment_id?: string | null
          plan?: string
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          file_name: string
          file_size: number
          file_type: string | null
          id: string
          storage_path: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name: string
          file_size: number
          file_type?: string | null
          id?: string
          storage_path: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number
          file_type?: string | null
          id?: string
          storage_path?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklists: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          item_text: string
          proof_url: string | null
          requires_proof: boolean | null
          sort_order: number | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text: string
          proof_url?: string | null
          requires_proof?: boolean | null
          sort_order?: number | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          item_text?: string
          proof_url?: string | null
          requires_proof?: boolean | null
          sort_order?: number | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_checklists_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_checklists_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          parent_comment_id: string | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          parent_comment_id?: string | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          parent_comment_id?: string | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string | null
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          created_at: string | null
          id: string
          tag_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "project_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      team_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          notes: string | null
          project_id: string | null
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          project_id?: string | null
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          project_id?: string | null
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_availability_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_appointments: {
        Row: {
          appointment_type: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          capacity: number | null
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          examiner_name: string | null
          id: string
          location: string | null
          notes: string | null
          passed: boolean | null
          priority: string | null
          reminder_email: boolean | null
          reminder_sms: boolean | null
          result: string | null
          scheduled_by: string | null
          score: number | null
          service_type: string | null
          status: string
          test_date: string
          test_type: string | null
          updated_at: string | null
          video_call_join_url: string | null
          video_call_meeting_id: string | null
          video_call_password: string | null
          video_call_provider: string | null
          worker_id: string | null
        }
        Insert: {
          appointment_type?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          capacity?: number | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          examiner_name?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          passed?: boolean | null
          priority?: string | null
          reminder_email?: boolean | null
          reminder_sms?: boolean | null
          result?: string | null
          scheduled_by?: string | null
          score?: number | null
          service_type?: string | null
          status?: string
          test_date: string
          test_type?: string | null
          updated_at?: string | null
          video_call_join_url?: string | null
          video_call_meeting_id?: string | null
          video_call_password?: string | null
          video_call_provider?: string | null
          worker_id?: string | null
        }
        Update: {
          appointment_type?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          capacity?: number | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          examiner_name?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          passed?: boolean | null
          priority?: string | null
          reminder_email?: boolean | null
          reminder_sms?: boolean | null
          result?: string | null
          scheduled_by?: string | null
          score?: number | null
          service_type?: string | null
          status?: string
          test_date?: string
          test_type?: string | null
          updated_at?: string | null
          video_call_join_url?: string | null
          video_call_meeting_id?: string | null
          video_call_password?: string | null
          video_call_provider?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_appointments_scheduled_by_fkey"
            columns: ["scheduled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_appointments_scheduled_by_fkey"
            columns: ["scheduled_by"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_appointments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_appointments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      unavailable_dates: {
        Row: {
          created_at: string
          date: string
          id: string
          profile_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          profile_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          profile_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unavailable_dates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unavailable_dates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_availability: {
        Row: {
          available: boolean | null
          booking_job_id: string | null
          created_at: string | null
          date: string
          day_of_week: number | null
          end_time: string | null
          id: string
          is_booked: boolean | null
          start_time: string | null
          worker_id: string
        }
        Insert: {
          available?: boolean | null
          booking_job_id?: string | null
          created_at?: string | null
          date: string
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_booked?: boolean | null
          start_time?: string | null
          worker_id: string
        }
        Update: {
          available?: boolean | null
          booking_job_id?: string | null
          created_at?: string | null
          date?: string
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          is_booked?: boolean | null
          start_time?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_availability_booking_job_id_fkey"
            columns: ["booking_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_availability_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_availability_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_portfolio: {
        Row: {
          category: string | null
          client_company: string | null
          client_name: string | null
          created_at: string | null
          description: string | null
          duration_days: number | null
          end_date: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          is_public: boolean | null
          project_url: string | null
          start_date: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
          worker_id: string
        }
        Insert: {
          category?: string | null
          client_company?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_public?: boolean | null
          project_url?: string | null
          start_date?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          worker_id: string
        }
        Update: {
          category?: string | null
          client_company?: string | null
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_public?: boolean | null
          project_url?: string | null
          start_date?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_portfolio_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_portfolio_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_skills: {
        Row: {
          created_at: string | null
          id: string
          proficiency: number | null
          proficiency_level: string | null
          skill_name: string
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
          worker_id: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          proficiency?: number | null
          proficiency_level?: string | null
          skill_name: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          worker_id: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          proficiency?: number | null
          proficiency_level?: string | null
          skill_name?: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
          worker_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_skills_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_skills_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          address: string | null
          approved_categories: string[] | null
          availability: Json | null
          available: boolean | null
          available_from: string | null
          avatar_url: string | null
          bio: string | null
          btw_number: string | null
          certificate_issued_at: string | null
          certificate_status: string | null
          certifications: string[] | null
          completed_jobs: number | null
          cover_image_url: string | null
          created_at: string | null
          email_notifications: boolean | null
          experience_years: number | null
          hourly_rate: number | null
          hourly_rate_max: number | null
          id: string
          is_available: boolean | null
          is_available_now: boolean | null
          is_on_demand_available: boolean | null
          kvk_number: string | null
          languages: string[] | null
          last_active: string | null
          last_payment_date: string | null
          latitude: number | null
          location_city: string | null
          location_country: string | null
          location_postal_code: string | null
          longitude: number | null
          monthly_fee: number | null
          own_tools: string[] | null
          own_vehicle: boolean | null
          phone: string | null
          portfolio_images: Json | null
          postal_code: string | null
          preferred_days_per_week: number | null
          profile_id: string
          profile_views: number | null
          profile_visibility: string | null
          push_notifications: boolean | null
          radius_km: number | null
          rate_negotiable: boolean | null
          rating: number | null
          rating_count: number | null
          response_rate: number | null
          response_time: string | null
          service_radius_km: number | null
          show_email: boolean | null
          show_location: boolean | null
          show_phone: boolean | null
          skills: string[] | null
          sms_notifications: boolean | null
          specialization: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          team_description: string | null
          team_hourly_rate: number | null
          team_size: number | null
          total_earnings: number | null
          total_jobs_completed: number | null
          unavailable_dates: Json | null
          updated_at: string | null
          user_id: string | null
          vehicle_type: string | null
          verified: boolean | null
          worker_type: string | null
          years_experience: number | null
          zzp_certificate_date: string | null
          zzp_certificate_expires_at: string | null
          zzp_certificate_issued: boolean | null
          zzp_certificate_number: string | null
        }
        Insert: {
          address?: string | null
          approved_categories?: string[] | null
          availability?: Json | null
          available?: boolean | null
          available_from?: string | null
          avatar_url?: string | null
          bio?: string | null
          btw_number?: string | null
          certificate_issued_at?: string | null
          certificate_status?: string | null
          certifications?: string[] | null
          completed_jobs?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          experience_years?: number | null
          hourly_rate?: number | null
          hourly_rate_max?: number | null
          id?: string
          is_available?: boolean | null
          is_available_now?: boolean | null
          is_on_demand_available?: boolean | null
          kvk_number?: string | null
          languages?: string[] | null
          last_active?: string | null
          last_payment_date?: string | null
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_postal_code?: string | null
          longitude?: number | null
          monthly_fee?: number | null
          own_tools?: string[] | null
          own_vehicle?: boolean | null
          phone?: string | null
          portfolio_images?: Json | null
          postal_code?: string | null
          preferred_days_per_week?: number | null
          profile_id: string
          profile_views?: number | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          radius_km?: number | null
          rate_negotiable?: boolean | null
          rating?: number | null
          rating_count?: number | null
          response_rate?: number | null
          response_time?: string | null
          service_radius_km?: number | null
          show_email?: boolean | null
          show_location?: boolean | null
          show_phone?: boolean | null
          skills?: string[] | null
          sms_notifications?: boolean | null
          specialization?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          team_description?: string | null
          team_hourly_rate?: number | null
          team_size?: number | null
          total_earnings?: number | null
          total_jobs_completed?: number | null
          unavailable_dates?: Json | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          verified?: boolean | null
          worker_type?: string | null
          years_experience?: number | null
          zzp_certificate_date?: string | null
          zzp_certificate_expires_at?: string | null
          zzp_certificate_issued?: boolean | null
          zzp_certificate_number?: string | null
        }
        Update: {
          address?: string | null
          approved_categories?: string[] | null
          availability?: Json | null
          available?: boolean | null
          available_from?: string | null
          avatar_url?: string | null
          bio?: string | null
          btw_number?: string | null
          certificate_issued_at?: string | null
          certificate_status?: string | null
          certifications?: string[] | null
          completed_jobs?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          experience_years?: number | null
          hourly_rate?: number | null
          hourly_rate_max?: number | null
          id?: string
          is_available?: boolean | null
          is_available_now?: boolean | null
          is_on_demand_available?: boolean | null
          kvk_number?: string | null
          languages?: string[] | null
          last_active?: string | null
          last_payment_date?: string | null
          latitude?: number | null
          location_city?: string | null
          location_country?: string | null
          location_postal_code?: string | null
          longitude?: number | null
          monthly_fee?: number | null
          own_tools?: string[] | null
          own_vehicle?: boolean | null
          phone?: string | null
          portfolio_images?: Json | null
          postal_code?: string | null
          preferred_days_per_week?: number | null
          profile_id?: string
          profile_views?: number | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          radius_km?: number | null
          rate_negotiable?: boolean | null
          rating?: number | null
          rating_count?: number | null
          response_rate?: number | null
          response_time?: string | null
          service_radius_km?: number | null
          show_email?: boolean | null
          show_location?: boolean | null
          show_phone?: boolean | null
          skills?: string[] | null
          sms_notifications?: boolean | null
          specialization?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          team_description?: string | null
          team_hourly_rate?: number | null
          team_size?: number | null
          total_earnings?: number | null
          total_jobs_completed?: number | null
          unavailable_dates?: Json | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          verified?: boolean | null
          worker_type?: string | null
          years_experience?: number | null
          zzp_certificate_date?: string | null
          zzp_certificate_expires_at?: string | null
          zzp_certificate_issued?: boolean | null
          zzp_certificate_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zzp_exam_applications: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          certificate_number: string | null
          created_at: string | null
          documents: Json | null
          email: string
          full_name: string
          id: string
          phone: string | null
          rejection_reason: string | null
          specializations: string[]
          status: string
          test_date: string | null
          test_score: number | null
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          certificate_number?: string | null
          created_at?: string | null
          documents?: Json | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          rejection_reason?: string | null
          specializations?: string[]
          status?: string
          test_date?: string | null
          test_score?: number | null
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          certificate_number?: string | null
          created_at?: string | null
          documents?: Json | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          rejection_reason?: string | null
          specializations?: string[]
          status?: string
          test_date?: string | null
          test_score?: number | null
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zzp_exam_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zzp_exam_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zzp_exam_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "v_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zzp_exam_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      task_templates: {
        Row: {
          calculated_cost: number | null
          checklist: Json | null
          created_at: string | null
          description: string | null
          estimated_hours: number | null
          hourly_rate: number | null
          id: string | null
          materials: Json | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          template_category: string | null
          template_name: string | null
          updated_at: string | null
        }
        Insert: {
          calculated_cost?: number | null
          checklist?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string | null
          materials?: Json | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          template_category?: string | null
          template_name?: string | null
          updated_at?: string | null
        }
        Update: {
          calculated_cost?: number | null
          checklist?: Json | null
          created_at?: string | null
          description?: string | null
          estimated_hours?: number | null
          hourly_rate?: number | null
          id?: string | null
          materials?: Json | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          template_category?: string | null
          template_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_employers: {
        Row: {
          company_name: string | null
          created_at: string | null
          id: string | null
          kvk_number: string | null
          profile_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          kvk_number?: string | null
          profile_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          id?: string | null
          kvk_number?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          role?: string | null
        }
        Relationships: []
      }
      v_workers: {
        Row: {
          address: string | null
          available: boolean | null
          available_from: string | null
          avatar_url: string | null
          bio: string | null
          btw_number: string | null
          certifications: string[] | null
          created_at: string | null
          email: string | null
          email_notifications: boolean | null
          experience_years: number | null
          full_name: string | null
          hourly_rate: number | null
          hourly_rate_max: number | null
          id: string | null
          is_available_now: boolean | null
          is_on_demand_available: boolean | null
          kvk_number: string | null
          languages: string[] | null
          last_active: string | null
          last_payment_date: string | null
          latitude: number | null
          location_city: string | null
          location_country: string | null
          location_postal_code: string | null
          longitude: number | null
          monthly_fee: number | null
          own_tools: string[] | null
          own_vehicle: boolean | null
          postal_code: string | null
          profile_id: string | null
          profile_phone: string | null
          profile_views: number | null
          profile_visibility: string | null
          push_notifications: boolean | null
          radius_km: number | null
          rating: number | null
          rating_count: number | null
          response_time: string | null
          show_email: boolean | null
          show_location: boolean | null
          show_phone: boolean | null
          skills: string[] | null
          sms_notifications: boolean | null
          specialization: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          team_description: string | null
          team_hourly_rate: number | null
          team_size: number | null
          total_jobs_completed: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_type: string | null
          verified: boolean | null
          worker_phone: string | null
          worker_type: string | null
          years_experience: number | null
          zzp_certificate_date: string | null
          zzp_certificate_expires_at: string | null
          zzp_certificate_issued: boolean | null
          zzp_certificate_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_materials_cost:
        | { Args: { materials_json: Json }; Returns: number }
        | { Args: { p_task_id: string }; Returns: number }
      calculate_total_task_cost: {
        Args: {
          estimated_hours_val: number
          hourly_rate_val: number
          materials_json: Json
        }
        Returns: number
      }
      count_completed_checklist_items: {
        Args: { checklist_json: Json }
        Returns: number
      }
      create_default_project_room: {
        Args: { p_created_by: string; p_project_id: string }
        Returns: undefined
      }
      create_notification:
        | {
            Args: {
              p_data?: Json
              p_link?: string
              p_message: string
              p_priority?: string
              p_title: string
              p_type: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_message: string
              p_title: string
              p_type?: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_action_url?: string
              p_data?: Json
              p_message: string
              p_notification_type: Database["public"]["Enums"]["notification_type"]
              p_priority?: number
              p_project_id: string
              p_title: string
              p_user_id: string
            }
            Returns: undefined
          }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      exec_sql: { Args: { query: string }; Returns: undefined }
      exec_sql_return: {
        Args: { query: string }
        Returns: Record<string, unknown>[]
      }
      expire_old_invites: { Args: never; Returns: undefined }
      generate_certificate_id: { Args: never; Returns: string }
      generate_certificate_number: { Args: never; Returns: string }
      generate_invite_token: { Args: never; Returns: string }
      get_checklist_completion_percentage: {
        Args: { checklist_json: Json }
        Returns: number
      }
      get_unread_message_count: { Args: { p_user_id: string }; Returns: number }
      get_unread_notifications_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_feed:
        | {
            Args: { p_limit?: number; p_user_id: string }
            Returns: {
              content: string
              created_at: string
              post_id: string
            }[]
          }
        | {
            Args: { p_limit: number; p_offset: number }
            Returns: {
              author_name: string
              content: string
              created_at: string
              post_id: string
            }[]
          }
      get_worker_earnings_stats: {
        Args: { p_worker_id: string }
        Returns: {
          avg_job_value: number
          jobs_completed: number
          total_earned: number
        }[]
      }
      get_worker_stats: {
        Args: { worker_uuid: string }
        Returns: {
          avg_rating: number
          total_earnings: number
          total_jobs: number
        }[]
      }
      increment_certificate_scan: {
        Args: { cert_id_text: string }
        Returns: boolean
      }
      increment_profile_views: {
        Args: { p_worker_id: string }
        Returns: undefined
      }
      log_project_activity: {
        Args: {
          p_activity_type: Database["public"]["Enums"]["activity_type"]
          p_description: string
          p_details?: Json
          p_project_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      revoke_certificate: {
        Args: { cert_id: string; reason: string }
        Returns: boolean
      }
      update_employer_stats: {
        Args: { p_employer_id: string }
        Returns: undefined
      }
    }
    Enums: {
      activity_type:
        | "project_created"
        | "project_updated"
        | "project_status_changed"
        | "task_created"
        | "task_updated"
        | "task_completed"
        | "task_assigned"
        | "task_comment_added"
        | "event_created"
        | "event_updated"
        | "event_cancelled"
        | "member_invited"
        | "member_joined"
        | "member_left"
        | "member_removed"
        | "permissions_changed"
        | "budget_updated"
        | "deadline_changed"
        | "file_uploaded"
        | "file_removed"
        | "milestone_reached"
        | "milestone_missed"
        | "report_generated"
        | "backup_created"
        | "system_maintenance"
      attendance_status:
        | "invited"
        | "accepted"
        | "declined"
        | "tentative"
        | "attended"
        | "absent"
      event_status:
        | "planned"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "postponed"
      event_type:
        | "meeting"
        | "deadline"
        | "inspection"
        | "delivery"
        | "milestone"
        | "safety_check"
        | "client_meeting"
        | "training"
        | "other"
      invitation_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "cancelled"
      invite_status: "pending" | "accepted" | "rejected" | "expired"
      notification_status: "unread" | "read" | "archived" | "dismissed"
      notification_type:
        | "task_assigned"
        | "task_due_soon"
        | "task_overdue"
        | "event_reminder"
        | "event_cancelled"
        | "project_update"
        | "team_invitation"
        | "permission_granted"
        | "permission_revoked"
        | "budget_alert"
        | "deadline_alert"
        | "milestone_achieved"
        | "system_message"
        | "weekly_summary"
      permission_scope:
        | "view_tasks"
        | "create_tasks"
        | "edit_tasks"
        | "delete_tasks"
        | "assign_tasks"
        | "view_events"
        | "create_events"
        | "edit_events"
        | "delete_events"
        | "view_team"
        | "manage_team"
        | "invite_members"
        | "remove_members"
        | "view_financials"
        | "edit_financials"
        | "view_reports"
        | "export_data"
        | "project_settings"
        | "full_admin"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "not_started"
        | "in_progress"
        | "review"
        | "completed"
        | "blocked"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "project_created",
        "project_updated",
        "project_status_changed",
        "task_created",
        "task_updated",
        "task_completed",
        "task_assigned",
        "task_comment_added",
        "event_created",
        "event_updated",
        "event_cancelled",
        "member_invited",
        "member_joined",
        "member_left",
        "member_removed",
        "permissions_changed",
        "budget_updated",
        "deadline_changed",
        "file_uploaded",
        "file_removed",
        "milestone_reached",
        "milestone_missed",
        "report_generated",
        "backup_created",
        "system_maintenance",
      ],
      attendance_status: [
        "invited",
        "accepted",
        "declined",
        "tentative",
        "attended",
        "absent",
      ],
      event_status: [
        "planned",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "postponed",
      ],
      event_type: [
        "meeting",
        "deadline",
        "inspection",
        "delivery",
        "milestone",
        "safety_check",
        "client_meeting",
        "training",
        "other",
      ],
      invitation_status: [
        "pending",
        "accepted",
        "declined",
        "expired",
        "cancelled",
      ],
      invite_status: ["pending", "accepted", "rejected", "expired"],
      notification_status: ["unread", "read", "archived", "dismissed"],
      notification_type: [
        "task_assigned",
        "task_due_soon",
        "task_overdue",
        "event_reminder",
        "event_cancelled",
        "project_update",
        "team_invitation",
        "permission_granted",
        "permission_revoked",
        "budget_alert",
        "deadline_alert",
        "milestone_achieved",
        "system_message",
        "weekly_summary",
      ],
      permission_scope: [
        "view_tasks",
        "create_tasks",
        "edit_tasks",
        "delete_tasks",
        "assign_tasks",
        "view_events",
        "create_events",
        "edit_events",
        "delete_events",
        "view_team",
        "manage_team",
        "invite_members",
        "remove_members",
        "view_financials",
        "edit_financials",
        "view_reports",
        "export_data",
        "project_settings",
        "full_admin",
      ],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "not_started",
        "in_progress",
        "review",
        "completed",
        "blocked",
        "cancelled",
      ],
    },
  },
} as const
