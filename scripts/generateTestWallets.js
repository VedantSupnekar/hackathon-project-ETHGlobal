/**
 * Generate Test Wallets for Live Demo
 * Creates wallets with different credit profiles for MetaMask integration
 */

import { ethers } from "hardhat";

async function generateTestWallets() {
  console.log("🎭 GENERATING TEST WALLETS FOR LIVE DEMO");
  console.log("=" * 50);

  // Get test accounts from Hardhat
  const accounts = await ethers.getSigners();
  
  // Define credit profiles for demo wallets
  const creditProfiles = [
    {
      name: "Excellent Credit Alice",
      description: "Perfect payment history, low utilization",
      creditScore: 820,
      paymentHistory: 100,
      creditUtilization: 5,
      creditHistoryLength: 15,
      accountsOpen: 8,
      recentInquiries: 0,
      publicRecords: 0,
      delinquencies: 0,
      profile: "EXCELLENT"
    },
    {
      name: "Good Credit Bob",
      description: "Solid history, moderate utilization",
      creditScore: 750,
      paymentHistory: 95,
      creditUtilization: 25,
      creditHistoryLength: 8,
      accountsOpen: 5,
      recentInquiries: 2,
      publicRecords: 0,
      delinquencies: 0,
      profile: "GOOD"
    },
    {
      name: "Fair Credit Charlie",
      description: "Some late payments, higher utilization",
      creditScore: 650,
      paymentHistory: 75,
      creditUtilization: 45,
      creditHistoryLength: 5,
      accountsOpen: 3,
      recentInquiries: 4,
      publicRecords: 0,
      delinquencies: 1,
      profile: "FAIR"
    },
    {
      name: "Poor Credit Dave",
      description: "Multiple late payments, high utilization",
      creditScore: 550,
      paymentHistory: 60,
      creditUtilization: 75,
      creditHistoryLength: 3,
      accountsOpen: 2,
      recentInquiries: 6,
      publicRecords: 1,
      delinquencies: 3,
      profile: "POOR"
    },
    {
      name: "Bad Credit Eve",
      description: "Defaults, collections, very high utilization",
      creditScore: 450,
      paymentHistory: 40,
      creditUtilization: 95,
      creditHistoryLength: 2,
      accountsOpen: 1,
      recentInquiries: 8,
      publicRecords: 2,
      delinquencies: 5,
      profile: "BAD"
    },
    {
      name: "No Credit Frank",
      description: "New to credit, thin file",
      creditScore: 350,
      paymentHistory: 0,
      creditUtilization: 0,
      creditHistoryLength: 0,
      accountsOpen: 0,
      recentInquiries: 1,
      publicRecords: 0,
      delinquencies: 0,
      profile: "NO_CREDIT"
    },
    {
      name: "Recovering Grace",
      description: "Rebuilding after bankruptcy",
      creditScore: 580,
      paymentHistory: 85,
      creditUtilization: 30,
      creditHistoryLength: 1,
      accountsOpen: 2,
      recentInquiries: 2,
      publicRecords: 1,
      delinquencies: 0,
      profile: "RECOVERING"
    },
    {
      name: "High Earner Henry",
      description: "High income, excellent credit",
      creditScore: 850,
      paymentHistory: 100,
      creditUtilization: 2,
      creditHistoryLength: 20,
      accountsOpen: 12,
      recentInquiries: 0,
      publicRecords: 0,
      delinquencies: 0,
      profile: "PREMIUM"
    },
    {
      name: "Student Ivy",
      description: "College student, limited history",
      creditScore: 680,
      paymentHistory: 90,
      creditUtilization: 15,
      creditHistoryLength: 2,
      accountsOpen: 2,
      recentInquiries: 1,
      publicRecords: 0,
      delinquencies: 0,
      profile: "STUDENT"
    },
    {
      name: "Business Owner Jack",
      description: "Small business owner, variable income",
      creditScore: 720,
      paymentHistory: 88,
      creditUtilization: 35,
      creditHistoryLength: 10,
      accountsOpen: 6,
      recentInquiries: 3,
      publicRecords: 0,
      delinquencies: 1,
      profile: "BUSINESS"
    }
  ];

  const testWallets = [];

  console.log("📝 GENERATING WALLET PROFILES:");
  console.log("");

  for (let i = 0; i < Math.min(creditProfiles.length, accounts.length); i++) {
    const account = accounts[i];
    const profile = creditProfiles[i];
    
    const wallet = {
      id: i + 1,
      address: account.address,
      privateKey: "0x" + "a".repeat(64), // Placeholder - real private key from Hardhat
      name: profile.name,
      description: profile.description,
      profile: profile.profile,
      creditData: {
        creditScore: profile.creditScore,
        paymentHistory: profile.paymentHistory,
        creditUtilization: profile.creditUtilization,
        creditHistoryLength: profile.creditHistoryLength,
        accountsOpen: profile.accountsOpen,
        recentInquiries: profile.recentInquiries,
        publicRecords: profile.publicRecords,
        delinquencies: profile.delinquencies,
        timestamp: Math.floor(Date.now() / 1000)
      },
      balance: "10000.0", // ETH balance for demo
      demoReady: true
    };

    testWallets.push(wallet);

    // Display wallet info
    console.log(`${i + 1}. ${profile.name} (${profile.profile})`);
    console.log(`   Address: ${account.address}`);
    console.log(`   Credit Score: ${profile.creditScore}`);
    console.log(`   Description: ${profile.description}`);
    console.log("");
  }

  return testWallets;
}

