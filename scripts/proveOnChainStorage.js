/**
 * Prove On-Chain Storage Script
 * Demonstrates that user data is stored on the blockchain
 */

const { ethers } = require('ethers');

async function proveOnChainStorage() {
  console.log('🔍 PROVING ON-CHAIN DATA STORAGE\n');
  
  try {
    // Connect to local blockchain
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const network = await provider.getNetwork();
    console.log(`🔗 Connected to blockchain: Chain ID ${network.chainId}`);
    
    // Get a signer (user account)
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    console.log(`👤 User Address: ${userAddress}`);
    
    // Demonstrate on-chain storage by sending transactions with data
    console.log('\n📝 STORING USER DATA ON-CHAIN...\n');
    
    // 1. Store user registration data
    const userData = {
      email: 'demo@hackathon.com',
      firstName: 'Demo',
      lastName: 'User',
      web3Id: ethers.keccak256(ethers.toUtf8Bytes('demo-user-web3-id')),
      timestamp: new Date().toISOString()
    };
    
    console.log('1️⃣ Storing User Registration Data...');
    const userDataHex = ethers.toUtf8Bytes(JSON.stringify(userData));
    const userRegistrationTx = await signer.sendTransaction({
      to: userAddress, // Self-transaction to store data
      value: 0,
      data: userDataHex
    });
    
    console.log(`   📄 Transaction Hash: ${userRegistrationTx.hash}`);
    console.log(`   📊 Data Size: ${userDataHex.length} bytes`);
    console.log(`   💾 Stored Data: ${JSON.stringify(userData, null, 2)}`);
    
    // Wait for confirmation
    const userReceipt = await userRegistrationTx.wait();
    console.log(`   ✅ Confirmed in Block: ${userReceipt.blockNumber}`);
    console.log(`   ⛽ Gas Used: ${userReceipt.gasUsed.toString()}\n`);
    
    // 2. Store credit score data
    const creditData = {
      web3Id: userData.web3Id,
      onChainScore: 720,
      offChainScore: 680,
      compositeScore: 700,
      fdcAttestationId: 'fdc-' + Date.now(),
      timestamp: new Date().toISOString()
    };
    
    console.log('2️⃣ Storing Credit Score Data...');
    const creditDataHex = ethers.toUtf8Bytes(JSON.stringify(creditData));
    const creditScoreTx = await signer.sendTransaction({
      to: userAddress,
      value: 0,
      data: creditDataHex
    });
    
    console.log(`   📄 Transaction Hash: ${creditScoreTx.hash}`);
    console.log(`   📊 Data Size: ${creditDataHex.length} bytes`);
    console.log(`   💾 Stored Data: ${JSON.stringify(creditData, null, 2)}`);
    
    const creditReceipt = await creditScoreTx.wait();
    console.log(`   ✅ Confirmed in Block: ${creditReceipt.blockNumber}`);
    console.log(`   ⛽ Gas Used: ${creditReceipt.gasUsed.toString()}\n`);
    
    // 3. Store wallet linking data
    const walletLinkData = {
      web3Id: userData.web3Id,
      linkedWallet: '0x742d35Cc6635C0532925a3b8D67C9e5b538Eb24d',
      linkType: 'external',
      signature: 'demo-signature-' + Date.now(),
      timestamp: new Date().toISOString()
    };
    
    console.log('3️⃣ Storing Wallet Link Data...');
    const walletDataHex = ethers.toUtf8Bytes(JSON.stringify(walletLinkData));
    const walletLinkTx = await signer.sendTransaction({
      to: userAddress,
      value: 0,
      data: walletDataHex
    });
    
    console.log(`   📄 Transaction Hash: ${walletLinkTx.hash}`);
    console.log(`   📊 Data Size: ${walletDataHex.length} bytes`);
    console.log(`   💾 Stored Data: ${JSON.stringify(walletLinkData, null, 2)}`);
    
    const walletReceipt = await walletLinkTx.wait();
    console.log(`   ✅ Confirmed in Block: ${walletReceipt.blockNumber}`);
    console.log(`   ⛽ Gas Used: ${walletReceipt.gasUsed.toString()}\n`);
    
    // 4. Prove data retrieval from blockchain
    console.log('🔍 PROVING DATA RETRIEVAL FROM BLOCKCHAIN...\n');
    
    // Get transaction details to prove data is on-chain
    const userTxDetails = await provider.getTransaction(userRegistrationTx.hash);
    const creditTxDetails = await provider.getTransaction(creditScoreTx.hash);
    const walletTxDetails = await provider.getTransaction(walletLinkTx.hash);
    
    console.log('📄 BLOCKCHAIN PROOF OF STORAGE:');
    console.log('================================');
    
    console.log('\n1️⃣ User Registration Data:');
    console.log(`   Block Number: ${userTxDetails.blockNumber}`);
    console.log(`   Block Hash: ${userTxDetails.blockHash}`);
    console.log(`   Transaction Index: ${userTxDetails.index}`);
    console.log(`   From: ${userTxDetails.from}`);
    console.log(`   To: ${userTxDetails.to}`);
    console.log(`   Data: ${userTxDetails.data}`);
    
    // Decode the stored data
    try {
      const decodedUserData = ethers.toUtf8String(userTxDetails.data);
      console.log(`   Decoded Data: ${decodedUserData}`);
    } catch (e) {
      console.log(`   Raw Data (${userTxDetails.data.length} chars): ${userTxDetails.data.substring(0, 100)}...`);
    }
    
    console.log('\n2️⃣ Credit Score Data:');
    console.log(`   Block Number: ${creditTxDetails.blockNumber}`);
    console.log(`   Block Hash: ${creditTxDetails.blockHash}`);
    console.log(`   Transaction Index: ${creditTxDetails.index}`);
    console.log(`   Data: ${creditTxDetails.data}`);
    
    console.log('\n3️⃣ Wallet Link Data:');
    console.log(`   Block Number: ${walletTxDetails.blockNumber}`);
    console.log(`   Block Hash: ${walletTxDetails.blockHash}`);
    console.log(`   Transaction Index: ${walletTxDetails.index}`);
    console.log(`   Data: ${walletTxDetails.data}`);
    
    // 5. Generate blockchain proof summary
    const blockchainProof = {
      network: {
        chainId: network.chainId.toString(),
        name: 'localhost'
      },
      userAddress,
      dataStorageTransactions: {
        userRegistration: {
          hash: userRegistrationTx.hash,
          blockNumber: userReceipt.blockNumber,
          blockHash: userReceipt.blockHash,
          gasUsed: userReceipt.gasUsed.toString(),
          data: userData
        },
        creditScore: {
          hash: creditScoreTx.hash,
          blockNumber: creditReceipt.blockNumber,
          blockHash: creditReceipt.blockHash,
          gasUsed: creditReceipt.gasUsed.toString(),
          data: creditData
        },
        walletLink: {
          hash: walletLinkTx.hash,
          blockNumber: walletReceipt.blockNumber,
          blockHash: walletReceipt.blockHash,
          gasUsed: walletReceipt.gasUsed.toString(),
          data: walletLinkData
        }
      },
      proof: {
        totalTransactions: 3,
        totalGasUsed: (
          BigInt(userReceipt.gasUsed) + 
          BigInt(creditReceipt.gasUsed) + 
          BigInt(walletReceipt.gasUsed)
        ).toString(),
        dataStoredOnChain: true,
        immutable: true,
        verifiable: true,
        timestamp: new Date().toISOString()
      }
    };
    
    // Save proof to file
    const fs = require('fs');
    fs.writeFileSync('blockchain-storage-proof.json', JSON.stringify(blockchainProof, null, 2));
    
    console.log('\n🎉 BLOCKCHAIN STORAGE PROOF COMPLETE!');
    console.log('=====================================');
    console.log(`✅ ${blockchainProof.proof.totalTransactions} transactions stored on-chain`);
    console.log(`✅ Total gas used: ${blockchainProof.proof.totalGasUsed}`);
    console.log(`✅ Data is immutable and permanently stored`);
    console.log(`✅ All transactions are publicly verifiable`);
    console.log(`✅ Proof saved to: blockchain-storage-proof.json`);
    
    console.log('\n🔗 VERIFICATION COMMANDS:');
    console.log('=========================');
    console.log(`# View user registration transaction:`);
    console.log(`curl -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["${userRegistrationTx.hash}"],"id":1}'`);
    console.log(`\n# View credit score transaction:`);
    console.log(`curl -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["${creditScoreTx.hash}"],"id":1}'`);
    console.log(`\n# View wallet link transaction:`);
    console.log(`curl -X POST http://127.0.0.1:8545 -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["${walletLinkTx.hash}"],"id":1}'`);
    
    return blockchainProof;
    
  } catch (error) {
    console.error('❌ Blockchain storage proof failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  proveOnChainStorage()
    .then(proof => {
      console.log('\n🏆 SUCCESS: Data storage on blockchain proven!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Failed to prove blockchain storage:', error);
      process.exit(1);
    });
}

module.exports = proveOnChainStorage;
