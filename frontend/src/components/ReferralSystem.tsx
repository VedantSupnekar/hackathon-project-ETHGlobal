'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ethers } from 'ethers';

// Contract configuration - Update these after deployment
const REFERRAL_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';

// Contract ABI - Essential functions only
const REFERRAL_CONTRACT_ABI = [
  'function registerUser(bytes32 web3Id, address walletAddress, string memory email, bytes32 referrerWeb3Id) external',
  'function createReferralRequest(bytes32 referrerWeb3Id, string memory refereeEmail) external',
  'function acceptReferralRequest(bytes32 requestId, bytes32 refereeWeb3Id, address walletAddress) external',
  'function rejectReferralRequest(bytes32 requestId, string memory refereeEmail) external',
  'function getPendingReferralRequest(string memory email) external view returns (bytes32, bytes32, bool, uint256, uint256)',
  'function getUserProfile(bytes32 web3Id) external view returns (bytes32, address, string, bytes32, uint256, uint256, uint256, bytes32[], uint256)',
  'function getNetworkStats() external view returns (uint256, uint256, uint256, uint256)',
  'function canBeReferred(string memory email) external view returns (bool)',
  'function getReferralPath(bytes32 web3Id) external view returns (bytes32[])',
  'function getDirectReferrals(bytes32 web3Id) external view returns (bytes32[])',
  'event ReferralRequested(bytes32 indexed referrerWeb3Id, string indexed refereeEmail, bytes32 indexed requestId)',
  'event ReferralAccepted(bytes32 indexed referrerWeb3Id, bytes32 indexed refereeWeb3Id, bytes32 indexed requestId)',
  'event UserRegistered(bytes32 indexed web3Id, address indexed walletAddress, bytes32 indexed referrerWeb3Id)'
];

