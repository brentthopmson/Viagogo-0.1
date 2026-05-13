"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Ticket, Admin } from './types';

const APP_SCRIPT_USER_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_USER_URL || "";
const APP_SCRIPT_TICKET_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_TICKET_URL || "";
const APP_SCRIPT_ADMIN_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_ADMIN_URL || "";

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
    fetchUserData: (id: string) => Promise<User | null>; // Corrected declaration
}

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
    fetchUserData: async () => null, // Corrected default implementation
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

    const fetchWithRetry = async (url: string, retries = 3) => {
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
                  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
              } else {
                  console.error("Failed to fetch after multiple attempts:", error);
                  throw error;
              }
          }
      }
  };

  const fetchAdminData = async (username: string, password: string): Promise<boolean> => {
    try {
      //setLoading(true);
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
        sessionStorage.setItem("loggedInAdmin", username);
        sessionStorage.setItem("adminData", JSON.stringify(adminData));
        return true;
      } else {
        alert("Invalid admin credentials!");
        sessionStorage.removeItem("loggedInAdmin");
        sessionStorage.removeItem("adminData");
        setAdmin(null);
        return false;
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      return false;
    } finally {
      //setLoading(false);
    }
  };


    const fetchUserData = async (id: string): Promise<User | null> => { // Corrected implementation
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
    };

  const fetchAllUsers = async () => {
    try {
      //setLoading(true);
      const data: User[] = await fetchWithRetry(APP_SCRIPT_USER_URL);
      const adminUsername = sessionStorage.getItem("loggedInAdmin");
      const filteredData = adminUsername ? data.filter(u => u.admin === adminUsername) : data;
      setUsers(filteredData);
      localStorage.setItem('allUsersData', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching all users:', error);
    } finally {
      //setLoading(false);
    }
  };

  const fetchTicketData = async (ticketId: string) => {
    try {
      //setLoading(true);
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
  };

  const fetchAllTickets = async () => {
    try {
      //setLoading(true);
      const data: Ticket[] = await fetchWithRetry(APP_SCRIPT_TICKET_URL);
      const adminUsername = sessionStorage.getItem("loggedInAdmin");
      const filteredData = adminUsername ? data.filter(t => t.admin === adminUsername) : data;
      setTickets(filteredData);
      localStorage.setItem('allTicketsData', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching all tickets:', error);
    } finally {
      //setLoading(false);
    }
  };

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
                  const adminUsername = sessionStorage.getItem("loggedInAdmin");
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
                  const adminUsername = sessionStorage.getItem("loggedInAdmin");
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
      }

      if (idFromUrl && user && user.userId !== idFromUrl) {
          localStorage.removeItem('ticketData');
          setTicket(null);
      }
  }, [searchParams, router, user]);

  // Add this to your useEffect in UserContext.tsx
  useEffect(() => {
    // Check for stored admin data
    const loggedInAdminUsername = sessionStorage.getItem("loggedInAdmin");
    const storedAdminData = sessionStorage.getItem("adminData");
    
    if (storedAdminData) {
      try {
        setAdmin(JSON.parse(storedAdminData));
      } catch (e) {
        console.error("Error parsing stored admin data", e);
        sessionStorage.removeItem("adminData");
      }
    } else if (loggedInAdminUsername) {
      // If we only have the username but not the full data, try to fetch it
      fetchAdminData(loggedInAdminUsername, ""); // Password will be ignored in this case
    }
  }, []);

  return (
      <UserContext.Provider
          value={{
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
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
