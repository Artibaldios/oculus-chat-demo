export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      chats: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          mime_type: string;
          byte_size: number;
          storage_path: string;
          url: string | null;
          extracted_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          mime_type: string;
          byte_size: number;
          storage_path: string;
          url?: string | null;
          extracted_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          mime_type?: string;
          byte_size?: number;
          storage_path?: string;
          url?: string | null;
          extracted_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_files: {
        Row: {
          chat_id: string;
          message_id: string;
          file_id: string;
          created_at: string;
        };
        Insert: {
          chat_id: string;
          message_id: string;
          file_id: string;
          created_at?: string;
        };
        Update: {
          chat_id?: string;
          message_id?: string;
          file_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
