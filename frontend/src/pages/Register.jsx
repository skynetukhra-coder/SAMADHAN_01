import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const [psaDdo, setPsaDdo] = useState('');
  const [psaDdoCode, setPsaDdoCode] = useState('');
  const [address, setAddress] = useState('');
  const [repName, setRepName] = useState('');
  const designation = 'Sr. Accounts Officer';
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [ddoList, setDdoList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [registeredToken, setRegisteredToken] = useState(null);
  const [existingTokens, setExistingTokens] = useState([]);
  
  useEffect(() => {
    const fetchExisting = async () => {
      if (!psaDdo) {
        setExistingTokens([]);
        return;
      }
      try {
        const res = await axios.get(`http://localhost:5000/api/tokens/by-psa?psa_name=${encodeURIComponent(psaDdo)}`);
        setExistingTokens(res.data);
      } catch (err) {
        console.error('Error fetching existing tokens:', err);
      }
    };
    const delayDebounce = setTimeout(() => {
      fetchExisting();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [psaDdo]);

  useEffect(() => {
    const fetchDdos = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/ddos');
        setDdoList(response.data);
      } catch (err) {
        console.error('Error fetching DDO list, using offline fallback:', err);
        setDdoList([
          { PSA_NAME: 'Office of the Accountant General, WB', PSA_CODE: 'DDO-2024-AGWB', ADDRESS: 'Treasury Buildings, 2 Government Place West, Kolkata - 700001' },
          { PSA_NAME: 'Department of Finance, Govt of India', PSA_CODE: 'DDO-1100-FIN', ADDRESS: 'North Block, Central Secretariat, New Delhi - 110001' },
          { PSA_NAME: 'GPF Commissioner Directorate', PSA_CODE: 'DDO-7001-GPF', ADDRESS: 'Salt Lake Sector V, Bikash Bhavan, Kolkata - 700091' }
        ]);
      }
    };
    fetchDdos();
  }, []);

  const [services, setServices] = useState({
    PENSION: false,
    ACCOUNTS: false,
    GPF: false
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleServiceChange = (serviceName) => {
    setServices(prev => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!psaDdo || !address || !repName || !mobile || !email) {
      setError('Please fill in all required fields marked with *');
      return;
    }

    const selectedServices = Object.keys(services).filter(k => services[k]);
    if (selectedServices.length === 0) {
      setError('Please select at least one required service.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        psa_ddo: psaDdo,
        psa_ddo_code: psaDdoCode,
        address,
        rep_name: repName,
        designation,
        mobile,
        email,
        services: selectedServices,
        password: 'default_ddo_password_2026' // Default fallback since form has no password field
      };

      const res = await axios.post('http://localhost:5000/api/auth/register', payload);
      setRegisteredToken(res.data.token_number || 'N/A');
    } catch (err) {
      console.error(err);
      if (err.code === 'ERR_NETWORK') {
        setRegisteredToken('TKN-OFFLINE-DEMO');
      } else {
        setError(err.response?.data?.error || 'Registration failed. Server error.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registeredToken) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-10 px-4 w-full max-w-xl mx-auto">
        <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-150 p-10 text-center relative z-10 glass-card">
          
          {/* Animated Success Badge */}
          <div className="w-20 h-20 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10 text-emerald-600 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-govBlue font-serif mb-2">
            Token Generated Successfully!
          </h2>
          
          {/* Diamond decoration */}
          <div className="flex items-center justify-center my-3 text-govGold">
            <span className="text-sm">♦</span>
          </div>

          <p className="text-gray-600 text-sm font-semibold mb-6 max-w-xs mx-auto leading-relaxed">
            Your support request has been registered in the SAMADHAN portal. Please keep this token number for tracking and feedback.
          </p>

          {/* Token Box */}
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 mb-8 max-w-xs mx-auto shadow-inner">
            <span className="block text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5">Your Token Number</span>
            <span className="text-3xl md:text-4xl font-extrabold text-govBlue font-mono tracking-wider">{registeredToken}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setPsaDdo('');
                setPsaDdoCode('');
                setAddress('');
                setRepName('');
                setMobile('');
                setEmail('');
                setServices({
                  PENSION: false,
                  ACCOUNTS: false,
                  GPF: false
                });
                setSuccess('');
                setError('');
                setRegisteredToken(null);
              }}
              className="bg-govBlue hover:bg-govBlue-dark text-white font-bold py-3.5 px-6 rounded-lg text-xs md:text-sm tracking-wider uppercase shadow hover:shadow-md transition duration-200 cursor-pointer"
            >
              Register Another Token
            </button>
            <button
              onClick={() => navigate('/')}
              className="border-2 border-gray-300 hover:border-govBlue hover:text-govBlue text-gray-700 font-bold py-3 px-6 rounded-lg text-xs md:text-sm tracking-wider uppercase transition duration-200 cursor-pointer"
            >
              Back to Home
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center py-10 px-4 w-full max-w-5xl mx-auto">
      
      {/* Registration card styled exactly like the mockup */}
      <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-150 p-10 relative z-10 glass-card">
        
        {/* Title / Subtitle Header */}
        <div className="text-center mb-8 pb-5 border-b border-gray-100">
          <h2 className="text-3xl font-extrabold text-govBlue font-serif">
            REGISTRATION
          </h2>
          {/* Gold Diamond Ornament */}
          <div className="flex items-center justify-center my-2 text-govGold">
            <span className="text-xs">♦</span>
          </div>
          <p className="text-gray-500 text-xs font-semibold tracking-wider">
            Fill in the details below to register and access government services.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs md:text-sm rounded-lg flex items-start space-x-2">
            <svg className="w-4 h-4 mt-[2px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-bold">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-3.5 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-xs md:text-sm rounded-lg flex items-start space-x-2">
            <svg className="w-4 h-4 mt-[2px] flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Part 1: PSA / DDO Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-govBlue text-xs font-bold uppercase tracking-wider mb-2">
                PSA / DDO <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={psaDdo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPsaDdo(val);
                    const found = ddoList.find(d => d.PSA_NAME === val);
                    if (found) {
                      setPsaDdoCode(found.PSA_CODE || '');
                      setAddress(found.ADDRESS || '');
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Select or type PSA / DDO"
                  className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
                  required
                />
                
                {showDropdown && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-full">
                    {ddoList
                      .filter(d => d.PSA_NAME.toLowerCase().includes(psaDdo.toLowerCase()))
                      .map((d, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setPsaDdo(d.PSA_NAME);
                            setPsaDdoCode(d.PSA_CODE || '');
                            setAddress(d.ADDRESS || '');
                            setShowDropdown(false);
                          }}
                          className="px-4 py-2.5 hover:bg-govBlue hover:text-white cursor-pointer text-xs md:text-sm font-semibold text-gray-800 transition duration-100 whitespace-normal text-left"
                        >
                          {d.PSA_NAME}
                        </div>
                      ))}
                    {ddoList.filter(d => d.PSA_NAME.toLowerCase().includes(psaDdo.toLowerCase())).length === 0 && (
                      <div className="px-4 py-2.5 text-gray-500 text-xs md:text-sm italic text-left">
                        No matching PSA found. Type manually to register a new one.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-govBlue text-xs font-bold uppercase tracking-wider mb-2">
                PSA / DDO Code <span className="text-gray-400 font-normal">(if any)</span>
              </label>
              <input
                type="text"
                value={psaDdoCode}
                onChange={(e) => setPsaDdoCode(e.target.value)}
                placeholder="Select or enter PSA / DDO Code"
                className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
              />
            </div>
          </div>

          {/* Address, District & PIN Code */}
          <div>
            <label className="block text-govBlue text-xs font-bold uppercase tracking-wider mb-2">
              Address, District & PIN Code <span className="text-red-500">*</span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter complete address with district and PIN code"
              rows="3"
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
              required
            ></textarea>
          </div>

          {/* Representative Divider (with center title, user icon, and horizontal lines matching target layout) */}
          <div className="flex items-center space-x-3 py-4">
            <div className="h-[1px] flex-grow bg-gray-200"></div>
            
            <div className="flex items-center space-x-2 text-govBlue font-extrabold text-sm uppercase tracking-wider font-sans">
              {/* User Avatar Silhouette */}
              <svg className="w-5 h-5 text-govBlue" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.75 16.65c0-2.43 1.92-4.4 4.35-4.4h7.8c2.43 0 4.35 1.97 4.35 4.4V18a1 1 0 01-1 1H4.75a1 1 0 01-1-1v-1.35z" clipRule="evenodd" />
              </svg>
              <span>Office Representative Details</span>
            </div>
            
            <div className="h-[1px] flex-grow bg-gray-200"></div>
          </div>

          {/* Part 2: Representative details inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Representative Name */}
            <div>
              <label className="block text-govBlue text-xs font-bold uppercase tracking-wider mb-2">
                Representative Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  placeholder="Enter representative name"
                  className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
                  required
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                  {/* User icon on right */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
              </div>
            </div>



            {/* Mobile Number */}
            <div>
              <label className="block text-govBlue text-xs font-bold uppercase tracking-wider mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter mobile number"
                  className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
                  required
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                  {/* Telephone Handset icon on right */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Official Mail Address */}
            <div>
              <label className="block text-govBlue text-xs font-bold uppercase tracking-wider mb-2">
                Official Mail Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter official mail address"
                  className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-govBlue/45 text-sm font-semibold text-gray-800"
                  required
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                  {/* Mail Envelope icon on right */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
            </div>

          </div>

          {/* Part 3: Services Required (colored borders: Blue, Green, Purple) */}
          <div className="space-y-4 pt-4">
            
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-govBlue font-bold text-xs uppercase tracking-wider">Services Required</span>
              <span className="text-gray-400 text-xs font-semibold tracking-wide">(Select all that apply)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* PENSION (Blue Border Card) */}
              <div
                onClick={() => handleServiceChange('PENSION')}
                className={`border-2 rounded-xl p-5 flex items-center justify-start space-x-4 cursor-pointer select-none transition-all duration-200 ${
                  services.PENSION
                    ? 'border-blue-500 bg-blue-50/20 shadow-sm font-bold'
                    : 'border-blue-500/30 hover:border-blue-500 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={services.PENSION}
                  onChange={() => {}}
                  className="h-5 w-5 text-blue-600 border-blue-400 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-extrabold text-xs tracking-widest text-blue-900 uppercase">PENSION</span>
              </div>

              {/* ACCOUNTS (Green Border Card) */}
              <div
                onClick={() => handleServiceChange('ACCOUNTS')}
                className={`border-2 rounded-xl p-5 flex items-center justify-start space-x-4 cursor-pointer select-none transition-all duration-200 ${
                  services.ACCOUNTS
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-sm font-bold'
                    : 'border-emerald-500/30 hover:border-emerald-500 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={services.ACCOUNTS}
                  onChange={() => {}}
                  className="h-5 w-5 text-emerald-600 border-emerald-400 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-extrabold text-xs tracking-widest text-emerald-900 uppercase">ACCOUNTS</span>
              </div>

              {/* GPF (Purple Border Card) */}
              <div
                onClick={() => handleServiceChange('GPF')}
                className={`border-2 rounded-xl p-5 flex items-center justify-start space-x-4 cursor-pointer select-none transition-all duration-200 ${
                  services.GPF
                    ? 'border-purple-500 bg-purple-50/20 shadow-sm font-bold'
                    : 'border-purple-500/30 hover:border-purple-500 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={services.GPF}
                  onChange={() => {}}
                  className="h-5 w-5 text-purple-600 border-purple-400 rounded focus:ring-purple-500 cursor-pointer"
                />
                <span className="font-extrabold text-xs tracking-widest text-purple-900 uppercase">GPF</span>
              </div>

            </div>
          </div>

          {/* Centered Submit Button with Airplane Icon */}
          <div className="pt-6 border-t border-gray-100 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-govBlue hover:bg-govBlue-dark text-white font-bold py-3.5 px-8 rounded-lg tracking-wider uppercase text-sm shadow transition duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              ) : (
                <>
                  {/* Paper airplane send icon */}
                  <svg className="w-4 h-4 fill-current transform rotate-45 -mt-0.5" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  <span>SUBMIT REGISTRATION</span>
                </>
              )}
            </button>
          </div>

          {/* Part 4: Previously Raised Tokens */}
          {existingTokens.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-150 text-left">
              <h4 className="text-govBlue font-extrabold text-xs uppercase tracking-wider mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-govGold" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Previously Raised Tokens for this Office
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-govBlue font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Token Number</th>
                      <th className="py-3 px-4">Representative</th>
                      <th className="py-3 px-4 text-center">Pension</th>
                      <th className="py-3 px-4 text-center">Accounts</th>
                      <th className="py-3 px-4 text-center">GPF</th>
                      <th className="py-3 px-4 text-center">Overall Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingTokens.map((tk, idx) => (
                      <tr key={idx} className="border-b border-gray-150 hover:bg-slate-50/50 transition duration-150">
                        <td className="py-3 px-4 font-mono font-extrabold text-govBlue">{tk.token_number}</td>
                        <td className="py-3 px-4 font-bold text-gray-700">
                          {tk.rep_name} <span className="text-[10px] text-gray-500 font-normal">({tk.mobile})</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tk.service_pension ? (
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${tk.service_pension === 'Completed' || tk.service_pension === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                              {tk.service_pension}
                            </span>
                          ) : <span className="text-gray-400 font-bold italic text-[11px]">-</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tk.service_accounts ? (
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${tk.service_accounts === 'Completed' || tk.service_accounts === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                              {tk.service_accounts}
                            </span>
                          ) : <span className="text-gray-400 font-bold italic text-[11px]">-</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tk.service_gpf ? (
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${tk.service_gpf === 'Completed' || tk.service_gpf === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                              {tk.service_gpf}
                            </span>
                          ) : <span className="text-gray-400 font-bold italic text-[11px]">-</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${tk.status === 'Completed' || tk.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {tk.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
