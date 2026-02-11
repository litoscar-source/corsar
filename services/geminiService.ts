import { GoogleGenAI } from "@google/genai";
import { AuditCriteria } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize properly with new GoogleGenAI({ apiKey: ... })
// NOTE: In a real app, never expose keys on client side without proxy. 
// For this demo, we assume process.env is injected.
const ai = new GoogleGenAI({ apiKey });

export const generateReportSummary = async (
  clientName: string,
  type: string,
  criteria: AuditCriteria[]
): Promise<string> => {
  if (!apiKey) return "Erro: Chave de API não configurada.";

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
