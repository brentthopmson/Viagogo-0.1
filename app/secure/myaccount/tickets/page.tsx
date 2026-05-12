"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../UserContext';
import TicketCard from '../../../components/TicketCard';
import { Ticket } from '../../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTicketAlt, 
    faUserCircle, 
    faCog, 
    faShieldAlt, 
    faQuestionCircle,
    faSignOutAlt,
    faBars,
    faTimes,
    faLock
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function MyTicketsPage() {
    const router = useRouter();
    const {
        admin,
        tickets: allTickets,
        fetchAllTickets,
        setAdmin,
        setLoading,
        setUsers,
        setTickets
    } = useUser();

    const [loggedInAdmin, setLoggedInAdmin] = useState<string | null>(null);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const adminUsername = sessionStorage.getItem("loggedInAdmin");
        const adminData = sessionStorage.getItem('adminData');
    
        if (adminUsername && adminData) {
            try {
                const parsedAdminData = JSON.parse(adminData);
                setAdmin(parsedAdminData);
                setLoggedInAdmin(adminUsername);
                setIsSessionValid(true);
                fetchAllTickets();
            } catch (e) {
                console.error("Error parsing admin data", e);
                router.replace('/login');
            }
        } else {
            router.replace('/login');
        }
    }, [setAdmin, router]);

    useEffect(() => {
        if (isSessionValid === true && loggedInAdmin && Array.isArray(allTickets)) {
            const filtered = allTickets.filter((t) => t.admin === loggedInAdmin);
            setFilteredTickets(filtered);
        }
    }, [allTickets, loggedInAdmin, isSessionValid]);

    const handleLogout = () => {
        sessionStorage.removeItem("loggedInAdmin");
        sessionStorage.removeItem("adminData");
        setAdmin(null);
        setUsers([]);
        setTickets([]);
        router.push('/login');
    };

    const sidebarItems = [
        { icon: faTicketAlt, label: 'My Purchases', active: true },
        { icon: faUserCircle, label: 'Personal Details', active: false },
        { icon: faCog, label: 'Account Settings', active: false },
        { icon: faShieldAlt, label: 'Privacy', active: false },
        { icon: faQuestionCircle, label: 'Help', active: false },
    ];

    if (isSessionValid === null) return null;

    return (
        <div className="min-h-screen bg-[#f4f7f9] flex flex-col font-sans">
            {/* Header - White Background as requested */}
            <header className="bg-white text-[#001B41] border-b border-gray-100 p-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button 
                            className="mr-4 lg:hidden text-2xl text-[#001B41]"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} />
                        </button>
                        <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
                            <img src="/logo.png" alt="viagogo logo" className="h-[24px] w-auto md:h-[28px]" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-6">
                        <span className="hidden md:block text-sm font-bold uppercase tracking-wider text-gray-500">Hi, {admin?.username}</span>
                        <button onClick={handleLogout} className="text-sm font-black text-[#001B41] hover:text-[#89CF28] transition-colors flex items-center">
                            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row py-8 px-4 gap-8">
                {/* Sidebar */}
                <aside className={`
                    fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:bg-transparent lg:inset-auto lg:w-64
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <div className="p-6 lg:p-0">
                        <div className="lg:hidden flex justify-end mb-8">
                            <button onClick={() => setIsSidebarOpen(false)} className="text-2xl text-[#001B41]">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <nav className="space-y-1">
                            {sidebarItems.map((item, i) => (
                                <button
                                    key={i}
                                    className={`w-full text-left px-4 py-3 rounded-[12px] flex items-center space-x-3 transition-all ${item.active ? 'bg-[#89CF28] text-white font-black shadow-lg shadow-[#89CF28]/20' : 'text-[#001B41] hover:bg-white hover:shadow-sm font-bold'}`}
                                >
                                    <FontAwesomeIcon icon={item.icon} className="w-5" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Management Link */}
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <Link 
                                href="/secure/myaccount/manage" 
                                className="flex items-center space-x-3 text-gray-400 hover:text-[#89CF28] transition-colors text-[10px] font-black uppercase tracking-widest"
                            >
                                <FontAwesomeIcon icon={faLock} className="w-4" />
                                <span>Admin Panel</span>
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    <h1 className="text-4xl font-black text-[#001B41] mb-8 tracking-tight">My Purchases</h1>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-8 py-4 font-black text-xs uppercase tracking-widest transition-all border-b-4 whitespace-nowrap ${activeTab === 'upcoming' ? 'border-[#89CF28] text-[#001B41]' : 'border-transparent text-gray-400 hover:text-[#001B41]'}`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`px-8 py-4 font-black text-xs uppercase tracking-widest transition-all border-b-4 whitespace-nowrap ${activeTab === 'past' ? 'border-[#89CF28] text-[#001B41]' : 'border-transparent text-gray-400 hover:text-[#001B41]'}`}
                        >
                            Past
                        </button>
                    </div>

                    {/* Tickets List */}
                    <div className="space-y-6">
                        {activeTab === 'upcoming' ? (
                            filteredTickets.length > 0 ? (
                                filteredTickets.map((ticket, i) => (
                                    <TicketCard key={i} ticket={ticket} />
                                ))
                            ) : (
                                <div className="bg-white rounded-[24px] p-16 text-center shadow-xl shadow-[#001B41]/5 border border-gray-100">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <FontAwesomeIcon icon={faTicketAlt} className="text-3xl text-gray-200" />
                                    </div>
                                    <h3 className="text-2xl font-black text-[#001B41] mb-2">No upcoming purchases</h3>
                                    <p className="text-gray-400 font-bold mb-8">Find your next live experience today!</p>
                                    <button 
                                        onClick={() => router.push('/')}
                                        className="bg-[#89CF28] text-white px-10 py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform shadow-xl shadow-[#89CF28]/20"
                                    >
                                        Browse Events
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="bg-white rounded-[24px] p-16 text-center shadow-sm border border-gray-100">
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No past purchases to show.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Global Mobile Footer - Reference Yahoo Link Aesthetic */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-3 flex justify-between items-center z-[100] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                <button onClick={() => router.push('/')} className="flex flex-col items-center space-y-1 text-gray-300 hover:text-[#89CF28] transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span className="text-[9px] font-black uppercase tracking-wider">Home</span>
                </button>
                <button onClick={() => router.push('/secure/myaccount/tickets')} className="flex flex-col items-center space-y-1 text-[#89CF28]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                    <span className="text-[9px] font-black uppercase tracking-wider">Tickets</span>
                </button>
                <button onClick={() => window.open('https://www.viagogo.com/favorites', '_blank')} className="flex flex-col items-center space-y-1 text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    <span className="text-[9px] font-black uppercase tracking-wider">Saved</span>
                </button>
                <button onClick={() => router.push('/secure/myaccount/manage')} className="flex flex-col items-center space-y-1 text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-[9px] font-black uppercase tracking-wider">Profile</span>
                </button>
            </nav>

            {/* Footer Desktop */}
            <footer className="bg-white border-t border-gray-100 py-12 mt-auto hidden lg:block">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">© {new Date().getFullYear()} Viagogo. Secure Ticket System.</p>
                </div>
            </footer>
        </div>
    );
}
