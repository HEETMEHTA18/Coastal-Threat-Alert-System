import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../store/hooks';
import { generateNameFromEmail, updateUserProfile } from '../store/slices/authSlice';
import { RefreshCw, User, Check } from 'lucide-react';

const NameRegenerator = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRegenerateName = async () => {
    if (!user?.email) return;
    
    setIsGenerating(true);
    
    // Generate name from current email
    const newName = user.email.split('@')[0]
      .split(/[._\d]+/)
      .filter(part => part.length > 0)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
    
    // Update the user profile
    dispatch(updateUserProfile({ name: newName }));
    
    setTimeout(() => {
      setIsGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 500);
  };

  if (!user) return null;

  const currentName = user.name || 'User';
  const suggestedName = user.email ? user.email.split('@')[0]
    .split(/[._\d]+/)
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ') : 'User';

  return (
    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-5 h-5 text-blue-400" />
        <h3 className="text-white font-medium">Name From Email</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="text-sm text-slate-400 mb-1">Current Name:</div>
          <div className="text-white font-medium">{currentName}</div>
        </div>
        
        <div>
          <div className="text-sm text-slate-400 mb-1">Email:</div>
          <div className="text-slate-300">{user.email}</div>
        </div>
        
        {suggestedName !== currentName && (
          <div>
            <div className="text-sm text-slate-400 mb-1">Suggested Name:</div>
            <div className="text-green-400 font-medium">{suggestedName}</div>
          </div>
        )}
        
        <button
          onClick={handleRegenerateName}
          disabled={isGenerating || showSuccess}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
            showSuccess 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {showSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Name Updated!
            </>
          ) : (
            <>
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Name from Email'}
            </>
          )}
        </button>
        
        <div className="text-xs text-slate-500 text-center">
          This will extract your name from your email address
        </div>
      </div>
    </div>
  );
};

export default NameRegenerator;