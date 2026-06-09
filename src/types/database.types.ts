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
      empresas: {
        Row: {
          id: string
          owner_user_id: string
          nome: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_user_id: string
          nome: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_user_id?: string
          nome?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contas_membros: {
        Row: {
          id: string
          tenant_user_id: string
          auth_user_id: string
          profissional_id: string
          role: string
          permissoes: Json
          must_change_password: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_user_id: string
          auth_user_id: string
          profissional_id: string
          role?: string
          permissoes?: Json
          must_change_password?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_user_id?: string
          auth_user_id?: string
          profissional_id?: string
          role?: string
          permissoes?: Json
          must_change_password?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          id: string
          user_id: string
          auth_user_id: string | null
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
          auth_user_id?: string | null
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
          auth_user_id?: string | null
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
      documentos_usuarios: {
        Row: {
          id: string
          user_id: string
          profissional_id: string
          tipo: string
          nome_arquivo: string
          storage_path: string
          mime_type: string
          status: string
          motivo_rejeicao: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profissional_id: string
          tipo: string
          nome_arquivo: string
          storage_path: string
          mime_type?: string
          status?: string
          motivo_rejeicao?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profissional_id?: string
          tipo?: string
          nome_arquivo?: string
          storage_path?: string
          mime_type?: string
          status?: string
          motivo_rejeicao?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documentos_usuarios_profissional_id_fkey'
            columns: ['profissional_id']
            isOneToOne: false
            referencedRelation: 'profissionais'
            referencedColumns: ['id']
          },
        ]
      }
      registro_ponto: {
        Row: {
          id: string
          user_id: string
          profissional_id: string
          plantao_id: string
          entrada_em: string
          saida_em: string | null
          latitude_entrada: number
          longitude_entrada: number
          latitude_saida: number | null
          longitude_saida: number | null
          distancia_entrada_metros: number | null
          distancia_saida_metros: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profissional_id: string
          plantao_id: string
          entrada_em: string
          saida_em?: string | null
          latitude_entrada: number
          longitude_entrada: number
          latitude_saida?: number | null
          longitude_saida?: number | null
          distancia_entrada_metros?: number | null
          distancia_saida_metros?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profissional_id?: string
          plantao_id?: string
          entrada_em?: string
          saida_em?: string | null
          latitude_entrada?: number
          longitude_entrada?: number
          latitude_saida?: number | null
          longitude_saida?: number | null
          distancia_entrada_metros?: number | null
          distancia_saida_metros?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'registro_ponto_profissional_id_fkey'
            columns: ['profissional_id']
            isOneToOne: false
            referencedRelation: 'profissionais'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registro_ponto_plantao_id_fkey'
            columns: ['plantao_id']
            isOneToOne: false
            referencedRelation: 'plantoes'
            referencedColumns: ['id']
          },
        ]
      }
      escala_modelo_itens: {
        Row: {
          id: string
          user_id: string
          modelo_id: string
          semana_index: number
          dia_semana: number
          hora_inicio: string
          hora_fim: string
          duracao_minutos: number | null
          tipo: string
          profissional_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          modelo_id: string
          semana_index?: number
          dia_semana: number
          hora_inicio: string
          hora_fim: string
          duracao_minutos?: number | null
          tipo?: string
          profissional_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          modelo_id?: string
          semana_index?: number
          dia_semana?: number
          hora_inicio?: string
          hora_fim?: string
          duracao_minutos?: number | null
          tipo?: string
          profissional_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'escala_modelo_itens_modelo_id_fkey'
            columns: ['modelo_id']
            isOneToOne: false
            referencedRelation: 'escala_modelos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'escala_modelo_itens_profissional_id_fkey'
            columns: ['profissional_id']
            isOneToOne: false
            referencedRelation: 'profissionais'
            referencedColumns: ['id']
          },
        ]
      }
      escala_modelos: {
        Row: {
          id: string
          user_id: string
          local_id: string
          setor_id: string
          nome: string
          quantidade_semanas: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          local_id: string
          setor_id: string
          nome?: string
          quantidade_semanas?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          local_id?: string
          setor_id?: string
          nome?: string
          quantidade_semanas?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'escala_modelos_local_id_fkey'
            columns: ['local_id']
            isOneToOne: false
            referencedRelation: 'locais'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'escala_modelos_setor_id_fkey'
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
      remuneracao_acrescimos: {
        Row: {
          id: string
          user_id: string
          nome: string
          tipo_calculo: string
          valor: number
          gatilho: string
          especialidade_contem: string | null
          ativo: boolean
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          tipo_calculo: string
          valor?: number
          gatilho: string
          especialidade_contem?: string | null
          ativo?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          tipo_calculo?: string
          valor?: number
          gatilho?: string
          especialidade_contem?: string | null
          ativo?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      remuneracao_feriados: {
        Row: {
          id: string
          user_id: string
          data_feriado: string
          nome: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          data_feriado: string
          nome?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          data_feriado?: string
          nome?: string
          created_at?: string
        }
        Relationships: []
      }
      remuneracao_tipos_plantao: {
        Row: {
          id: string
          user_id: string
          nome: string
          descricao: string | null
          multiplicador: number
          ativo: boolean
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          descricao?: string | null
          multiplicador?: number
          ativo?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          descricao?: string | null
          multiplicador?: number
          ativo?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
          remuneracao_tipo_id: string | null
          ajuste_financeiro: number
          observacao_ajuste: string | null
          disponivel_mural: boolean
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
          remuneracao_tipo_id?: string | null
          ajuste_financeiro?: number
          observacao_ajuste?: string | null
          disponivel_mural?: boolean
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
          remuneracao_tipo_id?: string | null
          ajuste_financeiro?: number
          observacao_ajuste?: string | null
          disponivel_mural?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plantoes_remuneracao_tipo_id_fkey'
            columns: ['remuneracao_tipo_id']
            isOneToOne: false
            referencedRelation: 'remuneracao_tipos_plantao'
            referencedColumns: ['id']
          },
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
      plantoes_trocas_solicitacoes: {
        Row: {
          id: string
          tenant_user_id: string
          plantao_id: string
          anunciante_profissional_id: string
          candidato_profissional_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_user_id: string
          plantao_id: string
          anunciante_profissional_id: string
          candidato_profissional_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_user_id?: string
          plantao_id?: string
          anunciante_profissional_id?: string
          candidato_profissional_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plantoes_trocas_solicitacoes_plantao_id_fkey'
            columns: ['plantao_id']
            isOneToOne: false
            referencedRelation: 'plantoes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plantoes_trocas_solicitacoes_anunciante_profissional_id_fkey'
            columns: ['anunciante_profissional_id']
            isOneToOne: false
            referencedRelation: 'profissionais'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plantoes_trocas_solicitacoes_candidato_profissional_id_fkey'
            columns: ['candidato_profissional_id']
            isOneToOne: false
            referencedRelation: 'profissionais'
            referencedColumns: ['id']
          },
        ]
      }
      relatorios_historico: {
        Row: {
          id: string
          user_id: string
          tipo_relatorio: string
          titulo: string
          competencia: string
          local_ref: string
          local_nome: string
          cabecalho: Json
          snapshot: Json
          impresso_em: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo_relatorio: string
          titulo: string
          competencia: string
          local_ref: string
          local_nome: string
          cabecalho?: Json
          snapshot?: Json
          impresso_em?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tipo_relatorio?: string
          titulo?: string
          competencia?: string
          local_ref?: string
          local_nome?: string
          cabecalho?: Json
          snapshot?: Json
          impresso_em?: string
          created_at?: string
        }
        Relationships: []
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
    Functions: {
      auth_tenant_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      membro_profissional_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_is_titular_conta: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      auth_is_master: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      auth_empresa_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
