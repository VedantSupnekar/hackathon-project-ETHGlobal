# Comprehensive Testing Guide

## 🎯 Pre-Frontend Validation Checklist

This guide will help you verify that all core systems are working correctly before building the referral system and frontend.

## 1. 🏦 Mock Experian API Testing

### Test 1.1: Basic Credit Report Generation
```bash
curl -X POST http://localhost:3001/api/credit-score/experian/report \
-H "Content-Type: application/json" \
-d '{
  "ssn": "123-45-6789",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15"
}'
```

**Expected Response Structure:**
```json
{
  "success": true,
  "requestId": "338f2e0f-c7d0-44f1-a1dc-418d0d5c6a5e",
  "timestamp": "2025-08-16T12:21:07.355Z",
  "consumer": {
    "firstName": "John",
    "lastName": "Doe",
    "ssn": "123-45-6789",
    "dateOfBirth": "1990-01-15"
  },
  "creditReport": {
    "creditScore": {
      "value": 750,
      "model": "FICO Score 8",
      "range": "300-850"
    },
    "creditFactors": {
      "paymentHistory": {"score": 95, "weight": 35},
      "creditUtilization": {"score": 75, "utilization": 25, "weight": 30},
      "creditHistory": {"score": 40, "lengthInYears": 8, "weight": 15},
      "creditMix": {"score": 90, "accountsOpen": 5, "weight": 10},
      "newCredit": {"score": 80, "recentInquiries": 2, "weight": 10}
    },
    "publicRecords": {"bankruptcies": 0, "liens": 0, "judgments": 0},
    "delinquencies": {"thirtyDaysLate": 0, "sixtyDaysLate": 0, "ninetyDaysLate": 0},
    "accounts": [...],
    "inquiries": [...]
  }
}
```

### Test 1.2: Simplified Credit Data for Blockchain
```bash
curl -X POST http://localhost:3001/api/credit-score/experian/simplified \
-H "Content-Type: application/json" \
-d '{"ssn": "123-45-6789"}'
```

**Expected Response:**
```json
{
  "success": true,
  "creditData": {
    "creditScore": 750,
    "paymentHistory": 95,
    "creditUtilization": 25,
    "creditHistoryLength": 8,
    "accountsOpen": 5,
    "recentInquiries": 2,
    "publicRecords": 0,
    "delinquencies": 0,
    "timestamp": 1755346867355
  }
}
```

### Test 1.3: Available Mock Profiles
```bash
curl -X GET http://localhost:3001/api/credit-score/mock-data
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Available mock SSNs for testing",
  "mockProfiles": [
    {"ssn": "123-45-6789", "name": "John Doe", "creditScore": 750, "description": "Good credit profile"},
    {"ssn": "987-65-4321", "name": "Jane Smith", "creditScore": 620, "description": "Fair credit profile"},
    {"ssn": "555-12-3456", "name": "Bob Johnson", "creditScore": 800, "description": "Excellent credit profile"}
  ],
  "note": "Use any other SSN to generate random credit profile"
}
```

## 2. 🔗 Web2-to-Web3 Mapping Testing

### Test 2.1: FDC Web2JSON Attestation
```bash
curl -X POST http://localhost:3001/api/credit-score/fdc/attest \
-H "Content-Type: application/json" \
-d '{
  "ssn": "123-45-6789",
  "userAddress": "0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46"
}'
```

