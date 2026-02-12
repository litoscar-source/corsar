import React, { useState, useEffect } from 'react';
import { Report, Client, User, AuditCriteria, ReportTemplate, CompanySettings } from '../types';
import SignaturePad from './SignaturePad';
import { generatePDF } from '../services/pdfService';
import { Save, CheckCircle, AlertCircle, MinusCircle, FileText, Download, Mail, MapPin, X } from 'lucide-react';

interface ReportFormProps {
  client: Client;
  auditor: User;
  template: ReportTemplate;
  companySettings: CompanySettings;
  onSave: (report: Report) => void;
  onCancel: () => void;
  initialReport?: Report; // Added for editing
  readOnly?: boolean; // New prop for viewing mode
}

const ReportForm: React.FC<ReportFormProps> = ({ client, auditor, template, companySettings, onSave, onCancel, initialReport, readOnly = false }) => {
  const [date, setDate] = useState(initialReport?.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialReport?.startTime || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
  const [endTime, setEndTime] = useState(initialReport?.endTime || new Date(Date.now() + 3600000).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
  
  const [contractNumber, setContractNumber] = useState(initialReport?.contractNumber || '');
  const [routeNumber, setRouteNumber] = useState(initialReport?.routeNumber || '');

  // Initialize criteria: from initialReport if editing/viewing, otherwise from template
  const [criteria, setCriteria] = useState<AuditCriteria[]>(
    initialReport 
      ? initialReport.criteria 
      : template.defaultCriteria.map((c, idx) => ({
          id: `crit-${idx}`,
          label: c.label,
          status: null,
          notes: ''
        }))
  );

  const [summary, setSummary] = useState(initialReport?.summary || '');
  const [clientObservations, setClientObservations] = useState(initialReport?.clientObservations || '');
  
  // Signature States
  const [auditorName, setAuditorName] = useState(initialReport?.auditorSignerName || auditor.name);
  const [auditorSignature, setAuditorSignature] = useState<string | null>(initialReport?.auditorSignature || null);
  
  const [clientName, setClientName] = useState(initialReport?.clientSignerName || client.contactPerson);
  const [clientSignature, setClientSignature] = useState<string | null>(initialReport?.clientSignature || null);
  
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | undefined>(initialReport?.gpsLocation);

  const handleCriteriaStatusChange = (id: string, status: AuditCriteria['status']) => {
    if (readOnly) return;
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleCriteriaNotesChange = (id: string, notes: string) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  const handleFinish = async (action: 'save' | 'pdf' | 'email') => {
    // Basic validation only if saving
    if (action === 'save') {
      if (!auditorSignature || !clientSignature) {
        alert("Ambas as assinaturas são obrigatórias.");
        return;
      }
      if (!auditorName.trim() || !clientName.trim()) {
        alert("Os nomes dos signatários são obrigatórios.");
        return;
      }
      if (!window.confirm("Deseja gravar o relatório?")) {
        return;
      }
    }

    // Capture GPS logic (skip if readOnly or just exporting PDF)
    let location = gpsCoords;
    if (action === 'save' && !readOnly && !location && "geolocation" in navigator) {
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

    // Construct data object
    const reportData: Report = {
      id: initialReport?.id || `r-${Date.now()}`,
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
      const doc = generatePDF(reportData, client, companySettings);
      
      if (action === 'pdf') {
        doc.save(`Relatorio_${client.name.replace(/\s+/g, '_')}_${date}.pdf`);
      } else {
        const subject = encodeURIComponent(`Relatório de Intervenção - ${client.name}`);
        const body = encodeURIComponent(`Segue em anexo o relatório da intervenção realizada dia ${date}.\n\nCumprimentos,\n${companySettings.name}`);
        window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
        doc.save(`Relatorio_${client.name}_${date}.pdf`); 
        alert("O cliente de email foi aberto.");
      }
    }

    if (action === 'save') {
      onSave(reportData);
    }
  };

  const hasCriteria = criteria.length > 0;
  const isGeneralIntervention = template.key === 'intervention_general';

  // Title logic
  let title = 'Novo Relatório';
  if (initialReport) title = readOnly ? 'Visualizar Relatório' : 'Editar Relatório';

  return (
    <div className="flex flex-col h-full bg-gray-50 fixed inset-0 z-50 overflow-hidden">
      {/* Sticky Header */}
      <div className="bg-white border-b shadow-sm px-4 md:px-6 py-4 flex justify-between items-center shrink-0 z-20">
        <div className="overflow-hidden mr-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">{title}</h2>
          <p className="text-xs md:text-sm font-semibold text-blue-600 truncate">{template.label}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 text-sm flex items-center gap-2">
            {readOnly ? <X size={16}/> : null}
            {readOnly ? 'Fechar' : 'Cancelar'}
          </button>
          
          <button onClick={() => handleFinish('email')} className="hidden md:flex px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 items-center gap-2 text-sm">
             <Mail size={16} /> Enviar
          </button>
           <button onClick={() => handleFinish('pdf')} className="hidden md:flex px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 items-center gap-2 text-sm">
             <Download size={16} /> PDF
          </button>

          {!readOnly && (
            <button onClick={() => handleFinish('save')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 text-sm">
              <Save size={16} /> <span className="hidden sm:inline">Finalizar</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full mx-auto">
        <div className="max-w-[1200px] mx-auto space-y-6 pb-20">
          
          {/* Info Section */}
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Data</label>
                <input 
                  type="date" 
                  value={date} 
                  disabled={readOnly}
                  onChange={e => setDate(e.target.value)}
                  // CHANGED: bg-white instead of bg-gray-50
                  className="w-full p-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:bg-gray-100" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Início</label>
                <input 
                  type="time" 
                  value={startTime}
                  disabled={readOnly}
                  onChange={e => setStartTime(e.target.value)} 
                  // CHANGED: bg-white instead of bg-gray-50
                  className="w-full p-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:bg-gray-100" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fim</label>
                <input 
                  type="time" 
                  value={endTime}
                  disabled={readOnly}
                  onChange={e => setEndTime(e.target.value)} 
                  // CHANGED: bg-white instead of bg-gray-50
                  className="w-full p-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:bg-gray-100" 
                />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">GPS</label>
                 <div className="w-full p-2 bg-white text-gray-500 border border-gray-300 rounded-lg flex items-center gap-2 truncate disabled:opacity-60 disabled:bg-gray-100">
                    <MapPin size={16} />
                    <span className="text-xs">{gpsCoords ? 'Capturado' : 'Pendente'}</span>
                 </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nº Contrato</label>
                <input 
                  type="text" 
                  placeholder="Ex: 12345/24"
                  value={contractNumber} 
                  disabled={readOnly}
                  onChange={e => setContractNumber(e.target.value)}
                  // CHANGED: bg-white instead of bg-gray-50
                  className="w-full p-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:bg-gray-100" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nº Rota</label>
                <input 
                  type="text" 
                  placeholder="Ex: R-01"
                  value={routeNumber} 
                  disabled={readOnly}
                  onChange={e => setRouteNumber(e.target.value)}
                  // CHANGED: bg-white instead of bg-gray-50
                  className="w-full p-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:bg-gray-100" 
                />
              </div>
            </div>
          </div>

          {/* Criteria Evaluation */}
          {hasCriteria && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 px-2">Grelha de Avaliação</h3>
              <div className="grid grid-cols-1 gap-4">
                {criteria.map((item) => (
                  <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="font-semibold text-gray-900 mb-3 text-lg">{item.label}</p>
                    
                    {/* Tablet Optimized Buttons: Full width Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3 h-14">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleCriteriaStatusChange(item.id, 'pass')}
                        className={`flex items-center justify-center rounded-lg border transition-all active:scale-95 ${
                          item.status === 'pass' 
                            ? 'bg-green-600 border-green-600 text-white shadow-md' 
                            : 'bg-white border-gray-200 text-gray-400'
                        } ${!readOnly && item.status !== 'pass' ? 'hover:bg-green-50' : ''} ${readOnly && item.status !== 'pass' ? 'opacity-30' : ''}`}
                      >
                        <CheckCircle size={24} className={item.status === 'pass' ? 'mr-2' : ''} />
                        {item.status === 'pass' && <span className="font-bold">OK</span>}
                      </button>

                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleCriteriaStatusChange(item.id, 'fail')}
                        className={`flex items-center justify-center rounded-lg border transition-all active:scale-95 ${
                          item.status === 'fail' 
                            ? 'bg-red-600 border-red-600 text-white shadow-md' 
                            : 'bg-white border-gray-200 text-gray-400'
                        } ${!readOnly && item.status !== 'fail' ? 'hover:bg-red-50' : ''} ${readOnly && item.status !== 'fail' ? 'opacity-30' : ''}`}
                      >
                        <AlertCircle size={24} className={item.status === 'fail' ? 'mr-2' : ''} />
                         {item.status === 'fail' && <span className="font-bold">NOK</span>}
                      </button>

                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleCriteriaStatusChange(item.id, 'na')}
                        className={`flex items-center justify-center rounded-lg border transition-all active:scale-95 ${
                          item.status === 'na' 
                            ? 'bg-gray-600 border-gray-600 text-white shadow-md' 
                            : 'bg-white border-gray-200 text-gray-400'
                        } ${!readOnly && item.status !== 'na' ? 'hover:bg-gray-100' : ''} ${readOnly && item.status !== 'na' ? 'opacity-30' : ''}`}
                      >
                        <MinusCircle size={24} className={item.status === 'na' ? 'mr-2' : ''} />
                         {item.status === 'na' && <span className="font-bold">N/A</span>}
                      </button>
                    </div>

                    {/* Notes */}
                    <textarea
                      placeholder="Observações..."
                      value={item.notes}
                      disabled={readOnly}
                      onChange={e => handleCriteriaNotesChange(item.id, e.target.value)}
                      rows={1}
                      // CHANGED: bg-white instead of bg-gray-50
                      className="w-full p-3 bg-white text-black border-b border-gray-300 focus:bg-white focus:border-blue-500 outline-none transition-colors text-base rounded-lg disabled:opacity-70"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Report / Summary Section */}
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <FileText size={20} /> {isGeneralIntervention ? 'Relatório da Intervenção' : 'Resumo e Conclusões'}
            </h3>
            <textarea
              value={summary}
              disabled={readOnly}
              onChange={e => setSummary(e.target.value)}
              placeholder={isGeneralIntervention ? "Descreva detalhadamente a intervenção realizada..." : "Escreva um resumo e conclusões..."}
              // CHANGED: bg-white
              className={`w-full p-4 bg-white text-black border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${isGeneralIntervention ? 'h-64' : 'h-32'} disabled:bg-gray-100 disabled:text-gray-700`}
            />
          </div>

          {/* Client Observations */}
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
            <h3 className="text-lg font-semibold text-amber-900 mb-3">Observações do Cliente</h3>
            <textarea
              value={clientObservations}
              disabled={readOnly}
              onChange={e => setClientObservations(e.target.value)}
              placeholder="Registe aqui quaisquer observações ou comentários do cliente..."
              // CHANGED: bg-white
              className="w-full p-4 bg-white text-black border border-amber-200 rounded-lg h-24 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm disabled:bg-gray-100 disabled:text-gray-700"
            />
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Técnico (Auditor)</label>
              <input 
                type="text" 
                value={auditorName} 
                disabled={readOnly}
                onChange={e => setAuditorName(e.target.value)}
                // CHANGED: bg-white
                className="w-full p-2 mb-4 bg-white text-black border border-gray-300 rounded outline-none disabled:bg-gray-100"
              />
              <SignaturePad 
                label="Assinatura"
                onEnd={setAuditorSignature}
                initialData={auditorSignature}
                disabled={readOnly}
              />
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cliente</label>
               <input 
                type="text" 
                value={clientName} 
                disabled={readOnly}
                onChange={e => setClientName(e.target.value)}
                // CHANGED: bg-white
                className="w-full p-2 mb-4 bg-white text-black border border-gray-300 rounded outline-none disabled:bg-gray-100"
              />
              <SignaturePad 
                label="Assinatura"
                onEnd={setClientSignature}
                initialData={clientSignature}
                disabled={readOnly}
              />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportForm;