import { User, UserRole, Client, Report, AuditCriteria, ReportTemplate, ReportTypeKey, CompanySettings } from './types';

// Red Drop Logo (SVG converted to Base64)
const RED_DROP_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFE0lEQVR4nO2aS2xcVRSGv3PfmXbm0U6btjSplIdCRdXGjQ0SEQ2IDStWQGILDSwQS2UBiQUSQxFCAiHWbJAoTEBFgqgCRV1UiJBCkRCDRFRJ00ye0/HMeBzfunMzk5kkE9vjTJyRre+453z/d8+95/4zYwxFiiiijCg87Q40Qj0HkXoOIvUcROo5iNRzEKn/O4i0t7e3TU1N/Vyv19+r1+sH6/X6m319ffsWFhbeu3z58k/N/r7RjI6O7t2zZ8/XQ0NDx/r6+o6Uy+VdAMYYVlZWqK6u0t3d/V1nZ+eXAwMDL8/Ozn574sSJX5r1nZYQ1/f9F0ql0otDQ0Mv7dy5c4/v+wAIIQAQQsQ/B4DrupTL5Z/27Nnz8tjY2EszMzNfNwszLSG1Wu2DvXv3vnjgwIHdQogYxBjj/xYj3/d37d279+WpqamPGo2GUxTS3t7eNjEx8fzIyMhL5XJ5F/F1sZ14oVDoLBQKpVKpdHpkZOQl3/efX1lZ+bopQZqGjI6O7t27d++3Q0NDxwDI5/MMDAzQ1dVFoVDo9DzvWKlUemVkZOSlixcvfnp937k+pL29vW1iYuK5gYGBFwF6e3t5+eWXefrpp3n66acBODgwMPCi7/vP34y9awu5fvB9/4WhoaHjAF1dXRw/fpzTp0/T1dXV8Z/v+y8MDe38bHZ29tsbBbkmpFqtHuzr6ztSLpd3AfT29vLWW29x/PhxCoUCAH19fUeGhoZempmZ+bIpwVqCjI6O7t2zZ8/XQoiY0N7ezltvvRXDFAoFhBA7h4aGjrmu+3KzY7UlpFwu7+rr6zsSj8z09DTHjx/n9OnTdHV1AfT19R3ZtWvX4QsXLvzYjFAtQarV6sH+/v7340J88cUXHD9+nNOnT8cwQ0NDx3zff35mZua7ZgRpClEqlV7s7u7+BsB1XQ4fPsxbb71FoVCAeJTu7u5vBgYGXpybm/u+WbFagriu+1K5XN4F4Hkehw8fjuEKhQJCyJjQ29v7za5du56fm5v7uRnBmkJ833+hVCq9GAvR1dXF22+/zcTEBAcPHozhCoXCS8Vi8bnZ2dlvmhWsJcT1ff+FYrH4fC6Xiwnt7e289dZbHD9+nPZ4lOYLhUJn3/efX1lZ+bopwZpCqtXqwV27dh0G8DyPo0ePcvz4cQ4ePAjQ8Z/jOM/7vv/89evXf2xKsJYgY2Nj+33ffz6Xy8WE3t5e3nrrLU6fPk1PTw9ApVLZ5fv+C9euXfuhGeFaQorF4nPd3d3fAHiH4fDhwxw/fpyuri6Anp6eI67rvlStVn9uRriWkEql0ul53rF8Ph8TeHp6euL7oVDo9DzvWKlUenF1dfX7ZgRrcaRQKJRKpdLpeJTu7u6Y0IEDB3bVavXgwsLCj80I1hSkv7//23w+HxN6enri+6FQ6CwajZ9u3LhxuhmhWoK4rrtTLpd3xYQAeJ7H0aNHY0L5fB7Xde+s1Wq/NiNUSxAhRBedmEKhQKFQwHVdQOzhdF33TjPCtQQxxtCNu278N8aY677fTpx/i5D/c4h+G/w/Qoyh67p3Go3GT80+v9m/7B3Xda9Vq9Wfm31+s4vRdV3q9fp7zT6/Kcj169d/rFarP9/0s2uEeg4i9RxE6jmI1HMQqe9b5F+BvFqQk7X9OwAAAABJRU5ErkJggg==";

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: 'AuditPro Solutions, Lda',
  nif: '500100200',
  address: 'Parque Tecnológico, Edifício A',
  postalCode: '4000-123',
  locality: 'Porto',
  email: 'geral@auditpro.pt',
  phone: '222 333 444',
  website: 'www.auditpro.pt',
  logoUrl: RED_DROP_LOGO
};

