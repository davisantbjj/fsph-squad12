-- Criar banco
CREATE DATABASE IF NOT EXISTS sistema_doacoes;
USE sistema_doacoes;


-- Tabela USUARIOS

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    telefone VARCHAR(20),
    data_nascimento DATE,
    cpf VARCHAR(20) UNIQUE,
    tipo_sanguineo VARCHAR(5),
    foto_perfil VARCHAR(255),
    status_ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    senha VARCHAR(255) NOT NULL
);


-- Tabela ENDERECOS

CREATE TABLE enderecos (
    id_endereco INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    cep VARCHAR(15),
    logradouro VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    endereco_principal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


-- Tabela DOACOES

CREATE TABLE doacoes (
    id_doacao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    data_doacao DATE,
    local_doacao VARCHAR(255),
    tipo_doacao VARCHAR(50),
    volume_coletado DECIMAL(10,2),
    status_doacao VARCHAR(50),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


-- Tabela CADASTRO_MEDULA

CREATE TABLE cadastro_medula (
    id_cadastro INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    hla_typing VARCHAR(255),
    status_cadastro VARCHAR(50),
    exames_medicos TEXT,
    ativo_registro BOOLEAN DEFAULT TRUE,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- Tabela COMPATIBILIDADE_MEDULA

CREATE TABLE compatibilidade_medula (
    id_compatibilidade INT AUTO_INCREMENT PRIMARY KEY,
    id_doador INT,
    id_receptor INT,
    percentual_compatibilidade DECIMAL(5,2),
    status_compatibilidade VARCHAR(50),
    data_teste DATE,
    resultado_detalhado TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_doador) REFERENCES cadastro_medula(id_cadastro),
    FOREIGN KEY (id_receptor) REFERENCES cadastro_medula(id_cadastro)
);


-- Tabela EXAMES_MEDULA

CREATE TABLE exames_medula (
    id_exame INT AUTO_INCREMENT PRIMARY KEY,
    id_cadastro INT,
    tipo_exame VARCHAR(100),
    data_exame DATE,
    resultado TEXT,
    status_exame VARCHAR(50),
    laboratorio VARCHAR(100),
    data_resultado TIMESTAMP,
    FOREIGN KEY (id_cadastro) REFERENCES cadastro_medula(id_cadastro)
);


-- Tabela POSTAGENS

CREATE TABLE postagens (
    id_postagem INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    conteudo_texto TEXT,
    imagem_url TEXT,
    curtidas INT DEFAULT 0,
    status_postagem VARCHAR(50),
    data_postagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


-- Tabela CURTIDAS_POSTAGEM

CREATE TABLE curtidas_postagem (
    id_curtida INT AUTO_INCREMENT PRIMARY KEY,
    id_postagem INT,
    id_usuario INT,
    data_curtida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_postagem) REFERENCES postagens(id_postagem),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


-- Tabela NOTIFICACOES

CREATE TABLE notificacoes (
    id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    tipo_notificacao VARCHAR(50),
    titulo VARCHAR(255),
    mensagem TEXT,
    lida BOOLEAN DEFAULT FALSE,
    envia_email BOOLEAN DEFAULT FALSE,
    data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


-- Tabela CONTADOR_DOACOES

CREATE TABLE contador_doacoes (
    id_contador INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    proxima_doacao_permitida DATE,
    dias_restantes INT,
    data_ultima_doacao DATE,
    total_doacoes INT DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


-- Tabela CAMPANHAS

CREATE TABLE campanhas (
    id_campanha INT AUTO_INCREMENT PRIMARY KEY,
    nome_campanha VARCHAR(255),
    descricao TEXT,
    data_inicio DATETIME,
    data_fim DATETIME,
    local_campanha VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(50),
    vagas_disponiveis INT,
    status_campanha VARCHAR(50)
);


-- Tabela PARTICIPANTES_CAMPANHA

CREATE TABLE participantes_campanha (
    id_participante INT AUTO_INCREMENT PRIMARY KEY,
    id_campanha INT,
    email_participante VARCHAR(255),
    telefone_participante VARCHAR(20),
    nome_participante VARCHAR(255),
    confirmado_email BOOLEAN DEFAULT FALSE,
    data_convite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_campanha) REFERENCES campanhas(id_campanha)
);


-- Tabela AGENDAMENTOS

CREATE TABLE agendamentos (
    id_agendamento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_campanha INT,
    data_agendamento DATETIME,
    tipo_agendamento VARCHAR(50),
    local_agendamento VARCHAR(255),
    -- Dados do doador persistidos para histórico do agendamento
    nome_doador VARCHAR(255),
    cpf_doador VARCHAR(20),
    telefone_doador VARCHAR(20),
    email_doador VARCHAR(255),
    data_nascimento_doador DATE,
    status_agendamento VARCHAR(50),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_campanha) REFERENCES campanhas(id_campanha)
);


-- Tabela PRE_TRIAGEM

CREATE TABLE pre_triagem (
    id_triagem INT AUTO_INCREMENT PRIMARY KEY,
    id_agendamento INT,
    peso DECIMAL(5,2),
    altura DECIMAL(5,2),
    pressao_arterial VARCHAR(50),
    apto_doacao BOOLEAN,
    observacoes TEXT,
    data_triagem TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_agendamento) REFERENCES agendamentos(id_agendamento)
);


-- Tabela TOKENS_OAUTH

CREATE TABLE tokens_oauth (
    id_token INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    provider VARCHAR(50),
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


-- Tabela ESTOQUE_SANGUE

CREATE TABLE estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grupoabo VARCHAR(2) NOT NULL,
    fatorrh CHAR(1) NOT NULL,
    updated DATETIME NOT NULL,
    situacao VARCHAR(20) NOT NULL,
    cobertura DECIMAL(5,2) NOT NULL,
    UNIQUE KEY unique_estoque (grupoabo, fatorrh)  -- evita duplicidade
);
