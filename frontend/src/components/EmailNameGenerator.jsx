import React, { useState } from 'react';
import { Mail, User, RefreshCw } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setUserFromLogin } from '../store/slices/authSlice';

const EmailNameGenerator = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [generatedName, setGeneratedName] = useState('');

  // Function to generate name from email (same as in authSlice)
  const generateNameFromEmail = (email) => {
    if (!email) return '';
    
    // Extract the part before @
    const username = email.split('@')[0];
    
    // Split by common separators and capitalize each part
    const nameParts = username
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .filter(part => part.length > 0);
    
    return nameParts.join(' ') || 'User';
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setGeneratedName(generateNameFromEmail(newEmail));
  };

  const handleApplyUser = () => {
    if (email && generatedName) {
      dispatch(setUserFromLogin({
        email: email,
        name: generatedName,
        role: 'user',
        department: 'Coastal Monitoring'
      }));
    }
  };

  const demoEmails = [
    'john.doe@example.com',
    'sarah.wilson@company.com',
    'mike.johnson@domain.org',
    'anna_smith@test.com',
    'david-brown@sample.net'
  ];

  return (
    <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-semibold">Email to Name Generator</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Enter Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter email address..."
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {generatedName && (
          <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <User className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-green-400 font-medium">Generated Name:</div>
              <div className="text-white text-lg">{generatedName}</div>
            </div>
          </div>
        )}

        {email && generatedName && (
          <button
            onClick={handleApplyUser}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Apply as Current User
          </button>
        )}

        <div>
          <div className="text-slate-400 text-sm mb-2">Try these demo emails:</div>
          <div className="grid grid-cols-1 gap-2">
            {demoEmails.map((demoEmail, index) => (
              <button
                key={index}
                onClick={() => {
                  setEmail(demoEmail);
                  setGeneratedName(generateNameFromEmail(demoEmail));
                }}
                className="text-left px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded border border-slate-600/50 hover:border-slate-500 transition-all text-sm"
              >
                {demoEmail} → {generateNameFromEmail(demoEmail)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailNameGenerator;