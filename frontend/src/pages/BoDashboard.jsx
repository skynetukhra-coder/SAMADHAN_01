import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function BoDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalTokens: 18,
    inProgress: 6,
    resolved: 9,
    totalFeedback: 24,
    recentFeedback: []
  });

  // Allocation form state
  const [activeTokens, setActiveTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [selectedTable, setSelectedTable] = useState('');

  const [viewAllActive, setViewAllActive] = useState(false);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllFeedbacks = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;
        const groupName = currentUser ? currentUser.group_name : null;

        const res = await axios.get('/api/feedback/list', {
          params: { group_name: groupName }
        });
        setAllFeedbacks(res.data);
      } catch (err) {
        console.error('Error fetching all feedbacks:', err);
        setAllFeedbacks(stats.recentFeedback);
      }
    };
    if (viewAllActive) {
      fetchAllFeedbacks();
    }
  }, [viewAllActive, stats.recentFeedback]);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch metrics and active list
  const fetchData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const groupName = currentUser ? currentUser.group_name : null;

      const statsRes = await axios.get('/api/feedback/stats', {
        params: { group_name: groupName }
      });
      setStats(statsRes.data);

      const activeRes = await axios.get('/api/tokens/active-list', {
        params: { group_name: groupName }
      });
      setActiveTokens(activeRes.data);
    } catch (err) {
      console.error('Error fetching stats and active tokens:', err);
      setStats({
        totalTokens: 0,
        inProgress: 0,
        resolved: 0,
        totalFeedback: 0,
        recentFeedback: []
      });
      setActiveTokens([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAllocate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedToken || !selectedTable) {
      setError('Please select both a Token Number and a Table Number.');
      return;
    }

    const [tokenNo, category] = selectedToken.split('|');
    setLoading(true);

    try {
      await axios.post('/api/tokens/allocate', {
        token_number: tokenNo,
        category: category,
        allocated_table: selectedTable,
        remarks: ''
      });

      setSuccess(`Token ${selectedToken} successfully allocated to ${selectedTable}.`);
      setSelectedToken('');
      setSelectedTable('');
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Allocation failed. Server error.');
    } finally {
      setLoading(false);
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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Progress':
        return 'bg-amber-50 border border-amber-200 text-amber-600 font-bold';
      case 'Resolved':
        return 'bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold';
      case 'Closed':
        return 'bg-purple-50 border border-purple-200 text-purple-600 font-bold';
      default:
        return 'bg-gray-50 border border-gray-200 text-gray-700 font-bold';
    }
  };

  if (viewAllActive) {
    const filteredFeedbacks = allFeedbacks.filter(fb => {
      if (!fb.submitted_on) return true;
      const fbDate = new Date(fb.submitted_on).toISOString().split('T')[0];
      if (startDate && fbDate < startDate) return false;
      if (endDate && fbDate > endDate) return false;
      return true;
    });

    const downloadCSV = () => {
      const headers = ['Token Number', 'Category', 'Submitted On', 'Feedback', 'Remarks', 'Status'];
      const csvRows = filteredFeedbacks.map(fb => [
        fb.token_number,
        fb.category,
        new Date(fb.submitted_on).toLocaleString(),
        fb.feedback ? fb.feedback.replace(/"/g, '""') : '',
        fb.remarks ? fb.remarks.replace(/"/g, '""') : '',
        fb.status
      ]);
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(val => `"${val}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `samadhan_feedbacks_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handlePrint = () => {
      window.print();
    };

    return (
      <div className="flex-grow flex flex-col w-full max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-6 relative z-10 font-sans">
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-section, #print-section * {
              visibility: visible;
            }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Back navigation and title row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 no-print">
          <div>
            <button
              onClick={() => setViewAllActive(false)}
              className="text-govBlue hover:text-govBlue-dark font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition mb-1.5 focus:outline-none cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>
            <h2 className="text-2xl font-extrabold text-govBlue font-serif">All Received Feedbacks</h2>
          </div>
          
          {/* Print/Download Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-slate-50 text-govBlue font-bold py-2.5 px-4 rounded-lg text-xs md:text-sm tracking-wider uppercase border border-gray-300 shadow-sm transition flex items-center space-x-2 cursor-pointer focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / PDF</span>
            </button>
            <button
              onClick={downloadCSV}
              className="bg-govBlue hover:bg-govBlue-dark text-white font-bold py-2.5 px-4 rounded-lg text-xs md:text-sm tracking-wider uppercase shadow-sm transition flex items-center space-x-2 cursor-pointer focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Date Filter Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm no-print">
          <h4 className="text-govBlue font-bold text-xs uppercase tracking-wider mb-4 flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-govGold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter Feedbacks by Date Range
          </h4>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full py-2.5 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full py-2.5 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-slate-50 text-xs md:text-sm font-bold uppercase text-gray-700 tracking-wider transition cursor-pointer focus:outline-none"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Print Section (Table of Feedbacks) */}
        <div id="print-section" className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
          <div className="hidden print:block text-center py-6 border-b border-gray-200">
            <h2 className="text-2xl font-extrabold text-govBlue font-serif">SAMADHAN PORTAL</h2>
            <p className="text-xs uppercase font-extrabold tracking-widest text-govGold mt-1">Grievance & Support Feedbacks Report</p>
            {startDate || endDate ? (
              <p className="text-xs text-gray-500 mt-2 font-bold">
                Filtered Range: {startDate || 'Beginning'} to {endDate || 'Today'}
              </p>
            ) : null}
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] md:text-xs font-extrabold text-govBlue uppercase tracking-widest">
                  <th className="py-4 px-6">Token Number</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Submitted On</th>
                  <th className="py-4 px-6">Feedback</th>
                  <th className="py-4 px-6">AAO Remarks</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs md:text-sm font-semibold text-gray-805">
                {filteredFeedbacks.map((fb, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-govBlue tracking-wide">{fb.token_number}</td>
                    <td className="py-4 px-6">{fb.category}</td>
                    <td className="py-4 px-6 text-gray-500">{formatDateTime(fb.submitted_on)}</td>
                    <td className="py-4 px-6 text-gray-700 whitespace-pre-wrap">{fb.feedback}</td>
                    <td className="py-4 px-6 text-gray-600 italic font-semibold">{fb.remarks || '-'}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block py-1 px-3.5 rounded-full text-[10px] tracking-wide uppercase ${getStatusStyle(fb.status)}`}>
                        {fb.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredFeedbacks.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-400 font-bold uppercase tracking-wider">
                      No feedback entries match the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-govBlue/75 font-semibold text-xs md:text-sm tracking-wide uppercase">Welcome Back,</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-govBlue font-serif mt-1">
            {user?.rep_name || 'Rajesh Kumar'}
          </h2>
          <p className="text-gray-700 text-xs md:text-sm font-bold mt-2.5">
            We are here to serve you better.
          </p>
        </div>
      </div>

      {/* 4 Metric Cards with icons on left and text on right */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Tokens Generated */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex items-center space-x-5 glass-card">
          <div className="w-14 h-14 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            {/* Document icon */}
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-emerald-700 font-serif leading-none">{stats.totalTokens}</p>
            <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1.5">Total Tokens Generated</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex items-center space-x-5 glass-card">
          <div className="w-14 h-14 bg-amber-50 rounded-full text-amber-600 border border-amber-100 flex items-center justify-center flex-shrink-0">
            {/* Hourglass icon */}
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-amber-600 font-serif leading-none">{stats.inProgress}</p>
            <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1.5">In Progress</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex items-center space-x-5 glass-card">
          <div className="w-14 h-14 bg-blue-50 rounded-full text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
            {/* Check double icon */}
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-blue-700 font-serif leading-none">{stats.resolved}</p>
            <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1.5">Resolved</p>
          </div>
        </div>

        {/* Total Feedback */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex items-center space-x-5 glass-card">
          <div className="w-14 h-14 bg-purple-50 rounded-full text-purple-600 border border-purple-100 flex items-center justify-center flex-shrink-0">
            {/* Chat bubble icon */}
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-purple-700 font-serif leading-none">{stats.totalFeedback}</p>
            <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1.5">Total Feedback</p>
          </div>
        </div>
      </div>

      {/* Token Allocation Section */}
      <div className="bg-white p-8 rounded-2xl border border-gray-150 shadow-sm glass-card">
        <h3 className="text-govBlue font-bold text-xs uppercase tracking-wider border-b border-govBlue/20 pb-4 flex items-center">
          {/* Outline Document check list icon */}
          <svg className="w-5 h-5 mr-2 text-govGold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Token Allocation
        </h3>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-lg flex items-center space-x-2">
            <span className="font-bold">{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs rounded-lg flex items-center space-x-2">
            <span className="font-bold">{success}</span>
          </div>
        )}

        <form onSubmit={handleAllocate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mt-6">
          <div>
            <label className="block text-govBlue text-xs font-bold uppercase tracking-wider mb-2">
              Token Number <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
              required
            >
              <option value="">Select Token Number</option>
              {activeTokens.map((tk, idx) => (
                <option key={idx} value={tk.token_number + '|' + tk.category}>
                  {tk.token_number} ({tk.category})
                </option>
              ))}
              {activeTokens.length === 0 && (
                <option disabled value="">No active tokens available</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-govBlue text-xs font-bold uppercase tracking-wider mb-2">
              PSA / DDO Name
            </label>
            <input
              type="text"
              value={(() => {
                if (!selectedToken) return '';
                const [tokenNo, category] = selectedToken.split('|');
                const found = activeTokens.find(t => t.token_number === tokenNo && t.category === category);
                return found ? found.psa_name || 'N/A' : '';
              })()}
              readOnly
              placeholder="Auto-filled PSA Name"
              className="w-full py-3 px-4 rounded-lg border border-gray-300 bg-gray-50 text-sm font-semibold text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-govBlue text-xs font-bold uppercase tracking-wider mb-2">
              Allocate Table Number <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
              required
            >
              <option value="">Select Table Number</option>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={`Table ${num}`}>{`Table ${num}`}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-govBlue hover:bg-govBlue-dark text-white font-bold py-3.5 px-4 rounded-lg tracking-wider uppercase text-sm shadow transition duration-200 flex items-center justify-center space-x-2 h-[46px]"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Assign</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recent Feedback Section */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden glass-card">
        <div className="py-5 px-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-govBlue font-bold text-xs uppercase tracking-wider flex items-center">
            {/* Speech bubble outline */}
            <svg className="w-5 h-5 mr-2 text-govGold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Recent Feedback
          </h3>
          <button 
            onClick={() => setViewAllActive(true)}
            className="text-govBlue hover:text-govBlue-light font-bold text-xs md:text-sm hover:underline cursor-pointer focus:outline-none"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
                <th className="py-4 px-6">Token Number</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Submitted On</th>
                <th className="py-4 px-6">Feedback</th>
                <th className="py-4 px-6">AAO Remarks</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs md:text-sm font-semibold text-gray-800">
              {stats.recentFeedback.map((fb, idx) => (
                <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-6 font-extrabold text-govBlue tracking-wide">{fb.token_number}</td>
                  <td className="py-4 px-6">{fb.category}</td>
                  <td className="py-4 px-6 text-gray-500">{formatDateTime(fb.submitted_on)}</td>
                  <td className="py-4 px-6 text-gray-650 max-w-xs truncate md:max-w-md">{fb.feedback}</td>
                  <td className="py-4 px-6 text-gray-600 italic font-semibold">{fb.remarks || '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-block py-1 px-3.5 rounded-full text-[10px] tracking-wide uppercase ${getStatusStyle(fb.status)}`}>
                      {fb.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentFeedback.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400 font-bold uppercase tracking-wider">
                    No feedbacks submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* White Dashboard themed Footer */}
      <footer className="border-t border-gray-200 bg-white/90 py-4 px-6 rounded-xl shadow-inner flex flex-col sm:flex-row items-center justify-between text-xs tracking-wide text-gray-500 font-semibold">
        <div className="mb-2 sm:mb-0">
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