// --- Templates Definitions ---
export const REPORT_TEMPLATES: Record<ReportTypeKey, ReportTemplate> = {
  'visit_comercial': {
    key: 'visit_comercial',
    label: '1. Visita Comercial / Prospeção',
    defaultCriteria: [
      { label: 'Apresentação da Empresa e Serviços' },
      { label: 'Levantamento de Necessidades do Cliente' },
      { label: 'Análise de Concorrência no Local' },
      { label: 'Recetividade à Proposta Comercial' },
      { label: 'Agendamento de Próxima Reunião' }
    ]
  },
  'audit_pool': {
    key: 'audit_pool',
    label: '2. Relatório de Intervenção (Piscinas)',
    defaultCriteria: [
      { label: 'Identificação da Piscina' },
      { label: 'Leitura: Cloro Livre (mg/l)' },
      { label: 'Leitura: pH' },
      { label: 'Leitura: Temp. (°C)' },
      { label: 'Aspiração da Piscina' },
      { label: 'Limpeza das paredes com escova' },
      { label: 'Remoção de particulas flutuantes (insetos, folhas etc.)' },
      { label: 'Limpeza dos cestos do Skimmer' },
      { label: 'Limpeza do pré-filtro' },
      { label: 'Tempo de lavagem do pré-filtro (min.)' },
      { label: 'Lavagem do Filtro de Areia' },
      { label: 'Adição de Cloro/bromo' },
      { label: 'Adição de corretor de pH' },
      { label: 'Adição de algicida' },
      { label: 'Verificação de Níveis de Reagentes' },
      { label: 'Verificação de Bombas Doseadoras' }
    ]
  },
  'audit_haccp': {
    key: 'audit_haccp',
    label: '3. Auditoria HACCP (Segurança Alimentar)',
    defaultCriteria: [
      { label: 'Higiene Pessoal dos Manipuladores' },
      { label: 'Controlo de Temperaturas (Frio/Quente)' },
      { label: 'Rastreabilidade dos Produtos' },
      { label: 'Limpeza e Desinfeção de Superfícies' },
      { label: 'Controlo de Pragas' },
      { label: 'Gestão de Resíduos' }
    ]
  },
  'maint_prev': {
    key: 'maint_prev',
    label: '4. Manutenção Preventiva Geral',
    defaultCriteria: [
      { label: 'Quadro Elétrico e Disjuntores' },
      { label: 'Iluminação Interior e Exterior' },
      { label: 'Sistema de AVAC (Ar Condicionado)' },
      { label: 'Rede de Águas e Esgotos' },
      { label: 'Estruturas (Portas, Janelas, Paredes)' }
    ]
  },
  'safety_check': {
    key: 'safety_check',
    label: '5. Verificação de Segurança (HST)',
    defaultCriteria: [
      { label: 'Extintores (Validade e Acesso)' },
      { label: 'Sinalética de Emergência' },
      { label: 'Desobstrução de Saídas de Emergência' },
      { label: 'Uso de EPIs' },
      { label: 'Kits de Primeiros Socorros' }
    ]
  },
  'pest_control': {
    key: 'pest_control',
    label: '6. Relatório de Intervenção (Pragas)',
    defaultCriteria: [
      // VISITA TYPE
      { label: 'TIPO DE VISITA: Rotina' },
      { label: 'TIPO DE VISITA: Reclamação' },
      { label: 'TIPO DE VISITA: Consolidação' },
      { label: 'TIPO DE VISITA: Inspeção' },
      
      // TARGETS
      { label: 'ALVO: Controlo de Roedores' },
      { label: 'ALVO: Controlo de Rastejantes' },
      { label: 'ALVO: Controlo de Insetos Voadores' },
      { label: 'ALVO: Controlo de Aves Urbanas' },
      
      // RODENT CONTROL DETAILS
      { label: 'ROEDORES: Engodo Totalmente Consumido (Indicar estações nas obs)' },
      { label: 'ROEDORES: Engodo Parcialmente Consumido (Indicar estações nas obs)' },
      { label: 'ROEDORES: Subs. Elementos de Motorização' },
      { label: 'ROEDORES: Subs. Engodo em todos os postos' },
      
      // BIOCIDES (RODENTS)
      { label: 'BIOCIDA (Roedores): Talon' },
      { label: 'BIOCIDA (Roedores): Bromadol Isco' },
      { label: 'BIOCIDA (Roedores): Vabitox Facum' },
      
      // CRAWLING INSECTS DETAILS
      { label: 'RASTEJANTES: Biocida Solfac 50 EW' },
      { label: 'RASTEJANTES: Biocida Agita 10 WG' },
      { label: 'RASTEJANTES: Biocida K-Othrine SC 25' },
      { label: 'RASTEJANTES: Instalador de Insecto-Caçador' },
      { label: 'RASTEJANTES: Substituição de Placas' },
      
      // BIRDS
      { label: 'AVES: Sistema de Captura' },
      { label: 'AVES: Pino Dissuador' },
      { label: 'AVES: Rede Contra Aves' },
      
      // RECOMMENDATIONS / STATUS
      { label: 'Estações deslocadas sem consentimento' },
      { label: 'Entrega das Fichas de Segurança Biocidas' },
      { label: 'Entrega pelo cliente da planta do local' },
      { label: 'Entrega do Manual do Controlo de Pragas' },
      { label: 'Equipamento/Sistema Danificado' },
      { label: 'Instruções/Avisos Danificados ou Removidos' },
      { label: 'Substituição de Instruções/Avisos' },
      { label: 'Entrega ao cliente de Mapa de Localização de Iscos' },
      { label: 'Equipamento/Sistema alterado sem consentimento' }
    ]
  },
  'intervention_general': {
    key: 'intervention_general',
    label: '7. Relatório de Intervenção (Geral)',
    defaultCriteria: [] // Intentionally empty for free text report
  }
};

