# 🩸 HEMOSE Mobile - Sistema de Apoio à Doação de Sangue
### Projeto de Residência Tecnológica | Porto Digital + UNIT + HEMOSE

O **HEMOSE App** é uma solução Full Stack robusta desenvolvida pelo **Squad 12**. O desafio central foi modernizar a experiência do doador de sangue em Sergipe, criando um ecossistema digital que conecta o doador ao Centro de Hemoterapia de forma eficiente, segura e intuitiva.

---

## 🏗️ Arquitetura do Sistema

O projeto foi construído utilizando a estratégia de **Monorepo**, garantindo que o contrato entre o servidor e o aplicativo mobile seja sempre consistente.

* **Frontend Mobile**: Desenvolvido com **React Native (Expo)**, priorizando uma interface fluida e acessível para todos os tipos de usuários.
* **Backend**: API construída em **Node.js** com o framework **Express**, seguindo princípios de arquitetura RESTful.
* **Linguagem**: 100% **TypeScript**, garantindo segurança de tipos de ponta a ponta e reduzindo erros em tempo de execução.
* **Versionamento**: Fluxo de trabalho colaborativo via Git, com gestão de branches e code reviews.

---

## 🚀 Principais Funcionalidades

O aplicativo foi desenhado para cobrir toda a jornada do doador:

1.  **Triagem Digital (Anamnese)**: Formulário inteligente que pré-avalia a elegibilidade do doador antes mesmo dele sair de casa.
2.  **Histórico de Doações**: Visualização detalhada de doações anteriores e controle de prazos para a próxima doação.
3.  **Gestão de Agendamentos**: Integração com o calendário do HEMOSE para reserva de horários.
4.  **Feed de Campanhas**: Notificações em tempo real sobre estoques críticos de tipos sanguíneos específicos.
5.  **Carteira Digital**: Identificação do doador e tipo sanguíneo acessíveis via app.

---

## 🛠️ Stack Tecnológica

### **Mobile**
* **React Native / Expo**: Framework principal.
* **Expo Router**: Roteamento baseado em arquivos (moderno e intuitivo).
* **Axios**: Integração para consumo de APIs.
* **React Hook Form + Zod**: Para validações complexas de formulários de triagem.

### **Backend & Infra**
* **Node.js**: Ambiente de execução.
* **Express**: Framework web.
* **TypeScript**: Superconjunto JavaScript para robustez.
* **Shared Logic**: Pasta dedicada a interfaces e DTOs compartilhados entre as plataformas.

---

## 📂 Organização do Repositório

```text
├── backend/       # API RESTful, Middlewares e Regras de Negócio
├── mobile/        # App React Native (Expo) - Interface e UX
├── shared/        # Tipagens (Interfaces) e constantes compartilhadas
├── docs/          # Documentação de requisitos e fluxogramas
└── package.json   # Gestão de dependências do ecossistema
⚙️ Instalação e Execução
1. Clonagem e Dependências
Bash
git clone [https://github.com/davisantbjj/fsph-squad12.git](https://github.com/davisantbjj/fsph-squad12.git)
cd fsph-squad12
npm install
2. Rodando o Servidor (Backend)
Bash
cd backend
npm run dev
3. Rodando o App (Mobile)
Bash
cd mobile
npx expo start
Dica: Utilize o app Expo Go no seu celular para testar em tempo real.

🌟 Diferenciais do Projeto
Escalabilidade: Estrutura pronta para suportar novos módulos (ex: integração com outros hemocentros).

Segurança: Tratamento rigoroso de dados sensíveis de saúde.

Colaboração: Desenvolvido por 5 desenvolvedores sob metodologias ágeis.

👥 Squad 12 - Desenvolvedores
Davi Santana e equipe de residentes.

Este projeto é um marco na nossa formação tecnológica, unindo inovação, saúde pública e desenvolvimento de software de alto nível.
