-- Criação da Base de Dados para AuditPro 360
-- Importe este ficheiro no phpMyAdmin da Hostinger

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Tabela `users`
--
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('Administrador','Comercial','Auditor','Técnico') NOT NULL,
  `pin` varchar(6) NOT NULL,
  `avatar` text DEFAULT NULL,
  `allowed_templates` json DEFAULT NULL, -- Guarda o array de permissões em formato JSON
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tabela `clients`
--
CREATE TABLE `clients` (
  `id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `nif` varchar(20) DEFAULT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text NOT NULL,
  `postal_code` varchar(20) NOT NULL,
  `locality` varchar(100) NOT NULL,
  `county` varchar(100) NOT NULL,
  `shop_name` varchar(150) DEFAULT NULL,
  `status` enum('Ativo','Inativo') DEFAULT 'Ativo',
  `last_visit` date DEFAULT NULL,
  `visit_frequency` int(11) DEFAULT 30,
  `account_manager_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tabela `reports`
--
CREATE TABLE `reports` (
  `id` varchar(50) NOT NULL,
  `client_id` varchar(50) NOT NULL,
  `auditor_id` varchar(50) NOT NULL,
  `type_key` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `contract_number` varchar(50) DEFAULT NULL,
  `route_number` varchar(50) DEFAULT NULL,
  `summary` text DEFAULT NULL,
  `client_observations` text DEFAULT NULL,
  `gps_lat` decimal(10,8) DEFAULT NULL,
  `gps_lng` decimal(11,8) DEFAULT NULL,
  `status` enum('Rascunho','Finalizado') DEFAULT 'Finalizado',
  `auditor_signature` longtext DEFAULT NULL, -- Base64 String
  `client_signature` longtext DEFAULT NULL, -- Base64 String
  `auditor_signer_name` varchar(100) DEFAULT NULL,
  `client_signer_name` varchar(100) DEFAULT NULL,
  `criteria_json` json DEFAULT NULL, -- Guarda os items da checklist e seus estados
  `order_json` json DEFAULT NULL, -- Guarda os items da encomenda e totais
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Tabela `company_settings` (Apenas 1 linha)
--
CREATE TABLE `company_settings` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `nif` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `locality` varchar(50) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `website` varchar(100) DEFAULT NULL,
  `logo_url` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Índices e Chaves Primárias
--
ALTER TABLE `users` ADD PRIMARY KEY (`id`);
ALTER TABLE `clients` ADD PRIMARY KEY (`id`);
ALTER TABLE `reports` ADD PRIMARY KEY (`id`);
ALTER TABLE `company_settings` ADD PRIMARY KEY (`id`);

--
-- Inserir Dados Iniciais (Opcional - Exemplo)
--
INSERT INTO `users` (`id`, `name`, `role`, `pin`, `allowed_templates`) VALUES
('u1', 'Administrador', 'Administrador', '123456', '["visit_comercial", "audit_pool", "audit_haccp", "maint_prev", "safety_check", "pest_control", "intervention_general"]');

COMMIT;
