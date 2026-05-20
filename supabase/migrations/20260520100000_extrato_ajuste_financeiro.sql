-- Extrato: renomear ajuste_glosa → ajuste_financeiro, observação do ajuste, flag extrato_fechado no período.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'plantoes'
      AND c.column_name = 'ajuste_glosa'
  ) THEN
    ALTER TABLE public.plantoes RENAME COLUMN ajuste_glosa TO ajuste_financeiro;
  END IF;
END $$;

ALTER TABLE public.plantoes
  ADD COLUMN IF NOT EXISTS ajuste_financeiro numeric(14, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.plantoes
  ADD COLUMN IF NOT EXISTS observacao_ajuste text;

COMMENT ON COLUMN public.plantoes.ajuste_financeiro IS
  'Ajuste financeiro da linha (negativo = desconto/glossa, positivo = acréscimo).';

COMMENT ON COLUMN public.plantoes.observacao_ajuste IS
  'Motivo ou nota do coordenador sobre o ajuste/glossa.';

ALTER TABLE public.financeiro_extrato_periodo
  ADD COLUMN IF NOT EXISTS extrato_fechado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.financeiro_extrato_periodo.extrato_fechado IS
  'Quando true, o extrato da competência para o profissional não aceita novas edições de glosas.';

UPDATE public.financeiro_extrato_periodo
SET extrato_fechado = true
WHERE fechado_em IS NOT NULL
  AND extrato_fechado = false;
