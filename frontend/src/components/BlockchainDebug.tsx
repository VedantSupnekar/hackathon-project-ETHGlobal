'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const REFERRAL_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';

const BlockchainDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkEverything = async () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        environment: {
          contractAddress: REFERRAL_CONTRACT_ADDRESS,
          rpcUrl: RPC_URL,
          isDefaultAddress: REFERRAL_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000'
        },
        metamask: {
          available: typeof window !== 'undefined' && !!window.ethereum,
          isMetaMask: typeof window !== 'undefined' && window.ethereum?.isMetaMask
        }
      };

      // Check if MetaMask is connected
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          info.metamask.connectedAccounts = accounts;
          info.metamask.hasAccounts = accounts.length > 0;

          if (accounts.length > 0) {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            info.metamask.chainId = chainId;
            info.metamask.isHardhatNetwork = chainId === '0x7a69'; // 31337 in hex
          }
        } catch (error) {
          info.metamask.error = error.message;
        }
      }

      // Check RPC connection
      try {
        const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        const network = await provider.getNetwork();
        info.rpc = {
          connected: true,
          chainId: network.chainId.toString(),
          name: network.name
        };

        // Check if contract exists at address
        if (REFERRAL_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
          const code = await provider.getCode(REFERRAL_CONTRACT_ADDRESS);
          info.contract = {
            address: REFERRAL_CONTRACT_ADDRESS,
            hasCode: code !== '0x',
            codeLength: code.length
          };
        }
      } catch (error) {
        info.rpc = {
          connected: false,
          error: error.message
        };
      }

      // Check browser provider
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const browserProvider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await browserProvider.getNetwork();
          info.browserProvider = {
            connected: true,
            chainId: network.chainId.toString(),
            name: network.name
          };
        } catch (error) {
          info.browserProvider = {
            connected: false,
            error: error.message
          };
        }
      }

      setDebugInfo(info);
    };

    checkEverything();
  }, []);

  const connectMetaMask = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        // Refresh debug info after connection
        window.location.reload();
      } catch (error) {
        console.error('Failed to connect MetaMask:', error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🔧 Blockchain Connection Debug</h1>
      
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
        <div className="space-y-1 text-sm font-mono">
          <div>Contract Address: <span className={debugInfo.environment?.isDefaultAddress ? 'text-red-600' : 'text-green-600'}>{debugInfo.environment?.contractAddress}</span></div>
          <div>RPC URL: <span className="text-blue-600">{debugInfo.environment?.rpcUrl}</span></div>
          <div>Is Default Address: <span className={debugInfo.environment?.isDefaultAddress ? 'text-red-600' : 'text-green-600'}>{debugInfo.environment?.isDefaultAddress ? 'YES (PROBLEM!)' : 'NO (GOOD)'}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">MetaMask Status</h2>
        <div className="space-y-1 text-sm">
          <div>Available: <span className={debugInfo.metamask?.available ? 'text-green-600' : 'text-red-600'}>{debugInfo.metamask?.available ? 'YES' : 'NO'}</span></div>
          <div>Is MetaMask: <span className={debugInfo.metamask?.isMetaMask ? 'text-green-600' : 'text-red-600'}>{debugInfo.metamask?.isMetaMask ? 'YES' : 'NO'}</span></div>
          <div>Connected Accounts: <span className="font-mono">{debugInfo.metamask?.connectedAccounts?.length || 0}</span></div>
          {debugInfo.metamask?.hasAccounts && (
            <>
              <div>Current Account: <span className="font-mono text-xs">{debugInfo.metamask?.connectedAccounts?.[0]}</span></div>
              <div>Chain ID: <span className="font-mono">{debugInfo.metamask?.chainId}</span></div>
              <div>Is Hardhat Network: <span className={debugInfo.metamask?.isHardhatNetwork ? 'text-green-600' : 'text-red-600'}>{debugInfo.metamask?.isHardhatNetwork ? 'YES' : 'NO'}</span></div>
            </>
          )}
          {debugInfo.metamask?.error && (
            <div className="text-red-600">Error: {debugInfo.metamask.error}</div>
          )}
        </div>
        
        {!debugInfo.metamask?.hasAccounts && debugInfo.metamask?.available && (
          <button
            onClick={connectMetaMask}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Connect MetaMask
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">RPC Connection</h2>
        <div className="space-y-1 text-sm">
          <div>Connected: <span className={debugInfo.rpc?.connected ? 'text-green-600' : 'text-red-600'}>{debugInfo.rpc?.connected ? 'YES' : 'NO'}</span></div>
          {debugInfo.rpc?.connected && (
            <>
              <div>Chain ID: <span className="font-mono">{debugInfo.rpc?.chainId}</span></div>
              <div>Network Name: <span>{debugInfo.rpc?.name}</span></div>
            </>
          )}
          {debugInfo.rpc?.error && (
            <div className="text-red-600">Error: {debugInfo.rpc.error}</div>
          )}
        </div>
      </div>

      {debugInfo.contract && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Smart Contract</h2>
          <div className="space-y-1 text-sm">
            <div>Address: <span className="font-mono text-xs">{debugInfo.contract?.address}</span></div>
            <div>Has Code: <span className={debugInfo.contract?.hasCode ? 'text-green-600' : 'text-red-600'}>{debugInfo.contract?.hasCode ? 'YES' : 'NO'}</span></div>
            <div>Code Length: <span>{debugInfo.contract?.codeLength} characters</span></div>
          </div>
        </div>
      )}

      <div className="bg-gray-100 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Raw Debug Data</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>
  );
};

export default BlockchainDebug;
