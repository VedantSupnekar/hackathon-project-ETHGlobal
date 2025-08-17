# 🦊 MetaMask + Hardhat Integration Guide

## 🎯 **Complete Setup for Real Wallet Analysis**

This guide will set up a **complete local blockchain environment** with MetaMask integration for real wallet analysis instead of hardcoded demo data.

## 🚀 **Quick Start (3 Commands)**

### 1. **Start All Services**
```bash
npm run dev:full
```

This starts:
- 🔗 **Hardhat Network** (localhost:8545) - Local blockchain
- 🔧 **Backend API** (localhost:3001) - Real wallet analysis  
- 🎨 **Frontend** (localhost:3000) - MetaMask integration

### 2. **Configure MetaMask**
- Open MetaMask
- Add Custom Network:
  - **Network Name:** `Hardhat Local`
  - **RPC URL:** `http://127.0.0.1:8545`
  - **Chain ID:** `1337`
  - **Currency Symbol:** `ETH`

### 3. **Import Test Account**
Use any private key from Hardhat output (they all have 10,000 ETH):
```
Account #0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## 🔧 **Manual Setup (Step by Step)**

### **Step 1: Start Hardhat Network**
```bash
# Terminal 1 - Start local blockchain
npm run dev:hardhat

# Wait for this output:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### **Step 2: Start Backend**
```bash
# Terminal 2 - Start API server
npm run dev:backend

# Wait for:
# 🔗 Connected to network: unknown (Chain ID: 1337)
# 🚀 DeFi Lending Platform API Server Started
```

### **Step 3: Start Frontend**
```bash
# Terminal 3 - Start Next.js app
npm run dev:frontend

# Wait for:
# ✓ Ready on http://localhost:3000
```

## 🦊 **MetaMask Configuration**

### **Add Hardhat Network**
1. Open MetaMask
2. Click network dropdown (usually shows "Ethereum Mainnet")
3. Click "Add network"
4. Fill in:
   ```
   Network name: Hardhat Local
   New RPC URL: http://127.0.0.1:8545
   Chain ID: 1337
   Currency symbol: ETH
   Block explorer URL: (leave blank)
   ```
5. Click "Save"

### **Import Test Accounts**
Hardhat provides 20 accounts with 10,000 ETH each:

**Account #0 (Recommended for testing):**
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**Account #1:**
- Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

To import:
1. Click MetaMask menu → "Import Account"
2. Paste private key
3. Click "Import"

## 🎬 **Demo Flow with Real Wallet Analysis**

### **1. Connect MetaMask**
- Open http://localhost:3000
- Sign up/Login to your account
- Click "🦊 Connect MetaMask" in header
- Approve connection in MetaMask popup
- Switch to Hardhat network if prompted

### **2. Link Your Wallet**
- Click "🦊 Link MetaMask" button (appears after connection)
- Backend will analyze your wallet's:
  - ✅ **Balance** (ETH amount)
  - ✅ **Transaction Count** (nonce)
  - ✅ **Transaction History** (recent activity)
  - ✅ **Activity Patterns** (frequency, variety)
- **Real-time score calculation** based on actual data

### **3. Test Different Scenarios**
Create transactions to see score changes:

```bash
# Terminal 4 - Send test transactions
npx hardhat console --network localhost

# In Hardhat console:
const [owner, addr1] = await ethers.getSigners();
await owner.sendTransaction({to: addr1.address, value: ethers.utils.parseEther("1.0")});
```

### **4. Set Off-Chain Score**
- Click "Set Off-Chain Score"
- Use SSN: `111-11-1111` (demo data)
- Backend fetches via **Flare FDC Web2JSON**
- Composite score combines on-chain + off-chain

## 🔍 **Real Wallet Analysis Features**

### **What Gets Analyzed:**
- 💰 **Current Balance** → Balance Score (0-150 points)
- 📊 **Transaction Count** → Activity Score (0-100 points)  
- 🔄 **Recent Transactions** → Pattern Analysis (0-50 points)
- 🎯 **Transaction Variety** → Network Score (0-25 points)
- ⚠️ **Risk Factors** → Risk Penalty (0-30 points)

### **Score Calculation:**
```javascript
Base Score: 300
+ Balance Score (based on ETH amount)
+ Transaction Score (based on tx count & variety)  
+ Activity Score (based on recent activity)
+ Age Score (based on account age)
- Risk Penalty (suspicious patterns)
= Final Score (300-850)
```

### **Demo vs Real Analysis:**
- **Demo Wallets** (hardcoded): Use predefined scores
- **Your MetaMask Wallet**: Real-time blockchain analysis
- **New Addresses**: Dynamic score calculation

## 🐛 **Troubleshooting**

### **MetaMask Won't Connect**
```bash
# Reset MetaMask connection
# Settings → Advanced → Reset Account
```

### **Wrong Network**
- Check Chain ID is `1337`
- RPC URL is `http://127.0.0.1:8545`
- Try removing and re-adding network

### **Hardhat Network Down**
```bash
# Restart Hardhat
pkill -f "hardhat node"
npm run dev:hardhat
```

### **Backend Can't Connect to Hardhat**
Check backend logs for:
```
🔗 Connected to network: unknown (Chain ID: 1337)
```

If not connected, restart backend after Hardhat is running.

### **No Transactions Found**
- New wallets have no history → Lower scores
- Send some test transactions to increase score
- Demo wallets still work for comparison

## 🎯 **Production Considerations**

For hackathon judges and production:

1. **Real Networks**: Switch to Ethereum testnets (Goerli, Sepolia)
2. **Transaction History**: Use Etherscan API for full history
3. **DeFi Protocols**: Analyze specific protocol interactions
4. **Credit Factors**: Add more sophisticated scoring models

## ✅ **Verification Checklist**

- [ ] Hardhat network running on port 8545
- [ ] Backend connected to Hardhat (check logs)
- [ ] MetaMask configured for Hardhat network
- [ ] Test account imported with ETH balance
- [ ] Frontend loads at localhost:3000
- [ ] MetaMask connects successfully
- [ ] Wallet linking works and shows real balance
- [ ] Score updates based on actual wallet data

## 🏆 **You're Ready!**

Your **DeFi Multi-Wallet Credit Platform** now analyzes **real wallet data** instead of hardcoded scores!

- ✅ **Real MetaMask Integration**
- ✅ **Live Blockchain Analysis** 
- ✅ **Dynamic Score Calculation**
- ✅ **Production-Ready Architecture**

**Demo URL:** http://localhost:3000
**Test with confidence!** 🚀
