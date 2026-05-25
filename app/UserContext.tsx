"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Ticket, Admin } from './types';

const APP_SCRIPT_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_URL || "";
const APP_SCRIPT_USER_URL = APP_SCRIPT_URL + "?sheetname=user";
const APP_SCRIPT_TICKET_URL = APP_SCRIPT_URL + "?sheetname=ticket";
const APP_SCRIPT_ADMIN_URL = APP_SCRIPT_URL + "?sheetname=admin";

interface UserContextProps {
    user: User | null;
    users: User[];
    ticket: Ticket | null;
    tickets: Ticket[];
    admin: Admin | null;
    loading: boolean;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    setTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
    setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
    setAdmin: React.Dispatch<React.SetStateAction<Admin | null>>;
    setLoggedInAdmin: React.Dispatch<React.SetStateAction<string | null>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    fetchAllUsers: () => Promise<void>;
    fetchAllTickets: () => Promise<void>;
    fetchAdminData: (username: string, password: string) => Promise<boolean>;
    fetchUserData: (id: string) => Promise<User | null>;
    fetchUserByToken: (token: string) => Promise<User | null>;
    loginWithToken: (token: string) => Promise<boolean>;
    verifyAdminSession: () => Promise<{ valid: boolean; status?: string; plan?: string; subscriptionExpiry?: string }>;
    logout: () => void;
};

