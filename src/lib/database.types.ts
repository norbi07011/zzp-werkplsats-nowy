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
      // ============================================
      // ACCOUNTANT TEAMS SYSTEM - Added 2025-12-19
      // ============================================
      accountant_teams: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          color_hex: string | null;
          icon: string | null;
          avatar_url: string | null;
          max_members: number | null;
          is_active: boolean | null;
          settings: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          color_hex?: string | null;
          icon?: string | null;
          avatar_url?: string | null;
          max_members?: number | null;
          is_active?: boolean | null;
          settings?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          color_hex?: string | null;
          icon?: string | null;
          avatar_url?: string | null;
          max_members?: number | null;
          is_active?: boolean | null;
          settings?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_teams_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          }
        ];
      };
      accountant_team_members: {
        Row: {
          id: string;
          team_id: string;
          accountant_id: string;
          role: string | null;
          specialization: string | null;
          notes: string | null;
          status: string | null;
          joined_at: string | null;
          left_at: string | null;
          permissions: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          accountant_id: string;
          role?: string | null;
          specialization?: string | null;
          notes?: string | null;
          status?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          permissions?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          accountant_id?: string;
          role?: string | null;
          specialization?: string | null;
          notes?: string | null;
          status?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          permissions?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "accountant_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountant_team_members_accountant_id_fkey";
            columns: ["accountant_id"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          }
        ];
      };
      accountant_team_memberships: {
        Row: {
          id: string;
          team_id: string;
          accountant_id: string;
          role: string | null;
          specialization: string | null;
          notes: string | null;
          status: string | null;
          joined_at: string | null;
          left_at: string | null;
          permissions: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          accountant_id: string;
          role?: string | null;
          specialization?: string | null;
          notes?: string | null;
          status?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          permissions?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          accountant_id?: string;
          role?: string | null;
          specialization?: string | null;
          notes?: string | null;
          status?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          permissions?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_team_memberships_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "accountant_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountant_team_memberships_accountant_id_fkey";
            columns: ["accountant_id"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          }
        ];
      };
      accountant_team_invitations: {
        Row: {
          id: string;
          team_id: string;
          invited_by: string;
          invited_accountant_id: string | null;
          invited_email: string;
          token: string | null;
          message: string | null;
          proposed_role: string | null;
          status: string | null;
          expires_at: string | null;
          responded_at: string | null;
          decline_reason: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          invited_by: string;
          invited_accountant_id?: string | null;
          invited_email: string;
          token?: string | null;
          message?: string | null;
          proposed_role?: string | null;
          status?: string | null;
          expires_at?: string | null;
          responded_at?: string | null;
          decline_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          invited_by?: string;
          invited_accountant_id?: string | null;
          invited_email?: string;
          token?: string | null;
          message?: string | null;
          proposed_role?: string | null;
          status?: string | null;
          expires_at?: string | null;
          responded_at?: string | null;
          decline_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_team_invitations_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "accountant_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountant_team_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountant_team_invitations_invited_accountant_id_fkey";
            columns: ["invited_accountant_id"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          }
        ];
      };
      accountant_team_tasks: {
        Row: {
          id: string;
          team_id: string;
          created_by: string;
          assigned_to: string | null;
          title: string;
          description: string | null;
          status: string | null;
          priority: string | null;
          category: string | null;
          due_date: string | null;
          start_date: string | null;
          completed_at: string | null;
          client_id: string | null;
          client_type: string | null;
          client_name: string | null;
          tags: string[] | null;
          notes: string | null;
          estimated_time: number | null;
          actual_time: number | null;
          attachments: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          created_by: string;
          assigned_to?: string | null;
          title: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          category?: string | null;
          due_date?: string | null;
          start_date?: string | null;
          completed_at?: string | null;
          client_id?: string | null;
          client_type?: string | null;
          client_name?: string | null;
          tags?: string[] | null;
          notes?: string | null;
          estimated_time?: number | null;
          actual_time?: number | null;
          attachments?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          created_by?: string;
          assigned_to?: string | null;
          title?: string;
          description?: string | null;
          status?: string | null;
          priority?: string | null;
          category?: string | null;
          due_date?: string | null;
          start_date?: string | null;
          completed_at?: string | null;
          client_id?: string | null;
          client_type?: string | null;
          client_name?: string | null;
          tags?: string[] | null;
          notes?: string | null;
          estimated_time?: number | null;
          actual_time?: number | null;
          attachments?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_team_tasks_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "accountant_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountant_team_tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountant_team_tasks_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          }
        ];
      };
      accountant_team_messages: {
        Row: {
          id: string;
          team_id: string;
          sender_id: string;
          content: string;
          message_type: string | null;
          attachments: Json | null;
          reply_to: string | null;
          reactions: Json | null;
          is_edited: boolean | null;
          edited_at: string | null;
          is_deleted: boolean | null;
          deleted_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          sender_id: string;
          content: string;
          message_type?: string | null;
          attachments?: Json | null;
          reply_to?: string | null;
          reactions?: Json | null;
          is_edited?: boolean | null;
          edited_at?: string | null;
          is_deleted?: boolean | null;
          deleted_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: string | null;
          attachments?: Json | null;
          reply_to?: string | null;
          reactions?: Json | null;
          is_edited?: boolean | null;
          edited_at?: string | null;
          is_deleted?: boolean | null;
          deleted_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_team_messages_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "accountant_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountant_team_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountant_team_messages_reply_to_fkey";
            columns: ["reply_to"];
            isOneToOne: false;
            referencedRelation: "accountant_team_messages";
            referencedColumns: ["id"];
          }
        ];
      };
      accountant_team_events: {
        Row: {
          id: string;
          team_id: string;
          created_by: string;
          title: string;
          description: string | null;
          location: string | null;
          event_type: string | null;
          start_time: string;
          end_time: string;
          all_day: boolean | null;
          is_recurring: boolean | null;
          recurrence_rule: string | null;
          attendees: string[] | null;
          client_id: string | null;
          client_type: string | null;
          client_name: string | null;
          status: string | null;
          color: string | null;
          reminders: number[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          location?: string | null;
          event_type?: string | null;
          start_time: string;
          end_time: string;
          all_day?: boolean | null;
          is_recurring?: boolean | null;
          recurrence_rule?: string | null;
          attendees?: string[] | null;
          client_id?: string | null;
          client_type?: string | null;
          client_name?: string | null;
          status?: string | null;
          color?: string | null;
          reminders?: number[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          event_type?: string | null;
          start_time?: string;
          end_time?: string;
          all_day?: boolean | null;
          is_recurring?: boolean | null;
          recurrence_rule?: string | null;
          attendees?: string[] | null;
          client_id?: string | null;
          client_type?: string | null;
          client_name?: string | null;
          status?: string | null;
          color?: string | null;
          reminders?: number[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_team_events_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "accountant_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountant_team_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      // ============================================
      // END ACCOUNTANT TEAMS SYSTEM
      // ============================================
      accountant_forms: {
        Row: {
          accountant_id: string;
          created_at: string | null;
          form_fields: Json;
          form_name: string;
          form_type: string;
          id: string;
          is_active: boolean | null;
          requires_approval: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          accountant_id: string;
          created_at?: string | null;
          form_fields: Json;
          form_name: string;
          form_type: string;
          id?: string;
          is_active?: boolean | null;
          requires_approval?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          accountant_id?: string;
          created_at?: string | null;
          form_fields?: Json;
          form_name?: string;
          form_type?: string;
          id?: string;
          is_active?: boolean | null;
          requires_approval?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountant_forms_accountant_id_fkey";
            columns: ["accountant_id"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          }
        ];
      };
      employer_teams: {
        Row: {
          color_hex: string | null;
          created_at: string | null;
          description: string | null;
          employer_id: string;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          max_members: number | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          color_hex?: string | null;
          created_at?: string | null;
          description?: string | null;
          employer_id: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_members?: number | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          color_hex?: string | null;
          created_at?: string | null;
          description?: string | null;
          employer_id?: string;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_members?: number | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employer_teams_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: false;
            referencedRelation: "employers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employer_teams_employer_id_fkey";
            columns: ["employer_id"];
            isOneToOne: false;
            referencedRelation: "v_employers";
            referencedColumns: ["id"];
          }
        ];
      };
      employer_team_members: {
        Row: {
          cleaning_company_id: string | null;
          created_at: string | null;
          id: string;
          joined_at: string | null;
          left_at: string | null;
          notes: string | null;
          role: string | null;
          status: string | null;
          team_id: string;
          team_specialization: string | null;
          updated_at: string | null;
          worker_id: string | null;
        };
        Insert: {
          cleaning_company_id?: string | null;
          created_at?: string | null;
          id?: string;
          joined_at?: string | null;
          left_at?: string | null;
          notes?: string | null;
          role?: string | null;
          status?: string | null;
          team_id: string;
          team_specialization?: string | null;
          updated_at?: string | null;
          worker_id?: string | null;
        };
        Update: {
          cleaning_company_id?: string | null;
          created_at?: string | null;
          id?: string;
          joined_at?: string | null;
          left_at?: string | null;
          notes?: string | null;
          role?: string | null;
          status?: string | null;
          team_id?: string;
          team_specialization?: string | null;
          updated_at?: string | null;
          worker_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employer_team_members_cleaning_company_id_fkey";
            columns: ["cleaning_company_id"];
            isOneToOne: false;
            referencedRelation: "cleaning_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employer_team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "employer_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employer_team_members_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "v_workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employer_team_members_worker_id_fkey";
            columns: ["worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          }
        ];
      };
      team_invitations: {
        Row: {
          created_at: string | null;
          decline_reason: string | null;
          expires_at: string | null;
          id: string;
          invited_by: string;
          invited_cleaning_company_id: string | null;
          invited_worker_id: string | null;
          message: string | null;
          proposed_role: string | null;
          responded_at: string | null;
          status: string | null;
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          decline_reason?: string | null;
          expires_at?: string | null;
          id?: string;
          invited_by: string;
          invited_cleaning_company_id?: string | null;
          invited_worker_id?: string | null;
          message?: string | null;
          proposed_role?: string | null;
          responded_at?: string | null;
          status?: string | null;
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          decline_reason?: string | null;
          expires_at?: string | null;
          id?: string;
          invited_by?: string;
          invited_cleaning_company_id?: string | null;
          invited_worker_id?: string | null;
          message?: string | null;
          proposed_role?: string | null;
          responded_at?: string | null;
          status?: string | null;
          team_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_invitations_invited_cleaning_company_id_fkey";
            columns: ["invited_cleaning_company_id"];
            isOneToOne: false;
            referencedRelation: "cleaning_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_invitations_invited_worker_id_fkey";
            columns: ["invited_worker_id"];
            isOneToOne: false;
            referencedRelation: "v_workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_invitations_invited_worker_id_fkey";
            columns: ["invited_worker_id"];
            isOneToOne: false;
            referencedRelation: "workers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "employer_teams";
            referencedColumns: ["id"];
          }
        ];
      };
      team_projects: {
        Row: {
          budget: number | null;
          city: string | null;
          client_name: string | null;
          country: string | null;
          created_at: string | null;
          created_by: string | null;
          currency: string | null;
          description: string | null;
          end_date: string | null;
          house_number: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          postal_code: string | null;
          start_date: string | null;
          status: string | null;
          street: string | null;
          team_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          budget?: number | null;
          city?: string | null;
          client_name?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          description?: string | null;
          end_date?: string | null;
          house_number?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          postal_code?: string | null;
          start_date?: string | null;
          status?: string | null;
          street?: string | null;
          team_id: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          budget?: number | null;
          city?: string | null;
          client_name?: string | null;
          country?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          description?: string | null;
          end_date?: string | null;
          house_number?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          postal_code?: string | null;
          start_date?: string | null;
          status?: string | null;
          street?: string | null;
          team_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_projects_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "employer_teams";
            referencedColumns: ["id"];
          }
        ];
      };
      team_tasks: {
        Row: {
          actual_hours: number | null;
          assigned_to: string[] | null;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          estimated_hours: number | null;
          id: string;
          materials_required: Json | null;
          materials_used: Json | null;
          photos: string[] | null;
          priority: string | null;
          project_id: string;
          status: string | null;
          title: string;
          tools_required: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          actual_hours?: number | null;
          assigned_to?: string[] | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          id?: string;
          materials_required?: Json | null;
          materials_used?: Json | null;
          photos?: string[] | null;
          priority?: string | null;
          project_id: string;
          status?: string | null;
          title: string;
          tools_required?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          actual_hours?: number | null;
          assigned_to?: string[] | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          estimated_hours?: number | null;
          id?: string;
          materials_required?: Json | null;
          materials_used?: Json | null;
          photos?: string[] | null;
          priority?: string | null;
          project_id?: string;
          status?: string | null;
          title?: string;
          tools_required?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_tasks_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_tasks_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "team_projects";
            referencedColumns: ["id"];
          }
        ];
      };
      team_chat_messages: {
        Row: {
          attachments: Json | null;
          created_at: string | null;
          id: string;
          is_deleted: boolean | null;
          is_pinned: boolean | null;
          message: string;
          message_type: string | null;
          read_by: string[] | null;
          reply_to_id: string | null;
          sender_id: string;
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          attachments?: Json | null;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_pinned?: boolean | null;
          message: string;
          message_type?: string | null;
          read_by?: string[] | null;
          reply_to_id?: string | null;
          sender_id: string;
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          attachments?: Json | null;
          created_at?: string | null;
          id?: string;
          is_deleted?: boolean | null;
          is_pinned?: boolean | null;
          message?: string;
          message_type?: string | null;
          read_by?: string[] | null;
          reply_to_id?: string | null;
          sender_id?: string;
          team_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_chat_messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "team_chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_chat_messages_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "employer_teams";
            referencedColumns: ["id"];
          }
        ];
      };
      team_task_work_logs: {
        Row: {
          created_at: string | null;
          description: string | null;
          duration_minutes: number | null;
          end_time: string | null;
          id: string;
          start_time: string;
          task_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          end_time?: string | null;
          id?: string;
          start_time: string;
          task_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          end_time?: string | null;
          id?: string;
          start_time?: string;
          task_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_task_work_logs_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "team_tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_task_work_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_task_work_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      team_task_comments: {
        Row: {
          attachments: Json | null;
          comment: string;
          created_at: string | null;
          id: string;
          task_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          attachments?: Json | null;
          comment: string;
          created_at?: string | null;
          id?: string;
          task_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          attachments?: Json | null;
          comment?: string;
          created_at?: string | null;
          id?: string;
          task_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_task_comments_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "team_tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_task_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_task_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      employers: {
        Row: {
          address: string | null;
          average_rating: number | null;
          avg_rating: number | null;
          btw_number: string | null;
          city: string | null;
          company_name: string | null;
          company_size: string | null;
          company_type: string | null;
          contact_email: string | null;
          contact_person: string | null;
          contact_phone: string | null;
          country: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          description: string | null;
          email: string | null;
          google_maps_url: string | null;
          google_place_id: string | null;
          google_rating: number | null;
          google_review_count: number | null;
          id: string;
          industry: string | null;
          kvk_number: string | null;
          latitude: number | null;
          location_city: string | null;
          logo_url: string | null;
          longitude: number | null;
          phone: string | null;
          postal_code: string | null;
          profile_completed: boolean | null;
          profile_id: string;
          rating: number | null;
          rating_count: number | null;
          review_count: number | null;
          rsin_number: string | null;
          subscription_end_date: string | null;
          subscription_start_date: string | null;
          subscription_started_at: string | null;
          subscription_status: string | null;
          subscription_tier: string | null;
          total_hires: number | null;
          total_jobs_posted: number | null;
          updated_at: string | null;
          user_id: string | null;
          verified: boolean | null;
          verified_at: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          average_rating?: number | null;
          avg_rating?: number | null;
          btw_number?: string | null;
          city?: string | null;
          company_name?: string | null;
          company_size?: string | null;
          company_type?: string | null;
          contact_email?: string | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          google_maps_url?: string | null;
          google_place_id?: string | null;
          google_rating?: number | null;
          google_review_count?: number | null;
          id?: string;
          industry?: string | null;
          kvk_number?: string | null;
          latitude?: number | null;
          location_city?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          profile_completed?: boolean | null;
          profile_id: string;
          rating?: number | null;
          rating_count?: number | null;
          review_count?: number | null;
          rsin_number?: string | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_started_at?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          total_hires?: number | null;
          total_jobs_posted?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          average_rating?: number | null;
          avg_rating?: number | null;
          btw_number?: string | null;
          city?: string | null;
          company_name?: string | null;
          company_size?: string | null;
          company_type?: string | null;
          contact_email?: string | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          email?: string | null;
          google_maps_url?: string | null;
          google_place_id?: string | null;
          google_rating?: number | null;
          google_review_count?: number | null;
          id?: string;
          industry?: string | null;
          kvk_number?: string | null;
          latitude?: number | null;
          location_city?: string | null;
          logo_url?: string | null;
          longitude?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          profile_completed?: boolean | null;
          profile_id?: string;
          rating?: number | null;
          rating_count?: number | null;
          review_count?: number | null;
          rsin_number?: string | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_started_at?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          total_hires?: number | null;
          total_jobs_posted?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      workers: {
        Row: {
          address: string | null;
          approved_categories: string[] | null;
          availability: Json | null;
          available: boolean | null;
          available_from: string | null;
          avatar_url: string | null;
          bio: string | null;
          btw_number: string | null;
          certificate_issued_at: string | null;
          certificate_status: string | null;
          certifications: string[] | null;
          completed_jobs: number | null;
          cover_image_url: string | null;
          created_at: string | null;
          email_notifications: boolean | null;
          experience_years: number | null;
          hourly_rate: number | null;
          hourly_rate_max: number | null;
          id: string;
          is_available: boolean | null;
          is_available_now: boolean | null;
          is_on_demand_available: boolean | null;
          kvk_number: string | null;
          languages: string[] | null;
          last_active: string | null;
          last_payment_date: string | null;
          latitude: number | null;
          location_city: string | null;
          location_country: string | null;
          location_postal_code: string | null;
          longitude: number | null;
          monthly_fee: number | null;
          own_tools: string[] | null;
          own_vehicle: boolean | null;
          phone: string | null;
          portfolio_images: Json | null;
          postal_code: string | null;
          preferred_days_per_week: number | null;
          profile_id: string;
          profile_views: number | null;
          profile_visibility: string | null;
          push_notifications: boolean | null;
          radius_km: number | null;
          rate_negotiable: boolean | null;
          rating: number | null;
          rating_count: number | null;
          response_rate: number | null;
          response_time: string | null;
          service_radius_km: number | null;
          show_email: boolean | null;
          show_location: boolean | null;
          show_phone: boolean | null;
          skills: string[] | null;
          sms_notifications: boolean | null;
          specialization: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_end_date: string | null;
          subscription_start_date: string | null;
          subscription_status: string | null;
          subscription_tier: string | null;
          team_description: string | null;
          team_hourly_rate: number | null;
          team_size: number | null;
          total_earnings: number | null;
          total_jobs_completed: number | null;
          unavailable_dates: Json | null;
          updated_at: string | null;
          user_id: string | null;
          vehicle_type: string | null;
          verified: boolean | null;
          worker_type: string | null;
          years_experience: number | null;
          zzp_certificate_date: string | null;
          zzp_certificate_expires_at: string | null;
          zzp_certificate_issued: boolean | null;
          zzp_certificate_number: string | null;
        };
        Insert: {
          address?: string | null;
          approved_categories?: string[] | null;
          availability?: Json | null;
          available?: boolean | null;
          available_from?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          btw_number?: string | null;
          certificate_issued_at?: string | null;
          certificate_status?: string | null;
          certifications?: string[] | null;
          completed_jobs?: number | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          email_notifications?: boolean | null;
          experience_years?: number | null;
          hourly_rate?: number | null;
          hourly_rate_max?: number | null;
          id?: string;
          is_available?: boolean | null;
          is_available_now?: boolean | null;
          is_on_demand_available?: boolean | null;
          kvk_number?: string | null;
          languages?: string[] | null;
          last_active?: string | null;
          last_payment_date?: string | null;
          latitude?: number | null;
          location_city?: string | null;
          location_country?: string | null;
          location_postal_code?: string | null;
          longitude?: number | null;
          monthly_fee?: number | null;
          own_tools?: string[] | null;
          own_vehicle?: boolean | null;
          phone?: string | null;
          portfolio_images?: Json | null;
          postal_code?: string | null;
          preferred_days_per_week?: number | null;
          profile_id: string;
          profile_views?: number | null;
          profile_visibility?: string | null;
          push_notifications?: boolean | null;
          radius_km?: number | null;
          rate_negotiable?: boolean | null;
          rating?: number | null;
          rating_count?: number | null;
          response_rate?: number | null;
          response_time?: string | null;
          service_radius_km?: number | null;
          show_email?: boolean | null;
          show_location?: boolean | null;
          show_phone?: boolean | null;
          skills?: string[] | null;
          sms_notifications?: boolean | null;
          specialization?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          team_description?: string | null;
          team_hourly_rate?: number | null;
          team_size?: number | null;
          total_earnings?: number | null;
          total_jobs_completed?: number | null;
          unavailable_dates?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
          vehicle_type?: string | null;
          verified?: boolean | null;
          worker_type?: string | null;
          years_experience?: number | null;
          zzp_certificate_date?: string | null;
          zzp_certificate_expires_at?: string | null;
          zzp_certificate_issued?: boolean | null;
          zzp_certificate_number?: string | null;
        };
        Update: {
          address?: string | null;
          approved_categories?: string[] | null;
          availability?: Json | null;
          available?: boolean | null;
          available_from?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          btw_number?: string | null;
          certificate_issued_at?: string | null;
          certificate_status?: string | null;
          certifications?: string[] | null;
          completed_jobs?: number | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          email_notifications?: boolean | null;
          experience_years?: number | null;
          hourly_rate?: number | null;
          hourly_rate_max?: number | null;
          id?: string;
          is_available?: boolean | null;
          is_available_now?: boolean | null;
          is_on_demand_available?: boolean | null;
          kvk_number?: string | null;
          languages?: string[] | null;
          last_active?: string | null;
          last_payment_date?: string | null;
          latitude?: number | null;
          location_city?: string | null;
          location_country?: string | null;
          location_postal_code?: string | null;
          longitude?: number | null;
          monthly_fee?: number | null;
          own_tools?: string[] | null;
          own_vehicle?: boolean | null;
          phone?: string | null;
          portfolio_images?: Json | null;
          postal_code?: string | null;
          preferred_days_per_week?: number | null;
          profile_id?: string;
          profile_views?: number | null;
          profile_visibility?: string | null;
          push_notifications?: boolean | null;
          radius_km?: number | null;
          rate_negotiable?: boolean | null;
          rating?: number | null;
          rating_count?: number | null;
          response_rate?: number | null;
          response_time?: string | null;
          service_radius_km?: number | null;
          show_email?: boolean | null;
          show_location?: boolean | null;
          show_phone?: boolean | null;
          skills?: string[] | null;
          sms_notifications?: boolean | null;
          specialization?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_end_date?: string | null;
          subscription_start_date?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          team_description?: string | null;
          team_hourly_rate?: number | null;
          team_size?: number | null;
          total_earnings?: number | null;
          total_jobs_completed?: number | null;
          unavailable_dates?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
          vehicle_type?: string | null;
          verified?: boolean | null;
          worker_type?: string | null;
          years_experience?: number | null;
          zzp_certificate_date?: string | null;
          zzp_certificate_expires_at?: string | null;
          zzp_certificate_issued?: boolean | null;
          zzp_certificate_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      cleaning_companies: {
        Row: {
          accepting_new_clients: boolean | null;
          additional_services: string[] | null;
          address: string | null;
          availability: Json | null;
          avatar_url: string | null;
          average_rating: number | null;
          bio: string | null;
          company_name: string;
          cover_image_url: string | null;
          created_at: string | null;
          email: string | null;
          hourly_rate_max: number | null;
          hourly_rate_min: number | null;
          id: string;
          kvk_number: string | null;
          last_active: string | null;
          latitude: number | null;
          location_city: string | null;
          location_province: string | null;
          longitude: number | null;
          owner_name: string;
          phone: string | null;
          portfolio_images: string[] | null;
          postal_code: string | null;
          preferred_days_per_week: number | null;
          profile_id: string;
          profile_visibility: string | null;
          rate_negotiable: boolean | null;
          service_radius_km: number | null;
          specialization: string[] | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          subscription_tier: string | null;
          team_size: number | null;
          total_reviews: number | null;
          unavailable_dates: Json | null;
          updated_at: string | null;
          years_experience: number | null;
        };
        Insert: {
          accepting_new_clients?: boolean | null;
          additional_services?: string[] | null;
          address?: string | null;
          availability?: Json | null;
          avatar_url?: string | null;
          average_rating?: number | null;
          bio?: string | null;
          company_name: string;
          cover_image_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          hourly_rate_max?: number | null;
          hourly_rate_min?: number | null;
          id?: string;
          kvk_number?: string | null;
          last_active?: string | null;
          latitude?: number | null;
          location_city?: string | null;
          location_province?: string | null;
          longitude?: number | null;
          owner_name: string;
          phone?: string | null;
          portfolio_images?: string[] | null;
          postal_code?: string | null;
          preferred_days_per_week?: number | null;
          profile_id: string;
          profile_visibility?: string | null;
          rate_negotiable?: boolean | null;
          service_radius_km?: number | null;
          specialization?: string[] | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          team_size?: number | null;
          total_reviews?: number | null;
          unavailable_dates?: Json | null;
          updated_at?: string | null;
          years_experience?: number | null;
        };
        Update: {
          accepting_new_clients?: boolean | null;
          additional_services?: string[] | null;
          address?: string | null;
          availability?: Json | null;
          avatar_url?: string | null;
          average_rating?: number | null;
          bio?: string | null;
          company_name?: string;
          cover_image_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          hourly_rate_max?: number | null;
          hourly_rate_min?: number | null;
          id?: string;
          kvk_number?: string | null;
          last_active?: string | null;
          latitude?: number | null;
          location_city?: string | null;
          location_province?: string | null;
          longitude?: number | null;
          owner_name?: string;
          phone?: string | null;
          portfolio_images?: string[] | null;
          postal_code?: string | null;
          preferred_days_per_week?: number | null;
          profile_id?: string;
          profile_visibility?: string | null;
          rate_negotiable?: boolean | null;
          service_radius_km?: number | null;
          specialization?: string[] | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          team_size?: number | null;
          total_reviews?: number | null;
          unavailable_dates?: Json | null;
          updated_at?: string | null;
          years_experience?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "cleaning_companies_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cleaning_companies_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      accountants: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          average_rating: number | null;
          bio: string | null;
          btw_number: string | null;
          city: string | null;
          company_name: string | null;
          country: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean | null;
          is_verified: boolean | null;
          kvk_number: string | null;
          languages: string[] | null;
          latitude: number | null;
          license_number: string | null;
          longitude: number | null;
          phone: string | null;
          portfolio_images: string[] | null;
          postal_code: string | null;
          profile_id: string | null;
          rating: number | null;
          rating_count: number | null;
          review_count: number | null;
          specializations: string[] | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          subscription_tier: string | null;
          total_clients: number | null;
          updated_at: string | null;
          website: string | null;
          years_experience: number | null;
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          average_rating?: number | null;
          bio?: string | null;
          btw_number?: string | null;
          city?: string | null;
          company_name?: string | null;
          country?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          email: string;
          full_name: string;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          kvk_number?: string | null;
          languages?: string[] | null;
          latitude?: number | null;
          license_number?: string | null;
          longitude?: number | null;
          phone?: string | null;
          portfolio_images?: string[] | null;
          postal_code?: string | null;
          profile_id?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          review_count?: number | null;
          specializations?: string[] | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          total_clients?: number | null;
          updated_at?: string | null;
          website?: string | null;
          years_experience?: number | null;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          average_rating?: number | null;
          bio?: string | null;
          btw_number?: string | null;
          city?: string | null;
          company_name?: string | null;
          country?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean | null;
          is_verified?: boolean | null;
          kvk_number?: string | null;
          languages?: string[] | null;
          latitude?: number | null;
          license_number?: string | null;
          longitude?: number | null;
          phone?: string | null;
          portfolio_images?: string[] | null;
          postal_code?: string | null;
          profile_id?: string | null;
          rating?: number | null;
          rating_count?: number | null;
          review_count?: number | null;
          specializations?: string[] | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          total_clients?: number | null;
          updated_at?: string | null;
          website?: string | null;
          years_experience?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "accountants_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accountants_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      v_employers: {
        Row: {
          company_name: string | null;
          created_at: string | null;
          id: string | null;
          kvk_number: string | null;
          profile_id: string | null;
        };
        Insert: {
          company_name?: string | null;
          created_at?: string | null;
          id?: string | null;
          kvk_number?: string | null;
          profile_id?: string | null;
        };
        Update: {
          company_name?: string | null;
          created_at?: string | null;
          id?: string | null;
          kvk_number?: string | null;
          profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      v_profiles: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          role: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string | null;
          role?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string | null;
          role?: string | null;
        };
        Relationships: [];
      };
      v_workers: {
        Row: {
          id: string | null;
          profile_id: string | null;
          full_name: string | null;
          email: string | null;
          role: string | null;
          specialization: string | null;
          hourly_rate: number | null;
          rating: number | null;
          verified: boolean | null;
          avatar_url: string | null;
          location_city: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "v_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      get_employer_team_ids: {
        Args: { user_profile_id: string };
        Returns: {
          team_id: string;
        }[];
      };
      get_team_ids_for_invited_user: {
        Args: { user_profile_id: string };
        Returns: {
          team_id: string;
        }[];
      };
      get_team_ids_for_member: {
        Args: { user_profile_id: string };
        Returns: {
          team_id: string;
        }[];
      };
      is_team_member_or_employer: {
        Args: { p_team_id: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;
