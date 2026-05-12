import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen, faPaperPlane, faTicketAlt, faPlus, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import AddUserModal from './AddUserModal';
import { User, Ticket } from '../types';
import { useUser } from '../UserContext';

interface UserTableProps {
  users: User[];
  tickets: Ticket[];
}

const UserTable: React.FC<UserTableProps> = ({ users, tickets }) => {
  const { fetchAllUsers } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserFormData, setNewUserFormData] = useState({
    fullName: '',
    phoneNumber: '',
    emailAddress: '',
    seatNumbers: '',
    senderName: '',
    senderEmail: '',
    userPlatform: 'viagogo',
    sendType: 'draft',
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Define the APP_SCRIPT_POST_URL here
  const APP_SCRIPT_POST_URL = "https://script.google.com/macros/s/AKfycbxcoCDXcWlKPDbttlFf2eR_EeuMkfupy5dfgIOklM1ShEZ30gfD3wzZZOxkKV4xIWEl/exec";

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleAddUser = () => {
    setShowAddUserModal(true);
  };

  const filteredUsers = users.filter(user => {
    const searchString = `${user.fullName} ${user.phoneNumber} ${user.emailAddress} ${user.ticketFolderId} ${user.eventName} ${user.section} ${user.adminStatus}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleRetractTransfer = useCallback((user: User) => {
    if (window.confirm("Are you sure you want to retract this ticket transfer?")) {
      setIsActionLoading(true);

      let payload = new URLSearchParams();
      payload.append("action", "retractTicket");
      payload.append("userId", user?.userId as string);
      payload.append("cancelledSTAMP", "RETRACTED");

      fetch(APP_SCRIPT_POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString()
      }).then(() => {
        setTimeout(() => {
          fetchAllUsers(); // Refresh users list
          setIsActionLoading(false);
        }, 1000);
      }).catch(error => {
        console.error("Error retracting ticket:", error);
        fetchAllUsers(); // Refresh users list
        setIsActionLoading(false);
      });
    }
  }, [APP_SCRIPT_POST_URL]);

  return (
    <>
      <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Users</h2>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <button
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center w-full sm:w-auto justify-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Send Ticket
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="border p-2 text-sm text-left">Full Name</th>
                <th className="border p-2 text-sm text-left hidden lg:table-cell">Phone Number</th>
                <th className="border p-2 text-sm text-left hidden lg:table-cell">Email Address</th>
                <th className="border p-2 text-sm text-left hidden lg:table-cell">Event</th>
                <th className="border p-2 text-sm text-left hidden lg:table-cell">Section</th>
                <th className="border p-2 text-sm text-left">Status</th>
                <th className="border p-2 text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.reverse().map(user => (
                <tr key={user.userId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="border p-2 text-sm">{user.fullName}</td>
                  <td className="border p-2 text-sm hidden lg:table-cell">{user.phoneNumber}</td>
                  <td className="border p-2 text-sm hidden lg:table-cell">{user.emailAddress}</td>
                  <td className="border p-2 text-sm hidden lg:table-cell">{user.eventName}</td>
                  <td className="border p-2 text-sm hidden lg:table-cell">{user.section}</td>
                  <td className="border p-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.systemStatus === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : user.systemStatus === 'WAITING CHECK'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.systemStatus}
                    </span>
                  </td>
                  <td className="border p-2 text-sm">
                    <div className="flex items-center justify-center space-x-3">
                      {user.ticketFolderId && (
                        <a
                          href={`https://drive.google.com/drive/folders/${user.ticketFolderId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Open Folder"
                        >
                          <FontAwesomeIcon icon={faFolderOpen} />
                        </a>
                      )}
                      {['WAITING APPROVAL', 'WAITING COMPLETION', 'COMPLETED'].includes(user.systemStatus) && (
                        <button
                          onClick={() => handleRetractTransfer(user)}
                          disabled={isActionLoading}
                          className="text-red-600 hover:text-red-800"
                          title="Retract Transfer"
                        >
                          {isActionLoading ? <span className="animate-spin">Loading...</span> : <FontAwesomeIcon icon={faTimesCircle} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No users found matching your search criteria.
          </div>
        )}
      </section>

      {showAddUserModal && (
        <AddUserModal
          tickets={tickets}
          formData={newUserFormData}
          setFormData={setNewUserFormData}
          onAddUser={handleAddUser}
          onClose={() => setShowAddUserModal(false)}
        />
      )}
    </>
  );
};

export default UserTable;
