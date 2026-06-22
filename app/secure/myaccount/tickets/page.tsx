"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    faLock,
    faSearch,
    faExchangeAlt
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';

const SWIPE_THRESHOLD = -60;

export default function MyTicketsPage() {
    const router = useRouter();
    const {
        admin,
        tickets: allTickets,
        fetchAllTickets,
        setAdmin,
        setLoading,
        setUsers,
        setTickets,
        setLoggedInAdmin: contextSetLoggedInAdmin
    } = useUser();

    const searchParams = useSearchParams();

    const [loggedInAdmin, setLoggedInAdmin] = useState<string | null>(null);
    const [localAdmin, setLocalAdmin] = useState<string | null>(null);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hiddenTicketIds, setHiddenTicketIds] = useState<Set<string>>(new Set());
    const [swipedTicketId, setSwipedTicketId] = useState<string | null>(null);
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const touchStartX = useRef(0);
    const touchCurrentId = useRef<string | null>(null);

    // Restore hidden tickets from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem("hiddenTickets");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) setHiddenTicketIds(new Set(parsed));
            }
        } catch (e) {}
    }, []);

    // Sync hidden tickets to localStorage
    useEffect(() => {
        localStorage.setItem("hiddenTickets", JSON.stringify(Array.from(hiddenTicketIds)));
    }, [hiddenTicketIds]);

    // Handle revealAll from URL param (set by Manage page)
    useEffect(() => {
        if (searchParams.get('revealAll') === '1') {
            localStorage.removeItem("hiddenTickets");
            setHiddenTicketIds(new Set());
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [searchParams]);

    const handleTouchStart = useCallback((ticketId: string, e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchCurrentId.current = ticketId;
        setIsSwiping(true);
        setSwipedTicketId(ticketId);
        setSwipeX(0);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isSwiping || !swipedTicketId) return;
        const dx = e.touches[0].clientX - touchStartX.current;
        if (dx > 0 && swipeX === 0) return;
        setSwipeX(Math.max(dx, -80));
    }, [isSwiping, swipedTicketId, swipeX]);

    const handleTouchEnd = useCallback(() => {
        setIsSwiping(false);
        if (swipeX < SWIPE_THRESHOLD) {
            setSwipeX(-80);
        } else {
            setSwipedTicketId(null);
            setSwipeX(0);
            touchCurrentId.current = null;
        }
    }, [swipeX]);

    const handleHideConfirm = useCallback((ticketId: string) => {
        const next = new Set(hiddenTicketIds);
        next.add(ticketId);
        setHiddenTicketIds(next);
        setSwipedTicketId(null);
        setSwipeX(0);
        touchCurrentId.current = null;
    }, [hiddenTicketIds]);

    const handleSnapBack = useCallback(() => {
        setSwipedTicketId(null);
        setSwipeX(0);
        touchCurrentId.current = null;
    }, []);

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
                if (allTickets.length === 0) {
                    fetchAllTickets();
                }
            } catch (e) {
                console.error("Error parsing admin data", e);
                router.replace('/login');
            }
        } else {
            router.replace('/login');
        }
    }, [setAdmin, router, fetchAllTickets, contextSetLoggedInAdmin]);

    useEffect(() => {
        if (isSessionValid === true && loggedInAdmin && Array.isArray(allTickets)) {
            const filtered = allTickets.filter((t) => {
                // 1. Must belong to the logged-in admin
                const matchesAdmin = t.admin === loggedInAdmin;
                
                // 2. Must not be deleted
                const isNotDeleted = !t.deletedSTAMP || t.deletedSTAMP.trim() === "";
                
                // 3. Platform must include "viagogo"
                const platformList = t.platform?.toLowerCase().split(',').map(p => p.trim()) || [];
                const matchesPlatform = platformList.includes("viagogo");

                if (!matchesAdmin || !isNotDeleted || !matchesPlatform) return false;
                if (hiddenTicketIds.has(t.ticketId)) return false;

                // 4. Tab Filter
                let matchesTab = false;
                if (activeTab === 'upcoming') {
                    matchesTab = t.eventStatus === 'ACTIVE' || t.eventStatus === 'WAITING';
                } else {
                    matchesTab = t.eventStatus === 'PAST';
                }
                if (!matchesTab) return false;

                // 5. Search Filter
                if (searchTerm.trim()) {
                    const term = searchTerm.toLowerCase();
                    const matchesSearch = 
                        t.eventName?.toLowerCase().includes(term) ||
                        t.ticketId?.toLowerCase().includes(term) ||
                        t.venue?.toLowerCase().includes(term) ||
                        t.location?.toLowerCase().includes(term) ||
                        t.seatNumbers?.toLowerCase().includes(term);
                    
                    if (!matchesSearch) return false;
                }

                return true;
            });
            setFilteredTickets(filtered);
        }
    }, [allTickets, loggedInAdmin, isSessionValid, activeTab, searchTerm, hiddenTicketIds]);

    const handleLogout = () => {
        localStorage.removeItem("loggedInAdmin");
        localStorage.removeItem("adminData");
        localStorage.removeItem("adminToken");
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
        { icon: faTicketAlt, label: 'My Purchases', active: true, href: '/secure/myaccount/tickets' },
        { icon: faExchangeAlt, label: 'Transfers', active: false, href: '/secure/myaccount/transfers' },
        { icon: faUserCircle, label: 'Personal Details', active: false, href: '/secure/myaccount/personal-details' },
        { icon: faCog, label: 'Account Settings', active: false, href: '/secure/myaccount/manage' },
        { icon: faShieldAlt, label: 'Privacy', active: false, href: '#' },
        { icon: faQuestionCircle, label: 'Help', active: false, href: '#' },
        { icon: faSignOutAlt, label: 'Sign Out', active: false, href: '#', action: handleLogout },
    ];

    if (isSessionValid === null) return null;

    return (
        <div className="min-h-screen bg-[#f4f7f9] flex flex-col font-sans">
            {/* Header - White Background as requested */}
            <header className="bg-white text-[#001B41] border-b border-gray-100 p-4 fixed top-0 left-0 right-0 z-50 w-full">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <button 
                            className="mr-4 lg:hidden text-2xl text-[#001B41]"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} />
                        </button>
                        <Link href="/" className="flex items-center cursor-pointer">
                            <img src="/logo.png" alt="viagogo logo" className="h-[24px] w-auto md:h-[28px]" />
                        </Link>
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
                <main className="flex-1">
                    <h1 className="text-4xl font-black text-[#001B41] mb-8 tracking-tight">My Purchases</h1>

                    {/* Search */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search by event, ticket ID, or venue..."
                            className="w-full p-4 pl-12 bg-white border border-gray-100 rounded-2xl text-[#001B41] placeholder-gray-300 font-bold text-sm outline-none focus:ring-4 focus:ring-[#89CF28]/10 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>

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
                                filteredTickets.map((ticket, i) => {
                                    const open = swipedTicketId === ticket.ticketId && swipeX === -80;
                                    return (
                                        <div key={i} className="relative overflow-hidden">
                                            {open && (
                                                <div className="absolute inset-y-0 right-0 w-[80px] flex items-center justify-center bg-red-500 rounded-[24px] z-0">
                                                    <button
                                                        onClick={() => handleHideConfirm(ticket.ticketId)}
                                                        className="text-white font-black text-xs uppercase tracking-widest"
                                                    >
                                                        Hide?
                                                    </button>
                                                </div>
                                            )}
                                            <div
                                                className="relative z-10"
                                                style={{
                                                    transform: `translateX(${swipedTicketId === ticket.ticketId ? swipeX : 0}px)`,
                                                    transition: isSwiping ? 'none' : 'transform 0.25s ease',
                                                    touchAction: 'pan-y',
                                                }}
                                                onTouchStart={(e) => handleTouchStart(ticket.ticketId, e)}
                                                onTouchMove={handleTouchMove}
                                                onTouchEnd={handleTouchEnd}
                                                onClick={open ? handleSnapBack : undefined}
                                            >
                                                {open ? (
                                                    <div className="pointer-events-none">
                                                        <TicketCard ticket={ticket} />
                                                    </div>
                                                ) : (
                                                    <TicketCard ticket={ticket} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
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
