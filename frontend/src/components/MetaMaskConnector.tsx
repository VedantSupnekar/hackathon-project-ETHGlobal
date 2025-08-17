'use client';
import React, { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

interface MetaMaskConnectorProps {
  onWalletConnected: (address: string, balance: string, provider: ethers.BrowserProvider) => void;
  onWalletDisconnected: () => void;
}

const MetaMaskConnector: React.FC<MetaMaskConnectorProps> = ({ onWalletConnected, onWalletDisconnected }) => {
  const [hasProvider, setHasProvider] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<string>('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  // Local blockchain network details
  const LOCAL_NETWORK = {
    chainId: '0x7a69', // 31337 in hex
    chainName: 'Local Testnet',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: null
  };

  useEffect(() => {
    checkConnection();
    setupEventListeners();
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    const ethereumProvider = await detectEthereumProvider();
    if (ethereumProvider) {
      setHasProvider(true);
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      const accounts = await web3Provider.listAccounts();
      if (accounts.length > 0) {
        await updateAccountInfo(web3Provider, accounts[0]);
      }

      // Check current network
      const network = await web3Provider.getNetwork();
      setChainId(`0x${network.chainId.toString(16)}`);
      setIsCorrectNetwork(network.chainId === 31337); // Check for 31337
    } else {
      setHasProvider(false);
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install it to connect your wallet.');
        return;
      }

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);

      // Check network
      const network = await web3Provider.getNetwork();
      setChainId(`0x${network.chainId.toString(16)}`);

      if (network.chainId !== 31337) { // Check for 31337
        setIsCorrectNetwork(false);
        await switchToLocalNetwork();
        return;
      }

      setIsCorrectNetwork(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      await updateAccountInfo(web3Provider, accounts[0]);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      alert(`Failed to connect MetaMask: ${error.message || error}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchToLocalNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: LOCAL_NETWORK.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [LOCAL_NETWORK],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          alert('Failed to add Local Testnet to MetaMask');
        }
      } else {
        console.error('Error switching network:', switchError);
        alert('Failed to switch to Local Testnet');
      }
    }
  };

  const updateAccountInfo = async (web3Provider: ethers.BrowserProvider, accountAddress: string) => {
    try {
      const balance = await web3Provider.getBalance(accountAddress);
      const balanceInEth = ethers.formatEther(balance);
      
      setAccount(accountAddress);
      setBalance(balanceInEth);
      
      onWalletConnected(accountAddress, balanceInEth, web3Provider);
    } catch (error) {
      console.error('Error updating account info:', error);
    }
  };

  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount('');
      setBalance('');
      onWalletDisconnected();
    } else if (provider) {
      updateAccountInfo(provider, accounts[0]);
    }
  };

  const handleChainChanged = (newChainId: string) => {
    setChainId(newChainId);
    setIsCorrectNetwork(newChainId === LOCAL_NETWORK.chainId);
    window.location.reload(); // Reload the page to reset the provider
  };

  const disconnectWallet = () => {
    setAccount('');
    setBalance('');
    setProvider(null);
    onWalletDisconnected();
  };

  if (!hasProvider) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 mb-4">MetaMask is not installed</p>
        <a
          href="https://metamask.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 mb-2">Wrong Network</p>
        <p className="text-sm text-gray-600 mb-4">Please switch to Local Testnet (Chain ID: 31337)</p>
        <button
          onClick={switchToLocalNetwork}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Switch Network
        </button>
      </div>
    );
  }

  if (account) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">🦊 MetaMask Connected</p>
            <p className="text-xs text-green-600 font-mono">{account.slice(0, 6)}...{account.slice(-4)}</p>
            <p className="text-xs text-green-600">{parseFloat(balance).toFixed(4)} ETH</p>
          </div>
          <button
            onClick={disconnectWallet}
            className="text-green-700 hover:text-green-900 text-sm font-medium"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
    >
      {isConnecting ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </div>
      ) : (
        <>
          <span className="mr-2">🦊</span>
          Connect MetaMask
        </>
      )}
    </button>
  );
};

export default MetaMaskConnector;