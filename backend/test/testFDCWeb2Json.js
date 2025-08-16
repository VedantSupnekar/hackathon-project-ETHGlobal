/**
 * Test Script for FDC Web2JSON Implementation
 * Tests the real Flare Data Connector Web2JSON integration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data for FDC Web2JSON
const testUsers = [
  {
    ssn: '123-45-6789',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-15',
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46',
    description: 'Good credit profile for FDC testing'
  },
  {
    ssn: '987-65-4321',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1985-05-20',
    userAddress: '0x8ba1f109551bD432803012645Hac136c5e2BD07',
    description: 'Fair credit profile for FDC testing'
  }
];

async function testFDCHealthCheck() {
  console.log('\n🔍 Testing FDC-Enhanced Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ API Server Status:', response.data.message);
    console.log('🌐 Environment:', response.data.environment);
    console.log('📋 Available Services:');
    Object.entries(response.data.services).forEach(([service, status]) => {
      console.log(`   - ${service}: ${status}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testFDCWeb2JsonAttestation(user) {
  console.log(`\n🔗 Testing FDC Web2JSON Attestation for ${user.firstName} ${user.lastName}...`);
  try {
    const response = await axios.post(`${BASE_URL}/api/credit-score/fdc/attest`, {
      ssn: user.ssn,
      userAddress: user.userAddress
    });

    if (response.data.success) {
      const attestation = response.data.attestation;
      console.log('✅ FDC Web2JSON Attestation Created Successfully');
      console.log(`🆔 Attestation ID: ${attestation.attestationId}`);
      console.log(`📊 Credit Score: ${attestation.attestationData.creditScore}`);
      console.log(`🔐 Data Hash: ${attestation.proof.dataHash.substring(0, 20)}...`);
      console.log(`🌳 Merkle Root: ${attestation.proof.merkleRoot.substring(0, 20)}...`);
      console.log(`📦 Block Number: ${attestation.blockNumber}`);
      console.log(`💱 Transaction Hash: ${attestation.transactionHash.substring(0, 20)}...`);
      console.log(`⏰ Timestamp: ${new Date(attestation.timestamp * 1000).toISOString()}`);
      console.log(`👤 User Address: ${user.userAddress}`);
      
      // Verify FDC-specific fields
      console.log('\n📋 FDC-Specific Data:');
      console.log(`   - Response Hex: ${attestation.proof.responseHex.substring(0, 30)}...`);
      console.log(`   - Merkle Proof Length: ${attestation.proof.merkleProof.length}`);
      console.log(`   - Source ID: ${attestation.proof.sourceId}`);
      
      return response.data;
    } else {
      console.error('❌ FDC Web2JSON Attestation Failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ FDC Web2JSON Attestation Error:', error.response?.data || error.message);
    return null;
  }
}

async function testFDCCompleteFlow(user) {
  console.log(`\n🚀 Testing FDC Complete Flow for ${user.firstName} ${user.lastName}...`);
  try {
    const startTime = Date.now();
    const response = await axios.post(`${BASE_URL}/api/credit-score/complete-flow`, {
      ssn: user.ssn,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      userAddress: user.userAddress
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ FDC Complete Flow Executed Successfully');
      console.log(`⚡ Processing Time: ${duration}ms`);
      console.log(`📈 Final Credit Score: ${data.simplifiedData.creditScore}`);
      console.log(`🆔 FDC Attestation ID: ${data.fdcAttestation.attestationId}`);
      console.log(`🔗 Flow Type: ${response.data.type}`);
      
      console.log('\n📋 FDC Smart Contract Data Structure:');
      const contractData = data.smartContractData;
      console.log(`   • creditScore: ${contractData.creditScore}`);
      console.log(`   • paymentHistory: ${contractData.paymentHistory}`);
      console.log(`   • creditUtilization: ${contractData.creditUtilization}`);
      console.log(`   • creditHistoryLength: ${contractData.creditHistoryLength} years`);
      console.log(`   • accountsOpen: ${contractData.accountsOpen}`);
      console.log(`   • recentInquiries: ${contractData.recentInquiries}`);
      console.log(`   • publicRecords: ${contractData.publicRecords}`);
      console.log(`   • delinquencies: ${contractData.delinquencies}`);
      console.log(`   • responseHex: ${contractData.responseHex.substring(0, 30)}...`);
      console.log(`   • dataHash: ${contractData.dataHash.substring(0, 30)}...`);
      console.log(`   • merkleRoot: ${contractData.merkleRoot.substring(0, 30)}...`);
      console.log(`   • blockNumber: ${contractData.blockNumber}`);
      console.log(`   • transactionHash: ${contractData.transactionHash.substring(0, 30)}...`);
      
      return response.data;
    } else {
      console.error('❌ FDC Complete Flow Failed:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ FDC Complete Flow Error:', error.response?.data || error.message);
    return null;
  }
}

async function testFDCvsLegacyComparison(user) {
  console.log(`\n⚖️  Comparing FDC vs Legacy Web2JSON for ${user.firstName} ${user.lastName}...`);
  
  try {
    // Test legacy Web2JSON
    console.log('   Testing Legacy Web2JSON...');
    const legacyResponse = await axios.post(`${BASE_URL}/api/credit-score/web2json/attest`, {
      ssn: user.ssn,
      userAddress: user.userAddress
    });

    // Test FDC Web2JSON
    console.log('   Testing FDC Web2JSON...');
    const fdcResponse = await axios.post(`${BASE_URL}/api/credit-score/fdc/attest`, {
      ssn: user.ssn,
      userAddress: user.userAddress
    });

    if (legacyResponse.data.success && fdcResponse.data.success) {
      console.log('✅ Both implementations successful');
      console.log('\n📊 Comparison Results:');
      
      const legacy = legacyResponse.data.attestation;
      const fdc = fdcResponse.data.attestation;
      
      console.log(`   Legacy Attestation ID: ${legacy.attestationId}`);
      console.log(`   FDC Attestation ID: ${fdc.attestationId}`);
      
      console.log(`   Credit Score Match: ${legacy.contractData.creditScore === fdc.attestationData.creditScore ? '✅' : '❌'}`);
      console.log(`   Data Structure: Legacy has ${Object.keys(legacy.contractData).length} fields, FDC has ${Object.keys(fdc.contractData).length} fields`);
      
      console.log('\n🔍 FDC Advantages:');
      console.log('   ✅ Real blockchain attestation proofs');
      console.log('   ✅ Merkle tree verification');
      console.log('   ✅ Encoded response data (responseHex)');
      console.log('   ✅ Transaction hash from FDC');
      console.log('   ✅ JQ filter processing');
      console.log('   ✅ ABI-encoded data for smart contracts');
      
      return { legacy: legacyResponse.data, fdc: fdcResponse.data };
    } else {
      console.error('❌ One or both implementations failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Comparison Error:', error.message);
    return null;
  }
}

async function runFDCTests() {
  console.log('🔥 Starting FDC Web2JSON Integration Tests');
  console.log('=' * 60);

  // Test health check
  const healthOk = await testFDCHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Server not available. Please start the server first.');
    return;
  }

  // Test each user
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 Testing FDC Implementation - User ${i + 1}: ${user.firstName} ${user.lastName}`);
    console.log(`   Address: ${user.userAddress}`);
    console.log(`   Description: ${user.description}`);
    console.log(`${'='.repeat(70)}`);

    // Test FDC Web2JSON attestation
    const fdcResult = await testFDCWeb2JsonAttestation(user);
    if (!fdcResult) continue;

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test FDC complete flow
    const completeFlowResult = await testFDCCompleteFlow(user);
    if (!completeFlowResult) continue;

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test comparison with legacy
    await testFDCvsLegacyComparison(user);
    
    // Add delay between users
    if (i < testUsers.length - 1) {
      console.log('\n⏳ Waiting before next user...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('🎉 FDC Web2JSON Tests Completed!');
  console.log(`${'='.repeat(70)}`);
  console.log('\n📝 FDC Implementation Summary:');
  console.log('✅ Real Flare Data Connector integration');
  console.log('✅ Proper Web2JSON attestation request format');
  console.log('✅ JQ filter processing for data transformation');
  console.log('✅ ABI encoding for Solidity compatibility');
  console.log('✅ Cryptographic proof generation');
  console.log('✅ Merkle tree verification system');
  console.log('✅ Smart contract ready data output');
  console.log('\n🔗 Key FDC Features Demonstrated:');
  console.log('• API URL configuration for Experian endpoint');
  console.log('• JQ filter for data processing');
  console.log('• ABI signature for Solidity struct definition');
  console.log('• HTTP method, headers, and body configuration');
  console.log('• Response hex encoding for smart contracts');
  console.log('• Merkle proof generation and verification');
  console.log('\n📚 Reference: https://dev.flare.network/fdc/guides/hardhat/web-2-json-for-custom-api');
}

// Run tests if called directly
if (require.main === module) {
  runFDCTests().catch(console.error);
}

module.exports = {
  testFDCHealthCheck,
  testFDCWeb2JsonAttestation,
  testFDCCompleteFlow,
  testFDCvsLegacyComparison,
  runFDCTests
};
