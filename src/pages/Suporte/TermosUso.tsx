import { Link } from 'react-router-dom'

export function TermosUsoPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-sm">
      <p className="text-sm font-medium text-slate-500 not-prose">PlantaoCheck · Suporte Legal</p>
      <h1>Termos de Uso</h1>
      <p className="lead">
        Última atualização: 1 de julho de 2026. Ao aceder ou utilizar a PlantaoCheck, você concorda
        com estes Termos de Uso.
      </p>

      <h2>1. Objeto</h2>
      <p>
        A PlantaoCheck é uma plataforma de gestão de plantões, escalas, ponto eletrônico e
        relatórios para organizações de saúde. O acesso é concedido mediante contrato entre a
        PlantaoCheck e a empresa contratante (tenant MASTER).
      </p>

      <h2>2. Contas e responsabilidades</h2>
      <ul>
        <li>
          O MASTER da conta é responsável pelos utilizadores convidados, permissões e veracidade
          dos cadastros.
        </li>
        <li>
          Cada utilizador deve manter credenciais confidenciais e notificar imediatamente uso não
          autorizado.
        </li>
        <li>
          Perfis de profissional, coordenador, auditor, faturista e visualizador possuem
          capacidades distintas definidas pela organização.
        </li>
      </ul>

      <h2>3. Uso aceitável</h2>
      <p>É proibido:</p>
      <ul>
        <li>Tentar aceder a dados de outros tenants ou contornar controles de segurança;</li>
        <li>Utilizar a plataforma para fins ilícitos ou incompatíveis com a assistência à saúde;</li>
        <li>Reproduzir, revender ou sublicenciar o software sem autorização escrita;</li>
        <li>Interferir na disponibilidade ou integridade do serviço.</li>
      </ul>

      <h2>4. Dados, geolocalização e documentos</h2>
      <p>
        O registo de ponto pode solicitar geolocalização do dispositivo para validação de
        presença, conforme descrito na{' '}
        <Link to="/suporte/politica-privacidade">Política de Privacidade</Link>. Documentos
        médicos e profissionais carregados na plataforma permanecem sob responsabilidade da
        organização contratante quanto à licitude da coleta e finalidade do tratamento.
      </p>

      <h2>5. Propriedade intelectual</h2>
      <p>
        A marca, interface, código e documentação da PlantaoCheck são protegidos. Os dados
        inseridos pelo cliente permanecem de propriedade da organização contratante.
      </p>

      <h2>6. Disponibilidade e suporte</h2>
      <p>
        Empregamos esforços comercialmente razoáveis para manter o serviço disponível. Manutenções
        programadas serão comunicadas quando possível. O suporte técnico é prestado pelos canais
        indicados no contrato ou widget de suporte da aplicação.
      </p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        A PlantaoCheck não substitui decisões clínicas ou jurídicas da organização. Na extensão
        permitida pela lei, não respondemos por danos indiretos decorrentes de uso indevido ou
        indisponibilidade temporária, salvo dolo ou culpa grave.
      </p>

      <h2>8. Rescisão</h2>
      <p>
        O acesso pode ser suspenso por violação destes termos ou encerramento contratual. Após
        rescisão, dados poderão ser exportados conforme acordado e posteriormente eliminados nos
        prazos legais.
      </p>

      <h2>9. Foro</h2>
      <p>
        Fica eleito o foro da comarca de domicílio da contratante, salvo disposição diversa em
        contrato específico, para dirimir controvérsias oriundas destes termos.
      </p>

      <p className="not-prose mt-8 text-sm text-slate-500">
        <Link to="/login" className="text-blue-600 hover:underline">
          Voltar ao login
        </Link>
        {' · '}
        <Link to="/suporte/politica-privacidade" className="text-blue-600 hover:underline">
          Política de Privacidade
        </Link>
      </p>
    </article>
  )
}
