import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl: string = 'https://oxcbqzqepkrntqjbhuik.supabase.co';
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Y2JxenFlcGtybnRxamJodWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzAxMDIsImV4cCI6MjA3MTg0NjEwMn0.npr86vldSEMF3T3TC5SRt9j97aoxx0A0xg9wKnYKIw0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (you can generate these automatically later with Supabase CLI)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          profile_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          profile_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          profile_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}