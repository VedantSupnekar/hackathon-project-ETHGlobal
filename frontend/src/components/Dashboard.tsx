'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { portfolioAPI, demoAPI, WalletLinkRequest, OffChainScoreRequest, ScoresResponse } from '@/lib/api';
import MetaMaskConnector from './MetaMaskConnector';
import ReferralSystem from './ReferralSystem';
import DemoReferralSystem from './DemoReferralSystem';
import { ethers } from 'ethers';

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
  });
  const [settingOffChain, setSettingOffChain] = useState(false);
  
  // Referral state
  const [showReferralSystem, setShowReferralSystem] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);

  // Demo reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  // MetaMask state
  const [connectedWallet, setConnectedWallet] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<string>('');
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

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
        signature: 'demo_signature',
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
        firstName: user?.firstName || 'Demo',
        lastName: user?.lastName || 'User',
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

  const handleWalletConnected = (address: string, balance: string, web3Provider: ethers.providers.Web3Provider) => {
    setConnectedWallet(address);
    setWalletBalance(balance);
    setProvider(web3Provider);
    console.log(`🦊 MetaMask connected: ${address} (${balance} ETH)`);
  };

  const handleWalletDisconnected = () => {
    setConnectedWallet('');
    setWalletBalance('');
    setProvider(null);
    console.log('🦊 MetaMask disconnected');
  };

  const handleDemoReset = async () => {
    try {
      setResetting(true);
      setError('');
      
      await demoAPI.resetAllData();
      
      // Logout user and redirect to login
      logout();
      setShowResetModal(false);
      
      console.log('🧹 Demo data reset successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  const handleLinkMetaMaskWallet = async () => {
    if (!connectedWallet) {
      setError('Please connect MetaMask first');
      return;
    }

    try {
      setLinkingWallet(true);
      setError('');
      
      const walletData: WalletLinkRequest = {
        walletAddress: connectedWallet,
        signature: 'metamask_connected', // In production, you'd request a signature
      };
      
      await portfolioAPI.linkWallet(walletData);
      
      // Reload scores to show updated portfolio
      await loadScores();
      
      console.log(`✅ MetaMask wallet linked: ${connectedWallet}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to link MetaMask wallet');
    } finally {
      setLinkingWallet(false);
    }
  };

  const demoWallets = [
    { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Excellent Alice' },
    { address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955', name: 'Premium Henry' },
    { address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', name: 'Bad Eve' },
    { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Good Bob' },
    { address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', name: 'Student Ivy' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">🏆 DeFi Credit Portfolio</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.firstName} {user?.lastName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <MetaMaskConnector 
                onWalletConnected={handleWalletConnected}
                onWalletDisconnected={handleWalletDisconnected}
              />
              <div className="text-sm text-gray-600">
                Web3 ID: <span className="font-mono text-xs">{user?.web3Id}</span>
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                title="Reset all demo data"
              >
                🧹 Reset Demo
              </button>
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
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {connectedWallet && (
            <button
              onClick={handleLinkMetaMaskWallet}
              disabled={linkingWallet}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {linkingWallet ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Linking...
                </div>
              ) : (
                <>
                  <span className="mr-2">🦊</span>
                  Link MetaMask
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => setShowWalletModal(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Link Manual
          </button>
          
          <button
            onClick={() => setShowOffChainModal(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Set Off-Chain Score
          </button>
          
          <button
            onClick={() => setShowReferralSystem(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Referral Network
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
                    <div className="bg-blue-100 rounded-full p-2 mr-4">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Referral Section Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Score</h3>
            <div className="text-center py-8">
              <div className="text-3xl font-bold text-green-600">Ready!</div>
              <div className="text-sm text-gray-600 mt-2">Referral system with The Graph</div>
              <button
                onClick={() => setShowReferralSystem(true)}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Open Referral Network
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs">1</span>
                </div>
                <span className="text-gray-700">Refer friends by email (they must accept)</span>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs">2</span>
                </div>
                <span className="text-gray-700">When they improve credit (+5 pts), you get 1 referral point</span>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs">3</span>
                </div>
                <span className="text-gray-700">Chain rewards: deeper levels get 0.001 pts per level</span>
              </div>
              <div className="flex items-start">
                <div className="bg-red-100 rounded-full p-1 mr-3 mt-0.5">
                  <span className="text-red-600 text-xs">!</span>
                </div>
                <span className="text-gray-700">Bad credit decisions (-5 pts) cause penalties</span>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your wallet address or try demo wallets:
              </p>
              <div className="mt-2 space-y-1">
                {demoWallets.map((wallet) => (
                  <button
                    key={wallet.address}
                    onClick={() => setWalletAddress(wallet.address)}
                    className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 truncate"
                  >
                    {wallet.name}: {wallet.address}
                  </button>
                ))}
              </div>
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Using your account details:</strong><br/>
                  Name: {user?.firstName} {user?.lastName}<br/>
                  Web3 ID: <span className="font-mono text-xs">{user?.web3Id}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SSN (for Experian credit report)
                </label>
                <input
                  type="text"
                  value={offChainData.ssn}
                  onChange={(e) => setOffChainData({...offChainData, ssn: e.target.value})}
                  placeholder="111-11-1111 (demo)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
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
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {settingOffChain ? 'Setting...' : 'Set Score'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-900 mb-4">🧹 Reset Demo Data</h3>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently delete:
                </p>
                <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                  <li>All user accounts</li>
                  <li>All linked wallets</li>
                  <li>All credit scores</li>
                  <li>All off-chain attestations</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                You will be logged out and need to create a new account.
              </p>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                onClick={handleDemoReset}
                disabled={resetting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {resetting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </div>
                ) : (
                  '🧹 Reset All Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral System Modal */}
      {showReferralSystem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-6xl w-full mx-4 my-8 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Referral Network</h2>
              <button
                onClick={() => setShowReferralSystem(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-0">
              {/* Mode Toggle */}
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Referral System Mode</h3>
                    <p className="text-sm text-gray-600">Choose between live blockchain or demo mode for presentation</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setUseDemoMode(false)}
                      className={`px-4 py-2 rounded-lg ${!useDemoMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      Live Blockchain
                    </button>
                    <button
                      onClick={() => setUseDemoMode(true)}
                      className={`px-4 py-2 rounded-lg ${useDemoMode 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      🎭 Demo Mode
                    </button>
                  </div>
                </div>
              </div>

              {/* Render appropriate component */}
              {useDemoMode ? <DemoReferralSystem /> : <ReferralSystem />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;