import { useState } from 'react';
import { useUser } from '../UserContext'; 
import { Ticket } from '../types';

const APP_SCRIPT_POST_URL =
  'https://script.google.com/macros/s/AKfycbxcoCDXcWlKPDbttlFf2eR_EeuMkfupy5dfgIOklM1ShEZ30gfD3wzZZOxkKV4xIWEl/exec';

interface AddUserModalProps {
  tickets: Ticket[];
  formData: {
    fullName: string;
    phoneNumber: string;
    emailAddress: string;
    seatNumbers: string;
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

  // Initialize defaults from admin if available
  useState(() => {
    if (admin) {
      setFormData(prev => ({
        ...prev,
        senderName: prev.senderName || admin.senderName || '',
        senderEmail: prev.senderEmail || admin.senderEmail || '',
        userPlatform: prev.userPlatform || 'viagogo',
        sendType: prev.sendType || 'draft'
      }));
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
    // Using the environment variable for the specific deployment URL
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
      payload.append('seatNumbers', formData.seatNumbers);
      payload.append('ticketId', selectedTicketId);
      payload.append('timestamp', timestamp);
      payload.append('admin', admin.username);
      payload.append('senderName', formData.senderName);
      payload.append('senderEmail', formData.senderEmail);
      payload.append('userPlatform', formData.userPlatform);
      payload.append('sendType', formData.sendType); // New field: draft or auto

      console.log('Payload:', payload.toString());

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

      console.log('Response:', data);
      
      fetchAllUsers(); 

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
      fetchAllUsers(); 
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
                onChange={e => setSelectedTicketId(e.target.value)}
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

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Seat Numbers*</label>
              <input
                type="text"
                name="seatNumbers"
                value={formData.seatNumbers}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-[#89CF28] focus:bg-white outline-none transition-all font-bold text-[#001B41]"
                required
              />
            </div>

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
