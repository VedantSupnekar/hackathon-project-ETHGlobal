# 🏦 DeFi Credit Scoring Platform

A comprehensive DeFi lending platform that enables secure user authentication, multi-wallet portfolio management, and advanced credit scoring combining on-chain analytics, off-chain data via Flare FDC, and decentralized storage via IPFS.

## 🎯 **Major Achievements**

### ✅ **Full Authentication System**
- 🔐 **Secure user registration/login** with bcrypt password hashing & JWT tokens
- 👤 **Multi-wallet portfolio system** - one user can link multiple crypto wallets
- 🌐 **Dynamic Web3 ID generation** for each user
- 🔒 **Security-first design** - eliminated authentication bypass vulnerabilities

### ✅ **Advanced Credit Scoring**
- 📊 **Real-time on-chain analysis** - analyzes actual wallet transactions, balances, activity
- 🌉 **Flare FDC Web2JSON integration** - bridges traditional credit data to blockchain
- 🔗 **Composite scoring** - combines on-chain + off-chain + referral scores
- ⚖️ **Weighted aggregation** across multiple linked wallets per user

### ✅ **Decentralized Storage (IPFS)**
- 🌐 **IPFS integration** for storing user profiles and credit data off-chain
- 🔗 **Smart contracts** store IPFS hashes on-chain for immutable references
- 📦 **Hybrid storage** - local fallback when IPFS unavailable
- 🛡️ **Data integrity** with cryptographic verification

### ✅ **Modern Frontend & Backend**
- ⚛️ **Next.js frontend** with TypeScript, Tailwind CSS
- 🦊 **MetaMask integration** with network switching and error handling  
- 🔄 **Express.js API** with comprehensive endpoints
- 🧪 **Demo system** with database reset functionality

### ✅ **Blockchain Integration**
- ⛓️ **Ganache CLI** local blockchain for development
- 📝 **Smart contracts** for credit registry and IPFS hash storage
- 💰 **Real wallet analysis** using ethers.js v6
- 🔍 **On-chain proof generation** with transaction verification

## 🚀 **Quick Start**

### Prerequisites
- Node.js 16+ and npm
- Git
- MetaMask browser extension

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd hackathon-project

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install
```

### 2. Start Local Blockchain
```bash
# Terminal 1: Start Ganache
ganache-cli --port 8545 --chainId 31337 --accounts 10 --defaultBalanceEther 10000 --mnemonic "test test test test test test test test test test test junk"
```

### 3. Start Backend
```bash
# Terminal 2: Start backend API
cd backend && node server.js
```
Backend runs on: http://localhost:3001

### 4. Start Frontend
```bash
# Terminal 3: Start Next.js frontend
cd frontend && npm run dev
```
Frontend runs on: http://localhost:3000

## 🎮 **Demo Instructions**

### 1. **User Registration & Login**
- Visit http://localhost:3000
- Create account with email, password, name, SSN
- Login with your credentials (secure authentication!)

### 2. **Connect MetaMask Wallets**
- Ensure MetaMask is on Local Testnet (Chain ID: 31337)
- Connect wallets to build your multi-wallet portfolio
- View real-time on-chain credit scores

### 3. **Set Off-Chain Credit Score**
- Use FDC Web2JSON to simulate traditional credit data
- Watch composite score calculation
- Data stored on IPFS with on-chain hash references

### 4. **Demo Reset** (for presentations)
- Use "🧹 Reset Demo" button to clear all data
- Start fresh demonstrations easily

## 📊 **API Endpoints**

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Secure login
- `GET /api/auth/profile` - Get user profile

### Portfolio Management
- `POST /api/portfolio/register` - Create user with Web3 ID
- `POST /api/portfolio/link-wallet` - Link wallet to user
- `GET /api/portfolio/scores/:userId` - Get all credit scores
- `POST /api/portfolio/set-offchain-score` - Set off-chain score via FDC

### IPFS & Decentralized Storage
- `GET /api/ipfs/status` - Check IPFS connection status
- `POST /api/ipfs/store-user` - Store user data on IPFS
- `GET /api/ipfs/retrieve/:hash` - Retrieve data from IPFS

### Demo & Testing
- `POST /api/portfolio/demo/reset` - Clear all demo data
- `GET /api/portfolio/demo/stats` - Get system statistics

## 🔧 **Configuration**

### Environment Variables (.env in backend/)
```env
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# IPFS Configuration (optional)
IPFS_API_URL=https://ipfs.infura.io:5001/api/v0
IPFS_GATEWAY_URL=https://gateway.ipfs.io/ipfs

