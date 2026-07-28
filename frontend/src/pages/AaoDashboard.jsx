import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AaoDashboard() {
  const [selectedTable, setSelectedTable] = useState('');
  const [tokens, setTokens] = useState([]);
  const [editingRemarks, setEditingRemarks] = useState({});
  const [user, setUser] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/login');
    } else {
      const parsed = JSON.parse(storedUser);
      const repNameVal = parsed.rep_name || parsed.full_name || '';
      setUser({ 
        ...parsed, 
        rep_name: repNameVal.startsWith('AAO') || repNameVal.startsWith('ASSTT') 
          ? repNameVal 
          : `AAO ${repNameVal}` 
      });
    }
  }, []);

  // Fetch tokens for selected table
  const fetchTableTokens = async (tableNum) => {
    if (!tableNum) {
      setTokens([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/tokens/table/${tableNum}?group_name=${user?.group_name || ''}`);
      setTokens(res.data);
      
      // Initialize editingRemarks state
      const initialRemarks = {};
      res.data.forEach(t => {
        initialRemarks[t.token_number] = t.remarks || '';
      });
      setEditingRemarks(initialRemarks);
    } catch (err) {
      console.error('Error fetching table tokens:', err);
      setError('Failed to load tokens for the selected table. Server error.');
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableTokens(selectedTable);
  }, [selectedTable]);

  // Handle status update
  const handleUpdateStatus = async (tokenNum, newStatus, currentRemarks) => {
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/tokens/update-status', {
        token_number: tokenNum,
        status: newStatus,
        remarks: currentRemarks,
        group_name: user?.group_name
      });
      setSuccess(`Token ${tokenNum} updated to ${newStatus === 'Resolved' ? 'Completed' : newStatus}.`);
      fetchTableTokens(selectedTable);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Server error.');
    }
  };

  // Handle remarks save
  const handleSaveRemarks = async (tokenNum) => {
    const remarkVal = editingRemarks[tokenNum] || '';
    const tokenItem = tokens.find(t => t.token_number === tokenNum);
    const statusVal = tokenItem ? tokenItem.status : 'In Progress';
    
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/tokens/update-status', {
        token_number: tokenNum,
        status: statusVal,
        remarks: remarkVal,
        group_name: user?.group_name
      });
      setSuccess(`Remarks saved for token ${tokenNum}.`);
      fetchTableTokens(selectedTable);
    } catch (err) {
      console.error('Error saving remarks:', err);
      setError('Failed to save remarks. Server error.');
    }
  };

  // Sort tokens: In Progress and Pending always on top, Completed/Resolved/Closed at bottom
  const getSortedTokens = () => {
    return [...tokens].sort((a, b) => {
      const aActive = a.status === 'In Progress' || a.status === 'Pending' ? 0 : 1;
      const bActive = b.status === 'In Progress' || b.status === 'Pending' ? 0 : 1;
      return aActive - bActive;
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-amber-50 border border-amber-200 text-amber-600 font-bold';
      case 'Resolved':
      case 'Completed':
        return 'bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold';
      case 'Closed':
        return 'bg-purple-50 border border-purple-200 text-purple-600 font-bold';
      default:
        return 'bg-gray-50 border border-gray-200 text-gray-700 font-bold';
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Statistics for the selected table
  const getTableStats = () => {
    const total = tokens.length;
    const inProgress = tokens.filter(t => t.status === 'In Progress').length;
    const completed = tokens.filter(t => t.status === 'Resolved' || t.status === 'Closed' || t.status === 'Completed').length;
    const pending = tokens.filter(t => t.status === 'Pending').length;
    return { total, inProgress, completed, pending };
  };

  const stats = getTableStats();

  return (
    <div className="flex-grow flex flex-col w-full max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-6 relative z-10 font-sans">
      
      {/* Subheader Banner with uploaded background image */}
      <div className="relative rounded-2xl border border-blue-100 text-govBlue p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-sm overflow-hidden min-h-[160px]">
        {/* Background Image of Secretariat Building */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/agbengal.png" 
            alt="Secretariat Building" 
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle gradient overlay to ensure text contrast and legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/95 via-blue-50/80 to-transparent" />
        </div>
        
        {/* Banner Welcome text details */}
        <div className="relative z-10 text-center md:text-left">
          <p className="text-govBlue/75 font-semibold text-xs md:text-sm tracking-wide uppercase">Assistant Accounts Officer (AAO)</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-govBlue font-serif mt-1">
            {user?.rep_name || 'AAO Rajesh Kumar'}
          </h2>
          <p className="text-gray-700 text-xs md:text-sm font-bold mt-2.5">
            Table-wise Service Allocation & Verification Portal
          </p>
        </div>
      </div>

      {/* Two Columns Layout Above */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Column 1: Select Table Number */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm glass-card flex flex-col justify-center">
          <h3 className="text-govBlue text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-govGold" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Select Table Number
          </h3>
          
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-bold text-gray-800"
          >
            <option value="">Select Table Number</option>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={`Table ${num}`}>{`Table ${num}`}</option>
            ))}
          </select>
        </div>

        {/* Column 2: Table Stats / Info */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm glass-card grid grid-cols-3 gap-4 items-center">
          <div className="text-center border-r border-gray-100">
            <p className="text-2xl font-extrabold text-govBlue font-serif">{selectedTable ? stats.total : '-'}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1">Total Assigned</p>
          </div>
          <div className="text-center border-r border-gray-100">
            <p className="text-2xl font-extrabold text-amber-600 font-serif">{selectedTable ? stats.inProgress : '-'}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-emerald-600 font-serif">{selectedTable ? stats.completed : '-'}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1">Completed</p>
          </div>
        </div>

      </div>

      {/* Main Tabular View */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden glass-card">
        <div className="py-5 px-6 border-b border-gray-100">
          <h3 className="text-govBlue font-bold text-xs uppercase tracking-wider flex items-center">
            <svg className="w-5 h-5 mr-2 text-govGold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {selectedTable ? `Assigned Tokens - ${selectedTable}` : 'Assigned Tokens List'}
          </h3>
        </div>

        {error && (
          <div className="m-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-lg font-bold">
            {error}
          </div>
        )}
        {success && (
          <div className="m-6 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs rounded-lg font-bold">
            {success}
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
                <th className="py-4 px-6">Token Number</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Submitted On</th>
                <th className="py-4 px-6 w-1/3">Remarks</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs md:text-sm font-semibold text-gray-800">
              {selectedTable && getSortedTokens().map((tk) => {
                const isLocked = tk.status === 'Resolved' || tk.status === 'Closed' || tk.status === 'Completed';
                const isInProgress = tk.status === 'In Progress';
                
                return (
                  <tr key={tk.token_number} className={`hover:bg-slate-50/40 transition-colors ${isLocked ? 'bg-gray-50/40 opacity-75' : ''}`}>
                    <td className="py-4 px-6 font-extrabold text-govBlue tracking-wide">{tk.token_number}</td>
                    <td className="py-4 px-6">{tk.category}</td>
                    <td className="py-4 px-6 text-gray-500">{formatDateTime(tk.submitted_on)}</td>
                    <td className="py-4 px-6">
                      {isLocked ? (
                        <span className="text-gray-500 italic block py-1">{tk.remarks || 'No remarks recorded'}</span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <input 
                            type="text"
                            value={editingRemarks[tk.token_number] !== undefined ? editingRemarks[tk.token_number] : (tk.remarks || '')}
                            onChange={(e) => setEditingRemarks({ ...editingRemarks, [tk.token_number]: e.target.value })}
                            className="w-full py-1.5 px-3 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-govBlue text-xs font-semibold"
                            placeholder="Enter remarks..."
                            disabled={!isInProgress}
                          />
                          {isInProgress && (
                            <button
                              onClick={() => handleSaveRemarks(tk.token_number)}
                              title="Save Remarks"
                              className="p-2 bg-govBlue hover:bg-govBlue-dark text-white rounded shadow-sm transition duration-150"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block py-1 px-3.5 rounded-full text-[10px] tracking-wide uppercase ${getStatusStyle(tk.status)}`}>
                        {tk.status === 'Resolved' ? 'Completed' : tk.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* In Progress Button */}
                        <button
                          onClick={() => handleUpdateStatus(tk.token_number, 'In Progress', editingRemarks[tk.token_number] || tk.remarks)}
                          disabled={isLocked || isInProgress}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition duration-150 ${
                            isInProgress 
                              ? 'bg-amber-100 text-amber-700 cursor-default border border-amber-200' 
                              : isLocked
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                          }`}
                        >
                          In Progress
                        </button>
                        
                        {/* Completed Button */}
                        <button
                          onClick={() => handleUpdateStatus(tk.token_number, 'Resolved', editingRemarks[tk.token_number] || tk.remarks)}
                          disabled={isLocked}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition duration-150 ${
                            isLocked 
                              ? 'bg-emerald-100 text-emerald-700 cursor-default border border-emerald-200' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          Completed
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!selectedTable && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                    Please select a table number above to view and process assigned tokens.
                  </td>
                </tr>
              )}

              {selectedTable && tokens.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                    No tokens assigned to {selectedTable} yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/90 py-4 px-6 rounded-xl shadow-inner flex flex-col sm:flex-row items-center justify-between text-xs tracking-wide text-gray-500 font-semibold">
        <div>
          &copy; 2024 SAMADHAN. All rights reserved.
        </div>
        <div className="flex items-center space-x-4">
          <a href="#privacy" className="hover:text-govBlue transition-colors">Privacy Policy</a>
          <span>|</span>
          <a href="#terms" className="hover:text-govBlue transition-colors">Terms of Use</a>
          <span>|</span>
          <a href="#contact" className="hover:text-govBlue transition-colors">Contact Us</a>
        </div>
      </footer>

    </div>
  );
}
