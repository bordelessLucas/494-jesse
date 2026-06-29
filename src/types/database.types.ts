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
          profissional_id: string | null
          role: 'profissional' | 'auditor' | 'faturista'
          permissoes: Json
          must_change_password: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_user_id: string
          auth_user_id: string
          profissional_id?: string | null
          role?: 'profissional' | 'auditor' | 'faturista'
          permissoes?: Json
          must_change_password?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_user_id?: string
          auth_user_id?: string
          profissional_id?: string | null
          role?: 'profissional' | 'auditor' | 'faturista'
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
      certificados_profissionais: {
        Row: {
          id: string
          tenant_user_id: string
          profissional_id: string
          certificado_url: string
          senha_criptografada: string
          valido_ate: string
          titular_certificado: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          tenant_user_id: string
          profissional_id: string
          certificado_url: string
          senha_criptografada: string
          valido_ate: string
          titular_certificado?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          tenant_user_id?: string
          profissional_id?: string
          certificado_url?: string
          senha_criptografada?: string
          valido_ate?: string
          titular_certificado?: string | null
          criado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: 'certificados_profissionais_profissional_id_fkey'
            columns: ['profissional_id']
            isOneToOne: true
            referencedRelation: 'profissionais'
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
          confirmado_profissional: boolean
          data_confirmacao_profissional: string | null
          motivo_recusa: string | null
          lembrete_confirmacao_enviado: boolean
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
          confirmado_profissional?: boolean
          data_confirmacao_profissional?: string | null
          motivo_recusa?: string | null
          lembrete_confirmacao_enviado?: boolean
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
          confirmado_profissional?: boolean
          data_confirmacao_profissional?: string | null
          motivo_recusa?: string | null
          lembrete_confirmacao_enviado?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'escala_confirmacoes_plantao_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'escala_confirmacoes'
            referencedColumns: ['plantao_id']
          },
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
          pdf_assinado_url: string | null
          profissional_emissor_id: string | null
          assinado_em: string | null
          status_workflow: 'rascunho' | 'em_auditoria' | 'aprovado' | 'faturado'
          anexos_urls: string[]
          auditor_id: string | null
          faturista_id: string | null
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
          pdf_assinado_url?: string | null
          profissional_emissor_id?: string | null
          assinado_em?: string | null
          status_workflow?: 'rascunho' | 'em_auditoria' | 'aprovado' | 'faturado'
          anexos_urls?: string[]
          auditor_id?: string | null
          faturista_id?: string | null
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
          pdf_assinado_url?: string | null
          profissional_emissor_id?: string | null
          assinado_em?: string | null
          status_workflow?: 'rascunho' | 'em_auditoria' | 'aprovado' | 'faturado'
          anexos_urls?: string[]
          auditor_id?: string | null
          faturista_id?: string | null
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
      escala_confirmacoes: {
        Row: {
          id: string
          plantao_id: string
          profissional_id: string
          tenant_user_id: string
          status: string
          motivo_recusa: string | null
          confirmado_em: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plantao_id: string
          profissional_id: string
          tenant_user_id: string
          status?: string
          motivo_recusa?: string | null
          confirmado_em?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plantao_id?: string
          profissional_id?: string
          tenant_user_id?: string
          status?: string
          motivo_recusa?: string | null
          confirmado_em?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          id: string
          tenant_user_id: string
          usuario_id: string
          titulo: string
          mensagem: string
          tipo: string
          lida: boolean
          link_acao: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          tenant_user_id: string
          usuario_id: string
          titulo: string
          mensagem: string
          tipo: string
          lida?: boolean
          link_acao?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          tenant_user_id?: string
          usuario_id?: string
          titulo?: string
          mensagem?: string
          tipo?: string
          lida?: boolean
          link_acao?: string | null
          criado_em?: string
        }
        Relationships: []
      }
      suporte_artigos: {
        Row: {
          id: string
          tenant_user_id: string | null
          titulo: string
          palavras_chave: string[]
          conteudo: string
          ativo: boolean
          criado_em: string
        }
        Insert: {
          id?: string
          tenant_user_id?: string | null
          titulo: string
          palavras_chave?: string[]
          conteudo: string
          ativo?: boolean
          criado_em?: string
        }
        Update: {
          id?: string
          tenant_user_id?: string | null
          titulo?: string
          palavras_chave?: string[]
          conteudo?: string
          ativo?: boolean
          criado_em?: string
        }
        Relationships: []
      }
      suporte_conversas: {
        Row: {
          id: string
          tenant_user_id: string
          usuario_id: string
          status: string
          fluxo_atual_id: string | null
          criada_em: string
          atualizada_em: string
        }
        Insert: {
          id?: string
          tenant_user_id: string
          usuario_id: string
          status?: string
          fluxo_atual_id?: string | null
          criada_em?: string
          atualizada_em?: string
        }
        Update: {
          id?: string
          tenant_user_id?: string
          usuario_id?: string
          status?: string
          fluxo_atual_id?: string | null
          criada_em?: string
          atualizada_em?: string
        }
        Relationships: []
      }
      suporte_fluxo_opcoes: {
        Row: {
          id: string
          fluxo_id: string
          label: string
          proximo_fluxo_id: string | null
          ordem: number
          criado_em: string
        }
        Insert: {
          id?: string
          fluxo_id: string
          label: string
          proximo_fluxo_id?: string | null
          ordem?: number
          criado_em?: string
        }
        Update: {
          id?: string
          fluxo_id?: string
          label?: string
          proximo_fluxo_id?: string | null
          ordem?: number
          criado_em?: string
        }
        Relationships: []
      }
      suporte_fluxos: {
        Row: {
          id: string
          titulo: string
          mensagem: string
          tipo: string
          slug: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          titulo: string
          mensagem: string
          tipo?: string
          slug?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          titulo?: string
          mensagem?: string
          tipo?: string
          slug?: string | null
          criado_em?: string
        }
        Relationships: []
      }
      suporte_mensagens: {
        Row: {
          id: string
          conversa_id: string
          autor_tipo: string
          autor_id: string | null
          texto: string
          fluxo_opcao_id: string | null
          criada_em: string
        }
        Insert: {
          id?: string
          conversa_id: string
          autor_tipo: string
          autor_id?: string | null
          texto: string
          fluxo_opcao_id?: string | null
          criada_em?: string
        }
        Update: {
          id?: string
          conversa_id?: string
          autor_tipo?: string
          autor_id?: string | null
          texto?: string
          fluxo_opcao_id?: string | null
          criada_em?: string
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
      auth_membro_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_is_auditor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      auth_is_faturista: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      auth_is_coordenador_workflow: {
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
      upsert_certificado_profissional: {
        Args: {
          p_certificado_url: string
          p_senha_plana: string
          p_valido_ate: string
          p_titular_certificado?: string | null
        }
        Returns: string
      }
      criptografar_pin_certificado: {
        Args: {
          p_senha: string
        }
        Returns: string
      }
      descriptografar_pin_certificado: {
        Args: {
          p_senha_criptografada: string
        }
        Returns: string
      }
      plantao_duracao_horas: {
        Args: {
          p_data: string
          p_hora_inicio: string
          p_hora_fim: string
        }
        Returns: number
      }
      plantoes_por_mes: {
        Args: {
          p_local_id?: string | null
          p_meses?: number | null
        }
        Returns: {
          mes: string
          total: number
          realizados: number
          vagos: number
          custo: number
        }[]
      }
      profissionais_ranking: {
        Args: {
          p_competencia: string
          p_local_id?: string | null
        }
        Returns: {
          profissional_id: string
          nome: string
          horas: number
          plantoes: number
          valor_total: number
          taxa_presenca: number
        }[]
      }
      resumo_setor: {
        Args: {
          p_competencia: string
        }
        Returns: {
          setor_id: string
          setor_nome: string
          local_nome: string
          total_plantoes: number
          cobertos: number
          vagos: number
          custo: number
        }[]
      }
      profissionais_sobrecarga: {
        Args: {
          p_semana_inicio: string
        }
        Returns: {
          profissional_id: string
          nome: string
          horas_semana: number
          plantoes_semana: number
        }[]
      }
      confirmar_plantao: {
        Args: {
          p_plantao_id: string
          p_aceitar: boolean
          p_motivo?: string | null
          p_ip_address?: string | null
        }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