**Expected Response Structure:**
```json
{
  "success": true,
  "type": "FDC_WEB2JSON",
  "attestation": {
    "success": true,
    "attestationId": "fdc_web2json_1755348242021_vck1i1l9j",
    "attestationData": {
      "creditScore": 750,
      "paymentHistory": 95,
      "creditUtilization": 25,
      "creditHistoryLength": 8,
      "accountsOpen": 5,
      "recentInquiries": 2,
      "publicRecords": 0,
      "delinquencies": 0,
      "timestamp": 1755348242023
    },
    "proof": {
      "requestId": "fdc_web2json_1755348242021_vck1i1l9j",
      "sourceId": "EXPERIAN_CREDIT_SCORE",
      "responseHex": "0x00000000000000000000000000000000000000000000000000000000000002ee...",
      "dataHash": "0x68f15b0a7a78a9ce0f72cb2ee92e27d43bb8b70d8def64b6c65f12e17f71c47d",
      "merkleProof": ["0x2dd602a9bac8251029769748d793dc08bf2b30c90930c15c536404c95cd9e3c2", "..."],
      "merkleRoot": "0x5d83841e40152fd46fbf501020eb271a70f20a6bad34ea2eb39b6373b6820b74",
      "blockNumber": 5124148,
      "transactionHash": "0x1351a4671a59f7665e29a4aa8e9864397e5ea763cf8ed4aa40304eda7ecd252b",
      "timestamp": 1755348242
    },
    "contractData": {
      "creditScore": 750,
      "paymentHistory": 95,
      "creditUtilization": 25,
      "creditHistoryLength": 8,
      "accountsOpen": 5,
      "recentInquiries": 2,
      "publicRecords": 0,
      "delinquencies": 0,
      "attestationId": "fdc_web2json_1755348242021_vck1i1l9j",
      "responseHex": "0x00000000000000000000000000000000000000000000000000000000000002ee...",
      "dataHash": "0x68f15b0a7a78a9ce0f72cb2ee92e27d43bb8b70d8def64b6c65f12e17f71c47d",
      "merkleProof": ["0x2dd602a9bac8251029769748d793dc08bf2b30c90930c15c536404c95cd9e3c2", "..."],
      "merkleRoot": "0x5d83841e40152fd46fbf501020eb271a70f20a6bad34ea2eb39b6373b6820b74",
      "blockNumber": 5124148,
      "transactionHash": "0x1351a4671a59f7665e29a4aa8e9864397e5ea763cf8ed4aa40304eda7ecd252b",
      "timestamp": 1755348242023
    }
  }
}
```

### Test 2.2: Verify Data Mapping Integrity
**Key Validation Points:**
1. **Data Consistency**: `attestationData` matches original Experian response
2. **ABI Encoding**: `responseHex` contains properly encoded Solidity data
3. **Cryptographic Proofs**: `dataHash` and `merkleRoot` are valid 32-byte hashes
4. **Blockchain References**: `blockNumber` and `transactionHash` are present
5. **Smart Contract Ready**: `contractData` has all required fields

## 3. ⛓️ On-Chain Credit Score Testing

### Test 3.1: Register User and Create Wallet
```bash
# Step 1: Register user
curl -X POST http://localhost:3001/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "User",
  "ssn": "111-22-3333",
  "dateOfBirth": "1990-01-01"
}'
```

**Save the JWT token from response**

```bash
# Step 2: Create wallet
curl -X POST http://localhost:3001/api/auth/wallet/create \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "wallet": {
    "address": "0xF9a9614DDd8dD1BfBC85CcE5A55c85505d71399C",
    "publicKey": "0x033c08b2ad7eb019a1...",
    "mnemonic": "genius zoo rookie...",
    "isGenerated": true
  }
}
```

### Test 3.2: On-Chain Score Calculation
```bash
curl -X GET http://localhost:3001/api/auth/score/onchain \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "onChainScore": 647,
  "breakdown": {
    "walletsAnalyzed": 1,
    "hasOffChainData": false
  },
  "timestamp": 1755353320742
}
```

### Test 3.3: Link Existing Wallet (Higher Score)
```bash
curl -X POST http://localhost:3001/api/auth/wallet/link \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "walletAddress": "0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46",
  "signature": "mock_signature_for_verification_12345"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "wallet": {
    "address": "0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46",
    "isGenerated": false,
    "onChainScore": 650,
    "defiActivity": {
      "totalVolume": 25000,
      "protocolsUsed": ["Uniswap", "Aave", "Compound"],
      "liquidityProvided": 15000,
      "stakingHistory": [...]
    }
  }
}
```

## 4. 🎯 Composite Score Testing

### Test 4.1: Complete Flow with Both Scores
```bash
curl -X POST http://localhost:3001/api/credit-score/complete-flow \
-H "Content-Type: application/json" \
-d '{
  "ssn": "123-45-6789",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "userAddress": "0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46"
}'
```

**Expected Response:**
```json
{
  "success": true,
  "flow": "complete",
  "type": "FDC_WEB2JSON",
  "data": {
    "fullCreditReport": {...},
    "simplifiedData": {
      "creditScore": 750,
      "paymentHistory": 95,
      "creditUtilization": 25,
      "creditHistoryLength": 8,
      "accountsOpen": 5,
      "recentInquiries": 2,
      "publicRecords": 0,
      "delinquencies": 0
    },
    "fdcAttestation": {...},
    "smartContractData": {...}
  }
}
```

### Test 4.2: User Composite Score Calculation
```bash
curl -X GET http://localhost:3001/api/auth/score/composite \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "scores": {
    "onChain": 647,
    "offChain": 750,
    "composite": 719
  },
  "weights": {
    "onChain": 0.3,
    "offChain": 0.7
  },
  "breakdown": {
    "walletsAnalyzed": 1,
    "hasOffChainData": true
  },
  "timestamp": 1755353320770
}
```

