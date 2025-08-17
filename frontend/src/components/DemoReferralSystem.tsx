'use client';

import React, { useState } from 'react';

// Mock data for demo purposes
const mockUsers = {
  'alice@demo.com': {
    web3Id: '0x1234567890123456789012345678901234567890123456789012345678901234',
    email: 'alice@demo.com',
    onChainScore: 750,
    referralScore: 25,
    totalScore: 775,
    referredBy: null,
    directReferrals: ['bob@demo.com', 'charlie@demo.com']
  },
  'bob@demo.com': {
    web3Id: '0x2345678901234567890123456789012345678901234567890123456789012345',
    email: 'bob@demo.com', 
    onChainScore: 680,
    referralScore: 12,
    totalScore: 692,
    referredBy: 'alice@demo.com',
    directReferrals: ['david@demo.com']
  },
  'charlie@demo.com': {
    web3Id: '0x3456789012345678901234567890123456789012345678901234567890123456',
    email: 'charlie@demo.com',
    onChainScore: 720,
    referralScore: 8,
    totalScore: 728,
    referredBy: 'alice@demo.com',
    directReferrals: []
  },
  'david@demo.com': {
    web3Id: '0x4567890123456789012345678901234567890123456789012345678901234567',
    email: 'david@demo.com',
    onChainScore: 650,
    referralScore: 0,
    totalScore: 650,
    referredBy: 'bob@demo.com',
    directReferrals: []
  }
};

const DemoReferralSystem = () => {
  const [selectedUser, setSelectedUser] = useState('alice@demo.com');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentUser = mockUsers[selectedUser as keyof typeof mockUsers];

  const handleCreateReferral = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!refereeEmail) {
      setError('Please enter an email address');
      return;
    }

    if (mockUsers[refereeEmail as keyof typeof mockUsers]) {
      setError('This user is already registered');
      return;
    }

    if (refereeEmail === selectedUser) {
      setError('You cannot refer yourself');
      return;
    }

    // Simulate successful referral
    setSuccess(`✅ Referral request sent to ${refereeEmail}! They will receive an email to join the network.`);
    setRefereeEmail('');
  };

  const simulateScoreUpdate = (userEmail: string, change: number) => {
    const user = mockUsers[userEmail as keyof typeof mockUsers];
    if (user) {
      user.onChainScore += change;
      user.totalScore += change;
      
      // Propagate rewards up the chain
      if (user.referredBy) {
        const referrer = mockUsers[user.referredBy as keyof typeof mockUsers];
        if (referrer) {
          const reward = Math.floor(change * 0.2); // 20% of the change
          referrer.referralScore += reward;
          referrer.totalScore += reward;
        }
      }
      
      setSuccess(`✅ Score updated! ${userEmail} gained ${change} points. Referral rewards propagated!`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔗 Referral Credit Network</h1>
        <p className="text-gray-600">Decentralized Credit Scoring with Referral Rewards</p>
        <div className="mt-4 px-4 py-2 bg-green-100 text-green-800 rounded-lg inline-block">
          ✅ Connected to Blockchain (Demo Mode)
        </div>
      </div>

      {/* User Selector */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Demo User</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(mockUsers).map(([email, user]) => (
            <button
              key={email}
              onClick={() => setSelectedUser(email)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedUser === email
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{email.split('@')[0]}</div>
              <div className="text-sm text-gray-500">Score: {user.totalScore}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current User Profile */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">User Profile: {currentUser.email}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{currentUser.onChainScore}</div>
            <div className="text-sm text-gray-600">On-Chain Score</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{currentUser.referralScore}</div>
            <div className="text-sm text-gray-600">Referral Score</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{currentUser.totalScore}</div>
            <div className="text-sm text-gray-600">Total Score</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{currentUser.directReferrals.length}</div>
            <div className="text-sm text-gray-600">Direct Referrals</div>
          </div>
        </div>
      </div>

      {/* Create Referral */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Referral Request</h3>
        <form onSubmit={handleCreateReferral} className="space-y-4">
          <div>
            <label htmlFor="refereeEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Referee Email Address
            </label>
            <input
              type="email"
              id="refereeEmail"
              value={refereeEmail}
              onChange={(e) => setRefereeEmail(e.target.value)}
              placeholder="Enter email address to refer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Referral Request
          </button>
        </form>
        
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Referral Network */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Referral Network</h3>
        <div className="space-y-4">
          {currentUser.referredBy && (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Referred by:</span>
              <span className="font-medium">{currentUser.referredBy}</span>
            </div>
          )}
          
          {currentUser.directReferrals.length > 0 && (
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Direct Referrals:</span>
              </div>
              <div className="ml-6 space-y-2">
                {currentUser.directReferrals.map((email) => (
                  <div key={email} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{email}</span>
                    <span className="text-sm text-gray-500">
                      Score: {mockUsers[email as keyof typeof mockUsers]?.totalScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Demo Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Demo Actions</h3>
        <p className="text-gray-600 mb-4">Simulate credit events to see referral rewards in action:</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => simulateScoreUpdate(selectedUser, 25)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            ✅ Good Credit Action (+25)
          </button>
          <button
            onClick={() => simulateScoreUpdate(selectedUser, 50)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🏆 Excellent Credit Action (+50)
          </button>
          <button
            onClick={() => simulateScoreUpdate(selectedUser, -15)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            ❌ Poor Credit Action (-15)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoReferralSystem;
