"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '../../../UserContext';
import { User } from '../../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faChevronLeft,
    faTicketAlt,
    faExchangeAlt,
    faUser,
    faClock,
    faCheckCircle,
    faInfoCircle,
    faExclamationTriangle,
    faSignOutAlt,
    faBars,
    faTimes,
    faUserCircle,
    faCog,
    faShieldAlt,
    faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function TransferDetailPage() {
    const router = useRouter();
    const params = useParams();
    const transferId = params.id as string;
    const { admin, users, fetchAllUsers, setAdmin, setUsers, setTickets } = useUser();

    const APP_SCRIPT_POST_URL = "https://script.google.com/macros/s/AKfycbxcoCDXcWlKPDbttlFf2eR_EeuMkfupy5dfgIOklM1ShEZ30gfD3wzZZOxkKV4xIWEl/exec";
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [transfer, setTransfer] = useState<User | null>(null);
    const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const adminUsername = sessionStorage.getItem("loggedInAdmin");
        const adminData = sessionStorage.getItem('adminData');
        if (adminUsername && adminData) {
            try {
                const parsedAdminData = JSON.parse(adminData);
                setAdmin(parsedAdminData);
                setIsSessionValid(true);
                fetchAllUsers();
            } catch (e) {
                router.replace('/login');
            }
        } else {
            router.replace('/login');
        }
    }, [setAdmin, router, fetchAllUsers]);

    useEffect(() => {
        if (users && transferId) {
            const found = users.find(u => u.userId === transferId);
            if (found) setTransfer(found);
        }
    }, [users, transferId]);

    const handleLogout = () => {
        sessionStorage.removeItem("loggedInAdmin");
        sessionStorage.removeItem("adminData");
        setAdmin(null);
        setUsers([]);
        setTickets([]);
        router.push('/login');
    };

    const handleDisputeTransfer = () => {
        if (!transfer) return;
        if (window.confirm("Are you sure you want to dispute this ticket transfer?")) {
            setIsActionLoading(true);

            let payload = new URLSearchParams();
            payload.append("action", "retractTicket");
            payload.append("userId", transfer.userId);
            payload.append("cancelledSTAMP", "RETRACTED");

            fetch(APP_SCRIPT_POST_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: payload.toString()
            }).then(() => {
                setTimeout(() => {
                    fetchAllUsers(); 
                    setIsActionLoading(false);
                    setTransfer({...transfer, systemStatus: 'RETRACTED'});
                }, 1000);
            }).catch(error => {
                console.error("Error disputing ticket:", error);
                fetchAllUsers();
                setIsActionLoading(false);
            });
        }
    };

    if (isSessionValid === null || !transfer) return null;

    const sidebarItems = [
        { icon: faTicketAlt, label: 'My Purchases', active: false, href: '/secure/myaccount/tickets' },
        { icon: faExchangeAlt, label: 'Transfers', active: true, href: '/secure/myaccount/transfers' },
        { icon: faUserCircle, label: 'Personal Details', active: false, href: '#' },
        { icon: faCog, label: 'Account Settings', active: false, href: '#' },
        { icon: faShieldAlt, label: 'Privacy', active: false, href: '#' },
        { icon: faQuestionCircle, label: 'Help', active: false, href: '#' },
        { icon: faSignOutAlt, label: 'Sign Out', active: false, action: handleLogout },
    ];

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'WAITING APPROVAL':
                return { icon: faClock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100', banner: 'bg-yellow-500' };
            case 'WAITING COMPLETION':
                return { icon: faInfoCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', banner: 'bg-blue-500' };
            case 'COMPLETED':
                return { icon: faCheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', banner: 'bg-green-500' };
            case 'DECLINED':
            case 'CANCELLED':
                return { icon: faTimes, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', banner: 'bg-red-500' };
            case 'RETRACTED':
                return { icon: faExclamationTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', banner: 'bg-orange-500' };
            default:
                return { icon: faInfoCircle, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', banner: 'bg-gray-400' };
        }
    };

    const theme = getStatusTheme(transfer.systemStatus);

    return (
        <div className="min-h-screen bg-[#f4f7f9] flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white text-[#001B41] border-b border-gray-100 p-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center">
                    <button onClick={() => router.back()} className="mr-4 text-[#001B41] hover:text-[#89CF28] transition-colors">
                        <FontAwesomeIcon icon={faChevronLeft} className="text-xl" />
                    </button>
                    <h1 className="text-lg font-black text-[#001B41] tracking-tight">Transfer Details</h1>
                </div>
            </header>

            <div className="flex-1 max-w-3xl mx-auto w-full py-8 px-4">
                {/* Status Banner */}
                <div className={`${theme.bg} ${theme.border} border rounded-[24px] p-6 mb-8 shadow-sm`}>
                    <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-12 h-12 rounded-full ${theme.bg} flex items-center justify-center border-2 ${theme.border}`}>
                            <FontAwesomeIcon icon={theme.icon} className={`text-xl ${theme.color}`} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-black uppercase tracking-tight ${theme.color}`}>
                                {transfer.systemStatus || 'Processing'}
                            </h2>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ticket ID: {transfer.ticketId}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {transfer.percentageStatus && (
                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</span>
                                <span className={`text-xs font-black ${theme.color}`}>{transfer.percentageStatus}%</span>
                            </div>
                            <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-100">
                                <div 
                                    className={`h-full ${theme.banner} transition-all duration-1000 ease-out`}
                                    style={{ width: `${transfer.percentageStatus}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Dynamic Message */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className={`text-sm font-black uppercase tracking-wider mb-2 ${theme.color}`}>
                            {transfer.titleStatus || 'Status Update'}
                        </h3>
                        <p className="text-gray-600 text-sm font-bold leading-relaxed mb-6">
                            {transfer.messageStatus?.replace("sender's confirmation", "receiver's confirmation") || 'Your transfer is being processed. Please check back later for updates.'}
                        </p>

                        {/* Warning Box */}
                        {transfer.warningStatus && (
                            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start space-x-3">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mt-1" />
                                <p className="text-xs font-bold text-red-700 leading-normal">{transfer.warningStatus}</p>
                            </div>
                        )}

                        {/* Dispute Button */}
                        {['WAITING APPROVAL', 'WAITING COMPLETION', 'COMPLETED'].includes(transfer.systemStatus) && (
                            <button 
                                onClick={handleDisputeTransfer}
                                disabled={isActionLoading}
                                className="w-full bg-white border-2 border-red-100 text-red-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center space-x-2 shadow-sm active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {isActionLoading ? (
                                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faExchangeAlt} className="text-[10px]" />
                                        <span>Dispute Transfer</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Transfer Info */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
                    <h3 className="text-base font-black text-[#001B41] mb-6 uppercase tracking-wider">Transfer Summary</h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-[#89CF28]/5 text-[#89CF28] flex items-center justify-center">
                                <FontAwesomeIcon icon={faUser} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient</p>
                                <p className="font-black text-[#001B41]">{transfer.fullName}</p>
                                <p className="text-xs font-bold text-gray-400">{transfer.emailAddress}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-[#89CF28]/5 text-[#89CF28] flex items-center justify-center">
                                <FontAwesomeIcon icon={faTicketAlt} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</p>
                                <p className="font-black text-[#001B41]">{transfer.eventName}</p>
                                <p className="text-xs font-bold text-gray-400">Section {transfer.section}, Seat {transfer.seatNumbers}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sent On</p>
                                <p className="text-sm font-bold text-[#001B41]">
                                    {new Date(transfer.timestamp).toLocaleDateString('en-US', { 
                                        month: 'long', day: 'numeric', year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</p>
                                <p className="text-sm font-bold text-[#001B41]">Digital Transfer</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
