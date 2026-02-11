import { GoogleGenAI } from "@google/genai";
import { AuditCriteria } from "../types";

// Safe access to API Key to prevent "process is not defined" crashes in production
const getApiKey = () => {
  try {
    // Check if process exists before accessing env
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || '';
    }
    // Fallback if window.process shim from index.html works
    if ((window as any).process && (window as any).process.env) {
      return (window as any).process.env.API_KEY || '';
    }
    return '';
  } catch (e) {
    console.warn("API Key environment access failed", e);
    return '';
  }
};

const apiKey = getApiKey();

// Initialize properly with new GoogleGenAI({ apiKey: ... })
const ai = new GoogleGenAI({ apiKey });

export const generateReportSummary = async (
  clientName: string,
  type: string,
  criteria: AuditCriteria[]
): Promise<string> => {
  if (!apiKey) return "A funcionalidade de IA está indisponível (Chave API em falta). Por favor configure a API_KEY no servidor.";

  const failedItems = criteria.filter(c => c.status === 'fail');
  const passItems = criteria.filter(c => c.status === 'pass');
  const naItems = criteria.filter(c => c.status === 'na');

  const prompt = `
    Atue como um auditor técnico profissional sénior.
    Escreva um resumo executivo curto (máximo 3 parágrafos) em Português de Portugal para um relatório de ${type} realizado no cliente "${clientName}".
    
    Dados da Auditoria:
    - Total de critérios avaliados: ${criteria.length}
    - Critérios Aprovados: ${passItems.length}
    - Critérios Reprovados: ${failedItems.length}
    - Critérios Não Aplicáveis: ${naItems.length}

    Detalhes das falhas (se houver):
    ${failedItems.map(i => `- ${i.label}: ${i.notes}`).join('\n')}

    Destaques positivos (se houver notas):
    ${passItems.filter(i => i.notes).map(i => `- ${i.label}: ${i.notes}`).join('\n')}

    O tom deve ser profissional, construtivo e focado em melhoria contínua. Se houver falhas, sugira prioridade na resolução.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar o resumo.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao comunicar com a IA para gerar o resumo. Verifique a ligação ou a chave API.";
  }
};