const UserContext = createContext<UserContextProps>({
    user: null,
    users: [],
    ticket: null,
    tickets: [],
    admin: null,
    loading: true,
    setUser: () => { },
    setUsers: () => { },
    setTicket: () => { },
    setTickets: () => { },
    setAdmin: () => { },
    setLoggedInAdmin: () => { },
    setLoading: () => { },
    fetchAllUsers: async () => { },
    fetchAllTickets: async () => { },
    fetchAdminData: async () => false,
    fetchUserData: async () => null,
    fetchUserByToken: async () => null,
    loginWithToken: async () => false,
    verifyAdminSession: async () => ({ valid: false }),
    logout: () => { },
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [loggedInAdmin, setLoggedInAdmin] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialLoad = useRef(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const postToGAS = useCallback(async (payload: Record<string, string>) => {
        const body = new URLSearchParams(payload);
        const res = await fetch(APP_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString()
        });
        return res.json();
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("loggedInAdmin");
        localStorage.removeItem("adminData");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("allUsersData");
        localStorage.removeItem("allTicketsData");
        setAdmin(null);
        setLoggedInAdmin(null);
        setUsers([]);
        setTickets([]);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        router.push('/login');
    }, [router]);

    const verifyAdminSession = useCallback(async () => {
        const token = localStorage.getItem("adminToken");
        if (token) return { valid: true };
        const adminData = localStorage.getItem("adminData");
        if (!adminData) return { valid: false };
        try {
            const parsed: Admin = JSON.parse(adminData);
            if (parsed.token) return { valid: true };
            return await postToGAS({ action: "verifyAdminSession", adminId: parsed.adminId });
        } catch {
            return { valid: false };
        }
    }, [postToGAS]);

    const loginWithToken = useCallback(async (token: string): Promise<boolean> => {
        try {
            const data = await postToGAS({ action: "adminLoginByToken", token });
            if (data.success && data.admin) {
                setAdmin(data.admin);
                setLoggedInAdmin(data.admin.username);
                localStorage.setItem("loggedInAdmin", data.admin.username);
                localStorage.setItem("adminData", JSON.stringify(data.admin));
                localStorage.setItem("adminToken", token);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Token login error:", error);
            return false;
        }
    }, [postToGAS]);

    const fetchWithRetry = useCallback(async (url: string, retries = 3) => {
        let attempt = 0;
        while (attempt < retries) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error("Network response was not ok");
                return await response.json();
            } catch (error) {
                attempt++;
                if (attempt < retries) {
                    console.log(`Retrying... attempt ${attempt}`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    console.error("Failed to fetch after multiple attempts:", error);
                    throw error;
                }
            }
        }
    }, []);

    const fetchAdminData = useCallback(async (username: string, password: string): Promise<boolean> => {
        try {
            const data: Admin[] = await fetchWithRetry(APP_SCRIPT_ADMIN_URL);
            const adminData = data.find((admin) => admin.username === username && admin.password === password);
            
            if (adminData) {
                // Platform Validation: Check if "viagogo" is in the allowedPlatform list
                // If the list is empty, we allow access by default for now (to avoid lockout)
                const platformString = adminData.allowedPlatform?.toLowerCase() || "";
                const allowedPlatforms = platformString.split(',').map(p => p.trim()).filter(p => p !== "");
                
                if (allowedPlatforms.length > 0 && !allowedPlatforms.includes("viagogo")) {
                    alert("Access denied: Your account is not authorized for the Viagogo platform.");
                    return false;
                }
                
                // Subscription Validation
                if (adminData.role === 'CUSTOMER' && adminData.status === 'EXPIRED') {
                    alert("Your subscription has expired. Please contact the administrator.");
                    return false;
                }
                
                setAdmin(adminData);
                localStorage.setItem("loggedInAdmin", username);
                localStorage.setItem("adminData", JSON.stringify(adminData));
                
                // Save token from sheet data immediately (ensureToken may fail)
                if (adminData.token) {
                    localStorage.setItem("adminToken", adminData.token);
                }
                
                // Auto-generate/retrieve token for this admin
                try {
                    const tokenResult = await postToGAS({ action: "ensureToken", adminId: adminData.adminId });
                    if (tokenResult.success && tokenResult.token) {
                        adminData.token = tokenResult.token;
                        localStorage.setItem("adminData", JSON.stringify(adminData));
                        localStorage.setItem("adminToken", tokenResult.token);
                    }
                } catch (err) {
                    console.error("Token generation error:", err);
                }
                
                return true;
            } else {
                alert("Invalid admin credentials!");
                localStorage.removeItem("loggedInAdmin");
                localStorage.removeItem("adminData");
                setAdmin(null);
                return false;
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
            return false;
        }
    }, [fetchWithRetry]);

    const fetchUserData = useCallback(async (id: string): Promise<User | null> => {
        try {
            const data: User[] = await fetchWithRetry(APP_SCRIPT_USER_URL);
            const userData = data.find((row: User) => row.userId === id);
            if (userData) {
                setUser(userData);
                return userData;
            } else {
                router.push('/invalid');
                return null;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            router.push('/invalid');
            return null;
        } finally {
            //setLoading(false);
        }
    }, [router, fetchWithRetry]);

    const fetchUserByToken = useCallback(async (token: string): Promise<User | null> => {
        try {
            const data: User[] = await fetchWithRetry(APP_SCRIPT_USER_URL);
            const userData = data.find((row: User) => row.token === token);
            if (userData) {
                setUser(userData);
                return userData;
            } else {
                router.push('/invalid');
                return null;
            }
        } catch (error) {
            console.error('Error fetching user data by token:', error);
            router.push('/invalid');
            return null;
        } finally {
            //setLoading(false);
        }
    }, [router, fetchWithRetry]);

    const fetchAllUsers = useCallback(async () => {
        try {
            const data: User[] = await fetchWithRetry(APP_SCRIPT_USER_URL);
            const adminUsername = localStorage.getItem("loggedInAdmin");
            const filteredData = adminUsername ? data.filter(u => u.admin === adminUsername) : data;
            setUsers(filteredData);
            localStorage.setItem('allUsersData', JSON.stringify(data));
        } catch (error) {
            console.error('Error fetching all users:', error);
        } finally {
            //setLoading(false);
        }
    }, [fetchWithRetry]);

    const fetchTicketData = useCallback(async (ticketId: string) => {
        try {
            const data: Ticket[] = await fetchWithRetry(APP_SCRIPT_TICKET_URL);
            const ticketData = data.find((row: Ticket) => row.ticketId === ticketId);
            if (ticketData) {
                setTicket(ticketData);
                localStorage.setItem('ticketData', JSON.stringify(ticketData));
            }
        } catch (error) {
            console.error('Error fetching ticket data:', error);
        } finally {
            //setLoading(false);
        }
    }, [fetchWithRetry]);

    const fetchAllTickets = useCallback(async () => {
        try {
            const data: Ticket[] = await fetchWithRetry(APP_SCRIPT_TICKET_URL);
            const adminUsername = localStorage.getItem("loggedInAdmin");
            const filteredData = adminUsername ? data.filter(t => t.admin === adminUsername) : data;
            setTickets(filteredData);
            localStorage.setItem('allTicketsData', JSON.stringify(data));
        } catch (error) {
            console.error('Error fetching all tickets:', error);
        } finally {
            //setLoading(false);
        }
    }, [fetchWithRetry]);

    const refreshData = () => {
        initialLoad.current = true;
    };

    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        const cachedAllUsersData = localStorage.getItem('allUsersData');
        const cachedAllTicketsData = localStorage.getItem('allTicketsData');
        const currentPath = window.location.pathname;

        if (idFromUrl) {
            fetchUserData(idFromUrl);
        } else if (!currentPath.startsWith('/login')) {
            //router.push('/invalid');
        }

        if (user && user.ticketId) {
            fetchTicketData(user.ticketId);
        }

        if (initialLoad.current) {
            initialLoad.current = false;

            if (cachedAllUsersData) {
                try {
                    const usersData = JSON.parse(cachedAllUsersData);
                    const adminUsername = localStorage.getItem("loggedInAdmin");
                    const filteredData = adminUsername ? usersData.filter((u: User) => u.admin === adminUsername) : usersData;
                    setUsers(filteredData);
                } catch (e) {
                    console.error("Error parsing cached all users data", e);
                    localStorage.removeItem('allUsersData');
                    fetchAllUsers();
                }
            } else {
                fetchAllUsers();
            }

            if (cachedAllTicketsData) {
                try {
                    const ticketsData = JSON.parse(cachedAllTicketsData);
                    const adminUsername = localStorage.getItem("loggedInAdmin");
                    const filteredData = adminUsername ? ticketsData.filter((t: Ticket) => t.admin === adminUsername) : ticketsData;
                    setTickets(filteredData);
                } catch (e) {
                    console.error("Error parsing cached all tickets data", e);
                    localStorage.removeItem('allTicketsData');
                    fetchAllTickets();
                }
            } else {
                fetchAllTickets();
            }

            if (idFromUrl && user && user.userId !== idFromUrl) {
                localStorage.removeItem('ticketData');
                setTicket(null);
            }
        }
    }, [searchParams, router, fetchUserData, fetchAllUsers, fetchAllTickets, fetchTicketData]);

    // Restore admin session from localStorage
    useEffect(() => {
        const storedAdminData = localStorage.getItem("adminData");
        
        if (storedAdminData) {
            try {
                const parsed: Admin = JSON.parse(storedAdminData);
                setAdmin(parsed);
                setLoggedInAdmin(parsed.username);
            } catch (e) {
                console.error("Error parsing stored admin data", e);
                localStorage.removeItem("adminData");
                localStorage.removeItem("loggedInAdmin");
            }
        }
    }, []);

    const value = useMemo(() => ({
        user,
        users,
        ticket,
        tickets,
        admin,
        loading,
        setUser,
        setUsers,
        setTicket,
        setTickets,
        setAdmin,
        setLoggedInAdmin,
        setLoading,
        fetchAllUsers,
        fetchAllTickets,
        fetchAdminData,
        fetchUserData,
        fetchUserByToken,
        loginWithToken,
        verifyAdminSession,
        logout,
    }), [
        user,
        users,
        ticket,
        tickets,
        admin,
        loading,
        setUser,
        setUsers,
        setTicket,
        setTickets,
        setAdmin,
        setLoggedInAdmin,
        setLoading,
        fetchAllUsers,
        fetchAllTickets,
        fetchAdminData,
        fetchUserData,
        fetchUserByToken,
        loginWithToken,
        verifyAdminSession,
        logout,
    ]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);