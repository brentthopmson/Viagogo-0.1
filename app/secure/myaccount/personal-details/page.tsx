"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserCircle,
    faSignOutAlt,
    faBars,
    faTimes,
    faTicketAlt,
    faCog,
    faShieldAlt,
    faQuestionCircle,
    faChevronLeft,
    faExchangeAlt,
    faLock,
    faSave,
    faTimesCircle,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

const APP_SCRIPT_POST_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbxcoCDXcWlKPDbttlFf2eR_EeuMkfupy5dfgIOklM1ShEZ30gfD3wzZZOxkKV4xIWEl/exec";

export default function PersonalDetailsPage() {
    const router = useRouter();
    const { admin, setAdmin, fetchAllUsers, fetchAllTickets } = useUser();
    
    const [isSessionValid, setIsSessionValid] = useState<boolean | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [formData, setFormData] = useState({
        accountName: '',
        accountEmail: '',
        accountStateCountry: '',
        adminSettings: '{}',
        telegramId: '',
    });

    useEffect(() => {
        const adminData = sessionStorage.getItem('adminData');
        if (adminData) {
            try {
                const parsed = JSON.parse(adminData);
                setIsSessionValid(true);
                let settingsStr = parsed.adminSettings || '{}';
                let settingsObj = {};
                try { settingsObj = JSON.parse(settingsStr); } catch (e) {}
                
                setFormData({
                    accountName: parsed.accountName || '',
                    accountEmail: parsed.accountEmail || '',
                    accountStateCountry: parsed.accountStateCountry || '',
                    adminSettings: settingsStr,
                    telegramId: (settingsObj as any).telegramId || '',
                });
            } catch (e) {
                setIsSessionValid(false);
                router.replace('/login');
            }
        } else {
            setIsSessionValid(false);
            router.replace('/login');
        }
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!admin) return;
        setSaving(true);
        setMessage(null);

        try {
            // Merge telegramId into adminSettings JSON
            let settingsObj: any = {};
            try { settingsObj = JSON.parse(formData.adminSettings); } catch (e) { settingsObj = {}; }
            settingsObj.telegramId = formData.telegramId;
            const finalAdminSettings = JSON.stringify(settingsObj);

            const payload = new URLSearchParams();
            payload.append("action", "updateAdmin");
            payload.append("adminId", admin.adminId);
            payload.append("accountName", formData.accountName);
            payload.append("accountEmail", formData.accountEmail);
            payload.append("accountStateCountry", formData.accountStateCountry);
            payload.append("adminSettings", finalAdminSettings);

            const response = await fetch(APP_SCRIPT_POST_URL, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: payload.toString()
            });

            if (response.ok) {
                const updatedAdmin = { 
                    ...admin, 
                    accountName: formData.accountName,
                    accountEmail: formData.accountEmail,
                    accountStateCountry: formData.accountStateCountry,
                    adminSettings: finalAdminSettings
                };
                setAdmin(updatedAdmin);
                sessionStorage.setItem("adminData", JSON.stringify(updatedAdmin));
                setFormData(prev => ({ ...prev, adminSettings: finalAdminSettings }));
                setMessage({ type: 'success', text: 'Personal details updated successfully!' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.error || 'Failed to update. Please try again.' });
            }
        } catch (error) {
            console.error("Error updating admin details:", error);
            setMessage({ type: 'error', text: 'An error occurred while saving.' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("loggedInAdmin");
        sessionStorage.removeItem("adminData");
        setAdmin(null);
        router.push('/login');
    };

    const sidebarItems = [
        { icon: faTicketAlt, label: 'My Purchases', active: false, href: '/secure/myaccount/tickets' },
        { icon: faExchangeAlt, label: 'Transfers', active: false, href: '/secure/myaccount/transfers' },
        { icon: faUserCircle, label: 'Personal Details', active: true, href: '#' },
        { icon: faCog, label: 'Account Settings', active: false, href: '#' },
        { icon: faShieldAlt, label: 'Privacy', active: false, href: '#' },
        { icon: faQuestionCircle, label: 'Help', active: false, href: '#' },
    ];

    if (isSessionValid === null) return null;

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Fixed Header */}
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

            {/* Scrollable Content Area */}
            <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col lg:flex-row py-8 px-4 gap-8 overflow-y-auto">
                {/* Sidebar */}
                <aside className={`fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:inset-auto lg:w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 lg:p-0">
                        <div className="lg:hidden flex justify-end mb-8">
                            <button onClick={() => setIsSidebarOpen(false)} className="text-2xl"><FontAwesomeIcon icon={faTimes} /></button>
                        </div>
                        <nav className="space-y-1">
                            {sidebarItems.map((item, i) => (
                                item.href && item.href !== '#' ? (
                                    <Link key={i} href={item.href}
                                        className={`w-full text-left px-4 py-3 rounded-[12px] flex items-center space-x-3 transition-all ${item.active ? 'bg-[#89CF28] text-white font-black shadow-lg shadow-[#89CF28]/20' : 'text-[#001B41] hover:bg-white hover:shadow-sm font-bold'}`}>
                                        <FontAwesomeIcon icon={item.icon} className="w-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                ) : (
                                    <button key={i}
                                        className={`w-full text-left px-4 py-3 rounded-[12px] flex items-center space-x-3 transition-all ${item.active ? 'bg-[#89CF28] text-white font-black shadow-lg shadow-[#89CF28]/20' : 'text-[#001B41] hover:bg-white hover:shadow-sm font-bold'}`}>
                                        <FontAwesomeIcon icon={item.icon} className="w-5" />
                                        <span>{item.label}</span>
                                    </button>
                                )
                            ))}
                        </nav>
                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <Link href="/secure/myaccount/manage" className="flex items-center space-x-3 text-gray-400 hover:text-[#89CF28] transition-colors text-[10px] font-black uppercase tracking-widest">
                                <FontAwesomeIcon icon={faLock} className="w-4" />
                                <span>Admin Panel</span>
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 pb-24 lg:pb-0">
                    <button 
                        onClick={() => router.push('/secure/myaccount/tickets')}
                        className="flex items-center text-[#001B41] font-black mb-8 hover:opacity-70 transition-opacity"
                    >
                        <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                        Back to My Purchases
                    </button>

                    <h1 className="text-3xl font-black text-[#001B41] mb-8">Personal Details</h1>

                    {message && (
                        <div className={`mb-6 p-4 rounded-2xl flex items-center space-x-3 ${
                            message.type === 'success' 
                                ? 'bg-[#89CF28]/5 border border-[#89CF28]/10 text-[#89CF28]' 
                                : 'bg-red-50 border border-red-100 text-red-600'
                        }`}>
                            <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faTimesCircle} />
                            <span className="font-bold text-sm">{message.text}</span>
                        </div>
                    )}

                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
                        <div className="p-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Account Name</label>
                                    <input
                                        type="text"
                                        name="accountName"
                                        value={formData.accountName}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                                        placeholder="Enter your account name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Account Email</label>
                                    <input
                                        type="email"
                                        name="accountEmail"
                                        value={formData.accountEmail}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                                        placeholder="Enter your account email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">State / Country</label>
                                    <input
                                        type="text"
                                        name="accountStateCountry"
                                        value={formData.accountStateCountry}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                                        placeholder="Enter your state or country"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telegram ID</label>
                                    <input
                                        type="text"
                                        name="telegramId"
                                        value={formData.telegramId}
                                        onChange={handleChange}
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                                        placeholder="Enter your Telegram ID"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Admin Settings (JSON)</label>
                                    <textarea
                                        name="adminSettings"
                                        value={formData.adminSettings}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41] text-sm font-mono"
                                        placeholder="{}"
                                    ></textarea>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full bg-[#89CF28] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#89CF28]/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-3"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faSave} className="mr-3" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Fixed Footer */}
            <footer className="bg-white border-t border-gray-100 py-6 sticky bottom-0 z-50">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">© {new Date().getFullYear()} Viagogo. Secure Ticket System.</p>
                </div>
            </footer>
        </div>
    );
}