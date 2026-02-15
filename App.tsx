import React, { useState, useEffect } from 'react';
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
  UserPlus,
  History,
  Mail,
  Download,
  Phone,
  MapPin,
  AtSign,
  Upload,
  Camera,
  Eye,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';
import { REPORT_TEMPLATES, DEFAULT_COMPANY_SETTINGS, MOCK_USERS, MOCK_CLIENTS, MOCK_REPORTS } from './constants';
import { User, Client, Report, UserRole, ReportTypeKey, CompanySettings } from './types';
import ReportForm from './components/ReportForm';
import LoginScreen from './components/LoginScreen';
import { generatePDF, generateOrderPDF } from './services/pdfService';
import { api } from './services/api';

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
  
  // Data State - Initialize empty, load from API
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Client Management State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  
  // Client History State
  const [viewingHistoryClient, setViewingHistoryClient] = useState<Client | null>(null);

  // User Management State (Settings)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Report Workflow State
  const [selectedClientForReport, setSelectedClientForReport] = useState<Client | null>(null);
  const [isReportTypeModalOpen, setIsReportTypeModalOpen] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<ReportTypeKey | null>(null);
  
  // Report Edit/View State
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);

  // --- API LOADING ---
  const loadData = async () => {
      setIsLoading(true);
      try {
          // Fetch all data in parallel
          const [fetchedUsers, fetchedClients, fetchedReports, fetchedSettings] = await Promise.all([
              api.getUsers(),
              api.getClients(),
              api.getReports(),
              api.getSettings()
          ]);

          // Hydrate Reports with Client/Auditor names (since SQL returns IDs)
          const hydratedReports = fetchedReports.map(r => {
              const client = fetchedClients.find(c => c.id === r.clientId);
              const auditor = fetchedUsers.find(u => u.id === r.auditorId);
              const template = Object.values(REPORT_TEMPLATES).find(t => t.key === r.typeKey);
              
              return {
                  ...r,
                  clientName: client ? client.name : 'Cliente Desconhecido',
                  clientShopName: client?.shopName,
                  auditorName: auditor ? auditor.name : 'Auditor Desconhecido',
                  typeName: template ? template.label : r.typeKey
              };
          });

          // Fallback if API returns empty/error (e.g. first run) use Constants, otherwise use API data
          // NOTE: For Production, remove the OR || fallback to force DB usage
          setUsers(fetchedUsers.length > 0 ? fetchedUsers : MOCK_USERS); 
          setClients(fetchedClients.length > 0 ? fetchedClients : MOCK_CLIENTS);
          // If reports are empty but users/clients loaded, it might just be empty DB.
          // Only fallback if EVERYTHING failed (users empty)
          setReports(fetchedUsers.length > 0 ? hydratedReports : MOCK_REPORTS);
          
          if (fetchedSettings) setCompanySettings(fetchedSettings);

      } catch (error) {
          console.error("Error loading data", error);
          // Fallback to mocks so app doesn't crash on dev without PHP
          setUsers(MOCK_USERS);
          setClients(MOCK_CLIENTS);
          setReports(MOCK_REPORTS);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      loadData();
  }, []);


  // --- Derived State & Access Control ---
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Filter Clients based on Role
  const availableClients = clients.filter(c => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.COMERCIAL) {
        return c.accountManagerId === currentUser.id;
    }
    return true; // Auditors/Technicians usually see all or route based, keeping open for now
  });

  const filteredClients = availableClients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    (c.nif && c.nif.includes(clientSearch))
  );

  // Filter Reports based on Role (Only see reports for clients you have access to)
  const availableReports = reports.filter(r => {
      const client = clients.find(c => c.id === r.clientId);
      if (!client) return false; // Or show if deleted?
      if (!currentUser) return false;
      
      if (currentUser.role === UserRole.ADMIN) return true;
      if (currentUser.role === UserRole.COMERCIAL) {
          return client.accountManagerId === currentUser.id;
      }
      return true; 
  });

  // Dashboard calculations
  const currentMonthReports = availableReports.filter(r => {
    const rDate = new Date(r.date);
    const now = new Date();
    return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
  });

  const recentReports = availableReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Order Calculations
  const currentMonthOrders = currentMonthReports.filter(r => r.order);
  const currentMonthOrderValue = currentMonthOrders.reduce((acc, r) => acc + (r.order?.totalValue || 0), 0);

  // Alert Calculations (Clients not visited) - Only calculated for display logic, but visibility controlled below
  const overdueClients = availableClients.filter(c => {
      if (!c.visitFrequency || !c.lastVisit || c.lastVisit === '-') return false;
      const last = new Date(c.lastVisit);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > c.visitFrequency;
  });

  // --- Actions: Auth ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen(Screen.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // --- Actions: Clients ---

  const handleSaveClient = async (e: React.FormEvent<HTMLFormElement>) => {
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
      
      visitFrequency: Number(formData.get('visitFrequency')) || undefined,

      status: 'Ativo',
      lastVisit: editingClient?.lastVisit || '-',
      
      // If creating as commercial, auto-assign. If admin, could add selector (skipping for brevity)
      accountManagerId: editingClient?.accountManagerId || (currentUser?.role === UserRole.COMERCIAL ? currentUser.id : undefined)
    };

    // Update Local State Optimistically
    if (editingClient) {
      setClients(clients.map(c => c.id === clientData.id ? clientData : c));
    } else {
      setClients([...clients, clientData]);
    }
    
    // Save to API
    await api.saveClient(clientData);

    setIsClientModalOpen(false);
    setEditingClient(null);
  };

  const handleDeleteClient = async (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      alert("Apenas administradores podem apagar clientes.");
      return;
    }
    if (confirm('Tem a certeza que deseja remover este cliente?')) {
      // Optimistic Update
      setClients(clients.filter(c => c.id !== id));
      // API Call
      await api.deleteClient(id);
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

  const openClientHistory = (client: Client) => {
    setViewingHistoryClient(client);
  };

  // --- Actions: Users ---

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Handle File Upload
    const fileInput = (e.currentTarget.elements.namedItem('avatarFile') as HTMLInputElement);
    let avatarUrl = editingUser?.avatar || `https://ui-avatars.com/api/?name=${formData.get('name')}&background=random`;

    if (fileInput.files && fileInput.files[0]) {
       const file = fileInput.files[0];
       avatarUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
       });
    }

    // Get Allowed Templates (Permissions)
    const allowedTemplates = formData.getAll('allowedTemplates') as ReportTypeKey[];
    
    const userData: User = {
      id: editingUser ? editingUser.id : `u-${Date.now()}`,
      name: formData.get('name') as string,
      role: formData.get('role') as UserRole,
      pin: formData.get('pin') as string,
      avatar: avatarUrl,
      allowedTemplates: allowedTemplates.length > 0 ? allowedTemplates : [] 
    };

    if (editingUser) {
      setUsers(users.map(u => u.id === userData.id ? userData : u));
    } else {
      setUsers([...users, userData]);
    }

    await api.saveUser(userData);

    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Tem a certeza?')) {
        setUsers(users.filter(u => u.id !== id));
        await api.deleteUser(id);
    }
  };

  // --- Actions: Reports ---

  const initReportCreation = (client: Client) => {
    setSelectedClientForReport(client);
    setEditingReport(null); // Ensure we are not editing
    setViewingReport(null);
    setIsReportTypeModalOpen(true);
  };

  const selectReportType = (key: ReportTypeKey) => {
    setSelectedTemplateKey(key);
    setIsReportTypeModalOpen(false);
  };

  const handleEditReport = (report: Report) => {
    // Only Admin or the Author can edit (simplified to Admin for now based on prompt, but logical extension)
    if (currentUser?.role !== UserRole.ADMIN) return;
    const client = clients.find(c => c.id === report.clientId);
    if (!client) return;
    
    setSelectedClientForReport(client);
    setSelectedTemplateKey(report.typeKey);
    setEditingReport(report);
    setViewingReport(null);
  };

  const handleViewReport = (report: Report) => {
    const client = clients.find(c => c.id === report.clientId);
    if (!client) return;
    
    setSelectedClientForReport(client);
    setSelectedTemplateKey(report.typeKey);
    setViewingReport(report);
    setEditingReport(null);
  };

  const handleSaveReport = async (report: Report) => {
    // Check if updating or creating
    const exists = reports.some(r => r.id === report.id);
    
    if (exists) {
      setReports(reports.map(r => r.id === report.id ? report : r));
    } else {
      setReports([report, ...reports]);
      // Update client last visit
      const updatedClient = clients.find(c => c.id === report.clientId);
      if(updatedClient) {
          const newClientData = { ...updatedClient, lastVisit: report.date };
          setClients(clients.map(c => c.id === report.clientId ? newClientData : c));
          await api.saveClient(newClientData); // Async save client update
      }
    }

    await api.saveReport(report); // Async save report

    setSelectedTemplateKey(null);
    setSelectedClientForReport(null);
    setEditingReport(null);
    setViewingReport(null);
    setCurrentScreen(Screen.REPORTS);
  };

  const handleDownloadPDF = (report: Report) => {
    const client = clients.find(c => c.id === report.clientId);
    if (!client) return;
    const doc = generatePDF(report, client, companySettings);
    doc.save(`Relatorio_${client.name.replace(/\s+/g, '_')}_${report.date}.pdf`);
  };

  const handleEmailReport = (report: Report) => {
    const client = clients.find(c => c.id === report.clientId);
    if (!client) return;

    const doc = generatePDF(report, client, companySettings);
    
    // Simulate Email
    const subject = encodeURIComponent(`Relatório de Intervenção - ${client.name} - ${report.date}`);
    const body = encodeURIComponent(`Estimado(a) ${client.contactPerson},\n\nSegue em anexo o relatório da intervenção realizada dia ${report.date}.\n\nCumprimentos,\n${companySettings.name}`);
    
    // Open mailto
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
    // Download PDF for attachment
    doc.save(`Relatorio_${client.name.replace(/\s+/g, '_')}_${report.date}.pdf`);
    alert("O cliente de email foi aberto. O PDF foi descarregado para que o possa anexar manualmente.");
  };

  const handleDeleteReport = async (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    if (confirm("Deseja apagar este relatório permanentemente?")) {
      setReports(reports.filter(r => r.id !== id));
      await api.deleteReport(id);
    }
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  // --- Actions: Company Settings ---
  const handleSaveCompanySettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentUser?.role !== UserRole.ADMIN) return;
    
    const formData = new FormData(e.currentTarget);
    const fileInput = e.currentTarget.elements.namedItem('logoFile') as HTMLInputElement;
    
    let logoUrl = companySettings.logoUrl;

    if (fileInput.files && fileInput.files[0]) {
       const file = fileInput.files[0];
       logoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
       });
    }

    const newSettings = {
      name: formData.get('name') as string,
      nif: formData.get('nif') as string,
      address: formData.get('address') as string,
      postalCode: formData.get('postalCode') as string,
      locality: formData.get('locality') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      website: formData.get('website') as string,
      logoUrl: logoUrl
    };

    setCompanySettings(newSettings);
    await api.saveSettings(newSettings);
    alert("Definições da empresa atualizadas.");
  };


  // --- Render ---

  // Loading Screen
  if (isLoading) {
      return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">A carregar dados...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  // If creating, editing or viewing report
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
          setEditingReport(null);
          setViewingReport(null);
        }}
        initialReport={editingReport || viewingReport || undefined}
        readOnly={!!viewingReport}
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
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
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
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Total Clients Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-sm">Meus Clientes</p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-2">{availableClients.length}</h3>
                </div>
                
                {/* Reports Month Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500 text-sm">Relatórios (Mês)</p>
                  <h3 className="text-3xl font-bold text-blue-600 mt-2">{currentMonthReports.length}</h3>
                </div>

                {/* Orders Month Card (Commercial Focused) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm">Encomendas (Mês)</p>
                    <div className="flex items-end gap-2 mt-2">
                        <h3 className="text-3xl font-bold text-emerald-600">{currentMonthOrders.length}</h3>
                        {/* Only Admin sees value */}
                        {isAdmin && (
                          <span className="text-sm text-gray-500 mb-1">({currentMonthOrderValue.toFixed(0)}€)</span>
                        )}
                    </div>
                </div>

                 {/* Alerts Card - ONLY ADMIN SEES ALERTS */}
                 {isAdmin && (
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-gray-500 text-sm">Alertas de Visita</p>
                      <h3 className={`text-3xl font-bold mt-2 ${overdueClients.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {overdueClients.length}
                      </h3>
                  </div>
                 )}
              </div>
              
              {/* ALERTS SECTION (Only Admin) */}
              {isAdmin && overdueClients.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-red-100 flex items-center gap-2">
                          <AlertTriangle className="text-red-600" size={20} />
                          <h3 className="font-bold text-red-800">Clientes com Visita em Atraso</h3>
                      </div>
                      <div className="divide-y divide-red-100">
                          {overdueClients.map(client => {
                               const last = new Date(client.lastVisit || '');
                               const now = new Date();
                               const diffTime = Math.abs(now.getTime() - last.getTime());
                               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return (
                                  <div key={client.id} className="p-4 flex items-center justify-between hover:bg-red-100/50">
                                      <div>
                                          <p className="font-semibold text-gray-800">{client.name}</p>
                                          <p className="text-sm text-red-600">Última visita: {client.lastVisit} (há {diffDays} dias)</p>
                                          <p className="text-xs text-gray-500">Frequência definida: {client.visitFrequency} dias</p>
                                      </div>
                                      <button 
                                        onClick={() => initReportCreation(client)}
                                        className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700"
                                      >
                                          Visitar Agora
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              )}

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Relatórios Recentes</h3>
                  <button className="text-blue-600 text-sm hover:underline" onClick={() => setCurrentScreen(Screen.REPORTS)}>Ver todos</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentReports.length > 0 ? recentReports.map(report => (
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
                      <div className="flex gap-2">
                        <button onClick={() => handleViewReport(report)} className="p-2 text-gray-500 hover:text-blue-600" title="Visualizar">
                           <Eye size={18} />
                        </button>
                        <button onClick={() => handleDownloadPDF(report)} className="p-2 text-gray-500 hover:text-blue-600" title="PDF">
                           <FileText size={18} />
                        </button>
                      </div>
                    </div>
                  )) : (
                      <div className="p-6 text-center text-gray-500">Sem relatórios recentes.</div>
                  )}
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
                                onClick={() => openClientHistory(client)}
                                className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100" title="Ver Histórico / Detalhes">
                                <History size={18} />
                              </button>
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
                      {availableReports.map(report => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                             <p className="font-medium text-gray-900">{report.clientName}</p>
                             <p className="text-xs text-gray-500">{report.typeName}</p>
                             {report.order && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded ml-1">Encomenda</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{report.date}</td>
                          <td className="px-6 py-4 text-gray-600">{report.auditorName}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                <button onClick={() => handleViewReport(report)} className="p-2 text-purple-600 hover:bg-purple-50 rounded" title="Visualizar">
                                  <Eye size={18} />
                                </button>
                                <button onClick={() => handleDownloadPDF(report)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Ver PDF Relatório">
                                  <FileText size={18} />
                                </button>
                                {report.order && (
                                     <button onClick={() => {
                                         const client = clients.find(c => c.id === report.clientId);
                                         if(client) {
                                            const doc = generateOrderPDF(report, client, companySettings);
                                            doc.save(`Encomenda_${client.name.replace(/\s+/g, '_')}_${report.date}.pdf`);
                                         }
                                     }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded" title="Ver PDF Encomenda">
                                        <FileText size={18} />
                                    </button>
                                )}
                                {currentUser.role === UserRole.ADMIN && (
                                  <>
                                    <button 
                                      onClick={() => handleEditReport(report)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded" title="Editar Relatório">
                                      <Edit2 size={18} />
                                    </button>
                                    
                                    {report.gpsLocation && (
                                        <button 
                                          onClick={() => openGoogleMaps(report.gpsLocation!.lat, report.gpsLocation!.lng)} 
                                          className="p-2 text-orange-600 hover:bg-orange-50 rounded" title="Abrir no Maps">
                                          <MapPin size={18} />
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
                    
                    {/* Logo Section */}
                    <div className="md:col-span-2 mb-6 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Logótipo da Empresa</label>
                        <div className="flex items-center gap-6">
                            {companySettings.logoUrl && (
                                <div className="w-24 h-24 border rounded-lg bg-white flex items-center justify-center p-2 shadow-sm">
                                    <img src={companySettings.logoUrl} alt="Logo Atual" className="max-w-full max-h-full object-contain" />
                                </div>
                            )}
                            <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 shadow-sm transition-colors">
                                <Upload size={18} />
                                <span>{companySettings.logoUrl ? 'Alterar Logótipo' : 'Carregar Logótipo'}</span>
                                <input type="file" name="logoFile" accept="image/*" className="hidden" />
                            </label>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Recomendado: PNG ou JPG (Fundo transparente)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                        <input name="name" defaultValue={companySettings.name} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">NIF</label>
                        <input name="nif" defaultValue={companySettings.nif} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" required />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Morada</label>
                        <input name="address" defaultValue={companySettings.address} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Código Postal</label>
                        <input name="postalCode" defaultValue={companySettings.postalCode} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Localidade</label>
                        <input name="locality" defaultValue={companySettings.locality} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email Geral</label>
                        <input name="email" defaultValue={companySettings.email} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input name="phone" defaultValue={companySettings.phone} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <input name="website" defaultValue={companySettings.website} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" />
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
                            <td className="px-6 py-4 flex items-center gap-2 text-gray-900">
                               <img src={u.avatar} className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                               {u.name}
                            </td>
                            <td className="px-6 py-4 text-gray-900">{u.role}</td>
                            <td className="px-6 py-4 font-mono text-gray-600">******</td>
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

                  {/* Visit Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequência de Visita (Dias)</label>
                    <input 
                      name="visitFrequency" 
                      type="number" 
                      min="1"
                      defaultValue={editingClient?.visitFrequency || 30} 
                      className="w-full p-2 bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Para alertas de visita</p>
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
                   <input name="name" defaultValue={editingUser?.name} required className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                   <select name="role" defaultValue={editingUser?.role || UserRole.TECNICO} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900">
                      {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">PIN (6 dígitos)</label>
                   <input name="pin" defaultValue={editingUser?.pin} pattern="\d{6}" maxLength={6} required className="w-full p-2 border border-gray-300 rounded font-mono bg-white text-gray-900" placeholder="123456" />
                </div>
                
                {/* Template Permissions Checklist */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Permissões de Relatórios</label>
                   <div className="border border-gray-300 rounded bg-gray-50 max-h-40 overflow-y-auto p-2 space-y-2">
                      {Object.values(REPORT_TEMPLATES).map(tpl => (
                        <label key={tpl.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors">
                          <input 
                            type="checkbox" 
                            name="allowedTemplates" 
                            value={tpl.key}
                            defaultChecked={editingUser ? editingUser.allowedTemplates.includes(tpl.key) : true}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" 
                          />
                          <span className="text-sm text-gray-700">{tpl.label}</span>
                        </label>
                      ))}
                   </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil (Opcional)</label>
                  <div className="flex items-center gap-4">
                    {editingUser?.avatar && <img src={editingUser.avatar} className="w-12 h-12 rounded-full object-cover" />}
                    <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-200 flex items-center gap-2">
                       <Upload size={16} /> Carregar Foto
                       <input type="file" name="avatarFile" accept="image/*" className="hidden" />
                    </label>
                  </div>
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

        {/* Client History / Detail View Overlay */}
        {viewingHistoryClient && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center">
               <div className="flex items-center gap-4">
                 <button onClick={() => setViewingHistoryClient(null)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
                   <ChevronRight className="rotate-180" size={24} />
                 </button>
                 <div>
                   <h2 className="text-xl font-bold text-gray-800">{viewingHistoryClient.name}</h2>
                   <p className="text-sm text-gray-500">Ficha de Cliente e Histórico</p>
                 </div>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => { setViewingHistoryClient(null); openEditClient(viewingHistoryClient); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                    <Edit2 size={18} /> Editar Dados
                 </button>
                 <button onClick={() => { setViewingHistoryClient(null); initReportCreation(viewingHistoryClient); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus size={18} /> Novo Relatório
                 </button>
               </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
              
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2"><Building size={20}/> Dados da Empresa</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><span className="font-bold">NIF:</span> {viewingHistoryClient.nif || 'N/A'}</p>
                    <p><span className="font-bold">Loja:</span> {viewingHistoryClient.shopName || 'Sede'}</p>
                    <p className="flex items-start gap-2"><MapPin size={16} className="mt-1 shrink-0"/> {viewingHistoryClient.address}, {viewingHistoryClient.postalCode} {viewingHistoryClient.locality}, {viewingHistoryClient.county}</p>
                  </div>
                </div>

                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2"><Phone size={20}/> Contactos</h3>
                  <div className="space-y-2 text-sm text-green-800">
                     <p><span className="font-bold">Responsável:</span> {viewingHistoryClient.contactPerson}</p>
                     <p className="flex items-center gap-2"><AtSign size={16}/> {viewingHistoryClient.email}</p>
                     <p className="flex items-center gap-2"><Phone size={16}/> {viewingHistoryClient.phone}</p>
                  </div>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2"><Calendar size={20}/> Atividade</h3>
                  <div className="space-y-2 text-sm text-purple-800">
                     <p><span className="font-bold">Estado:</span> <span className="px-2 py-0.5 bg-white rounded-full text-xs border border-purple-200">{viewingHistoryClient.status}</span></p>
                     <p><span className="font-bold">Última Visita:</span> {viewingHistoryClient.lastVisit}</p>
                     <p><span className="font-bold">Frequência:</span> {viewingHistoryClient.visitFrequency || '30'} dias</p>
                     <p><span className="font-bold">Total Relatórios:</span> {reports.filter(r => r.clientId === viewingHistoryClient.id).length}</p>
                  </div>
                </div>
              </div>

              {/* Reports History */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Histórico de Intervenções</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                   <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Data / Hora</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo de Relatório</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Técnico</th>
                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {availableReports.filter(r => r.clientId === viewingHistoryClient.id).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            Ainda não existem relatórios para este cliente.
                          </td>
                        </tr>
                      ) : (
                        availableReports
                        .filter(r => r.clientId === viewingHistoryClient.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(report => (
                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                             <p className="font-medium text-gray-900">{report.date}</p>
                             <p className="text-xs text-gray-500">{report.startTime} - {report.endTime}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-100">
                              {report.typeName}
                            </span>
                            {report.order && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded ml-1">Enc.</span>}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{report.auditorName}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end gap-2">
                                <button onClick={() => handleViewReport(report)} className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 flex items-center gap-1 shadow-sm">
                                  <Eye size={14} /> Ver
                                </button>
                                <button onClick={() => handleDownloadPDF(report)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1 shadow-sm">
                                  <Download size={14} /> PDF
                                </button>
                                <button onClick={() => handleEmailReport(report)} className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 flex items-center gap-1 shadow-sm">
                                  <Mail size={14} /> Email
                                </button>
                             </div>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;