# Smart Contract Address (if deployed)
IPFS_CONTRACT_ADDRESS=0x...
```

### MetaMask Network Configuration
- **Network Name**: Local Testnet
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency**: ETH

## 🏗️ **Architecture**

### Backend Services
- `userAuthService.js` - Authentication & JWT management
- `userPortfolioService.js` - Multi-wallet portfolio management
- `walletAnalysisService.js` - Real-time on-chain credit scoring
- `fdcWeb2JsonService.js` - Flare FDC Web2JSON integration
- `simpleIpfsService.js` - IPFS storage with HTTP API
- `decentralizedStorageService.js` - Orchestrates IPFS + blockchain storage

### Smart Contracts
- `UserCreditRegistry.sol` - Stores user credit data on-chain
- `IPFSCreditRegistry.sol` - Stores IPFS hashes for decentralized data

### Frontend Components
- `AuthPage.tsx` - Registration & login interface
- `Dashboard.tsx` - Main user dashboard with scores
- `MetaMaskConnector.tsx` - Wallet connection with network switching

## 🧪 **Testing**

### Manual Testing
```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.com","password":"secure123","firstName":"Test","lastName":"User","ssn":"111-11-1111"}'

# Test wallet linking
curl -X POST http://localhost:3001/api/portfolio/link-wallet \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id","walletAddress":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","signature":"signature"}'

# Test IPFS status
curl http://localhost:3001/api/ipfs/status
```

### Demo Reset
```bash
curl -X POST http://localhost:3001/api/portfolio/demo/reset
```

## 🔒 **Security Features**

- ✅ **Password hashing** with bcrypt
- ✅ **JWT token authentication** 
- ✅ **Signature verification** for wallet linking
- ✅ **Input validation** and sanitization
- ✅ **CORS protection**
- ✅ **Eliminated authentication bypass** vulnerabilities
- ✅ **Secure API endpoints** with proper error handling

## 📈 **Credit Scoring Algorithm**

### On-Chain Score (0-850)
- **Balance Score**: Higher balances = higher score
- **Transaction Activity**: Regular transactions = positive
- **Account Age**: Older accounts = more trustworthy
- **Risk Assessment**: Low-risk behavior = higher score

### Composite Score Calculation
```javascript
compositeScore = (onChainScore * 0.4) + (offChainScore * 0.5) + (referralScore * 0.1)
```

### Multi-Wallet Aggregation
- Analyzes all linked wallets per user
- Calculates weighted average based on wallet activity
- Provides comprehensive portfolio view

## 🌟 **Key Innovations**

1. **Multi-Wallet User Identity** - One user, multiple wallets, unified credit profile
2. **Real-Time On-Chain Analysis** - Dynamic scoring based on actual blockchain data
3. **Flare FDC Bridge** - Seamless Web2 to Web3 data integration
4. **IPFS + Blockchain Hybrid** - Decentralized storage with on-chain references
5. **Security-First Design** - Comprehensive authentication and validation

## 🎯 **Demo Scenarios**

### Scenario 1: High-Credit User
- Register with good SSN
- Link wallet with high balance (10,000 ETH)
- Set high off-chain score (750+)
- See composite score calculation

### Scenario 2: Multi-Wallet Portfolio
- Register user
- Link multiple wallets with different balances
- Watch aggregated on-chain score calculation
- Compare individual vs. portfolio scores

### Scenario 3: IPFS Storage
- Create user profile
- Check IPFS status
- View stored data via IPFS hash
- Verify on-chain hash references

## 🛠️ **Troubleshooting**

### Common Issues

**MetaMask Connection Issues**
- Ensure Chain ID is 31337
- Reset MetaMask account if needed
- Check Ganache is running on port 8545

**Backend Startup Issues**
- Check port 3001 is available
- Verify all dependencies installed
- Check Ganache blockchain is running

**Frontend Build Issues**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## 📚 **Additional Documentation**

Key guides kept for reference:
- `TESTING_GUIDE.md` - Comprehensive testing procedures
- `UI_DEMO_GUIDE.md` - Frontend demo walkthrough
- `HACKATHON_DEMO_GUIDE.md` - Presentation guide

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a Pull Request

## 📄 **License**

MIT License - see LICENSE file for details.

---

**🎉 Hackathon Achievement**: Complete DeFi credit scoring platform with multi-wallet support, real blockchain integration, decentralized storage, and production-ready security features!