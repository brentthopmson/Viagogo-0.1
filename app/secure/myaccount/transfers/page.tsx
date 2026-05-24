"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../UserContext';
import { User } from '../../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExchangeAlt,
    faBars,
    faUser,
    faEnvelope,
    faTicketAlt,
    faChevronRight,
    faSearch,
    faLock,
    faSignOutAlt,
    faUserCircle,
    faCog,
    faShieldAlt,
    faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';

export default function TransfersPage() {
    const router = useRouter();
    const {
        admin,
        users,
        fetchAllUsers,
        setAdmin,
        setUsers,
        setTickets,
        setLoggedInAdmin: contextSetLoggedInAdmin,
        verifyAdminSession
    } = useUser();

    const [loggedInAdmin, setLoggedInAdmin] = useState<string | null>(null);
    const [localAdmin, setLocalAdmin] = useState<string | null>(null);
    const [filteredTransfers, setFilteredTransfers] = useState<User[]>([]);
    const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [activeLabel, setActiveLabel] = useState('Transfers');
    const [searchTerm, setSearchTerm] = useState('');

    const handleLogout = () => {
        localStorage.removeItem("loggedInAdmin");
        localStorage.removeItem("adminData");
        setAdmin(null);
        contextSetLoggedInAdmin(null);
        setLoggedInAdmin(null);
        setLocalAdmin(null);
        setUsers([]);
        setTickets([]);
        setIsSessionValid(false);
        router.push('/login');
    };

    const sidebarItems = [
        { icon: faTicketAlt, label: 'My Purchases', active: false, href: '/secure/myaccount/tickets' },
        { icon: faExchangeAlt, label: 'Transfers', active: true, href: '/secure/myaccount/transfers' },
        { icon: faUserCircle, label: 'Personal Details', active: false, href: '/secure/myaccount/personal-details' },
        { icon: faCog, label: 'Account Settings', active: false, href: '/secure/myaccount/manage' },
        { icon: faShieldAlt, label: 'Privacy', active: false, href: '#' },
        { icon: faQuestionCircle, label: 'Help', active: false, href: '#' },
        { icon: faSignOutAlt, label: 'Sign Out', active: false, href: '#', action: handleLogout },
    ];

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
            } catch (e) {
                console.error("Error parsing admin data", e);
                router.replace('/login');
            }
        } else {
            router.replace('/login');
        }
    }, [setAdmin, router, fetchAllUsers, contextSetLoggedInAdmin]);

    // Periodic session verification
    useEffect(() => {
        if (isSessionValid === true) {
            const interval = setInterval(async () => {
                const result = await verifyAdminSession();
                if (!result.valid) {
                    alert("Your session has expired. You have been logged out.");
                    localStorage.removeItem("loggedInAdmin");
                    localStorage.removeItem("adminData");
                    setAdmin(null);
                    contextSetLoggedInAdmin(null);
                    setLoggedInAdmin(null);
                    setLocalAdmin(null);
                    setUsers([]);
                    setTickets([]);
                    setIsSessionValid(false);
                    router.push('/login');
                }
            }, 60000);

            return () => clearInterval(interval);
        }
    }, [isSessionValid, verifyAdminSession, router, setAdmin, contextSetLoggedInAdmin, setUsers, setTickets]);

    useEffect(() => {
        if (isSessionValid === true && loggedInAdmin && Array.isArray(users)) {
            // Filter: only this admin's transfers with 'viagogo' platform
            let transfers = users.filter(u =>
                u.admin === loggedInAdmin &&
                u.userPlatform?.toLowerCase() === 'viagogo'
            );

            // Filter by tab
            if (activeTab === 'pending') {
                transfers = transfers.filter(u =>
                    u.systemStatus === 'WAITING APPROVAL' ||
                    u.systemStatus === 'WAITING COMPLETION' ||
                    !u.systemStatus // Default to pending if no status
                );
            } else {
                transfers = transfers.filter(u => u.systemStatus === 'COMPLETED');
            }

            // Filter by search
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                transfers = transfers.filter(u =>
                    u.fullName?.toLowerCase().includes(term) ||
                    u.emailAddress?.toLowerCase().includes(term) ||
                    u.ticketId?.toLowerCase().includes(term)
                );
            }

            setFilteredTransfers(transfers);
        }
    }, [users, loggedInAdmin, isSessionValid, activeTab, searchTerm]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WAITING APPROVAL': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'WAITING COMPLETION': return 'bg-[#89CF28]/5 text-[#89CF28] border-[#89CF28]/10';
            case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-100';
            case 'DECLINED': return 'bg-red-50 text-red-700 border-red-100';
            case 'RETRACTED': return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'CANCELLED': return 'bg-gray-50 text-gray-700 border-gray-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    if (isSessionValid === null) return null;

    return (
        <div className="min-h-screen bg-[#f4f7f9] flex flex-col font-sans">

            {/* Header */}
            <header className="bg-white text-[#001B41] border-b border-gray-100 p-4 fixed top-0 left-0 right-0 z-50 w-full">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            className="mr-4 lg:hidden text-2xl text-[#001B41]"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <FontAwesomeIcon icon={faBars} />
                        </button>
                        <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
                            <img src="/logo.png" alt="viagogo logo" className="h-[24px] w-auto md:h-[28px]" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-6">
                        <span className="hidden md:block text-sm font-bold uppercase tracking-wider text-gray-500">Hi, {admin?.username}</span>
                        <button onClick={handleLogout} className="text-sm font-black text-[#001B41] hover:text-[#89CF28] transition-colors flex items-center">
                            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row pt-[88px] lg:pt-[88px] pb-8 px-4 gap-8">
                <Sidebar
                    sidebarItems={sidebarItems}
                    isSidebarOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    adminUsername={admin?.username}
                />

                {/* Main Content */}
                <main className="flex-1 pb-24 lg:pb-0">
                    <h1 className="text-4xl font-black text-[#001B41] mb-8 tracking-tight">Transfers</h1>

                    {/* Search */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search by name, email, or ticket ID..."
                            className="w-full p-4 pl-12 bg-white border border-gray-100 rounded-2xl text-[#001B41] placeholder-gray-300 font-bold text-sm outline-none focus:ring-4 focus:ring-[#89CF28]/10 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 mb-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-8 py-4 font-black text-xs uppercase tracking-widest transition-all border-b-4 whitespace-nowrap ${activeTab === 'pending' ? 'border-[#89CF28] text-[#001B41]' : 'border-transparent text-gray-400 hover:text-[#001B41]'}`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-8 py-4 font-black text-xs uppercase tracking-widest transition-all border-b-4 whitespace-nowrap ${activeTab === 'completed' ? 'border-[#89CF28] text-[#001B41]' : 'border-transparent text-gray-400 hover:text-[#001B41]'}`}
                        >
                            Completed
                        </button>
                    </div>

                    {/* Transfer List */}
                    {filteredTransfers.length > 0 ? (
                        <div className="space-y-4">
                            {filteredTransfers.map((transfer, i) => (
                                <Link key={i} href={`/secure/myaccount/transfers/${transfer.userId}`} className="block bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform">
                                    <div className="p-5 flex items-start justify-between">
                                        <div className="flex-1 min-w-0 mr-4">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-[#89CF28]/5 text-[#89CF28] flex items-center justify-center flex-shrink-0">
                                                    <FontAwesomeIcon icon={faUser} className="text-sm" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#001B41] text-base truncate">{transfer.fullName}</p>
                                                    <p className="text-xs font-bold text-gray-400 truncate">{transfer.emailAddress}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-[11px] font-bold text-gray-500 mt-2">
                                                <span className="flex items-center">
                                                    <FontAwesomeIcon icon={faTicketAlt} className="mr-1.5 text-[#89CF28]" />
                                                    {transfer.ticketId}
                                                </span>
                                                <span className="flex items-center">
                                                    <FontAwesomeIcon icon={faExchangeAlt} className="mr-1.5 text-[#89CF28]" />
                                                    {transfer.seatNumbers}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-300 mt-2">
                                                {transfer.timestamp ? new Date(transfer.timestamp).toLocaleDateString('en-US', { 
                                                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                }) : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end space-y-3">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border ${getStatusColor(transfer.systemStatus || '')}`}>
                                                {transfer.systemStatus || 'UNKNOWN'}
                                            </span>
                                            <FontAwesomeIcon icon={faChevronRight} className="text-gray-200 text-xs mr-1" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[24px] p-16 text-center shadow-sm border border-gray-100">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FontAwesomeIcon icon={faExchangeAlt} className="text-3xl text-gray-200" />
                            </div>
                            <h3 className="text-2xl font-black text-[#001B41] mb-2">No transfers found</h3>
                            <p className="text-gray-400 font-bold">
                                {activeTab === 'pending'
                                    ? `No pending transfers found.`
                                    : 'No completed transfers found.'}
                            </p>
                        </div>
                    )}
                </main>
            </div>

        </div>
    );
}
