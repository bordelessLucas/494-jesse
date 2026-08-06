import { Link } from 'react-router-dom'

export function PoliticaPrivacidadePage() {
  return (
    <article className="prose prose-slate mx-auto max-w-4xl ug-card p-8">
      <p className="text-sm font-semibold text-ug-muted not-prose">Unique Gestor · Suporte Legal</p>
      <h1>Política de Privacidade</h1>
      <p className="lead">
        Última atualização: 1 de julho de 2026. Esta política descreve como a Unique Gestor trata
        dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº
        13.709/2018).
      </p>

      <h2>1. Controlador e finalidade</h2>
      <p>
        A Unique Gestor atua como operadora de plataforma SaaS contratada pela sua organização
        (controladora dos dados dos profissionais e pacientes vinculados à operação). Processamos
        dados para gestão de escalas, plantões, ponto eletrônico, documentos profissionais e
        relatórios gerenciais.
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li>
          <strong>Identificação e contacto:</strong> nome, e-mail, telefone, conselho profissional
          (CRM/COREN), documentos de habilitação.
        </li>
        <li>
          <strong>Dados operacionais:</strong> escalas, confirmações, trocas, faltas, registos de
          ponto e remuneração.
        </li>
        <li>
          <strong>Geolocalização:</strong> coordenadas GPS capturadas no registo de ponto
          eletrônico, quando autorizado pelo dispositivo, para comprovar presença no local de
          trabalho. A coleta ocorre apenas no momento do registo, com base no consentimento
          informado e na necessidade contratual.
        </li>
        <li>
          <strong>Documentos médicos e administrativos:</strong> certificados, comprovantes e
          anexos enviados pelos profissionais ou pela coordenação, armazenados de forma cifrada e
          acessíveis apenas a perfis autorizados dentro do tenant.
        </li>
      </ul>

      <h2>3. Bases legais (LGPD)</h2>
      <p>Tratamos dados com fundamento em:</p>
      <ul>
        <li>Execução de contrato ou procedimentos preliminares (Art. 7º, V);</li>
        <li>Cumprimento de obrigação legal ou regulatória (Art. 7º, II);</li>
        <li>Legítimo interesse para segurança da operação e prevenção à fraude (Art. 7º, IX);</li>
        <li>Consentimento, quando aplicável a geolocalização e comunicações opcionais (Art. 7º, I).</li>
      </ul>

      <h2>4. Compartilhamento e retenção</h2>
      <p>
        Não vendemos dados pessoais. Informações podem ser processadas por infraestrutura em nuvem
        (Supabase/AWS) sob contratos de suboperadoria. Mantemos os dados enquanto durar a relação
        contratual e pelos prazos legais aplicáveis; após encerramento, aplicamos eliminação ou
        anonimização conforme solicitação da controladora.
      </p>

      <h2>5. Segurança</h2>
      <p>
        Adotamos isolamento multi-tenant (RLS), criptografia em trânsito (TLS), controles de acesso
        por perfil (MASTER, coordenador, profissional, visualizador) e auditoria de operações
        sensíveis.
      </p>

      <h2>6. Direitos do titular</h2>
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade,
        anonimização, eliminação ou revogação de consentimento contactando o DPO da sua
        organização ou o suporte Unique Gestor em{' '}
        <a href="mailto:privacidade@plantaocheck.com.br">privacidade@plantaocheck.com.br</a>.
      </p>

      <h2>7. Alterações</h2>
      <p>
        Esta política pode ser atualizada. Alterações relevantes serão comunicadas na plataforma ou
        por e-mail aos administradores do tenant.
      </p>

      <p className="not-prose mt-8 text-sm text-slate-500">
        <Link to="/login" className="text-blue-600 hover:underline">
          Voltar ao login
        </Link>
        {' · '}
        <Link to="/suporte/termos-uso" className="text-blue-600 hover:underline">
          Termos de Uso
        </Link>
      </p>
    </article>
  )
}
