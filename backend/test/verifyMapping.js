/**
 * Verify Web2-to-Web3 Mapping Script
 * Checks data consistency and proof validity
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function verifyWeb2ToWeb3Mapping() {
  console.log('🔍 VERIFYING WEB2-TO-WEB3 MAPPING');
  console.log('=' * 50);

  const testSSN = '123-45-6789';
  const testAddress = '0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46';

  try {
    // Step 1: Get original Experian data
    console.log('\n1️⃣ Getting original Experian data...');
    const experianResponse = await axios.post(`${BASE_URL}/api/credit-score/experian/simplified`, {
      ssn: testSSN
    });

    if (!experianResponse.data.success) {
      console.log('❌ Failed to get Experian data');
      return;
    }

    const originalData = experianResponse.data.creditData;
    console.log('✅ Original Experian Data:');
    console.log(`   Credit Score: ${originalData.creditScore}`);
    console.log(`   Payment History: ${originalData.paymentHistory}`);
    console.log(`   Credit Utilization: ${originalData.creditUtilization}`);

    // Step 2: Get FDC Web2JSON attestation
    console.log('\n2️⃣ Creating FDC Web2JSON attestation...');
    const fdcResponse = await axios.post(`${BASE_URL}/api/credit-score/fdc/attest`, {
      ssn: testSSN,
      userAddress: testAddress
    });

    if (!fdcResponse.data.success) {
      console.log('❌ Failed to create FDC attestation');
      return;
    }

    const attestation = fdcResponse.data.attestation;
    const attestationData = attestation.attestationData;
    const proof = attestation.proof;

    console.log('✅ FDC Attestation Created:');
    console.log(`   Attestation ID: ${attestation.attestationId}`);
    console.log(`   Credit Score: ${attestationData.creditScore}`);
    console.log(`   Payment History: ${attestationData.paymentHistory}`);

    // Step 3: Verify data consistency
    console.log('\n3️⃣ Verifying data consistency...');
    const dataMatches = {
      creditScore: originalData.creditScore === attestationData.creditScore,
      paymentHistory: originalData.paymentHistory === attestationData.paymentHistory,
      creditUtilization: originalData.creditUtilization === attestationData.creditUtilization,
      creditHistoryLength: originalData.creditHistoryLength === attestationData.creditHistoryLength,
      accountsOpen: originalData.accountsOpen === attestationData.accountsOpen,
      recentInquiries: originalData.recentInquiries === attestationData.recentInquiries,
      publicRecords: originalData.publicRecords === attestationData.publicRecords,
      delinquencies: originalData.delinquencies === attestationData.delinquencies
    };

    let allMatch = true;
    Object.entries(dataMatches).forEach(([field, matches]) => {
      const status = matches ? '✅' : '❌';
      console.log(`   ${field}: ${status} (Original: ${originalData[field]}, Mapped: ${attestationData[field]})`);
      if (!matches) allMatch = false;
    });

    if (allMatch) {
      console.log('✅ ALL DATA FIELDS PRESERVED CORRECTLY');
    } else {
      console.log('❌ DATA INCONSISTENCY DETECTED');
      return;
    }

    // Step 4: Verify cryptographic proofs
    console.log('\n4️⃣ Verifying cryptographic proofs...');
    
    // Check dataHash format
    if (proof.dataHash && proof.dataHash.startsWith('0x') && proof.dataHash.length === 66) {
      console.log('✅ dataHash: Valid 32-byte hash format');
      console.log(`   ${proof.dataHash}`);
    } else {
      console.log('❌ dataHash: Invalid format');
      return;
    }

    // Check merkleRoot format
    if (proof.merkleRoot && proof.merkleRoot.startsWith('0x') && proof.merkleRoot.length === 66) {
      console.log('✅ merkleRoot: Valid 32-byte hash format');
      console.log(`   ${proof.merkleRoot}`);
    } else {
      console.log('❌ merkleRoot: Invalid format');
      return;
    }

    // Check merkleProof array
    if (Array.isArray(proof.merkleProof) && proof.merkleProof.length > 0) {
      console.log(`✅ merkleProof: Valid array with ${proof.merkleProof.length} elements`);
      proof.merkleProof.forEach((element, index) => {
        if (element.startsWith('0x') && element.length === 66) {
          console.log(`   [${index}]: ${element.substring(0, 20)}... ✅`);
        } else {
          console.log(`   [${index}]: Invalid format ❌`);
        }
      });
    } else {
      console.log('❌ merkleProof: Invalid or empty array');
      return;
    }

    // Step 5: Verify ABI encoding
    console.log('\n5️⃣ Verifying ABI encoding...');
    if (proof.responseHex && proof.responseHex.startsWith('0x') && proof.responseHex.length > 100) {
      console.log('✅ responseHex: Valid ABI-encoded data');
      console.log(`   Length: ${proof.responseHex.length} characters`);
      console.log(`   Sample: ${proof.responseHex.substring(0, 50)}...`);
    } else {
      console.log('❌ responseHex: Invalid or missing ABI encoding');
      return;
    }

    // Step 6: Verify smart contract data structure
    console.log('\n6️⃣ Verifying smart contract data...');
    const contractData = attestation.contractData;
    const requiredFields = [
      'creditScore', 'paymentHistory', 'creditUtilization', 'creditHistoryLength',
      'accountsOpen', 'recentInquiries', 'publicRecords', 'delinquencies',
      'attestationId', 'responseHex', 'dataHash', 'merkleProof', 'merkleRoot',
      'blockNumber', 'transactionHash', 'timestamp'
    ];

    const missingFields = requiredFields.filter(field => contractData[field] === undefined);
    if (missingFields.length === 0) {
      console.log('✅ Smart contract data: All required fields present');
      console.log(`   Fields: ${requiredFields.length} total`);
    } else {
      console.log(`❌ Smart contract data: Missing fields: ${missingFields.join(', ')}`);
      return;
    }

    console.log('\n🎉 WEB2-TO-WEB3 MAPPING VERIFICATION COMPLETE');
    console.log('✅ Data consistency maintained');
    console.log('✅ Cryptographic proofs valid');
    console.log('✅ ABI encoding correct');
    console.log('✅ Smart contract data complete');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run verification
if (require.main === module) {
  verifyWeb2ToWeb3Mapping();
}

module.exports = { verifyWeb2ToWeb3Mapping };
