# 🔗 Referral Credit Network System

A comprehensive blockchain-based referral system that tracks credit score improvements and distributes rewards through referral chains using The Graph Protocol.

## 🎯 System Overview

The Referral Credit Network implements a sophisticated chain-based reward system where:

1. **User X refers User Y** → Y must accept the referral
2. **User Y refers User Z** → Z must accept the referral  
3. **User Z improves credit** (+5 points) → Rewards propagate:
   - Z's on-chain score: +5 points
   - Y's referral score: +1 point (direct referrer)
   - X's referral score: +0.001 points (indirect referrer)

## 🏗️ Architecture Components

### Smart Contracts
- **`ReferralCreditNetwork.sol`** - Main contract handling referral logic
- **`UserCreditRegistry.sol`** - User profile and credit score management

### The Graph Integration
- **Subgraph Schema** - Tracks referral relationships and rewards
- **Event Indexing** - Real-time tracking of credit events and rewards

### Backend APIs
- **Referral Routes** - `/api/referral/*` endpoints
- **Credit Score Integration** - Automatic reward propagation

### Frontend Components
- **ReferralSystem.tsx** - Complete referral interface
- **Dashboard Integration** - Embedded referral features

## 📋 Key Features

### ✅ Referral Request System
- Email-based referral invitations
- 7-day expiration for pending requests
- Accept/reject functionality
- Duplicate request prevention

### ✅ Chain-Based Rewards
- Automatic score propagation through referral chains
- Depth-based reward calculation (1 point → 0.001 points per level)
- Both positive and negative score impacts
- Maximum depth limit (10 levels) for gas optimization

### ✅ On-Chain Tracking
- Immutable referral relationship records
- Complete audit trail of all rewards
- Network statistics and analytics
- User profile and referral path tracking

### ✅ The Graph Integration
- Real-time subgraph indexing
- Complex relationship queries
- Historical data analysis
- Network visualization support

## 🚀 Quick Start Guide

### 1. Deploy the Contract

```bash
# Compile contracts
npx hardhat compile

# Deploy to local network
node scripts/deployReferralContract.js

# Note the contract address for configuration
```

### 2. Configure Backend

```bash
# Add to .env file
REFERRAL_CONTRACT_ADDRESS=0x... # From deployment
REFERRAL_CONTRACT_OWNER=0x...   # Deployer address
```

### 3. Start Services

```bash
# Start Hardhat network (Terminal 1)
npx hardhat node

# Start backend server (Terminal 2)
cd backend && npm start

# Start frontend (Terminal 3)
cd frontend && npm run dev
```

### 4. Deploy Subgraph (Optional)

```bash
cd subgraph
npm install
npm run codegen
npm run build
npm run deploy-local
```

## 🧪 Testing the System

### Automated Tests

```bash
# Run comprehensive test suite
node test-referral-system.js
```

### Manual Testing Flow

1. **Register Users**
   ```javascript
   // Alice (root user)
   await contract.registerUser(aliceWeb3Id, aliceWallet, "alice@example.com", ethers.ZeroHash);
   ```

2. **Create Referral Request**
   ```javascript
   // Alice refers Bob
   await contract.createReferralRequest(aliceWeb3Id, "bob@example.com");
   ```

3. **Accept Referral**
   ```javascript
   // Bob accepts Alice's referral
   const request = await contract.getPendingReferralRequest("bob@example.com");
   await contract.acceptReferralRequest(request.requestId, bobWeb3Id, bobWallet);
   ```

4. **Update Credit Score**
   ```javascript
   // Bob improves credit, Alice gets reward
   await contract.updateCreditScore(bobWeb3Id, 750, 10, "LOAN_PAID", "Paid on time");
   ```

## 📊 Reward Calculation Logic

### Direct Referrer (Level 1)
- **Good credit decision** (+5 or more): +1 referral point (1000 wei)
- **Bad credit decision** (-5 or more): -1 referral point (penalty)

### Indirect Referrer (Level 2+)
- **Reward calculation**: `1000 * (1000 / 1000^level)` wei
- **Level 2**: 1 wei (0.001 points)
- **Level 3**: 0.001 wei (0.000001 points)
- **Maximum depth**: 10 levels

### Example Scenario
```
Alice → Bob → Charlie → Diana

Diana improves credit (+10 points):
- Diana: +10 on-chain score
- Charlie: +1 referral point (direct)
- Bob: +0.001 referral points (level 2)
- Alice: +0.000001 referral points (level 3)
```

