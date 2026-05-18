import { useState, useEffect } from 'react';
import { useUser } from '../UserContext'; 
import { Ticket } from '../types';

interface AddUserModalProps {
  tickets: Ticket[];
  formData: {
    fullName: string;
    phoneNumber: string;
    emailAddress: string;
    seatNumbers: string;
    transferringSeatNumbers: string;
    senderName: string;
    senderEmail: string;
    userPlatform: string;
    sendType: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      fullName: string;
      phoneNumber: string;
      emailAddress: string;
      seatNumbers: string;
      transferringSeatNumbers: string;
      senderName: string;
      senderEmail: string;
      userPlatform: string;
      sendType: string;
    }>
  >;
  onAddUser: () => void;
  onClose: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  tickets,
  formData,
  setFormData,
  onAddUser,
  onClose
}) => {
  const { admin, fetchAllUsers } = useUser();
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [applePayNumber, setApplePayNumber] = useState('');
  const [paypalLink, setPaypalLink] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [btcWallet, setBtcWallet] = useState('');
  const [ethWallet, setEthWallet] = useState('');
  const [trcWallet, setTrcWallet] = useState('');
  const [usdtWallet, setUsdtWallet] = useState('');

  // Initialize defaults from admin if available
  useEffect(() => {
    if (admin) {
      setFormData(prev => ({
        ...prev,
        senderName: prev.senderName || admin.accountName || '',
        senderEmail: prev.senderEmail || admin.accountEmail || '',
        userPlatform: prev.userPlatform || 'viagogo',
        sendType: prev.sendType || 'draft'
      }));
    }
  }, [admin, setFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTicketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ticketId = e.target.value;
    setSelectedTicketId(ticketId);
    
    const selectedTicket = tickets.find(t => t.ticketId === ticketId);
    setFormData(prev => ({
      ...prev,
      seatNumbers: selectedTicket?.seatNumbers || '',
      transferringSeatNumbers: '' // reset selection when ticket changes
    }));
  };

  const handleSeatToggle = (seat: string) => {
    setFormData(prev => {
      const currentSeats = prev.transferringSeatNumbers ? prev.transferringSeatNumbers.split(',').map(s => s.trim()) : [];
      let newSeats;
      if (currentSeats.includes(seat)) {
        newSeats = currentSeats.filter(s => s !== seat);
      } else {
        newSeats = [...currentSeats, seat];
      }
      return {
        ...prev,
        transferringSeatNumbers: newSeats.join(', ')
      };
    });
  };

  const availableSeats = tickets.find(t => t.ticketId === selectedTicketId)?.seatNumbers?.split(',').map(s => s.trim()).filter(Boolean) || [];


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTicketId) {
      setError('Please select a ticket.');
      return;
    }

    if (!formData.seatNumbers) {
      setError('Please specify seat numbers.');
      return;
    }

    if (!admin) {
      setError('Admin data is missing. Please log in again.');
      return;
    }

    // Determine which Apps Script URL to use based on platform
    const POST_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwXIfuadHykMFrMdPPLLP7y0pm4oZ8TJUnM9SMmDp9BkaVLGu9jupU-CuW8Id-Mm1ylxg/exec";

    setLoading(true);
    setError(null);

    try {
      const timestamp = new Date().toISOString();
      const payload = new URLSearchParams();
      payload.append('action', 'transferTicket');
      payload.append('fullName', formData.fullName);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('emailAddress', formData.emailAddress);
      // Backend handles original seats; we only send the ones being transferred
      payload.append('transferringSeatNumbers', formData.transferringSeatNumbers); 
      payload.append('ticketId', selectedTicketId);
      payload.append('timestamp', timestamp);
      payload.append('admin', admin.username);
      payload.append('senderName', formData.senderName);
      payload.append('senderEmail', formData.senderEmail);
      payload.append('userPlatform', formData.userPlatform);
      payload.append('sendType', formData.sendType); 

      let paymentSettingsObj: any = null;
      if (applePayNumber || paypalLink || btcWallet || ethWallet || trcWallet || usdtWallet) {
        paymentSettingsObj = {};
        if (applePayNumber) paymentSettingsObj.applePayNumber = applePayNumber;
        if (paypalLink) paymentSettingsObj.paypal = paypalLink;
        if (btcWallet || ethWallet || trcWallet || usdtWallet) {
          paymentSettingsObj.cryptoWallets = {};
          if (btcWallet) paymentSettingsObj.cryptoWallets.btc = btcWallet;
          if (ethWallet) paymentSettingsObj.cryptoWallets.eth = ethWallet;
          if (trcWallet) paymentSettingsObj.cryptoWallets.trc = trcWallet;
          if (usdtWallet) paymentSettingsObj.cryptoWallets.usdt = usdtWallet;
        }
      }

      if (paymentSettingsObj) {
        payload.append('paymentSettings', JSON.stringify(paymentSettingsObj));
      }

      if (paymentAmount) {
        payload.append('paymentAmount', paymentAmount);
      }

      const response = await fetch(POST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload.toString()
      });

      if (!response.ok) {
        throw new Error('Failed to add user');
      }

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        fetchAllUsers(); 
        onAddUser();
        onClose();
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'An unexpected error occurred.');
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-black text-[#001B41]">Transfer Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#001B41] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Full Name*</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Phone Number*</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Email Address*</label>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Select Ticket*</label>
              <select
                value={selectedTicketId}
                onChange={handleTicketChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                required
              >
                <option value="">--Select a Ticket--</option>
                {tickets.map(ticket => (
                  <option key={ticket.ticketId} value={ticket.ticketId}>
                    {ticket.eventName}
                  </option>
                ))}
              </select>
            </div>

            {selectedTicketId && (
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Select Seats to Transfer*</label>
                <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl border-2 border-transparent">
                  {availableSeats.length > 0 ? (
                    availableSeats.map((seat, index) => {
                      const isSelected = formData.transferringSeatNumbers.split(',').map(s => s.trim()).includes(seat);
                      return (
                        <button
                          type="button"
                          key={index}
                          onClick={() => handleSeatToggle(seat)}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                            isSelected
                              ? 'bg-[#89CF28] text-white shadow-md'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-[#89CF28]'
                          }`}
                        >
                          {seat}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 font-bold">No seat numbers available for this ticket. You can manually enter them below.</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Original Seat Numbers* (Reference)</label>
              <input
                type="text"
                name="seatNumbers"
                value={formData.seatNumbers}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-gray-500"
                required
                readOnly
              />
            </div>
            
            {availableSeats.length === 0 && (
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Manual Transfer Seats*</label>
                <input
                  type="text"
                  name="transferringSeatNumbers"
                  value={formData.transferringSeatNumbers}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Sender Name*</label>
              <input
                type="text"
                name="senderName"
                value={formData.senderName}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Sender Email*</label>
              <input
                type="email"
                name="senderEmail"
                value={formData.senderEmail}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                required
              />
            </div>

            {admin && (admin.role === 'OWNER' || admin.allowPayment === 'TRUE') && (
              <div className="md:col-span-2 mt-2 mb-2 p-4 border border-gray-200 rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                <h3 className="text-sm font-black text-[#001B41] dark:text-white uppercase tracking-widest mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">Payment Configuration (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Apple Pay Number</label>
                    <input type="text" value={applePayNumber} onChange={(e) => setApplePayNumber(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-[#89CF28] outline-none transition-all font-bold text-[#001B41] dark:text-white" placeholder="e.g. +1234567890" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Bitcoin (BTC) Wallet</label>
                    <input type="text" value={btcWallet} onChange={(e) => setBtcWallet(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-[#89CF28] outline-none transition-all font-bold text-[#001B41] dark:text-white" placeholder="BTC Address" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Ethereum (ETH) Wallet</label>
                    <input type="text" value={ethWallet} onChange={(e) => setEthWallet(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-[#89CF28] outline-none transition-all font-bold text-[#001B41] dark:text-white" placeholder="ETH Address" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Tron (TRC) Wallet</label>
                    <input type="text" value={trcWallet} onChange={(e) => setTrcWallet(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-[#89CF28] outline-none transition-all font-bold text-[#001B41] dark:text-white" placeholder="TRC Address" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Tether (USDT) Wallet</label>
                    <input type="text" value={usdtWallet} onChange={(e) => setUsdtWallet(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-[#89CF28] outline-none transition-all font-bold text-[#001B41] dark:text-white" placeholder="USDT Address" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">PayPal (paypal.me link)</label>
                    <input type="text" value={paypalLink} onChange={(e) => setPaypalLink(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-[#89CF28] outline-none transition-all font-bold text-[#001B41] dark:text-white" placeholder="e.g. paypal.me/username" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Payment Amount (per ticket)</label>
                    <input type="text" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-transparent rounded-xl focus:border-[#89CF28] outline-none transition-all font-bold text-[#001B41] dark:text-white" placeholder="e.g. 150.00" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Target Platform*</label>
              <select
                name="userPlatform"
                value={formData.userPlatform}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                required
              >
                <option value="viagogo">Viagogo</option>
                <option value="ticketmaster">Ticketmaster</option>
                <option value="uefa">UEFA</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Send Mode*</label>
              <select
                name="sendType"
                value={formData.sendType}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                required
              >
                <option value="draft">Save as Draft</option>
                <option value="auto">Send Automatically</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-[#89CF28] text-white rounded-xl font-black shadow-lg shadow-[#89CF28]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-3"></div>
                  Transferring...
                </>
              ) : (
                'Transfer Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
