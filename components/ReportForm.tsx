import React, { useState, useEffect } from 'react';
import { Report, Client, User, AuditCriteria, ReportTemplate, CompanySettings } from '../types';
import SignaturePad from './SignaturePad';
import { generatePDF } from '../services/pdfService';
import { Save, CheckCircle, AlertCircle, MinusCircle, FileText, Download, Mail, MapPin } from 'lucide-react';

interface ReportFormProps {
  client: Client;
  auditor: User;
  template: ReportTemplate;
  companySettings: CompanySettings;
  onSave: (report: Report) => void;
  onCancel: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ client, auditor, template, companySettings, onSave, onCancel }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600000).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })); // +1 hour default
  
  const [contractNumber, setContractNumber] = useState('');
  const [routeNumber, setRouteNumber] = useState('');

  // Initialize criteria from template
  const [criteria, setCriteria] = useState<AuditCriteria[]>(
    template.defaultCriteria.map((c, idx) => ({
      id: `crit-${idx}`,
      label: c.label,
      status: null,
      notes: ''
    }))
  );

  const [summary, setSummary] = useState('');
  const [clientObservations, setClientObservations] = useState('');
  
  // Signature States
  const [auditorName, setAuditorName] = useState(auditor.name);
  const [auditorSignature, setAuditorSignature] = useState<string | null>(null);
  
  const [clientName, setClientName] = useState(client.contactPerson);
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | undefined>(undefined);

  const handleCriteriaStatusChange = (id: string, status: AuditCriteria['status']) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleCriteriaNotesChange = (id: string, notes: string) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  const handleFinish = async (action: 'save' | 'pdf' | 'email') => {
    if (!auditorSignature || !clientSignature) {
      alert("Ambas as assinaturas são obrigatórias.");
      return;
    }
    if (!auditorName.trim() || !clientName.trim()) {
      alert("Os nomes dos signatários são obrigatórios.");
      return;
    }

    if (!window.confirm("Deseja gravar o relatório? Após gravar não será possível efetuar alterações.")) {
      return;
    }

    // Capture GPS
    let location = undefined;
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = { lat: position.coords.latitude, lng: position.coords.longitude };
        setGpsCoords(location);
      } catch (e) {
        console.warn("Could not get GPS", e);
      }
    }

    const newReport: Report = {
      id: `r-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      clientShopName: client.shopName,
      auditorId: auditor.id,
      auditorName: auditor.name, 
      date,
      startTime,
      endTime,
      contractNumber,
      routeNumber,
      typeKey: template.key,
      typeName: template.label,
      criteria,
      summary,
      clientObservations,
      auditorSignerName: auditorName,
      auditorSignature,
      clientSignerName: clientName,
      clientSignature,
      gpsLocation: location,
      status: 'Finalizado'
    };

    if (action === 'pdf' || action === 'email') {
      const doc = generatePDF(newReport, client, companySettings);
      
      if (action === 'pdf') {
        doc.save(`Relatorio_${client.name.replace(/\s+/g, '_')}_${date}.pdf`);
      } else {
        // Simulate Email
        const pdfBlob = doc.output('blob');
        const subject = encodeURIComponent(`Relatório de Intervenção - ${client.name}`);
        const body = encodeURIComponent(`Segue em anexo o relatório da intervenção realizada dia ${date}.\n\nCumprimentos,\n${companySettings.name}`);
        
        // We can't actually attach without backend, so we open mailto and download pdf
        window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
        doc.save(`Relatorio_${client.name}_${date}.pdf`); // Force download so user can attach
        alert("O cliente de email foi aberto. O PDF foi descarregado para que o possa anexar manualmente.");
      }
    }

    onSave(newReport);
  };

  const hasCriteria = criteria.length > 0;
  const isGeneralIntervention = template.key === 'intervention_general';

  return (
    <div className="flex flex-col h-full bg-gray-50 fixed inset-0 z-50 overflow-hidden">
      {/* Sticky Header */}
      <div className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Novo Relatório</h2>
          <p className="text-sm font-semibold text-blue-600">{template.label}</p>
          <p className="text-xs text-gray-500">{client.name}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200">
            Cancelar
          </button>
          
          <button onClick={() => handleFinish('email')} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 flex items-center gap-2">
             <Mail size={18} /> Enviar
          </button>
           <button onClick={() => handleFinish('pdf')} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 flex items-center gap-2">
             <Download size={18} /> PDF
          </button>

          <button onClick={() => handleFinish('save')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200">
            <Save size={18} /> Finalizar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 w-full mx-auto">
        {/* Full width container */}
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Info Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)} 
                  className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)} 
                  className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Localização GPS</label>
                 <div className="w-full p-3 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg flex items-center gap-2">
                    <MapPin size={16} />
                    <span className="text-sm">Será gravada ao finalizar</span>
                 </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº Contrato</label>
                <input 
                  type="text" 
                  placeholder="Ex: 12345/24"
                  value={contractNumber} 
                  onChange={e => setContractNumber(e.target.value)}
                  className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº Rota</label>
                <input 
                  type="text" 
                  placeholder="Ex: R-01"
                  value={routeNumber} 
                  onChange={e => setRouteNumber(e.target.value)}
                  className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Criteria Evaluation - Only Show if there are criteria */}
          {hasCriteria && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Grelha de Avaliação</h3>
                <p className="text-xs text-gray-500 mt-1">Marque 'OK' para confirmar a verificação ou aplicação. Use as observações para detalhes adicionais (ex: quantidade).</p>
              </div>
              <div className="divide-y divide-gray-100">
                {criteria.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <p className="font-medium text-gray-900 mb-4 text-lg">{item.label}</p>
                    
                    <div className="flex flex-col md:flex-row gap-4 md:items-start">
                      {/* Status Buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCriteriaStatusChange(item.id, 'pass')}
                          className={`flex-1 md:flex-none flex flex-col items-center justify-center p-3 w-24 rounded-lg border-2 transition-all ${
                            item.status === 'pass' 
                              ? 'bg-green-50 border-green-500 text-green-700' 
                              : 'bg-white border-gray-200 text-gray-400 hover:border-green-200'
                          }`}
                        >
                          <CheckCircle size={28} className="mb-1" />
                          <span className="text-xs font-bold uppercase">OK</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCriteriaStatusChange(item.id, 'fail')}
                          className={`flex-1 md:flex-none flex flex-col items-center justify-center p-3 w-24 rounded-lg border-2 transition-all ${
                            item.status === 'fail' 
                              ? 'bg-red-50 border-red-500 text-red-700' 
                              : 'bg-white border-gray-200 text-gray-400 hover:border-red-200'
                          }`}
                        >
                          <AlertCircle size={28} className="mb-1" />
                          <span className="text-xs font-bold uppercase">NOK</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCriteriaStatusChange(item.id, 'na')}
                          className={`flex-1 md:flex-none flex flex-col items-center justify-center p-3 w-24 rounded-lg border-2 transition-all ${
                            item.status === 'na' 
                              ? 'bg-gray-100 border-gray-500 text-gray-700' 
                              : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          <MinusCircle size={28} className="mb-1" />
                          <span className="text-xs font-bold uppercase">N/A</span>
                        </button>
                      </div>

                      {/* Notes Input */}
                      <div className="flex-1">
                        <textarea
                          placeholder="Observações ou Valores Medidos..."
                          value={item.notes}
                          onChange={e => handleCriteriaNotesChange(item.id, e.target.value)}
                          rows={2}
                          className="w-full p-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-base"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Report / Summary Section */}
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                <FileText size={24} /> {isGeneralIntervention ? 'Relatório da Intervenção' : 'Resumo e Conclusões'}
              </h3>
            </div>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder={isGeneralIntervention ? "Descreva detalhadamente a intervenção realizada..." : "Escreva um resumo e conclusões da auditoria..."}
              className={`w-full p-4 bg-white text-black border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${isGeneralIntervention ? 'h-64' : 'h-40'}`}
            />
          </div>

          {/* Client Observations */}
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
            <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
              Observações do Cliente
            </h3>
            <textarea
              value={clientObservations}
              onChange={e => setClientObservations(e.target.value)}
              placeholder="Registe aqui quaisquer observações ou comentários do cliente..."
              className="w-full p-4 bg-white text-black border border-amber-200 rounded-lg h-32 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Técnico Responsável pela Intervenção (Auditor)</label>
              <input 
                type="text" 
                value={auditorName} 
                onChange={e => setAuditorName(e.target.value)}
                className="w-full p-2 mb-4 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <SignaturePad 
                label="Assinatura do Técnico"
                onEnd={setAuditorSignature}
              />
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
               <label className="block text-sm font-semibold text-gray-700 mb-2">Responsável Contatado (Cliente)</label>
               <input 
                type="text" 
                value={clientName} 
                onChange={e => setClientName(e.target.value)}
                className="w-full p-2 mb-4 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <SignaturePad 
                label="Assinatura do Cliente / Rubrica"
                onEnd={setClientSignature}
              />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportForm;