import React, { useState, useEffect } from 'react';
import { Report, Client, User, AuditCriteria, ReportTemplate, CompanySettings, OrderItem } from '../types';
import SignaturePad from './SignaturePad';
import { generatePDF, generateOrderPDF } from '../services/pdfService';
import { Save, CheckCircle, AlertCircle, MinusCircle, FileText, Download, Mail, MapPin, X, ShoppingCart, Plus, Trash2, ExternalLink } from 'lucide-react';

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
  
  // --- ORDER STATE ---
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialReport?.order?.items || []);
  const [orderDeliveryConditions, setOrderDeliveryConditions] = useState(initialReport?.order?.deliveryConditions || '');
  const [orderObservations, setOrderObservations] = useState(initialReport?.order?.observations || '');
  const [orderTotal, setOrderTotal] = useState(initialReport?.order?.totalValue || 0);

  // Recalculate total when items change
  useEffect(() => {
    const total = orderItems.reduce((acc, item) => acc + item.total, 0);
    setOrderTotal(total);
  }, [orderItems]);

  // Signature States
  const [auditorName, setAuditorName] = useState(initialReport?.auditorSignerName || auditor.name);
  const [auditorSignature, setAuditorSignature] = useState<string | null>(initialReport?.auditorSignature || null);
  
  const [clientName, setClientName] = useState(initialReport?.clientSignerName || client.contactPerson);
  const [clientSignature, setClientSignature] = useState<string | null>(initialReport?.clientSignature || null);
  
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | undefined>(initialReport?.gpsLocation);

  const isCommercialVisit = template.key === 'visit_comercial';
  const hasCriteria = criteria.length > 0;
  const isGeneralIntervention = template.key === 'intervention_general';

  const handleCriteriaStatusChange = (id: string, status: AuditCriteria['status']) => {
    if (readOnly) return;
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const handleCriteriaNotesChange = (id: string, notes: string) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
  };

  // --- Order Logic ---
  const addOrderItem = () => {
      const newItem: OrderItem = {
          id: `item-${Date.now()}`,
          productName: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          total: 0
      };
      setOrderItems([...orderItems, newItem]);
  };

  const updateOrderItem = (id: string, field: keyof OrderItem, value: any) => {
      const updatedItems = orderItems.map(item => {
          if (item.id === id) {
              // Ensure numeric fields are actually numbers
              let finalValue = value;
              if (['quantity', 'unitPrice', 'discount'].includes(field)) {
                  finalValue = value === '' ? 0 : parseFloat(value);
              }
              
              const updated = { ...item, [field]: finalValue };
              
              // Recalculate line total using valid numbers
              const qty = Number(updated.quantity);
              const price = Number(updated.unitPrice);
              const disc = Number(updated.discount);
              
              updated.total = (qty * price) * (1 - disc / 100);
              
              return updated;
          }
          return item;
      });
      setOrderItems(updatedItems);
  };

  const removeOrderItem = (id: string) => {
      setOrderItems(orderItems.filter(i => i.id !== id));
  };

  const handleFinish = async (action: 'save' | 'pdf' | 'email' | 'order_pdf') => {
    // Basic validation only if saving
    if (action === 'save') {
      // Validate signatures ONLY if NOT a commercial visit
      if (!isCommercialVisit) {
        if (!auditorSignature || !clientSignature) {
          alert("Ambas as assinaturas são obrigatórias para este tipo de relatório.");
          return;
        }
        if (!auditorName.trim() || !clientName.trim()) {
          alert("Os nomes dos signatários são obrigatórios.");
          return;
        }
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
      status: 'Finalizado',
      // Attach order if it exists
      order: orderItems.length > 0 ? {
          items: orderItems,
          deliveryConditions: orderDeliveryConditions,
          observations: orderObservations,
          totalValue: orderTotal
      } : undefined
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

    if (action === 'order_pdf') {
        const doc = generateOrderPDF(reportData, client, companySettings);
        doc.save(`Encomenda_${client.name.replace(/\s+/g, '_')}_${date}.pdf`);
    }

    if (action === 'save') {
      onSave(reportData);
    }
  };

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
          
          {/* Export Options */}
          <div className="hidden md:flex gap-1">
               <button onClick={() => handleFinish('pdf')} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-l-lg font-medium hover:bg-indigo-200 items-center gap-2 text-sm flex border-r border-indigo-200">
                <Download size={16} /> PDF Relatório
              </button>
              {isCommercialVisit && orderItems.length > 0 && (
                <button onClick={() => handleFinish('order_pdf')} className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-r-lg font-medium hover:bg-emerald-200 items-center gap-2 text-sm flex" title="PDF apenas da Encomenda">
                    <ShoppingCart size={16} /> PDF Enc.
                </button>
              )}
          </div>

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
                  className="w-full p-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:bg-gray-100" 
                />
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">GPS</label>
                 {gpsCoords ? (
                    <button 
                      type="button"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${gpsCoords.lat},${gpsCoords.lng}`, '_blank')}
                      className="w-full p-2 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 truncate hover:bg-green-100 transition-colors"
                      title="Clique para ver no mapa"
                    >
                      <MapPin size={16} />
                      <span className="text-xs font-medium">Ver Mapa</span>
                      <ExternalLink size={12} className="opacity-50" />
                    </button>
                 ) : (
                   <div className="w-full p-2 bg-gray-50 text-gray-400 border border-gray-200 rounded-lg flex items-center gap-2 truncate">
                      <MapPin size={16} />
                      <span className="text-xs">Não capturado</span>
                   </div>
                 )}
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
                      className="w-full p-3 bg-white text-black border-b border-gray-300 focus:bg-white focus:border-blue-500 outline-none transition-colors text-base rounded-lg disabled:opacity-70"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* COMMERCIAL VISIT - ORDER SECTION */}
          {isCommercialVisit && (
              <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-emerald-600" /> Nova Encomenda
                    </h3>
                    {!readOnly && (
                        <button onClick={addOrderItem} className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-700">
                            <Plus size={16} /> Adicionar Produto
                        </button>
                    )}
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-1/3">Produto</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Qtd</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Preço (€)</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Desc.%</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                                    {!readOnly && <th className="px-4 py-3 w-10"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orderItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="p-2">
                                            <input 
                                                className="w-full p-2 border rounded bg-white text-gray-900"
                                                placeholder="Descrição do produto"
                                                value={item.productName}
                                                onChange={(e) => updateOrderItem(item.id, 'productName', e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number"
                                                min="1"
                                                className="w-full p-2 border rounded bg-white text-gray-900 text-center"
                                                value={item.quantity}
                                                onChange={(e) => updateOrderItem(item.id, 'quantity', e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input 
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full p-2 border rounded bg-white text-gray-900 text-right"
                                                value={item.unitPrice}
                                                onChange={(e) => updateOrderItem(item.id, 'unitPrice', e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="p-2">
                                             <input 
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-full p-2 border rounded bg-white text-gray-900 text-center"
                                                value={item.discount}
                                                onChange={(e) => updateOrderItem(item.id, 'discount', e.target.value)}
                                                disabled={readOnly}
                                            />
                                        </td>
                                        <td className="p-2 text-right font-bold text-gray-800">
                                            {item.total.toFixed(2)}€
                                        </td>
                                        {!readOnly && (
                                            <td className="p-2 text-center">
                                                <button onClick={() => removeOrderItem(item.id)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {orderItems.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-gray-400 text-sm">
                                            Nenhum produto adicionado à encomenda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-right text-gray-700">Valor Total:</td>
                                    <td className="px-4 py-3 text-right text-emerald-700 text-lg">{orderTotal.toFixed(2)}€</td>
                                    {!readOnly && <td></td>}
                                </tr>
                            </tfoot>
                        </table>
                      </div>
                      
                      <div className="p-4 bg-emerald-50 border-t border-emerald-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Condições de Entrega</label>
                              <input 
                                value={orderDeliveryConditions}
                                onChange={(e) => setOrderDeliveryConditions(e.target.value)}
                                disabled={readOnly}
                                className="w-full p-2 border border-emerald-200 rounded bg-white text-gray-900"
                                placeholder="Ex: Entrega em 48h, Portes incluídos..."
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Observações da Encomenda</label>
                              <input 
                                value={orderObservations}
                                onChange={(e) => setOrderObservations(e.target.value)}
                                disabled={readOnly}
                                className="w-full p-2 border border-emerald-200 rounded bg-white text-gray-900"
                                placeholder="Notas internas ou para faturação..."
                              />
                          </div>
                      </div>
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
              className="w-full p-4 bg-white text-black border border-amber-200 rounded-lg h-24 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm disabled:bg-gray-100 disabled:text-gray-700"
            />
          </div>

          {/* Signatures - HIDE FOR COMMERCIAL VISITS */}
          {!isCommercialVisit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Técnico (Auditor)</label>
                <input 
                  type="text" 
                  value={auditorName} 
                  disabled={readOnly}
                  onChange={e => setAuditorName(e.target.value)}
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
          )}

        </div>
      </div>
    </div>
  );
};

export default ReportForm;