interface PendingRequest {
  requestId: string;
  referrerWeb3Id: string;
  referrerDetails: {
    email: string;
    walletAddress: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  email: string;
}

interface UserProfile {
  web3Id: string;
  walletAddress: string;
  email: string;
  referredBy: string | null;
  onChainScore: string;
  referralScore: string;
  totalScore: string;
  directReferrals: string[];
  referralPath: string[];
  registeredAt: string;
  networkDepth: number;
}

interface NetworkStats {
  totalUsers: string;
  totalReferralRelationships: string;
  totalCreditEvents: string;
  averageReferralScore: string;
}

const ReferralSystem: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'refer' | 'profile' | 'network'>('refer');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Blockchain state
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractReadOnly, setContractReadOnly] = useState<ethers.Contract | null>(null);

  // Initialize blockchain connection
  useEffect(() => {
    initializeBlockchain();
  }, []);

  useEffect(() => {
    if (contractReadOnly && isAuthenticated && user?.email) {
      loadUserData();
    }
  }, [contractReadOnly, isAuthenticated, user]);

  const initializeBlockchain = async () => {
    try {
      // Check if MetaMask is available
      if (typeof window !== 'undefined' && window.ethereum) {
        const browserProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(browserProvider);
        
        // Get signer for transactions
        const signer = browserProvider.getSigner();
        setSigner(signer);
        
        // Create contract instance with signer for transactions
        const contractWithSigner = new ethers.Contract(REFERRAL_CONTRACT_ADDRESS, REFERRAL_CONTRACT_ABI, signer);
        setContract(contractWithSigner);
        
        console.log('✅ Blockchain connection initialized');
      }
      
      // Always create read-only contract for queries
      const readOnlyProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
      const readOnlyContract = new ethers.Contract(REFERRAL_CONTRACT_ADDRESS, REFERRAL_CONTRACT_ABI, readOnlyProvider);
      setContractReadOnly(readOnlyContract);
      
    } catch (error) {
      console.error('Failed to initialize blockchain:', error);
      setError('Failed to connect to blockchain. Please ensure MetaMask is installed and connected.');
    }
  };

  const loadUserData = async () => {
    if (!contractReadOnly || !user) return;
    
    try {
      await Promise.all([
        checkPendingRequest(),
        fetchUserProfile(),
        fetchNetworkStats()
      ]);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const checkPendingRequest = async () => {
    if (!user?.email || !contractReadOnly) return;

    try {
      const request = await contractReadOnly.getPendingReferralRequest(user.email);
      const [requestId, referrerWeb3Id, isActive, createdAt, expiresAt] = request;
      
      if (isActive && requestId !== ethers.ZeroHash) {
        setPendingRequest({
          requestId: requestId,
          referrerWeb3Id: referrerWeb3Id,
          referrerDetails: null, // We could fetch this if needed
          isActive: isActive,
          createdAt: createdAt.toString(),
          expiresAt: expiresAt.toString(),
          email: user.email
        });
      } else {
        setPendingRequest(null);
      }
    } catch (error) {
      console.error('Error checking pending request:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user?.web3Id || !contractReadOnly) return;

    try {
      // Convert address to bytes32 by padding with zeros
      const web3IdBytes32 = ethers.utils.hexZeroPad(user.web3Id, 32);
      const profile = await contractReadOnly.getUserProfile(web3IdBytes32);
      const [web3IdOut, walletAddress, email, referredBy, onChainScore, referralScore, totalScore, directReferrals, registeredAt] = profile;
      
      // Get referral path
      const referralPath = await contractReadOnly.getReferralPath(web3IdBytes32);
      
      setUserProfile({
        web3Id: web3IdOut,
        walletAddress: walletAddress,
        email: email,
        referredBy: referredBy === ethers.ZeroHash ? null : referredBy,
        onChainScore: onChainScore.toString(),
        referralScore: referralScore.toString(),
        totalScore: totalScore.toString(),
        directReferrals: directReferrals.map((id: any) => id.toString()),
        referralPath: referralPath.map((id: any) => id.toString()),
        registeredAt: registeredAt.toString(),
        networkDepth: referralPath.length - 1
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If user doesn't exist in referral system, that's okay
      setUserProfile(null);
    }
  };

  const fetchNetworkStats = async () => {
    if (!contractReadOnly) return;

    try {
      const stats = await contractReadOnly.getNetworkStats();
      const [totalUsers, totalReferralRelationships, totalCreditEvents, averageReferralScore] = stats;
      
      setNetworkStats({
        totalUsers: totalUsers.toString(),
        totalReferralRelationships: totalReferralRelationships.toString(),
        totalCreditEvents: totalCreditEvents.toString(),
        averageReferralScore: averageReferralScore.toString()
      });
    } catch (error) {
      console.error('Error fetching network stats:', error);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.web3Id || !refereeEmail || !contract) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First check if email can be referred (read-only call)
      const canBeReferred = await contractReadOnly?.canBeReferred(refereeEmail);
      
      if (!canBeReferred) {
        setError('This email is already registered or has a pending referral request');
        return;
      }

      console.log('Creating referral request on-chain...');
      console.log('Referrer Web3 ID:', user.web3Id);
      console.log('Referee Email:', refereeEmail);

      // Create referral request directly on blockchain
      // Convert address to bytes32 by padding with zeros
      const web3IdBytes32 = ethers.utils.hexZeroPad(user.web3Id, 32);
      const tx = await contract.createReferralRequest(web3IdBytes32, refereeEmail);
      
      setSuccess('Transaction submitted! Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log('Transaction confirmed:', receipt.hash);

      setSuccess(`Referral request sent to ${refereeEmail}! They have 7 days to accept.`);
      setRefereeEmail('');
      
      // Refresh data
      await Promise.all([
        fetchUserProfile(),
        fetchNetworkStats()
      ]);
      
    } catch (error: any) {
      console.error('Error creating referral:', error);
      
      // Handle specific error cases
      if (error.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by user');
      } else if (error.message?.includes('user rejected')) {
        setError('Transaction was rejected by user');
      } else if (error.reason) {
        setError(`Transaction failed: ${error.reason}`);
      } else {
        setError('Failed to create referral request. Please check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReferral = async () => {
    if (!pendingRequest || !user?.web3Id || !user?.walletAddress || !contract) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Accepting referral request on-chain...');
      console.log('Request ID:', pendingRequest.requestId);
      console.log('Referee Web3 ID:', user.web3Id);
      console.log('Wallet Address:', user.walletAddress);

      // Accept referral request directly on blockchain
      // Convert address to bytes32 by padding with zeros
      const web3IdBytes32 = ethers.utils.hexZeroPad(user.web3Id, 32);
      const tx = await contract.acceptReferralRequest(
        pendingRequest.requestId,
        web3IdBytes32,
        user.walletAddress
      );
      
      setSuccess('Transaction submitted! Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log('Referral acceptance confirmed:', receipt.hash);

      setSuccess('Referral accepted successfully! You are now part of the referral network.');
      setPendingRequest(null);
      
      // Refresh data
      await Promise.all([
        checkPendingRequest(),
        fetchUserProfile(),
        fetchNetworkStats()
      ]);
      
    } catch (error: any) {
      console.error('Error accepting referral:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by user');
      } else if (error.reason) {
        setError(`Transaction failed: ${error.reason}`);
      } else {
        setError('Failed to accept referral request. Please check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReferral = async () => {
    if (!pendingRequest || !user?.email || !contract) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Rejecting referral request on-chain...');
      console.log('Request ID:', pendingRequest.requestId);
      console.log('Referee Email:', user.email);

      // Reject referral request directly on blockchain
      const tx = await contract.rejectReferralRequest(
        pendingRequest.requestId,
        user.email
      );
      
      setSuccess('Transaction submitted! Waiting for confirmation...');
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log('Referral rejection confirmed:', receipt.hash);

      setSuccess('Referral request rejected.');
      setPendingRequest(null);
      
      // Refresh data
      await checkPendingRequest();
      
    } catch (error: any) {
      console.error('Error rejecting referral:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by user');
      } else if (error.reason) {
        setError(`Transaction failed: ${error.reason}`);
      } else {
        setError('Failed to reject referral request. Please check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please log in to access the referral system.</p>
        </div>
      </div>
    );
  }

  // Check if contract is properly configured
  if (REFERRAL_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-900 mb-2">Contract Not Deployed</h3>
          <p className="text-red-700">
            The referral contract has not been deployed yet. Please:
          </p>
          <ol className="list-decimal list-inside text-red-700 mt-2 space-y-1">
            <li>Deploy the contract: <code>node scripts/deployReferralContract.js</code></li>
            <li>Update the <code>NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS</code> environment variable</li>
            <li>Restart the frontend application</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Referral Network</h1>
        
        {/* Blockchain Connection Status */}
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${contract ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={contract ? 'text-green-700' : 'text-red-700'}>
            {contract ? 'Connected to Blockchain' : 'Blockchain Disconnected'}
          </span>
          {contract && (
            <span className="text-gray-500 font-mono text-xs">
              {REFERRAL_CONTRACT_ADDRESS.slice(0, 6)}...{REFERRAL_CONTRACT_ADDRESS.slice(-4)}
            </span>
          )}
        </div>
      </div>

      {/* Pending Referral Request Alert */}
      {pendingRequest && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-900">Pending Referral Request</h3>
              <p className="text-blue-700">
                {pendingRequest.referrerDetails?.email || 'Someone'} has invited you to join their referral network.
              </p>
              <p className="text-sm text-blue-600">
                Expires: {new Date(parseInt(pendingRequest.expiresAt) * 1000).toLocaleDateString()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAcceptReferral}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={handleRejectReferral}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'refer', label: 'Refer Someone' },
            { id: 'profile', label: 'My Profile' },
            { id: 'network', label: 'Network Stats' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'refer' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Someone to Join</h2>
            
            {/* MetaMask Connection Warning */}
            {!contract && (
              <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-800 text-sm">
                  ⚠️ Please connect MetaMask to create referral requests. All referral operations happen directly on the blockchain.
                </p>
              </div>
            )}
            
            <form onSubmit={handleCreateReferral} className="space-y-4">
              <div>
                <label htmlFor="refereeEmail" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="refereeEmail"
                  value={refereeEmail}
                  onChange={(e) => setRefereeEmail(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="friend@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !refereeEmail || !contract}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : !contract ? 'Connect MetaMask First' : 'Send Referral Request'}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">How Referral Rewards Work</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• When someone you refer makes good credit decisions (+5 points or more), you earn 1 referral point</li>
              <li>• When someone in your referral chain makes good decisions, you earn 0.001 points per level</li>
              <li>• Bad credit decisions (-5 points or more) result in penalty deductions</li>
              <li>• Your total score = On-chain score + Referral score</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'profile' && userProfile && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referral Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Scores</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">On-chain Score:</span>
                    <span className="font-medium">{userProfile.onChainScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Referral Score:</span>
                    <span className="font-medium text-blue-600">{userProfile.referralScore}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-medium">Total Score:</span>
                    <span className="font-bold text-lg">{userProfile.totalScore}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Network Position</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network Depth:</span>
                    <span className="font-medium">{userProfile.networkDepth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Direct Referrals:</span>
                    <span className="font-medium">{userProfile.directReferrals.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Referred By:</span>
                    <span className="font-medium">
                      {userProfile.referredBy ? 'Yes' : 'Root User'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {userProfile.referralPath.length > 1 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Your Referral Chain</h3>
              <div className="flex items-center space-x-2 overflow-x-auto">
                {userProfile.referralPath.reverse().map((web3Id, index) => (
                  <React.Fragment key={web3Id}>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                      {index === userProfile.referralPath.length - 1 ? 'You' : `Level ${index + 1}`}
                    </div>
                    {index < userProfile.referralPath.length - 1 && (
                      <div className="text-gray-400">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'network' && networkStats && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Network Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{networkStats.totalUsers}</div>
                <div className="text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{networkStats.totalReferralRelationships}</div>
                <div className="text-gray-600">Referral Relationships</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{networkStats.totalCreditEvents}</div>
                <div className="text-gray-600">Credit Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {Math.round(parseFloat(networkStats.averageReferralScore) / 1000)}
                </div>
                <div className="text-gray-600">Avg Referral Score</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSystem;