// --- Mock Data ---

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', name: 'Ana Silva', role: UserRole.ADMIN, 
    avatar: 'https://picsum.photos/id/64/100/100',
    pin: '123456',
    allowedTemplates: ['visit_comercial', 'audit_pool', 'audit_haccp', 'maint_prev', 'safety_check', 'pest_control', 'intervention_general'] 
  },
  { 
    id: 'u2', name: 'Carlos Santos', role: UserRole.AUDITOR, 
    avatar: 'https://picsum.photos/id/91/100/100',
    pin: '111111',
    allowedTemplates: ['audit_pool', 'audit_haccp', 'safety_check', 'pest_control', 'intervention_general']
  },
  { 
    id: 'u3', name: 'Bruno Dias', role: UserRole.COMERCIAL, 
    avatar: 'https://picsum.photos/id/177/100/100',
    pin: '222222',
    allowedTemplates: ['visit_comercial']
  },
  { 
    id: 'u4', name: 'Daniela Faria', role: UserRole.TECNICO, 
    avatar: 'https://picsum.photos/id/237/100/100',
    pin: '333333',
    allowedTemplates: ['audit_pool', 'maint_prev', 'pest_control', 'intervention_general']
  },
];

export const MOCK_CLIENTS: Client[] = [
  { 
    id: 'c1', name: 'Restaurante O Marisco', nif: '501234567', 
    address: 'Rua do Mar, 12', postalCode: '1200-001', locality: 'Lisboa', county: 'Lisboa', shopName: 'Marisco Chiado',
    contactPerson: 'Sr. Manuel', email: 'manuel@marisco.pt', phone: '912345678', status: 'Ativo', lastVisit: '2023-10-15',
    accountManagerId: 'u3', // Assigned to Bruno Dias
    visitFrequency: 30
  },
  { 
    id: 'c2', name: 'Hotel Central', nif: '502345678', 
    address: 'Av. da Liberdade, 200', postalCode: '1250-100', locality: 'Lisboa', county: 'Lisboa',
    contactPerson: 'Dra. Sofia', email: 'sofia@hotelcentral.pt', phone: '213456789', status: 'Ativo', lastVisit: '2023-11-02',
    accountManagerId: 'u3', // Assigned to Bruno Dias
    visitFrequency: 45
  },
  { 
    id: 'c3', name: 'Oficina Turbo', nif: '503456789', 
    address: 'Zona Industrial, Lote 4', postalCode: '4400-001', locality: 'Maia', county: 'Maia', shopName: 'Turbo Norte',
    contactPerson: 'Eng. Rui', email: 'rui@turbo.pt', phone: '934567890', status: 'Inativo', lastVisit: '2023-08-20',
    visitFrequency: 60
  },
  { 
    id: 'c4', name: 'Clube de Natação', nif: '504567890', 
    address: 'Complexo Desportivo', postalCode: '3000-111', locality: 'Coimbra', county: 'Coimbra',
    contactPerson: 'Joana', email: 'joana@natacao.pt', phone: '967890123', status: 'Ativo', lastVisit: '2023-12-05',
    visitFrequency: 30
  },
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 'r1',
    clientId: 'c1',
    clientName: 'Restaurante O Marisco',
    clientShopName: 'Marisco Chiado',
    auditorId: 'u2',
    auditorName: 'Carlos Santos',
    date: '2023-10-15',
    startTime: '14:30',
    endTime: '16:00',
    typeKey: 'audit_haccp',
    typeName: '3. Auditoria HACCP (Segurança Alimentar)',
    status: 'Finalizado',
    summary: 'O espaço encontra-se em boas condições gerais. Recomenda-se atenção à validade de alguns produtos secos.',
    auditorSignerName: 'Carlos Santos',
    auditorSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==', // Mock
    clientSignerName: 'Sr. Manuel',
    clientSignature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==', // Mock
    criteria: [
      { id: 'crit1', label: 'Higiene Pessoal dos Manipuladores', status: 'pass', notes: 'Muito bom' },
      { id: 'crit2', label: 'Controlo de Temperaturas', status: 'pass', notes: '' },
      { id: 'crit5', label: 'Gestão de Resíduos', status: 'fail', notes: 'Contentor exterior aberto.' },
    ]
  }
];