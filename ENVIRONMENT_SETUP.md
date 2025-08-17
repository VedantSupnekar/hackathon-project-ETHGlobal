# 🔧 Environment Variables Setup

## ✅ Contract Successfully Deployed!

**Contract Address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
**Owner:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

## 📝 Step 2: Set Environment Variables

### Frontend Environment (`frontend/.env.local`)
Create this file and add:

```bash
# Referral System Configuration
NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545

# Backend API Configuration  
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Backend Environment (`backend/.env`)
Create this file and add:

```bash
# Referral System Configuration
REFERRAL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REFERRAL_CONTRACT_OWNER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Backend Configuration
PORT=5000
NODE_ENV=development
```

## 🚀 Step 3: Start Services

```bash
# Terminal 1: Hardhat node is already running ✅

# Terminal 2: Start backend
cd backend && npm start

# Terminal 3: Start frontend  
cd frontend && npm run dev
```

## 🦊 Step 4: Configure MetaMask

### Add Hardhat Network:
- **Network Name:** Hardhat Local
- **RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337`
- **Currency:** ETH

### Import Test Account:
- **Private Key:** `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Address:** `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Balance:** 10,000 ETH

## ✅ Step 5: Test the System

1. Open frontend: http://localhost:3000
2. Login/register a user
3. Connect MetaMask to Hardhat network
4. Open "Referral Network" from dashboard
5. Check for green "Connected to Blockchain" status
6. Create a referral request with an email
7. Approve the MetaMask transaction

## 🎯 Success Indicators

You'll know it's working when:
- ✅ Green "Connected to Blockchain" status in referral UI
- ✅ Contract address visible: `0x5FbD...0aa3`
- ✅ MetaMask prompts for transaction approval
- ✅ Console shows transaction confirmations
- ✅ UI updates after blockchain confirmations

## 🔧 Troubleshooting

### "Contract Not Deployed" Error
- Verify `NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS` is set in `frontend/.env.local`
- Restart frontend after setting environment variables

### "Blockchain Disconnected" Status
- Check MetaMask is connected to localhost:8545
- Verify Hardhat node is running
- Ensure contract address is correct

### Transaction Failures
- Make sure you have test ETH in MetaMask
- Check you're connected to the right network (Chain ID: 31337)
- Verify the contract address matches deployment

---

## 🎉 Ready to Test!

The referral system is now **fully deployed and configured** for on-chain operation!

All referral requests, acceptances, and rejections will be **real blockchain transactions** through MetaMask. 🚀
