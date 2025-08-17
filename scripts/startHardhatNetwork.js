/**
 * Start Hardhat Network for MetaMask Integration
 * This script starts a local blockchain with funded accounts for testing
 */

import { spawn } from 'child_process';
import { ethers } from 'ethers';

async function startHardhatNetwork() {
  console.log('🚀 Starting Hardhat Network for MetaMask Integration...');
  console.log('');

  // Start Hardhat node
  const hardhatProcess = spawn('npx', ['hardhat', 'node'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Handle process events
  hardhatProcess.on('error', (error) => {
    console.error('❌ Failed to start Hardhat network:', error);
    process.exit(1);
  });

  hardhatProcess.on('close', (code) => {
    console.log(`Hardhat network process exited with code ${code}`);
  });

  // Wait a bit for the network to start
  setTimeout(async () => {
    console.log('');
    console.log('🎯 HARDHAT NETWORK SETUP COMPLETE!');
    console.log('');
    console.log('📋 MetaMask Configuration:');
    console.log('   Network Name: Hardhat Local');
    console.log('   RPC URL: http://127.0.0.1:8545');
    console.log('   Chain ID: 1337');
    console.log('   Currency Symbol: ETH');
    console.log('');
    console.log('💰 Available Test Accounts (each with 10,000 ETH):');
    
    try {
      const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      const accounts = await provider.listAccounts();
      
      for (let i = 0; i < Math.min(5, accounts.length); i++) {
        const balance = await provider.getBalance(accounts[i]);
        const balanceInEth = ethers.utils.formatEther(balance);
        console.log(`   ${i + 1}. ${accounts[i]} (${parseFloat(balanceInEth).toFixed(2)} ETH)`);
      }
      
      if (accounts.length > 5) {
        console.log(`   ... and ${accounts.length - 5} more accounts`);
      }
    } catch (error) {
      console.log('   (Accounts will be available once network is fully started)');
    }
    
    console.log('');
    console.log('🦊 To connect MetaMask:');
    console.log('   1. Open MetaMask');
    console.log('   2. Click on network dropdown');
    console.log('   3. Click "Add Network"');
    console.log('   4. Use the configuration above');
    console.log('   5. Import accounts using the private keys from Hardhat output');
    console.log('');
    console.log('🎬 Demo Ready:');
    console.log('   - Frontend: http://localhost:3000');
    console.log('   - Backend: http://localhost:3001');
    console.log('   - Hardhat: http://127.0.0.1:8545');
    console.log('');
    console.log('Press Ctrl+C to stop the network');
  }, 3000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Hardhat network...');
    hardhatProcess.kill();
    process.exit(0);
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startHardhatNetwork().catch(console.error);
}

export default startHardhatNetwork;
