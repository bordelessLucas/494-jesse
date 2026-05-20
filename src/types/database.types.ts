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
      locais: {
        Row: {
          id: string
          user_id: string
          codigo: string
          ativo: boolean
          nome_fantasia: string
          razao_social: string | null
          cnpj: string | null
          telefone: string | null
          cep: string | null
          rua: string | null
          numero: string | null
          complemento: string | null
          bairro: string | null
          cidade: string
          uf: string
          anotacoes: string | null
          fuso_horario: string | null
          latitude: string | null
          longitude: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          codigo: string
          ativo?: boolean
          nome_fantasia: string
          razao_social?: string | null
          cnpj?: string | null
          telefone?: string | null
          cep?: string | null
          rua?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade: string
          uf: string
          anotacoes?: string | null
          fuso_horario?: string | null
          latitude?: string | null
          longitude?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          codigo?: string
          ativo?: boolean
          nome_fantasia?: string
          razao_social?: string | null
          cnpj?: string | null
          telefone?: string | null
          cep?: string | null
          rua?: string | null
          numero?: string | null
          complemento?: string | null
          bairro?: string | null
          cidade?: string
          uf?: string
          anotacoes?: string | null
          fuso_horario?: string | null
          latitude?: string | null
          longitude?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      setores: {
        Row: {
          id: string
          user_id: string
          local_id: string
          codigo: string
          nome: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          local_id: string
          codigo: string
          nome: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          local_id?: string
          codigo?: string
          nome?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'setores_local_id_fkey'
            columns: ['local_id']
            isOneToOne: false
            referencedRelation: 'locais'
            referencedColumns: ['id']
          },
        ]
      }
      profissionais: {
        Row: {
          id: string
          user_id: string
          nome: string
          profissao: string
          sigla_conselho: string
          conselho_numero: string
          registro_uf: string
          email: string | null
          telefone: string | null
          cpf: string | null
          local_id: string | null
          detalhes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          profissao: string
          sigla_conselho?: string
          conselho_numero?: string
          registro_uf?: string
          email?: string | null
          telefone?: string | null
          cpf?: string | null
          local_id?: string | null
          detalhes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          profissao?: string
          sigla_conselho?: string
          conselho_numero?: string
          registro_uf?: string
          email?: string | null
          telefone?: string | null
          cpf?: string | null
          local_id?: string | null
          detalhes?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profissionais_local_id_fkey'
            columns: ['local_id']
            isOneToOne: false
            referencedRelation: 'locais'
            referencedColumns: ['id']
          },
        ]
      }
      profissional_setores: {
        Row: {
          id: string
          user_id: string
          profissional_id: string
          setor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profissional_id: string
          setor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profissional_id?: string
          setor_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profissional_setores_profissional_id_fkey'
            columns: ['profissional_id']
            isOneToOne: false
            referencedRelation: 'profissionais'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profissional_setores_setor_id_fkey'
            columns: ['setor_id']
            isOneToOne: false
            referencedRelation: 'setores'
            referencedColumns: ['id']
          },
        ]
      }
      coordenadores: {
        Row: {
          id: string
          user_id: string
          nome: string
          email: string | null
          telefone: string | null
          telefone2: string | null
          local_id: string | null
          detalhes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          email?: string | null
          telefone?: string | null
          telefone2?: string | null
          local_id?: string | null
          detalhes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          email?: string | null
          telefone?: string | null
          telefone2?: string | null
          local_id?: string | null
          detalhes?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'coordenadores_local_id_fkey'
            columns: ['local_id']
            isOneToOne: false
            referencedRelation: 'locais'
            referencedColumns: ['id']
          },
        ]
      }
      coordenador_setores: {
        Row: {
          id: string
          user_id: string
          coordenador_id: string
          setor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coordenador_id: string
          setor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          coordenador_id?: string
          setor_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'coordenador_setores_coordenador_id_fkey'
            columns: ['coordenador_id']
            isOneToOne: false
            referencedRelation: 'coordenadores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'coordenador_setores_setor_id_fkey'
            columns: ['setor_id']
            isOneToOne: false
            referencedRelation: 'setores'
            referencedColumns: ['id']
          },
        ]
      }
      financeiro_extrato_periodo: {
        Row: {
          id: string
          user_id: string
          profissional_id: string
          competencia: string
          fechado_em: string | null
          status_financeiro: string
          extrato_fechado: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profissional_id: string
          competencia: string
          fechado_em?: string | null
          status_financeiro?: string
          extrato_fechado?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profissional_id?: string
          competencia?: string
          fechado_em?: string | null
          status_financeiro?: string
          extrato_fechado?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'financeiro_extrato_periodo_profissional_id_fkey'
            columns: ['profissional_id']
            isOneToOne: false
            referencedRelation: 'profissionais'
            referencedColumns: ['id']
          },
        ]
      }
      plantoes: {
        Row: {
          id: string
          user_id: string
          local_id: string
          setor_id: string
          profissional_id: string | null
          data_plantao: string
          hora_inicio: string
          hora_fim: string
          status: string
          observacoes: string | null
          valor_plantao: number
          ajuste_financeiro: number
          observacao_ajuste: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          local_id: string
          setor_id: string
          profissional_id?: string | null
          data_plantao: string
          hora_inicio: string
          hora_fim: string
          status?: string
          observacoes?: string | null
          valor_plantao?: number
          ajuste_financeiro?: number
          observacao_ajuste?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          local_id?: string
          setor_id?: string
          profissional_id?: string | null
          data_plantao?: string
          hora_inicio?: string
          hora_fim?: string
          status?: string
          observacoes?: string | null
          valor_plantao?: number
          ajuste_financeiro?: number
          observacao_ajuste?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plantoes_local_id_fkey'
            columns: ['local_id']
            isOneToOne: false
            referencedRelation: 'locais'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plantoes_setor_id_fkey'
            columns: ['setor_id']
            isOneToOne: false
            referencedRelation: 'setores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plantoes_profissional_id_fkey'
            columns: ['profissional_id']
            isOneToOne: false
            referencedRelation: 'profissionais'
            referencedColumns: ['id']
          },
        ]
      }
      sciras_indicadores_cirurgicos: {
        Row: {
          id: string
          user_id: string
          mes_competencia: string
          total_cirurgias: number
          total_cirurgias_limpas: number
          num_infeccoes_cirurgias_limpas: number
          taxa_infeccao: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mes_competencia: string
          total_cirurgias: number
          total_cirurgias_limpas: number
          num_infeccoes_cirurgias_limpas: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mes_competencia?: string
          total_cirurgias?: number
          total_cirurgias_limpas?: number
          num_infeccoes_cirurgias_limpas?: number
          created_at?: string
        }
        Relationships: []
      }
      sciras_indicadores_uti: {
        Row: {
          id: string
          user_id: string
          mes_competencia: string
          setor: string
          total_pacientes_dia: number
          usuarios_acompanhados_busca_ativa: number
          taxa_busca_ativa: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mes_competencia: string
          setor: string
          total_pacientes_dia: number
          usuarios_acompanhados_busca_ativa: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mes_competencia?: string
          setor?: string
          total_pacientes_dia?: number
          usuarios_acompanhados_busca_ativa?: number
          created_at?: string
        }
        Relationships: []
      }
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
