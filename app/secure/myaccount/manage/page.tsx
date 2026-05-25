"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../UserContext';
import AdminLogin from '../../../components/AdminLogin';
import UserTable from '../../../components/UserTable';
import TicketTable from '../../../components/TicketTable';
import SubAdminTable from '../../../components/SubAdminTable';
import { User, Ticket } from '../../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faTicketAlt, faSignOutAlt, faChevronLeft, faUserShield } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function ManageDashboard() {
    const router = useRouter();
    const {
        admin,
        users: allUsers,
        tickets: allTickets,
        fetchAllUsers,
        fetchAllTickets,
        setUsers,
        setTickets,
        setAdmin,
        setLoading,
        setLoggedInAdmin: contextSetLoggedInAdmin
    } = useUser();

    const [loggedInAdmin, setLoggedInAdmin] = useState<string | null>(null);
    const [localAdmin, setLocalAdmin] = useState<string | null>(null);
    const [users, setFilteredUsers] = useState<User[]>([]);
    const [tickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [activeTab, setActiveTab] = useState<'transfers' | 'tickets' | 'customers'>('transfers');
    const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);

    useEffect(() => {
        const adminUsername = localStorage.getItem("loggedInAdmin");
        const adminData = localStorage.getItem('adminData');
    
        if (adminUsername && adminData) {
            try {
                const parsedAdminData = JSON.parse(adminData);
                setAdmin(parsedAdminData);
                contextSetLoggedInAdmin(adminUsername);
                setLoggedInAdmin(adminUsername);
                setLocalAdmin(adminUsername);
                setIsSessionValid(true);
                fetchAllUsers();
                fetchAllTickets();
            } catch (e) {
                console.error("Error parsing admin data", e);
                localStorage.removeItem('adminData');
                localStorage.removeItem('loggedInAdmin');
                setAdmin(null);
                contextSetLoggedInAdmin(null);
                setLoggedInAdmin(null);
                setLocalAdmin(null);
                setIsSessionValid(false);
            }
        } else {
            setIsSessionValid(false);
        }
    }, [setAdmin, contextSetLoggedInAdmin]);



    useEffect(() => {
        if (isSessionValid === true && loggedInAdmin && Array.isArray(allUsers)) {
            const filteredUsers = allUsers.filter((u) => u.admin === loggedInAdmin);
            setFilteredUsers(filteredUsers);
        } else {
            setFilteredUsers([]);
        }
    }, [allUsers, loggedInAdmin, isSessionValid]);
    
    useEffect(() => {
        if (isSessionValid === false) {
            router.replace('/secure/login');
        }
    }, [isSessionValid, router]);
    
    useEffect(() => {
        if (isSessionValid === true && loggedInAdmin && Array.isArray(allTickets)) {
            const filteredTickets = allTickets.filter((t) => t.admin === loggedInAdmin);
            setFilteredTickets(filteredTickets);
        } else {
            setFilteredTickets([]);
        }
    }, [allTickets, loggedInAdmin, isSessionValid]);

    const handleLogout = () => {
        localStorage.removeItem("loggedInAdmin");
        localStorage.removeItem("adminData");
        localStorage.removeItem("adminToken");
        setLoggedInAdmin(null);
        setLocalAdmin(null);
        setAdmin(null);
        contextSetLoggedInAdmin(null);
        setLoading(false);
        setUsers([]);
        setTickets([]);
        setIsSessionValid(false);
        router.push('/secure/login');
    };

    if (isSessionValid === false || loggedInAdmin === null || admin === null) {
        return <AdminLogin setLoggedInAdmin={setLoggedInAdmin} setUsers={setFilteredUsers} />;
    }

    return (
        <main className="p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                        <Link href="/secure/myaccount/tickets" className="mr-4 text-gray-500 hover:text-gray-700">
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Management Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('transfers')}
                                className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'transfers' ? 'bg-[#89CF28] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FontAwesomeIcon icon={faUsers} className="mr-2" />
                                <span>Transfers</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('tickets')}
                                className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'tickets' ? 'bg-[#008000] text-white' : 'text-gray-700 dark:text-gray-300'}`}
                            >
                                <FontAwesomeIcon icon={faTicketAlt} className="mr-2" />
                                <span>Tickets</span>
                            </button>
                            {admin?.role === 'OWNER' && (
                                <button
                                    onClick={() => setActiveTab('customers')}
                                    className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'customers' ? 'bg-[#89CF28] text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <FontAwesomeIcon icon={faUserShield} className="mr-2" />
                                    <span>Sub-Admins</span>
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
                {activeTab === 'transfers' && <UserTable users={users} tickets={tickets} />}
                {activeTab === 'tickets' && <TicketTable tickets={tickets} users={users} />}
                {activeTab === 'customers' && admin?.role === 'OWNER' && <SubAdminTable />}
            </div>
            <footer className="py-8 text-center text-gray-400 text-sm">
                © {new Date().getFullYear()} Viagogo Management.
            </footer>
        </main>
    );
}
