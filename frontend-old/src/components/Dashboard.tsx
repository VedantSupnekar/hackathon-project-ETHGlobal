import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { portfolioAPI, WalletLinkRequest, OffChainScoreRequest, ScoresResponse } from '../services/api';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [scores, setScores] = useState<ScoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Wallet linking state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [linkingWallet, setLinkingWallet] = useState(false);
  
  // Off-chain score state
  const [showOffChainModal, setShowOffChainModal] = useState(false);
  const [offChainData, setOffChainData] = useState({
    ssn: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [settingOffChain, setSettingOffChain] = useState(false);
  
  // Referral state (placeholder for future implementation)
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralEmail, setReferralEmail] = useState('');

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getScores();
      setScores(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load scores');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!walletAddress.trim()) {
      setError('Please enter a valid wallet address');
      return;
    }

    try {
      setLinkingWallet(true);
      setError('');
      
      const walletData: WalletLinkRequest = {
        walletAddress: walletAddress.trim(),
        signature: 'demo_signature', // In production, this would be a real signature
      };
      
      await portfolioAPI.linkWallet(walletData);
      
      // Reload scores to show updated portfolio
      await loadScores();
      
      setShowWalletModal(false);
      setWalletAddress('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to link wallet');
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleSetOffChainScore = async () => {
    if (!offChainData.ssn.trim()) {
      setError('Please enter your SSN');
      return;
    }

    try {
      setSettingOffChain(true);
      setError('');
      
      const scoreData: OffChainScoreRequest = {
        ssn: offChainData.ssn.trim(),
        firstName: offChainData.firstName.trim() || 'Demo',
        lastName: offChainData.lastName.trim() || 'User',
      };
      
      await portfolioAPI.setOffChainScore(scoreData);
      
      // Reload scores to show updated composite score
      await loadScores();
      
      setShowOffChainModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set off-chain score');
    } finally {
      setSettingOffChain(false);
    }
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (!score) return 'text-gray-400';
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number | null | undefined) => {
    if (!score) return 'Not Available';
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    if (score >= 600) return 'Poor';
    return 'Very Poor';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-defi-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DeFi Credit Portfolio</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.firstName} {user?.lastName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Web3 ID: <span className="font-mono text-xs">{user?.web3Id}</span>
              </div>
              <button
                onClick={logout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Credit Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Composite Score */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Composite Credit Score</h3>
              <div className="bg-gradient-to-r from-defi-500 to-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Primary Score
              </div>
            </div>
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(scores?.scores.composite)}`}>
                {scores?.scores.composite || '---'}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {getScoreLabel(scores?.scores.composite)}
              </div>
              {scores?.weights && (
                <div className="text-xs text-gray-500 mt-2">
                  {Math.round(scores.weights.offChain * 100)}% Off-chain + {Math.round(scores.weights.onChain * 100)}% On-chain
                </div>
              )}
            </div>
          </div>

          {/* On-Chain Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">On-Chain Score</h3>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(scores?.scores.onChain)}`}>
                {scores?.scores.onChain || '---'}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {scores?.portfolioSummary.totalWallets || 0} Wallets
              </div>
            </div>
          </div>

          {/* Off-Chain Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Off-Chain Score</h3>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(scores?.scores.offChain)}`}>
                {scores?.scores.offChain || '---'}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {scores?.scores.offChain ? 'Via FDC' : 'Not Set'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setShowWalletModal(true)}
            className="bg-gradient-to-r from-defi-500 to-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:from-defi-600 hover:to-primary-700 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Link Wallet
          </button>
          
          <button
            onClick={() => setShowOffChainModal(true)}
            className="bg-gradient-to-r from-primary-500 to-defi-600 text-white px-6 py-3 rounded-lg font-medium hover:from-primary-600 hover:to-defi-700 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Set Off-Chain Score
          </button>
          
          <button
            onClick={() => setShowReferralModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Refer Friend
          </button>
        </div>

        {/* Wallet Portfolio */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Wallets</h3>
          {scores?.portfolioSummary.walletBreakdown.length ? (
            <div className="space-y-4">
              {scores.portfolioSummary.walletBreakdown.map((wallet, index) => (
                <div key={wallet.address} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-defi-100 rounded-full p-2 mr-4">
                      <svg className="w-5 h-5 text-defi-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        Wallet {index + 1}
                        {wallet.profile && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {wallet.profile}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 font-mono">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getScoreColor(wallet.score)}`}>
                      {wallet.score}
                    </div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
              </svg>
              <p>No wallets connected yet</p>
              <p className="text-sm">Link your first wallet to start building your credit portfolio</p>
            </div>
          )}
        </div>

        {/* Referral Section (Placeholder) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Score</h3>
            <div className="text-center py-8">
              <div className="text-3xl font-bold text-gray-400">Coming Soon</div>
              <div className="text-sm text-gray-600 mt-2">Referral system via The Graph</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Activity</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">People Referred</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Referred By</span>
                <span className="font-semibold">None</span>
              </div>
              <div className="text-xs text-gray-500 mt-4">
                🚧 Referral tracking system coming soon with The Graph integration
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Link Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Link New Wallet</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-defi-500 focus:border-defi-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your wallet address or use demo wallets from the setup guide
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowWalletModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkWallet}
                disabled={linkingWallet}
                className="flex-1 px-4 py-2 bg-defi-600 text-white rounded-md hover:bg-defi-700 disabled:opacity-50"
              >
                {linkingWallet ? 'Linking...' : 'Link Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Off-Chain Score Modal */}
      {showOffChainModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Off-Chain Credit Score</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SSN
                </label>
                <input
                  type="text"
                  value={offChainData.ssn}
                  onChange={(e) => setOffChainData({...offChainData, ssn: e.target.value})}
                  placeholder="123-45-6789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-defi-500 focus:border-defi-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={offChainData.firstName}
                    onChange={(e) => setOffChainData({...offChainData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-defi-500 focus:border-defi-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={offChainData.lastName}
                    onChange={(e) => setOffChainData({...offChainData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-defi-500 focus:border-defi-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                This will fetch your traditional credit score via Flare FDC Web2JSON integration
              </p>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowOffChainModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSetOffChainScore}
                disabled={settingOffChain}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {settingOffChain ? 'Setting...' : 'Set Score'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal (Placeholder) */}
      {showReferralModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Refer a Friend</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Friend's Email
              </label>
              <input
                type="email"
                value={referralEmail}
                onChange={(e) => setReferralEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                🚧 Referral system coming soon with The Graph integration
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReferralModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled
                className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
