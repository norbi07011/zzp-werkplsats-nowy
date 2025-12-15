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
      regular_users: {
        Row: {
          address: string | null
          average_rating: number | null
          city: string | null
          created_at: string | null
          email_notifications: boolean | null
          first_name: string | null
          free_requests_limit: number | null
          id: string
          is_premium: boolean | null
          last_name: string | null
          phone: string | null
          postal_code: string | null
          premium_until: string | null
          profile_id: string
          requests_completed: number | null
          requests_posted: number | null
          requests_this_month: number | null
          sms_notifications: boolean | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          city?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          free_requests_limit?: number | null
          id?: string
          is_premium?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          premium_until?: string | null
          profile_id: string
          requests_completed?: number | null
          requests_posted?: number | null
          requests_this_month?: number | null
          sms_notifications?: boolean | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          city?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          free_requests_limit?: number | null
          id?: string
          is_premium?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          premium_until?: string | null
          profile_id?: string
          requests_completed?: number | null
          requests_posted?: number | null
          requests_this_month?: number | null
          sms_notifications?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regular_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      // ... (93 more tables)
    }
  }
}
