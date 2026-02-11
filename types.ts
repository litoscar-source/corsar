export enum UserRole {
  ADMIN = 'Administrador',
  COMERCIAL = 'Comercial',
  AUDITOR = 'Auditor',
  TECNICO = 'Técnico'
}

export type ReportTypeKey = 'visit_comercial' | 'audit_pool' | 'audit_haccp' | 'maint_prev' | 'safety_check' | 'pest_control' | 'intervention_general';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  pin: string; // 6 digit pin
  allowedTemplates: ReportTypeKey[]; // Access control
}

export interface Client {
  id: string;
  name: string;
  nif?: string; // Tax ID
  contactPerson: string;
  email: string;
  phone: string;
  
  // Address Fields
  address: string;
  postalCode: string;
  locality: string; // Localidade
  county: string;   // Concelho
  shopName?: string; // Nome da Loja (se aplicável)
  
  lastVisit?: string;
  status: 'Ativo' | 'Inativo';
}

export interface AuditCriteria {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'na' | null;
  notes: string;
}

export interface ReportTemplate {
  key: ReportTypeKey;
  label: string;
  defaultCriteria: { label: string }[];
}

export interface Report {
  id: string;
  clientId: string;
  clientName: string;
  clientShopName?: string;
  auditorId: string;
  auditorName: string;
  date: string;
  startTime: string;
  endTime: string;
  contractNumber?: string;
  routeNumber?: string;
  typeKey: ReportTypeKey;
  typeName: string;
  criteria: AuditCriteria[];
  summary: string;
  clientObservations?: string;
  
  // Signatures
  auditorSignerName: string;
  auditorSignature: string | null;
  clientSignerName: string;
  clientSignature: string | null;
  
  // Metadata
  gpsLocation?: { lat: number; lng: number };
  status: 'Rascunho' | 'Finalizado';
}

export interface CompanySettings {
  name: string;
  nif: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  logoUrl?: string;
}