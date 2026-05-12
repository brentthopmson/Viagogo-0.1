"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '../../../../UserContext';
import { Ticket } from '../../../../types';
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
    faChevronLeft,
    faCalendarAlt,
    faMapMarkerAlt,
    faCheckCircle,
    faInfoCircle,
    faChevronRight,
    faPaperPlane,
    faTag
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import TransferModal from '../../../../components/TransferModal';

export default function TicketDetailsAccountPage() {
    const router = useRouter();
    const params = useParams();
    const ticketId = params.id as string;
    
    const {
        admin,
        tickets: allTickets,
        fetchAllTickets,
        setAdmin,
        setTickets
    } = useUser();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentSeatIndex, setCurrentSeatIndex] = useState(0);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    useEffect(() => {
        const adminUsername = sessionStorage.getItem("loggedInAdmin");
        const adminData = sessionStorage.getItem('adminData');
    
        if (adminUsername && adminData) {
            try {
                const parsedAdminData = JSON.parse(adminData);
                setAdmin(parsedAdminData);
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
    }, [setAdmin, router]);

    useEffect(() => {
        if (isSessionValid && allTickets.length > 0) {
            const foundTicket = allTickets.find(t => t.ticketId === ticketId);
            if (foundTicket) {
                setTicket(foundTicket);
            }
        }
    }, [allTickets, ticketId, isSessionValid]);

    const handleLogout = () => {
        sessionStorage.removeItem("loggedInAdmin");
        sessionStorage.removeItem("adminData");
        setAdmin(null);
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

    if (isSessionValid === null || !ticket) return null;

    // Parse seats for slidable view
    const seats = ticket.seatNumbers ? ticket.seatNumbers.split(',').map(s => s.trim()) : [ticket.seat || 'N/A'];

    const nextSeat = () => {
        if (currentSeatIndex < seats.length - 1) {
            setCurrentSeatIndex(prev => prev + 1);
        }
    };

    const prevSeat = () => {
        if (currentSeatIndex > 0) {
            setCurrentSeatIndex(prev => prev - 1);
        }
    };

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
                            <button onClick={() => setIsSidebarOpen(false)} className="text-2xl">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <nav className="space-y-1">
                            {sidebarItems.map((item, i) => (
                                <Link
                                    key={i}
                                    href="/secure/myaccount/tickets"
                                    className={`w-full text-left px-4 py-3 rounded-[12px] flex items-center space-x-3 transition-all ${item.active ? 'bg-[#89CF28] text-white font-black shadow-lg shadow-[#89CF28]/20' : 'text-[#001B41] hover:bg-white hover:shadow-sm font-bold'}`}
                                >
                                    <FontAwesomeIcon icon={item.icon} className="w-5" />
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    <button 
                        onClick={() => router.push('/secure/myaccount/tickets')}
                        className="flex items-center text-[#001B41] font-black mb-8 hover:opacity-70 transition-opacity"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                        Back to My Purchases
                    </button>

                    {/* Sliding Ticket Section */}
                    <div className="max-w-md mx-auto relative">
                        {/* Background Decoration */}
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#89CF28]/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#001B41]/5 rounded-full blur-3xl"></div>

                        <div className="relative overflow-hidden rounded-[32px] shadow-2xl bg-white border border-gray-100">
                            {/* Static Top Info */}
                            <div className="bg-[#001B41] p-6 text-white">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="bg-[#89CF28] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Confirmed
                                    </div>
                                    <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                                        Ticket {currentSeatIndex + 1} of {seats.length}
                                    </div>
                                </div>
                                <h1 className="text-xl font-black mb-1 line-clamp-1">{ticket.eventName}</h1>
                                <p className="text-white/70 text-xs font-bold truncate">{ticket.venue}</p>
                                <p className="text-white/70 text-[10px] font-bold mt-1 uppercase tracking-wider">{ticket.dateTime}</p>
                            </div>

                            {/* Slidable Area */}
                            <div className="relative">
                                <div 
                                    className="flex transition-transform duration-500 ease-out"
                                    style={{ transform: `translateX(-${currentSeatIndex * 100}%)` }}
                                >
                                    {seats.map((seatNum: string, idx: number) => (
                                        <div key={idx} className="min-w-full p-8 text-center">
                                            {/* Seat Details */}
                                            <div className="grid grid-cols-3 gap-4 mb-8">
                                                <div className="bg-gray-50 rounded-2xl p-4">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Section</p>
                                                    <p className="text-lg font-black text-[#001B41]">{ticket.section}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-2xl p-4">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Row</p>
                                                    <p className="text-lg font-black text-[#001B41]">{ticket.row}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-2xl p-4">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Seat</p>
                                                    <p className="text-lg font-black text-[#89CF28]">{seatNum}</p>
                                                </div>
                                            </div>

                                            {/* Simulated Barcode Area */}
                                            <div className="mb-8 p-6 bg-white border-2 border-dashed border-gray-100 rounded-3xl">
                                                <div className="flex justify-center space-x-1 h-20 mb-4">
                                                    {Array.from({length: 45}).map((_, i) => (
                                                        <div 
                                                            key={i} 
                                                            className="h-full bg-black rounded-full" 
                                                            style={{
                                                                width: `${Math.random() * 3 + 1}px`, 
                                                                opacity: Math.random() > 0.1 ? 1 : 0.1
                                                            }}
                                                        ></div>
                                                    ))}
                                                </div>
                                                <p className="text-[10px] font-mono font-black text-gray-400 tracking-[0.3em]">
                                                    {ticket.ticketId.toUpperCase()}-{idx + 1}
                                                </p>
                                            </div>

                                            <div className="bg-[#89CF28]/5 py-3 rounded-2xl mb-4 border border-[#89CF28]/10">
                                                <div className="flex items-center justify-center space-x-2 text-[10px] font-black text-[#89CF28] uppercase tracking-widest">
                                                    <FontAwesomeIcon icon={faLock} />
                                                    <span>Verified Secure Ticket</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex space-x-3 mb-6">
                                                <button 
                                                    onClick={() => setIsTransferModalOpen(true)}
                                                    className="flex-1 bg-[#001B41] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#001B41]/10 hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center"
                                                >
                                                    <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                                                    Transfer
                                                </button>
                                                <button 
                                                    onClick={() => window.open('https://www.viagogo.com/selltickets', '_blank')}
                                                    className="flex-1 bg-white text-[#001B41] border-2 border-gray-100 py-4 rounded-2xl font-black text-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
                                                >
                                                    <FontAwesomeIcon icon={faTag} className="mr-2" />
                                                    Sell
                                                </button>
                                            </div>

                                            {/* Apple Wallet button removed from internal view */}
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Arrows */}
                                {seats.length > 1 && (
                                    <>
                                        {currentSeatIndex > 0 && (
                                            <button 
                                                onClick={prevSeat}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-[#001B41] z-10 hover:bg-white transition-all"
                                            >
                                                <FontAwesomeIcon icon={faChevronLeft} />
                                            </button>
                                        )}
                                        {currentSeatIndex < seats.length - 1 && (
                                            <button 
                                                onClick={nextSeat}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center text-[#001B41] z-10 hover:bg-white transition-all"
                                            >
                                                <FontAwesomeIcon icon={faChevronRight} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Dot Indicators */}
                            {seats.length > 1 && (
                                <div className="flex justify-center space-x-2 pb-6">
                                    {seats.map((_: any, idx: number) => (
                                        <div 
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${currentSeatIndex === idx ? 'w-6 bg-[#89CF28]' : 'w-1.5 bg-gray-200'}`}
                                        ></div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Guarantee Card */}
                        <div className="mt-8 bg-[#89CF28] rounded-[24px] p-6 text-white shadow-xl shadow-[#89CF28]/20 flex items-start">
                            <div className="bg-white/20 p-3 rounded-xl mr-4">
                                <FontAwesomeIcon icon={faShieldAlt} className="text-xl" />
                            </div>
                            <div>
                                <h4 className="font-black text-sm mb-1 uppercase tracking-wider">FanProtect™ Guarantee</h4>
                                <p className="text-[10px] font-bold text-white/80 leading-relaxed">
                                    Your order is covered. We guarantee you'll get valid tickets in time for the event.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">© {new Date().getFullYear()} Viagogo. Secure Ticket System.</p>
                </div>
            </footer>

            {/* Bottom-Up Transfer Modal */}
            <TransferModal 
                isOpen={isTransferModalOpen} 
                onClose={() => setIsTransferModalOpen(false)} 
                ticket={ticket}
            />
        </div>
    );
}
