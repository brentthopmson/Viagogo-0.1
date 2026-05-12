import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faUserPlus, 
    faKeyboard, 
    faChevronRight, 
    faCheckCircle, 
    faPaperPlane, 
    faChevronLeft,
    faSearch,
    faEnvelope,
    faPhone,
    faUser
} from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../UserContext';
import { Ticket, User } from '../types';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: Ticket | null;
}

type ViewState = 'options' | 'contacts' | 'manual' | 'confirm' | 'success';

export default function TransferModal({ isOpen, onClose, ticket }: TransferModalProps) {
    const { admin, users, fetchAllUsers } = useUser();
    const [view, setView] = useState<ViewState>('options');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        emailAddress: '',
        phoneNumber: '',
        seatNumbers: '',
        sendType: 'draft',
        userPlatform: 'viagogo'
    });

    useEffect(() => {
        if (isOpen) {
            setView('options');
            setError(null);
            if (ticket) {
                setFormData(prev => ({
                    ...prev,
                    seatNumbers: ticket.seatNumbers || '',
                }));
            }
        }
    }, [isOpen, ticket]);

    if (!isOpen || !ticket) return null;

    const filteredContacts = users.filter(u => 
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Deduplicate contacts by email
    const uniqueContacts = Array.from(new Map(filteredContacts.map(item => [item.emailAddress, item])).values());

    const handleContactSelect = (contact: User) => {
        setFormData(prev => ({
            ...prev,
            fullName: contact.fullName,
            emailAddress: contact.emailAddress,
            phoneNumber: contact.phoneNumber || '',
        }));
        setView('confirm');
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setView('confirm');
    };

    const handleTransfer = async () => {
        if (!admin) return;
        setLoading(true);
        setError(null);

        const POST_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_URL || "";

        try {
            const payload = new URLSearchParams();
            payload.append('action', 'transferTicket');
            payload.append('fullName', formData.fullName);
            payload.append('emailAddress', formData.emailAddress);
            payload.append('phoneNumber', formData.phoneNumber);
            payload.append('seatNumbers', formData.seatNumbers);
            payload.append('ticketId', ticket.ticketId);
            payload.append('admin', admin.username);
            payload.append('senderName', admin.senderName || 'Viagogo');
            payload.append('senderEmail', admin.senderEmail || '');
            payload.append('userPlatform', formData.userPlatform);
            payload.append('sendType', formData.sendType);

            const response = await fetch(POST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: payload.toString()
            });

            const result = await response.json();
            if (result.success) {
                fetchAllUsers();
                setView('success');
            } else {
                setError(result.error || 'Transfer failed');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            {/* Modal Container - Bottom Up Animation */}
            <div className={`w-full max-w-lg bg-white rounded-t-[32px] overflow-hidden transition-transform duration-500 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center">
                        {view !== 'options' && view !== 'success' && (
                            <button onClick={() => setView('options')} className="mr-4 text-gray-400 hover:text-black">
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                        )}
                        <h2 className="text-xl font-black text-[#001B41]">
                            {view === 'options' && 'Transfer To'}
                            {view === 'contacts' && 'Select Contact'}
                            {view === 'manual' && 'Enter Details'}
                            {view === 'confirm' && 'Review Transfer'}
                            {view === 'success' && 'Success!'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-black">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    
                    {/* View: Options */}
                    {view === 'options' && (
                        <div className="space-y-4">
                            <button 
                                onClick={() => setView('contacts')}
                                className="w-full p-6 rounded-2xl border-2 border-gray-100 hover:border-[#89CF28] hover:bg-[#89CF28]/5 transition-all text-left flex items-center group"
                            >
                                <div className="w-12 h-12 rounded-full bg-[#89CF28]/10 text-[#89CF28] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                    <FontAwesomeIcon icon={faUserPlus} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-[#001B41]">Select from contacts</p>
                                    <p className="text-xs font-bold text-gray-400">Choose from previous recipients</p>
                                </div>
                                <FontAwesomeIcon icon={faChevronRight} className="text-gray-200" />
                            </button>

                            <button 
                                onClick={() => setView('manual')}
                                className="w-full p-6 rounded-2xl border-2 border-gray-100 hover:border-[#001B41] hover:bg-gray-50 transition-all text-left flex items-center group"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                    <FontAwesomeIcon icon={faKeyboard} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-[#001B41]">Manually enter recipient</p>
                                    <p className="text-xs font-bold text-gray-400">Enter email and name details</p>
                                </div>
                                <FontAwesomeIcon icon={faChevronRight} className="text-gray-200" />
                            </button>
                        </div>
                    )}

                    {/* View: Contacts */}
                    {view === 'contacts' && (
                        <div className="space-y-4">
                            <div className="relative mb-6">
                                <input 
                                    type="text" 
                                    placeholder="Search contacts..."
                                    className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-[#89CF28]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            </div>
                            
                            <div className="space-y-2">
                                {uniqueContacts.length > 0 ? (
                                    uniqueContacts.map((contact, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => handleContactSelect(contact)}
                                            className="w-full p-4 rounded-xl hover:bg-gray-50 flex items-center text-left transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mr-4">
                                                <FontAwesomeIcon icon={faUser} />
                                            </div>
                                            <div>
                                                <p className="font-black text-[#001B41] text-sm">{contact.fullName}</p>
                                                <p className="text-[10px] font-bold text-gray-400">{contact.emailAddress}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="font-bold text-gray-300">No contacts found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* View: Manual Entry */}
                    {view === 'manual' && (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input 
                                    required
                                    type="text"
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-[#001B41]"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input 
                                    required
                                    type="email"
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-[#001B41]"
                                    value={formData.emailAddress}
                                    onChange={(e) => setFormData({...formData, emailAddress: e.target.value})}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone (Optional)</label>
                                <input 
                                    type="tel"
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-[#001B41]"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full bg-[#001B41] text-white py-4 rounded-2xl font-black text-sm mt-4 shadow-xl hover:scale-[1.02] transition-transform"
                            >
                                Continue to Review
                            </button>
                        </form>
                    )}

                    {/* View: Confirm */}
                    {view === 'confirm' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                <div className="flex items-center mb-6">
                                    <div className="w-12 h-12 rounded-full bg-[#89CF28]/10 text-[#89CF28] flex items-center justify-center mr-4">
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipent</p>
                                        <p className="font-black text-[#001B41]">{formData.fullName}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                                        <span className="text-xs font-bold text-gray-400">Email</span>
                                        <span className="text-xs font-black text-[#001B41]">{formData.emailAddress}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                                        <span className="text-xs font-bold text-gray-400">Event</span>
                                        <span className="text-xs font-black text-[#001B41] line-clamp-1">{ticket.eventName}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs font-bold text-gray-400">Seats</span>
                                        <span className="text-xs font-black text-[#89CF28]">{formData.seatNumbers}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <label className="text-xs font-black text-[#001B41]">Transfer Mode</label>
                                    <select 
                                        className="bg-transparent font-black text-xs text-[#89CF28] outline-none"
                                        value={formData.sendType}
                                        onChange={(e) => setFormData({...formData, sendType: e.target.value})}
                                    >
                                        <option value="draft">Save as Draft</option>
                                        <option value="auto">Send Automatically</option>
                                    </select>
                                </div>
                                
                                {error && <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>}

                                <button 
                                    onClick={handleTransfer}
                                    disabled={loading}
                                    className="w-full bg-[#89CF28] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#89CF28]/20 flex items-center justify-center hover:scale-[1.02] transition-transform disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Confirm Transfer'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* View: Success */}
                    {view === 'success' && (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-[#89CF28]/10 text-[#89CF28] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-4xl" />
                            </div>
                            <h3 className="text-2xl font-black text-[#001B41] mb-2">Transfer Initiated!</h3>
                            <p className="text-gray-400 font-bold mb-8 px-6">
                                {formData.sendType === 'draft' 
                                    ? `A draft has been created in your Gmail for ${formData.fullName}.` 
                                    : `An invitation email has been sent to ${formData.emailAddress}.`}
                            </p>
                            <button 
                                onClick={onClose}
                                className="w-full bg-[#001B41] text-white py-4 rounded-2xl font-black text-sm"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Disclaimer */}
                {view !== 'success' && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold text-center leading-relaxed">
                            By continuing, you agree to the Viagogo Ticket Transfer Terms. 
                            Transferred tickets cannot be retracted once accepted by the recipient.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