### Test 4.3: Verify Score Calculation
**Manual Verification:**
```
Composite Score = (OnChain × 0.3) + (OffChain × 0.7)
719 = (647 × 0.3) + (750 × 0.7)
719 = 194.1 + 525
719 = 719.1 ≈ 719 ✅
```

## 5. 🧪 Automated Test Scripts

### Run Comprehensive Tests
```bash
# Test all systems
cd backend
node test/testAuthSystem.js

# Test FDC Web2JSON specifically
node test/testFDCWeb2Json.js

# Test legacy vs FDC comparison
node test/testFlow.js
```

## 6. 🔍 Data Integrity Validation

### Validate Web2-to-Web3 Mapping
```javascript
// Check that ABI-encoded data matches original
const originalData = {
  creditScore: 750,
  paymentHistory: 95,
  creditUtilization: 25,
  creditHistoryLength: 8,
  accountsOpen: 5,
  recentInquiries: 2,
  publicRecords: 0,
  delinquencies: 0,
  timestamp: 1755348242023
};

// Verify responseHex decodes to originalData
// This is automatically validated in the FDC service
```

### Validate On-Chain Score Components
```javascript
// Verify score calculation logic
const mockWalletData = {
  transactions: 150,        // 150 × 2 = 300 points (capped at 150)
  defiVolume: 25000,       // 25000 / 1000 = 25 points
  protocolsUsed: 3,        // 3 × 20 = 60 points
  liquidityProvided: 15000, // 15000 / 10000 = 1.5 points
  stakingPositions: 2      // 2 × 10 = 20 points
};

// Expected score: 300 (base) + 150 + 25 + 60 + 1 + 20 = 556
```

## 7. 📊 Expected Test Results Summary

### Mock API Responses ✅
- **Experian Mock**: Returns realistic credit reports with FICO scores
- **Profile Variations**: 3 predefined profiles + random generation
- **Data Structure**: Complete credit factors, accounts, inquiries

### Web2-to-Web3 Mapping ✅
- **FDC Integration**: Real Flare Data Connector implementation
- **ABI Encoding**: Proper Solidity data encoding in `responseHex`
- **Cryptographic Proofs**: Valid `dataHash`, `merkleRoot`, `merkleProof`
- **Smart Contract Ready**: All data formatted for blockchain consumption

### On-Chain Scoring ✅
- **New Wallets**: 300-500 range (base + minimal activity)
- **Active Wallets**: 500-750 range (base + significant DeFi activity)
- **Multi-Wallet**: Averaged across all linked wallets
- **Score Components**: Transaction, DeFi, protocol, liquidity, staking factors

### Composite Scoring ✅
- **Weighted Combination**: 70% off-chain + 30% on-chain
- **Fallback Logic**: 100% on-chain when off-chain unavailable
- **Score Range**: 300-850 (matching traditional credit range)
- **Real-time Updates**: Automatic recalculation when data changes

## 8. 🚨 What to Look For (Red Flags)

### API Issues
- ❌ Empty or null responses from mock APIs
- ❌ Inconsistent credit scores between calls
- ❌ Missing required fields in credit reports

### Mapping Issues  
- ❌ `responseHex` is empty or malformed
- ❌ `dataHash` doesn't match encoded data
- ❌ Missing `merkleProof` or `merkleRoot`
- ❌ `contractData` missing required fields

### Scoring Issues
- ❌ On-chain scores below 300 or above 850
- ❌ Composite scores not matching calculation formula
- ❌ Scores not updating when new data is added
- ❌ Multi-wallet scores not properly averaged

### Authentication Issues
- ❌ JWT tokens not working for protected endpoints
- ❌ Wallet creation/linking failures
- ❌ Score retrieval without proper authentication

## 9. 🎯 Quick Validation Checklist

Before proceeding to referrals and frontend:

- [ ] Mock Experian API returns consistent, realistic credit data
- [ ] FDC Web2JSON creates valid attestations with proper proofs
- [ ] On-chain scoring analyzes wallet activity correctly
- [ ] Composite scoring uses correct weights (70%/30%)
- [ ] User authentication and wallet management work end-to-end
- [ ] All test scripts pass without errors
- [ ] API responses match expected structures
- [ ] Score calculations are mathematically correct

Run these tests and let me know if you encounter any issues. Once all systems are validated, we can confidently move to implementing the referral system and building the frontend!
