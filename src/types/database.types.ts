export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_branding: {
        Row: {
          user_id: string
          primary_color: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          primary_color?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          primary_color?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      relatorio_demo_frequencia: {
        Row: {
          id: string
          user_id: string
          setor: string
          competencia: string
          profissional_nome: string
          dia: number
          turno: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          setor: string
          competencia: string
          profissional_nome: string
          dia: number
          turno: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          setor?: string
          competencia?: string
          profissional_nome?: string
          dia?: number
          turno?: string
          created_at?: string
        }
        Relationships: []
      }
      relatorio_demo_scih_indicador: {
        Row: {
          id: string
          user_id: string
          competencia: string
          indicador: string
          valor: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          competencia: string
          indicador: string
          valor: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          competencia?: string
          indicador?: string
          valor?: string
          created_at?: string
        }
        Relationships: []
      }
      relatorio_demo_scih_ocorrencia: {
        Row: {
          id: string
          user_id: string
          competencia: string
          data_ocorrencia: string
          tipo: string
          resumo: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          competencia: string
          data_ocorrencia: string
          tipo: string
          resumo: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          competencia?: string
          data_ocorrencia?: string
          tipo?: string
          resumo?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