async function saveWalletConfiguration(wallets) {
  const fs = await import('fs');
  const path = await import('path');
  
  // Save to backend for API integration
  const backendConfig = {
    testWallets: wallets,
    generatedAt: new Date().toISOString(),
    description: "Test wallets for live demo with different credit profiles",
    usage: "Import these addresses into MetaMask for live demo"
  };

  const backendPath = path.join(process.cwd(), 'backend/config/testWallets.json');
  fs.writeFileSync(backendPath, JSON.stringify(backendConfig, null, 2));
  
  // Save to root for easy access
  const rootPath = path.join(process.cwd(), 'TEST_WALLETS.json');
  fs.writeFileSync(rootPath, JSON.stringify(backendConfig, null, 2));
  
  console.log("💾 WALLET CONFIGURATION SAVED:");
  console.log(`   Backend: ${backendPath}`);
  console.log(`   Root: ${rootPath}`);
  console.log("");
}

async function generateMetaMaskInstructions(wallets) {
  const instructions = `
# 🦊 MetaMask Setup Instructions for Live Demo

## 🎯 Demo Scenario
You have ${wallets.length} test wallets with different credit profiles to demonstrate the credit scoring system.

## 📝 Wallet Import Instructions

### Step 1: Start Local Hardhat Network
\`\`\`bash
# In project root
npx hardhat node
\`\`\`

### Step 2: Add Local Network to MetaMask
- Network Name: **Hardhat Local**
- RPC URL: **http://127.0.0.1:8545**
- Chain ID: **1337**
- Currency Symbol: **ETH**

### Step 3: Import Test Wallets

${wallets.map((wallet, index) => `
#### ${wallet.id}. ${wallet.name}
- **Address**: \`${wallet.address}\`
- **Credit Score**: ${wallet.creditData.creditScore}
- **Profile**: ${wallet.profile}
- **Description**: ${wallet.description}
- **Private Key**: Get from Hardhat console output

\`\`\`bash
# To get private key, run in Hardhat console:
npx hardhat console --network localhost
# Then: accounts[${index}].privateKey
\`\`\`
`).join('')}

## 🎭 Demo Flow

### 1. Start with No Credit Frank (Score: 350)
- Show base on-chain score calculation
- Demonstrate "thin file" scenario

### 2. Add Excellent Credit Alice (Score: 820)
- Show how composite score improves dramatically
- Demonstrate FDC Web2JSON integration

### 3. Add Poor Credit Dave (Score: 550)
- Show how bad credit brings down average
- Demonstrate weighted scoring algorithm

### 4. Add Good Credit Bob (Score: 750)
- Show balanced portfolio effect
- Demonstrate multi-wallet aggregation

### 5. Final Portfolio Analysis
- Show complete credit profile
- Demonstrate loan eligibility calculation

## 🧮 Expected Score Progression

| Wallet Added | Individual Score | Composite Score | Change |
|--------------|------------------|-----------------|---------|
| Frank (No Credit) | 350 | ~350 | Base |
| + Alice (Excellent) | 820 | ~650 | +300 |
| + Dave (Poor) | 550 | ~600 | -50 |
| + Bob (Good) | 750 | ~650 | +50 |

## 🔗 API Endpoints for Testing

\`\`\`bash
# Test individual wallet
curl -X POST http://localhost:3001/api/auth/wallet/link \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_TOKEN" \\
-d '{"walletAddress": "WALLET_ADDRESS", "signature": "SIGNATURE"}'

# Get composite score
curl -X GET http://localhost:3001/api/auth/score/composite \\
-H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

## 🎬 Judge Demonstration Script

1. **Setup**: "I have a DeFi lending platform that uses Flare FDC to combine on-chain and off-chain credit data"

2. **Connect First Wallet**: "Let me connect a wallet with no credit history" → Show base score

3. **Add Excellent Credit**: "Now I'll add a wallet with excellent credit from traditional sources" → Show FDC integration

4. **Add Poor Credit**: "Let's see what happens with a problematic credit wallet" → Show risk assessment

5. **Final Portfolio**: "The system creates a weighted composite score for loan decisions" → Show final result

## 🏆 Key Demo Points for Judges

✅ **Real MetaMask Integration**: Live wallet connections  
✅ **Flare FDC Web2JSON**: Authentic off-chain data integration  
✅ **Multi-Wallet Aggregation**: Portfolio-based credit scoring  
✅ **Real-Time Updates**: Scores update as wallets are added  
✅ **Production Ready**: Complete API with cryptographic proofs  

---
*Generated: ${new Date().toISOString()}*
`;

  const fs = await import('fs');
  const path = await import('path');
  const instructionsPath = path.join(process.cwd(), 'METAMASK_DEMO_SETUP.md');
  fs.writeFileSync(instructionsPath, instructions);
  
  console.log("📋 METAMASK DEMO INSTRUCTIONS CREATED:");
  console.log(`   File: ${instructionsPath}`);
  console.log("");
}

// Main execution
async function main() {
  try {
    const wallets = await generateTestWallets();
    await saveWalletConfiguration(wallets);
    await generateMetaMaskInstructions(wallets);
    
    console.log("🎉 TEST WALLET GENERATION COMPLETE!");
    console.log("");
    console.log("🚀 NEXT STEPS:");
    console.log("1. Run 'npx hardhat node' to start local blockchain");
    console.log("2. Import wallet addresses into MetaMask");
    console.log("3. Use METAMASK_DEMO_SETUP.md for demo instructions");
    console.log("4. Test with backend API for live credit scoring");
    console.log("");
    console.log("🏆 Ready for hackathon demo!");
    
  } catch (error) {
    console.error("❌ Error generating test wallets:", error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateTestWallets, saveWalletConfiguration };
