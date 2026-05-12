// /components/UpdateTicketModal.tsx
import { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { useUser } from '../UserContext';

interface UpdateTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
}

const UpdateTicketModal: React.FC<UpdateTicketModalProps> = ({ ticket, onClose }) => {
  const { fetchAllTickets } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Ticket>({...ticket});

  useEffect(() => {
    setFormData({...ticket});
  }, [ticket]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const payload = new URLSearchParams();
      payload.append("action", "updateTicket");
      payload.append("ticketId", ticket.ticketId);
      
      // Add all form fields to payload
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          payload.append(key, value.toString());
        }
      });
      
      const response = await fetch("https://script.google.com/macros/s/AKfycbxcoCDXcWlKPDbttlFf2eR_EeuMkfupy5dfgIOklM1ShEZ30gfD3wzZZOxkKV4xIWEl/exec", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString()
      });
      
      if (response.ok) {
        alert("Ticket updated successfully!");
        fetchAllTickets(); // Refresh tickets list
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update ticket. Please try again.");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      setError("An error occurred while updating the ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Update Ticket</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Event Name*</label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Venue*</label>
              <input
                type="text"
                name="venue"
                value={formData.venue || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Location*</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Date & Time*</label>
              <input
                type="datetime-local"
                name="dateTime"
                value={formData.dateTime || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Door Time</label>
              <input
                type="text"
                name="doorTime"
                value={formData.doorTime || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Section*</label>
              <input
                type="text"
                name="section"
                value={formData.section || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Section Number</label>
              <input
                type="text"
                name="sectionNo"
                value={formData.sectionNo || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Row*</label>
              <input
                type="text"
                name="row"
                value={formData.row || ''}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Age Restriction</label>
              <select
                name="ageRestriction"
                value={formData.ageRestriction || 'All Ages'}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="All Ages">All Ages</option>
                <option value="18+">18+</option>
                <option value="21+">21+</option>
              </select>
            </div>
            
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
            <input
              type="url"
              name="coverImage"
              value={formData.coverImage || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
            ></textarea>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Terms & Conditions</label>
            <textarea
              name="terms"
              value={formData.terms || ''}
              onChange={handleChange}
              rows={2}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Update Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTicketModal;