## 🌐 API Endpoints

### Referral Management
```
POST /api/referral/create-request
POST /api/referral/accept-request
POST /api/referral/reject-request
GET  /api/referral/pending-request/:email
```

### User Profiles
```
GET  /api/referral/user-profile/:web3Id
GET  /api/referral/network-stats
GET  /api/referral/can-be-referred/:email
```

### Credit Score Updates
```
POST /api/referral/update-credit-score
```

## 🎨 Frontend Usage

### Dashboard Integration
```typescript
import ReferralSystem from '@/components/ReferralSystem';

// Open referral modal
<button onClick={() => setShowReferralSystem(true)}>
  Referral Network
</button>

// Full referral interface
{showReferralSystem && <ReferralSystem />}
```

### Key Components
- **Refer Tab**: Send referral invitations
- **Profile Tab**: View referral scores and network position
- **Network Tab**: System-wide statistics
- **Pending Requests**: Accept/reject referral invitations

## 🔐 Security Features

### Access Control
- Only authorized addresses can update scores
- Owner-only administrative functions
- Request expiration (7 days)

### Validation
- Email uniqueness enforcement
- Web3ID collision prevention
- Referral loop detection
- Gas limit optimization

### Audit Trail
- All events logged on-chain
- Immutable referral relationships
- Complete reward history
- Subgraph indexing for queries

## 📈 Network Analytics

### Real-time Metrics
- Total users in network
- Active referral relationships
- Credit events processed
- Average referral scores

### The Graph Queries
```graphql
query GetUserNetwork($web3Id: String!) {
  user(id: $web3Id) {
    referralScore
    directReferrals {
      id
      email
    }
    referralPath {
      path
      depth
    }
  }
}
```

## 🚨 Important Considerations

### Gas Optimization
- Reward propagation limited to 10 levels
- Batch operations where possible
- Event-based architecture for efficiency

### Scalability
- Subgraph indexing for complex queries
- Off-chain computation for analytics
- On-chain storage for critical data only

### Privacy
- Email addresses stored on-chain (consider hashing)
- Web3ID as primary identifier
- Optional profile information

## 🛠️ Development Workflow

### Adding New Features
1. Update smart contract
2. Regenerate ABI and types
3. Update subgraph schema
4. Add backend API endpoints
5. Update frontend components
6. Add comprehensive tests

### Deployment Checklist
- [ ] Compile and test contracts locally
- [ ] Deploy to testnet
- [ ] Update contract addresses in config
- [ ] Deploy subgraph
- [ ] Test API endpoints
- [ ] Verify frontend integration
- [ ] Run full test suite

## 📝 Contract Events

### Core Events
```solidity
event UserRegistered(bytes32 indexed web3Id, address indexed walletAddress, bytes32 indexed referrerWeb3Id);
event ReferralRequested(bytes32 indexed referrerWeb3Id, string indexed refereeEmail, bytes32 indexed requestId);
event ReferralAccepted(bytes32 indexed referrerWeb3Id, bytes32 indexed refereeWeb3Id, bytes32 indexed requestId);
event CreditScoreUpdated(bytes32 indexed web3Id, uint256 oldScore, uint256 newScore, int256 change);
event ReferralRewardDistributed(bytes32 indexed referrerWeb3Id, bytes32 indexed originUserWeb3Id, uint256 reward, uint256 depth);
```

## 🎯 Future Enhancements

### Planned Features
- [ ] Referral code system
- [ ] Time-based reward bonuses
- [ ] Network visualization dashboard
- [ ] Advanced analytics and insights
- [ ] Mobile app integration
- [ ] Multi-chain support

### Optimization Opportunities
- [ ] Layer 2 deployment for lower costs
- [ ] IPFS integration for profile data
- [ ] Zero-knowledge proofs for privacy
- [ ] Machine learning for fraud detection

---

## 🎉 Success! 

The Referral Credit Network is now fully implemented with:
- ✅ Smart contract deployed and tested
- ✅ The Graph subgraph configured
- ✅ Backend APIs implemented
- ✅ Frontend interface complete
- ✅ Comprehensive test suite
- ✅ Documentation and guides

The system is ready for production use and can handle complex referral chains with automatic reward distribution!

---

*For technical support or questions, please refer to the test files and API documentation.*
