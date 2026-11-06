import { legalInfo, TERMS_VERSION } from "@/lib/legal";
import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDocument,
  LegalList,
  LegalSection,
} from "../components/legal-document";

export const metadata: Metadata = {
  title: "Termos de Uso | CareTrack",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Termos de Uso">
      <LegalSection id="sobre" title="1. Sobre estes termos">
        <p>
          O CareTrack é uma plataforma para profissionais de enfermagem
          registrarem e acompanharem seus pacientes: dados cadastrais,
          histórico de evolução e arquivos. Ela é fornecida por{" "}
          {legalInfo.operatorName}, inscrito no {legalInfo.operatorDocument},
          com endereço em {legalInfo.operatorAddress} (&quot;CareTrack&quot;,
          &quot;nós&quot;).
        </p>
        <p>
          Ao criar sua conta, você aceita estes Termos de Uso (versão{" "}
          {TERMS_VERSION}) e declara que leu a{" "}
          <Link href="/privacidade" className="text-teal-300 underline">
            Política de Privacidade
          </Link>
          . Guardamos a versão aceita e a data e hora do aceite.
        </p>
      </LegalSection>

      <LegalSection id="quem-pode-usar" title="2. Quem pode usar">
        <LegalList>
          <li>
            Profissionais de enfermagem com inscrição ativa no Conselho Regional
            de Enfermagem (COREN). O número e a UF do COREN identificam você
            como autor dos registros.
          </li>
          <li>
            A conta é pessoal e intransferível. Não compartilhe sua senha nem
            deixe outra pessoa usar sua sessão.
          </li>
          <li>
            Você deve informar dados verdadeiros e mantê-los atualizados.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="papeis" title="3. Papéis na proteção de dados (LGPD)">
        <p>
          Os dados dos pacientes que você cadastra são dados pessoais
          sensíveis de saúde (Lei 13.709/2018, art. 5º, II). Em relação a eles:
        </p>
        <LegalList>
          <li>
            <strong className="text-white">Você é o controlador:</strong> decide
            quais dados registrar e para quê, e responde pela base legal do
            tratamento, em regra a tutela da saúde em procedimento realizado
            por profissional de saúde (art. 11, II, &quot;f&quot;).
          </li>
          <li>
            <strong className="text-white">O CareTrack é o operador:</strong>{" "}
            trata esses dados apenas em seu nome, para prestar o serviço, e
            segue suas instruções (art. 39).
          </li>
        </LegalList>
        <p>
          Os dados da sua conta (nome, e-mail, COREN) são tratados pelo
          CareTrack como controlador, conforme a Política de Privacidade.
        </p>
      </LegalSection>

      <LegalSection id="suas-responsabilidades" title="4. Suas responsabilidades">
        <LegalList>
          <li>
            Manter o sigilo profissional (Código de Ética dos Profissionais de
            Enfermagem, Resolução COFEN 564/2017) sobre tudo o que acessar na
            plataforma.
          </li>
          <li>
            Registrar apenas os dados necessários ao cuidado do paciente.
          </li>
          <li>
            Informar os pacientes sobre o tratamento dos dados deles e atender
            aos pedidos que fizerem como titulares (art. 18 da LGPD). O
            CareTrack apoia você nesses pedidos.
          </li>
          <li>
            Obter e registrar a autorização de uso de imagem do paciente, ou do
            responsável legal, antes de anexar fotos ou vídeos.
          </li>
          <li>
            Encerrar a sessão ao usar computadores compartilhados e avisar o
            CareTrack se suspeitar de acesso indevido à sua conta.
          </li>
          <li>
            Responder pelo conteúdo dos registros que fizer.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="registros" title="5. Como funcionam os registros">
        <p>
          O CareTrack segue as regras de registro de enfermagem (Resolução
          COFEN 429/2012) e de prontuário eletrônico (Lei 13.787/2018):
        </p>
        <LegalList>
          <li>
            Cada registro guarda o autor (nome e COREN) e a data e hora do
            servidor, que não podem ser alteradas.
          </li>
          <li>
            Editar um registro cria uma versão nova. As versões anteriores
            continuam guardadas e podem ser consultadas.
          </li>
          <li>
            Um registro feito por engano pode ser anulado, com motivo. A
            anulação é definitiva, e o registro anulado continua guardado.
          </li>
          <li>
            &quot;Excluir&quot; um paciente significa arquivá-lo: ele sai das
            listas, mas o prontuário é mantido pelo prazo legal de guarda, de
            no mínimo 20 anos a partir do último registro.
          </li>
          <li>
            Nada do histórico de um paciente é apagado pela plataforma.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="nossas-responsabilidades" title="6. O que o CareTrack faz pelos seus dados">
        <LegalList>
          <li>
            Trata os dados dos pacientes só para prestar o serviço. Não os
            vende, não os compartilha para obter vantagem econômica (art. 11,
            § 4º, da LGPD), não os usa em publicidade nem para treinar
            sistemas de inteligência artificial.
          </li>
          <li>
            Isola os dados de cada profissional: só você acessa os pacientes
            que cadastrou.
          </li>
          <li>
            Adota medidas de segurança (art. 46): conexão criptografada,
            senhas guardadas de forma irreversível, encerramento automático da
            sessão por inatividade e registro de quem acessou cada prontuário.
          </li>
          <li>
            Avisa você em até {legalInfo.incidentNoticeDeadline} sobre
            incidentes de segurança que afetem os dados dos seus pacientes,
            para que você possa cumprir suas obrigações de comunicação (art.
            48).
          </li>
          <li>
            Só usa outros fornecedores (suboperadores) para hospedagem e envio
            de e-mails, listados na Política de Privacidade, com as mesmas
            obrigações de proteção.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="limites" title="7. O que o CareTrack não faz">
        <LegalList>
          <li>
            Não sugere diagnósticos, condutas ou tratamentos e não substitui o
            julgamento profissional.
          </li>
          <li>
            Não é um canal de comunicação com pacientes: eles não têm acesso à
            plataforma.
          </li>
          <li>
            Não garante funcionamento ininterrupto. Podem ocorrer pausas para
            manutenção ou por falhas, e por isso a plataforma não deve ser o
            único meio de acesso a informações de que você precise com
            urgência.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection id="encerramento" title="8. Suspensão e encerramento da conta">
        <p>
          Você pode pedir o encerramento da sua conta pelo e-mail{" "}
          {legalInfo.supportEmail}. Como os prontuários precisam ser guardados
          pelo prazo legal, encerrar a conta não apaga os dados dos pacientes:
          eles continuam guardados e disponíveis para você ou para quem a lei
          indicar durante esse prazo.
        </p>
        <p>
          Podemos suspender uma conta usada em desacordo com estes termos ou
          com a lei, como no compartilhamento de acesso ou no uso por quem não
          é profissional de enfermagem.
        </p>
      </LegalSection>

      <LegalSection id="alteracoes" title="9. Alterações destes termos">
        <p>
          Quando estes termos mudarem, publicaremos a nova versão com a data
          de atualização e avisaremos você. Se a mudança for relevante,
          pediremos um novo aceite.
        </p>
      </LegalSection>

      <LegalSection id="lei" title="10. Lei aplicável e contato">
        <p>
          Estes termos seguem as leis brasileiras. Fica eleito o foro da
          comarca de {legalInfo.forum} para resolver eventuais conflitos,
          ressalvados os casos em que a lei determine outro foro.
        </p>
        <p>
          Dúvidas sobre estes termos: {legalInfo.supportEmail}. Assuntos de
          privacidade e proteção de dados: {legalInfo.privacyEmail}.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
