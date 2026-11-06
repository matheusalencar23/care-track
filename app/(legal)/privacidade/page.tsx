import { legalInfo } from "@/lib/legal";
import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDocument,
  LegalList,
  LegalSection,
  LegalTable,
} from "../components/legal-document";

export const metadata: Metadata = {
  title: "Política de Privacidade | CareTrack",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Política de Privacidade">
      <LegalSection id="quem-somos" title="1. Quem somos e qual o nosso papel">
        <p>
          O CareTrack é fornecido por {legalInfo.operatorName}, inscrito no{" "}
          {legalInfo.operatorDocument}, com endereço em{" "}
          {legalInfo.operatorAddress}. Esta política explica como tratamos
          dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei
          13.709/2018, LGPD).
        </p>
        <p>Tratamos dois grupos de dados, com papéis diferentes:</p>
        <LegalList>
          <li>
            <strong className="text-white">
              Dados dos profissionais que usam a plataforma:
            </strong>{" "}
            somos o <strong className="text-white">controlador</strong> e
            decidimos como eles são tratados, conforme esta política.
          </li>
          <li>
            <strong className="text-white">Dados dos pacientes:</strong> o
            profissional que os cadastra é o controlador, e nós somos o{" "}
            <strong className="text-white">operador</strong>. Tratamos esses
            dados apenas em nome dele, para prestar o serviço, conforme os{" "}
            <Link href="/termos" className="text-teal-300 underline">
              Termos de Uso
            </Link>
            .
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="dados-da-conta" title="2. Dados dos profissionais">
        <LegalTable
          headers={["Dado", "Para quê", "Base legal (LGPD)"]}
          rows={[
            [
              "Nome, e-mail, número e UF do COREN",
              "Criar e manter a conta, confirmar o e-mail e identificar o autor de cada registro, como exigem as normas do COFEN.",
              "Execução de contrato (art. 7º, V)",
            ],
            [
              "Senha",
              "Autenticar o acesso. É guardada de forma irreversível (hash): ninguém, nem nós, consegue lê-la.",
              "Execução de contrato (art. 7º, V)",
            ],
            [
              "Versão dos termos aceita, com data e hora",
              "Comprovar o aceite dos Termos de Uso.",
              "Execução de contrato e exercício regular de direitos (art. 7º, V e VI)",
            ],
            [
              "Endereço IP, data, hora e ação realizada (login, saída, acessos e alterações em prontuários)",
              "Segurança da conta, apuração de acessos indevidos e prestação de contas sobre quem acessou cada prontuário.",
              "Cumprimento de obrigação legal (art. 7º, II, e art. 37) e legítimo interesse (art. 7º, IX)",
            ],
          ]}
        />
        <p>
          Não pedimos dados além desses. Não usamos os seus dados para
          publicidade nem os vendemos.
        </p>
      </LegalSection>

      <LegalSection id="dados-dos-pacientes" title="3. Dados dos pacientes">
        <p>
          Os dados dos pacientes (como nome, data de nascimento, CPF, Cartão
          SUS, telefone, registros de evolução e arquivos) são dados pessoais
          sensíveis de saúde. Em relação a eles:
        </p>
        <LegalList>
          <li>
            Só o profissional que cadastrou o paciente tem acesso a eles na
            plataforma. Os pacientes não acessam o CareTrack.
          </li>
          <li>
            Nós os tratamos apenas para prestar o serviço: guardar, exibir e
            proteger. Não os usamos para outra finalidade, não os vendemos,
            não os compartilhamos para obter vantagem econômica e não os
            usamos para treinar sistemas de inteligência artificial.
          </li>
          <li>
            Nossa equipe só acessa esses dados quando for indispensável para
            manter a segurança e o funcionamento do serviço, a pedido do
            profissional ou por ordem judicial ou da Autoridade Nacional de
            Proteção de Dados (ANPD).
          </li>
          <li>
            Se você é paciente e quer exercer seus direitos sobre esses dados,
            procure o profissional que cuida de você, que é o controlador. Se
            entrar em contato conosco, encaminharemos o seu pedido a ele.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="compartilhamento" title="4. Com quem compartilhamos">
        <p>
          Usamos apenas os fornecedores necessários para o serviço funcionar,
          com contratos que os obrigam a proteger os dados:
        </p>
        <LegalTable
          headers={["Fornecedor", "O que faz", "Dados", "Local"]}
          rows={[
            [
              legalInfo.hostingProvider,
              "Hospedagem da plataforma, do banco de dados e dos arquivos",
              "Todos os dados da plataforma, protegidos",
              legalInfo.hostingLocation,
            ],
            [
              "Resend",
              "Envio dos e-mails de confirmação de cadastro e de redefinição de senha",
              "Nome e e-mail do profissional",
              "Estados Unidos",
            ],
          ]}
        />
        <p>
          O envio de e-mails pelo Resend é uma transferência internacional de
          dados, feita com base em {legalInfo.internationalTransferBasis}.
          Dados de pacientes nunca são enviados por e-mail.
        </p>
        <p>
          Também podemos fornecer dados quando a lei ou uma ordem judicial
          exigir.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="5. Cookies e armazenamento no navegador">
        <p>
          Usamos um único cookie, essencial, que mantém você conectado. Ele
          não pode ser lido por scripts da página e expira após 30 minutos sem
          uso ou 12 horas após o login.
        </p>
        <p>
          Não usamos cookies de publicidade nem de análise, não usamos
          ferramentas de rastreamento de terceiros e não gravamos dados de
          pacientes no armazenamento do navegador.
        </p>
      </LegalSection>

      <LegalSection id="retencao" title="6. Por quanto tempo guardamos">
        <LegalList>
          <li>
            Dados da conta: enquanto a conta existir e, depois do
            encerramento, por {legalInfo.accountRetention}, para cumprir
            obrigações legais e para a defesa em eventuais processos.
          </li>
          <li>
            Prontuários dos pacientes, incluindo o registro de quem os acessou:
            no mínimo 20 anos a partir do último registro (Lei 13.787/2018).
          </li>
          <li>
            Registro do aceite dos termos: pelo mesmo prazo dos dados da conta.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="seguranca" title="7. Segurança">
        <LegalList>
          <li>Conexão sempre criptografada (HTTPS).</li>
          <li>Senhas guardadas de forma irreversível.</li>
          <li>
            Sessão encerrada automaticamente após 30 minutos de inatividade.
          </li>
          <li>
            Isolamento dos dados de cada profissional no próprio banco de
            dados.
          </li>
          <li>
            Registros do histórico e de acessos que não podem ser apagados nem
            alterados.
          </li>
        </LegalList>
        <p>
          Se ocorrer um incidente de segurança que possa causar risco ou dano
          relevante, comunicaremos a ANPD e as pessoas afetadas, conforme o
          art. 48 da LGPD.
        </p>
      </LegalSection>

      <LegalSection id="direitos" title="8. Seus direitos">
        <p>Como titular de dados, você pode pedir (art. 18 da LGPD):</p>
        <LegalList>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>
            anonimização, bloqueio ou eliminação de dados desnecessários ou
            tratados em desacordo com a lei;
          </li>
          <li>portabilidade dos dados a outro fornecedor;</li>
          <li>
            informação sobre com quem compartilhamos seus dados;
          </li>
          <li>revisão de decisões tomadas só com base em tratamento automatizado.</li>
        </LegalList>
        <p>
          Alguns dados não podem ser apagados enquanto houver obrigação legal
          de guardá-los, como os prontuários e o registro de autoria dos
          registros de enfermagem (art. 16, I).
        </p>
        <p>
          Para exercer seus direitos, escreva para {legalInfo.privacyEmail}.
          Respondemos em até 15 dias. Você também pode apresentar reclamação à
          ANPD.
        </p>
      </LegalSection>

      <LegalSection id="encarregado" title="9. Encarregado de dados">
        <p>
          O encarregado pelo tratamento de dados pessoais (DPO) do CareTrack é{" "}
          {legalInfo.dpoName}, que pode ser contatado pelo e-mail{" "}
          {legalInfo.privacyEmail}.
        </p>
      </LegalSection>

      <LegalSection id="alteracoes" title="10. Alterações desta política">
        <p>
          Quando esta política mudar, publicaremos a nova versão com a data de
          atualização e avisaremos os profissionais cadastrados.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
