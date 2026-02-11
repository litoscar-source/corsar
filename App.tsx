import React, { useState } from 'react';
import { 
  Users, 
  FileText, 
  Settings, 
  Plus, 
  ChevronRight, 
  Search,
  LayoutDashboard,
  Calendar,
  Briefcase,
  Edit2,
  Trash2,
  X,
  CheckSquare,
  Square,
  LogOut,
  Building,
  UserPlus
} from 'lucide-react';
import { MOCK_USERS, MOCK_CLIENTS, MOCK_REPORTS, REPORT_TEMPLATES, DEFAULT_COMPANY_SETTINGS } from './constants';
import { User, Client, Report, UserRole, ReportTypeKey, CompanySettings } from './types';
import ReportForm from './components/ReportForm';
import LoginScreen from './components/LoginScreen';
import { generatePDF } from './services/pdfService';

enum Screen {
  DASHBOARD = 'Dashboard',
  CLIENTS = 'Clientes',
  REPORTS = 'Relatórios',
  SETTINGS = 'Configurações'
}

const App: React.FC = () => {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.DASHBOARD);
  
  // Data State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  
  // Client Management State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');

  // User Management State (Settings)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Report Workflow State
  const [selectedClientForReport, setSelectedClientForReport] = useState<Client | null>(null);
  const [isReportTypeModalOpen, setIsReportTypeModalOpen] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<ReportTypeKey | null>(null);
  
  // --- Derived State ---
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.nif && c.nif.includes(clientSearch))
  );

  const currentMonthReports = reports.filter(r => {
    const rDate = new Date(r.date);
    const now = new Date();
    return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
  });

  const recentReports = reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // --- Actions: Auth ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen(Screen.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // --- Actions: Clients ---

  const handleSaveClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const clientData: Client = {
      id: editingClient ? editingClient.id : `c-${Date.now()}`,
      name: formData.get('name') as string,
      shopName: formData.get('shopName') as string,
      nif: formData.get('nif') as string,
      contactPerson: formData.get('contactPerson') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      
      address: formData.get('address') as string,
      postalCode: formData.get('postalCode') as string,
      locality: formData.get('locality') as string,
      county: formData.get('county') as string,

      status: 'Ativo',
      lastVisit: editingClient?.lastVisit || '-'
    };

    if (editingClient) {
      setClients(clients.map(c => c.id === clientData.id ? clientData : c));
    } else {
      setClients([...clients, clientData]);
    }
    setIsClientModalOpen(false);
    setEditingClient(null);
  };

  const handleDeleteClient = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      alert("Apenas administradores podem apagar clientes.");
      return;
    }
    if (confirm('Tem a certeza que deseja remover este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  const openEditClient = (client: Client) => {
    setEditingClient(client);
    setIsClientModalOpen(true);
  };

  const openAddClient = () => {
    setEditingClient(null);
    setIsClientModalOpen(true);
  };

  // --- Actions: Users ---

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData: User = {
      id: editingUser ? editingUser.id : `u-${Date.now()}`,
      name: formData.get('name') as string,
      role: formData.get('role') as UserRole,
      pin: formData.get('pin') as string,
      avatar: editingUser?.avatar || `https://ui-avatars.com/api/?name=${formData.get('name')}&background=random`,
      allowedTemplates: editingUser ? editingUser.allowedTemplates : [] // Keep existing or empty
    };

    if (editingUser) {
      setUsers(users.map(u => u.id === userData.id ? userData : u));
    } else {
      setUsers([...users, userData]);
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Tem a certeza?')) setUsers(users.filter(u => u.id !== id));
  };

  // --- Actions: Reports ---

  const initReportCreation = (client: Client) => {
    setSelectedClientForReport(client);
    setIsReportTypeModalOpen(true);
  };

  const selectReportType = (key: ReportTypeKey) => {
    setSelectedTemplateKey(key);
    setIsReportTypeModalOpen(false);
  };

  const handleSaveReport = (report: Report) => {
    setReports([report, ...reports]);
    setClients(clients.map(c => c.id === report.clientId ? { ...c, lastVisit: report.date } : c));
    setSelectedTemplateKey(null);
    setSelectedClientForReport(null);
    setCurrentScreen(Screen.REPORTS);
  };

  const handleDownloadPDF = (report: Report) => {
    const client = clients.find(c => c.id === report.clientId);
    if (!client) return;
    const doc = generatePDF(report, client, companySettings);
    doc.save(`Relatorio_${report.id}.pdf`);
  };

  const handleDeleteReport = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    if (confirm("Deseja apagar este relatório permanentemente?")) {
      setReports(reports.filter(r => r.id !== id));
    }
  };

  // --- Actions: Company Settings ---
  const handleSaveCompanySettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentUser?.role !== UserRole.ADMIN) return;
    const formData = new FormData(e.currentTarget);
    setCompanySettings({
      name: formData.get('name') as string,
      nif: formData.get('nif') as string,
      address: formData.get('address') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      website: formData.get('website') as string,
    });
    alert("Definições da empresa atualizadas.");
  };


  // --- Render ---

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  // If creating report
  if (selectedClientForReport && selectedTemplateKey) {
    return (
      <ReportForm 
        client={selectedClientForReport} 
        auditor={currentUser} 
        template={REPORT_TEMPLATES[selectedTemplateKey]}
        companySettings={companySettings}
        onSave={handleSaveReport}
        onCancel={() => {
          setSelectedTemplateKey(null);
          setSelectedClientForReport(null);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col z-20">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Briefcase className="text-blue-600" />
            AuditPro
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { s: Screen.DASHBOARD, i: LayoutDashboard },
            { s: Screen.CLIENTS, i: Users },
            { s: Screen.REPORTS, i: FileText },
            { s: Screen.SETTINGS, i: Settings },
          ].map(item => (
            <button
              key={item.s}
              onClick={() => setCurrentScreen(item.s)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentScreen === item.s 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.i size={20} />
              <span className="font-medium">{item.s}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-600 p-2 text-sm hover:bg-red-50 rounded">
            <LogOut size={16} /> Terminar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 p-4 md:hidden flex justify-between items-center z-10">
          <h1 className="text-lg font-bold text-gray-800">AuditPro</h1>
          <button onClick={handleLogout} className="text-sm text-red-600">Sair</button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* Dashboard View */}
          {currentScreen === Screen.DASHBOARD && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-sm">Total Clientes</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{clients.length}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-sm">Relatórios Emitidos (Mês)</p>
                  <h3 className="text-3xl font-bold text-blue-600 mt-2">{currentMonthReports.length}</h3>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Relatórios Recentes</h3>
                  <button className="text-blue-600 text-sm hover:underline" onClick={() => setCurrentScreen(Screen.REPORTS)}>Ver todos</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentReports.map(report => (
                    <div key={report.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{report.clientName}</p>
                          <p className="text-sm text-gray-500">{report.typeName} • {report.date}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDownloadPDF(report)} className="p-2 text-gray-500 hover:text-blue-600">
                         <FileText size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clients View */}
          {currentScreen === Screen.CLIENTS && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Gestão de Clientes</h2>
                <div className="flex gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Pesquisar..." 
                      className="pl-10 pr-4 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
                    />
                  </div>
                  <button onClick={openAddClient} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={20} /> <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Empresa</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Localização</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredClients.map(client => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{client.name}</p>
                              {client.shopName && <p className="text-xs text-blue-600">Loja: {client.shopName}</p>}
                              <p className="text-xs text-gray-500">{client.nif || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {client.locality}, {client.county}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => initReportCreation(client)}
                                className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100" title="Novo Relatório">
                                <FileText size={18} />
                              </button>
                              <button 
                                onClick={() => openEditClient(client)}
                                className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200" title="Editar">
                                <Edit2 size={18} />
                              </button>
                              {currentUser.role === UserRole.ADMIN && (
                                <button 
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100" title="Remover">
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Reports View */}
          {currentScreen === Screen.REPORTS && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Histórico de Relatórios</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Auditor</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reports.map(report => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                             <p className="font-medium text-gray-900">{report.clientName}</p>
                             <p className="text-xs text-gray-500">{report.typeName}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{report.date}</td>
                          <td className="px-6 py-4 text-gray-600">{report.auditorName}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                <button onClick={() => handleDownloadPDF(report)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Ver PDF">
                                  <FileText size={18} />
                                </button>
                                {currentUser.role === UserRole.ADMIN && (
                                  <>
                                    {report.gpsLocation && (
                                        <button 
                                          onClick={() => alert(`GPS: ${report.gpsLocation?.lat}, ${report.gpsLocation?.lng}`)} 
                                          className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Ver Localização GPS">
                                          <Building size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteReport(report.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Apagar">
                                      <Trash2 size={18} />
                                    </button>
                                  </>
                                )}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Settings View (Admin) */}
          {currentScreen === Screen.SETTINGS && currentUser.role === UserRole.ADMIN && (
             <div className="space-y-8">
               
               {/* Company Settings */}
               <section>
                 <h2 className="text-xl font-bold text-gray-800 mb-4">Dados da Empresa (Sede)</h2>
                 <form onSubmit={handleSaveCompanySettings} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                        <input name="name" defaultValue={companySettings.name} className="w-full p-2 border rounded" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">NIF</label>
                        <input name="nif" defaultValue={companySettings.nif} className="w-full p-2 border rounded" required />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Morada</label>
                        <input name="address" defaultValue={companySettings.address} className="w-full p-2 border rounded" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email Geral</label>
                        <input name="email" defaultValue={companySettings.email} className="w-full p-2 border rounded" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input name="phone" defaultValue={companySettings.phone} className="w-full p-2 border rounded" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <input name="website" defaultValue={companySettings.website} className="w-full p-2 border rounded" />
                      </div>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar Dados</button>
                 </form>
               </section>

               {/* User Management */}
               <section>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Utilizadores</h2>
                    <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="text-sm bg-green-600 text-white px-3 py-2 rounded flex items-center gap-2 hover:bg-green-700">
                      <UserPlus size={16} /> Adicionar
                    </button>
                 </div>
                 
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Função</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">PIN</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                          <tr key={u.id}>
                            <td className="px-6 py-4 flex items-center gap-2">
                               <img src={u.avatar} className="w-8 h-8 rounded-full bg-gray-200" />
                               {u.name}
                            </td>
                            <td className="px-6 py-4">{u.role}</td>
                            <td className="px-6 py-4 font-mono">******</td>
                            <td className="px-6 py-4 text-right">
                               <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="text-blue-600 mr-2 hover:underline">Editar</button>
                               <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:underline">Apagar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </section>
             </div>
          )}

        </div>

        {/* --- MODALS --- */}

        {/* Client Modal */}
        {isClientModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-y-auto max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <button onClick={() => setIsClientModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveClient} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                    <input name="name" defaultValue={editingClient?.name} required className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja (Opcional)</label>
                    <input name="shopName" defaultValue={editingClient?.shopName} className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                    <input name="nif" defaultValue={editingClient?.nif} className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa de Contacto</label>
                    <input name="contactPerson" defaultValue={editingClient?.contactPerson} required className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input name="phone" defaultValue={editingClient?.phone} required className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input name="email" type="email" defaultValue={editingClient?.email} required className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  
                  {/* Address Block */}
                   <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Morada</label>
                    <input name="address" defaultValue={editingClient?.address} required className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                    <input name="postalCode" defaultValue={editingClient?.postalCode} required className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Localidade</label>
                    <input name="locality" defaultValue={editingClient?.locality} required className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Concelho</label>
                    <input name="county" defaultValue={editingClient?.county} required className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                  <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

         {/* User Modal */}
        {isUserModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
              </div>
              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                   <input name="name" defaultValue={editingUser?.name} required className="w-full p-2 border rounded" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                   <select name="role" defaultValue={editingUser?.role || UserRole.TECNICO} className="w-full p-2 border rounded">
                      {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">PIN (6 dígitos)</label>
                   <input name="pin" defaultValue={editingUser?.pin} pattern="\d{6}" maxLength={6} required className="w-full p-2 border rounded font-mono" placeholder="123456" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Type Selection Modal */}
        {isReportTypeModalOpen && selectedClientForReport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800">Selecione o Tipo de Relatório</h3>
                <p className="text-sm text-gray-500">Cliente: {selectedClientForReport.name}</p>
              </div>
              <div className="p-4 space-y-2">
                {Object.values(REPORT_TEMPLATES).filter(tpl => currentUser?.allowedTemplates.includes(tpl.key)).map(tpl => (
                  <button 
                    key={tpl.key}
                    onClick={() => selectReportType(tpl.key)}
                    className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
                  >
                    <span className="font-medium text-gray-800 group-hover:text-blue-700">{tpl.label}</span>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500" />
                  </button>
                ))}
              </div>
              <div className="p-4 bg-gray-50 text-center">
                <button onClick={() => {
                  setIsReportTypeModalOpen(false);
                  setSelectedClientForReport(null);
                }} className="text-gray-500 hover:text-gray-800 text-sm font-medium">Cancelar</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;