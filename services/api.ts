import { Client, Report, User, CompanySettings } from '../types';

// Detect if we are in development (localhost) or production (Hostinger)
// If in localhost, you might need to change this if your PHP is running on a different port
// For Hostinger, the relative path '/api' works because files are served from the same domain
const API_BASE = '/api'; 

export const api = {
    // --- USERS ---
    getUsers: async (): Promise<User[]> => {
        try {
            const res = await fetch(`${API_BASE}/users.php`);
            if (!res.ok) throw new Error('API Error');
            return await res.json();
        } catch (e) {
            console.error("Failed to fetch users", e);
            return []; // Fallback or throw
        }
    },
    saveUser: async (user: User) => {
        await fetch(`${API_BASE}/users.php`, {
            method: 'POST',
            body: JSON.stringify(user)
        });
    },
    deleteUser: async (id: string) => {
        await fetch(`${API_BASE}/users.php?id=${id}`, { method: 'DELETE' });
    },

    // --- CLIENTS ---
    getClients: async (): Promise<Client[]> => {
        try {
            const res = await fetch(`${API_BASE}/clients.php`);
            if (!res.ok) throw new Error('API Error');
            return await res.json();
        } catch (e) {
            console.error("Failed to fetch clients", e);
            return [];
        }
    },
    saveClient: async (client: Client) => {
        await fetch(`${API_BASE}/clients.php`, {
            method: 'POST',
            body: JSON.stringify(client)
        });
    },
    deleteClient: async (id: string) => {
        await fetch(`${API_BASE}/clients.php?id=${id}`, { method: 'DELETE' });
    },

    // --- REPORTS ---
    getReports: async (): Promise<Report[]> => {
        try {
            const res = await fetch(`${API_BASE}/reports.php`);
            if (!res.ok) throw new Error('API Error');
            return await res.json();
        } catch (e) {
            console.error("Failed to fetch reports", e);
            return [];
        }
    },
    saveReport: async (report: Report) => {
        await fetch(`${API_BASE}/reports.php`, {
            method: 'POST',
            body: JSON.stringify(report)
        });
    },
    deleteReport: async (id: string) => {
        await fetch(`${API_BASE}/reports.php?id=${id}`, { method: 'DELETE' });
    },

    // --- SETTINGS ---
    getSettings: async (): Promise<CompanySettings | null> => {
        try {
            const res = await fetch(`${API_BASE}/settings.php`);
            if (!res.ok) throw new Error('API Error');
            return await res.json();
        } catch (e) {
            return null;
        }
    },
    saveSettings: async (settings: CompanySettings) => {
        await fetch(`${API_BASE}/settings.php`, {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }
};