export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nickname: string | null
          photo_urls: string[] | null
          college: 'CAS' | 'CCSS' | 'CBA' | 'CEDUC' | 'CDENT' | 'CENG' | null
          year_level: number | null
          hobbies: string[] | null
          description: string | null
          gender: 'Male' | 'Female' | 'Non-binary' | 'Other' | null
          preferred_gender: 'Male' | 'Female' | 'Non-binary' | 'Other' | 'Everyone' | null
          looking_for: 'Romantic' | 'Friendship' | 'Study Buddy' | 'Networking' | 'Everyone' | null
          role: 'admin' | 'user'
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          nickname?: string | null
          photo_urls?: string[] | null
          college?: 'CAS' | 'CCSS' | 'CBA' | 'CEDUC' | 'CDENT' | 'CENG' | null
          year_level?: number | null
          hobbies?: string[] | null
          description?: string | null
          gender?: 'Male' | 'Female' | 'Non-binary' | 'Other' | null
          preferred_gender?: 'Male' | 'Female' | 'Non-binary' | 'Other' | 'Everyone' | null
          looking_for?: 'Romantic' | 'Friendship' | 'Study Buddy' | 'Networking' | 'Everyone' | null
          role?: 'admin' | 'user'
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string | null
          photo_urls?: string[] | null
          college?: 'CAS' | 'CCSS' | 'CBA' | 'CEDUC' | 'CDENT' | 'CENG' | null
          year_level?: number | null
          hobbies?: string[] | null
          description?: string | null
          gender?: 'Male' | 'Female' | 'Non-binary' | 'Other' | null
          preferred_gender?: 'Male' | 'Female' | 'Non-binary' | 'Other' | 'Everyone' | null
          looking_for?: 'Romantic' | 'Friendship' | 'Study Buddy' | 'Networking' | 'Everyone' | null
          role?: 'admin' | 'user'
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_id?: string
          reason?: string
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          match_id: string
          description: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          description: string
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          description?: string
          is_completed?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          from_user_id: string
          type: 'like' | 'match'
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_user_id: string
          type: 'like' | 'match'
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_user_id?: string
          type?: 'like' | 'match'
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
