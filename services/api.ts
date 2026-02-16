import { Client, Report, User, CompanySettings } from '../types';

// Detect if we are in development (localhost) or production (Hostinger)
const API_BASE = '/api'; 

// Helper to handle fetch and JSON parsing safely
const safeFetch = async <T>(url: string, options?: RequestInit): Promise<T | null> => {
    try {
        const res = await fetch(`${API_BASE}${url}`, options);
        if (!res.ok) {
            // If 404 or 500, we just return null to fallback to mocks
            console.warn(`API Error ${res.status} for ${url}`);
            return null;
        }
        
        const text = await res.text();
        
        // Guard: If response is empty or looks like PHP source/HTML (starts with <), assume API is not active
        if (!text || text.trim().startsWith('<')) {
            // Only warn once or debug level to avoid console spam
            // console.debug(`API returned non-JSON for ${url}. Using mock data.`);
            return null;
        }

        return JSON.parse(text) as T;
    } catch (e) {
        console.warn(`API Exception for ${url}:`, e);
        return null;
    }
};

export const api = {
    // --- USERS ---
    getUsers: async (): Promise<User[]> => {
        const data = await safeFetch<User[]>('/users.php');
        return data || [];
    },
    saveUser: async (user: User) => {
        await safeFetch('/users.php', {
            method: 'POST',
            body: JSON.stringify(user)
        });
    },
    deleteUser: async (id: string) => {
        await safeFetch(`/users.php?id=${id}`, { method: 'DELETE' });
    },

    // --- CLIENTS ---
    getClients: async (): Promise<Client[]> => {
        const data = await safeFetch<Client[]>('/clients.php');
        return data || [];
    },
    saveClient: async (client: Client) => {
        await safeFetch('/clients.php', {
            method: 'POST',
            body: JSON.stringify(client)
        });
    },
    deleteClient: async (id: string) => {
        await safeFetch(`/clients.php?id=${id}`, { method: 'DELETE' });
    },

    // --- REPORTS ---
    getReports: async (): Promise<Report[]> => {
        const data = await safeFetch<Report[]>('/reports.php');
        return data || [];
    },
    saveReport: async (report: Report) => {
        await safeFetch('/reports.php', {
            method: 'POST',
            body: JSON.stringify(report)
        });
    },
    deleteReport: async (id: string) => {
        await safeFetch(`/reports.php?id=${id}`, { method: 'DELETE' });
    },

    // --- SETTINGS ---
    getSettings: async (): Promise<CompanySettings | null> => {
        return await safeFetch<CompanySettings>('/settings.php');
    },
    saveSettings: async (settings: CompanySettings) => {
        await safeFetch('/settings.php', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }
};