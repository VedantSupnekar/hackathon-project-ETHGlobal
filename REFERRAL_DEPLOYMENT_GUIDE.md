# 🚀 Referral System Deployment Guide

## Quick Setup (3 Steps)

### 1. Deploy the Contract

```bash
# Start Hardhat node (Terminal 1)
npx hardhat node

# Deploy contract (Terminal 2)
node scripts/deployReferralContract.js
```

The deployment script will output something like:
```
✅ ReferralCreditNetwork deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📋 Environment Variables to Update:
Add these to your .env file:
REFERRAL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 2. Configure Environment Variables

Create/update `.env.local` in the frontend directory:

```bash
# Frontend environment (.env.local)
NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

Create/update `.env` in the backend directory:

```bash
# Backend environment (.env)
REFERRAL_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 3. Start Services

```bash
# Start backend (Terminal 3)
cd backend && npm start

# Start frontend (Terminal 4)
cd frontend && npm run dev
```

## ✅ Testing the System

### Automated Test

```bash
# Run comprehensive test suite
node test-referral-system.js
```

### Manual Testing

1. **Open Frontend**: http://localhost:3000
2. **Login/Register** a user account
3. **Connect MetaMask** to localhost:8545
4. **Open Referral Network** from dashboard
5. **Create Referral Request** using an email
6. **Check Blockchain Connection** status in top-right

## 🔧 Troubleshooting

### "Contract Not Deployed" Error
- Check if `NEXT_PUBLIC_REFERRAL_CONTRACT_ADDRESS` is set in frontend `.env.local`
- Restart the frontend after setting environment variables

### "Failed to create referral request" Error
- Ensure MetaMask is connected to localhost:8545
- Check that you have test ETH in your MetaMask account
- Verify the contract address is correct in environment variables

### "Blockchain Disconnected" Status
- Check MetaMask connection
- Ensure Hardhat node is running on port 8545
- Verify RPC URL in environment variables

### Transaction Rejected
- This is normal - user rejected the MetaMask transaction
- Try again and approve the transaction in MetaMask

## 🌐 Network Configuration

### Hardhat Local Network
- **Network Name**: Hardhat Local
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency**: ETH

### MetaMask Setup
1. Add Hardhat network to MetaMask
2. Import test accounts using private keys from Hardhat
3. Ensure you have test ETH for transactions

## 📝 Contract Functions

The frontend now calls these functions directly on the blockchain:

```solidity
// Read-only functions (no gas cost)
- getPendingReferralRequest(email)
- getUserProfile(web3Id)
- getNetworkStats()
- canBeReferred(email)

// Transaction functions (require gas)
- createReferralRequest(referrerWeb3Id, refereeEmail)
- acceptReferralRequest(requestId, refereeWeb3Id, walletAddress)
- rejectReferralRequest(requestId, refereeEmail)
```

## 🎯 Success Indicators

You'll know the system is working when:

- ✅ Green "Connected to Blockchain" status
- ✅ Contract address visible in UI
- ✅ MetaMask prompts for transactions
- ✅ Transaction confirmations in console
- ✅ Real-time UI updates after transactions

## 🔗 Integration Points

The referral system is now:
- **Fully Decentralized** - No API calls, direct blockchain interaction
- **MetaMask Integrated** - Uses user's wallet for transactions
- **Real-time** - Updates immediately after blockchain confirmations
- **Transparent** - All operations visible on-chain

---

## 🎉 You're Ready!

The referral system now operates completely on-chain. Users can:
1. Send referral invitations (blockchain transaction)
2. Accept/reject referrals (blockchain transaction)  
3. View their referral network (blockchain queries)
4. Earn rewards automatically when referees improve credit

No APIs required - everything happens directly on the blockchain! 🚀
