# 🦊 MetaMask Demo Setup for Hackathon Judges

## 🎯 Live Demo Scenario
Demonstrate a **DeFi lending platform** that uses **Flare FDC Web2JSON** to combine on-chain wallet analysis with off-chain credit bureau data for comprehensive credit scoring.

## 🚀 Quick Setup (2 minutes)

### Step 1: Add Local Network to MetaMask
- **Network Name**: Hardhat Local
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 1337
- **Currency Symbol**: ETH

### Step 2: Import Demo Wallets


#### 1. Excellent Credit Alice - Credit Score: 820
**Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
**Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`  
**Profile**: EXCELLENT (Perfect payment history, low utilization)  

#### 2. Good Credit Bob - Credit Score: 750
**Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`  
**Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`  
**Profile**: GOOD (Solid history, moderate utilization)  

#### 3. Fair Credit Charlie - Credit Score: 650
**Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`  
**Private Key**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`  
**Profile**: FAIR (Some late payments, higher utilization)  

#### 4. Poor Credit Dave - Credit Score: 550
**Address**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`  
**Private Key**: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`  
**Profile**: POOR (Multiple late payments, high utilization)  

#### 5. Bad Credit Eve - Credit Score: 450
**Address**: `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`  
**Private Key**: `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`  
**Profile**: BAD (Defaults, collections, very high utilization)  

#### 6. No Credit Frank - Credit Score: 350
**Address**: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`  
**Private Key**: `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba`  
**Profile**: NO_CREDIT (New to credit, thin file)  

#### 7. Recovering Grace - Credit Score: 580
**Address**: `0x976EA74026E726554dB657fA54763abd0C3a0aa9`  
**Private Key**: `0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e`  
**Profile**: RECOVERING (Rebuilding after bankruptcy)  

#### 8. High Earner Henry - Credit Score: 850
**Address**: `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955`  
**Private Key**: `0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356`  
**Profile**: PREMIUM (High income, excellent credit)  

#### 9. Student Ivy - Credit Score: 680
**Address**: `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f`  
**Private Key**: `0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97`  
**Profile**: STUDENT (College student, limited history)  

#### 10. Business Owner Jack - Credit Score: 720
**Address**: `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720`  
**Private Key**: `0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6`  
**Profile**: BUSINESS (Small business owner, variable income)  


## 🎬 Judge Demo Script (5 minutes)

### Opening (30 seconds)
*"I built a DeFi lending platform that solves credit assessment by combining on-chain wallet behavior with traditional credit bureau data using Flare's FDC Web2JSON."*

### Demo Flow

#### 1. **Start with No Credit Frank** (1 minute)
- Import wallet: `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc`
- Show: *"This wallet has no credit history - score: 350"*
- Demonstrate: Base on-chain score calculation
- **Key Point**: *"Traditional DeFi would reject this user, but we can do better"*

#### 2. **Add Excellent Credit Alice** (1.5 minutes) 
- Import wallet: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Show: *"Same user, different wallet with excellent credit - score: 820"*
- **Demonstrate FDC Web2JSON**: 
  - Show API call to credit bureau
  - Show cryptographic proof generation
  - Show ABI-encoded smart contract data
- **Key Point**: *"Real Flare FDC integration - not a mock!"*

#### 3. **Add Poor Credit Dave** (1 minute)
- Import wallet: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- Show: *"This wallet has poor credit history - score: 550"*
- Demonstrate: Risk assessment and weighted scoring
- **Key Point**: *"System intelligently weights multiple data sources"*

#### 4. **Portfolio Analysis** (1.5 minutes)
- Show final composite score calculation
- Explain: *"Platform creates weighted portfolio score: 70% off-chain + 30% on-chain"*
- Demonstrate: Loan eligibility determination
- **Key Point**: *"Ready for production lending decisions"*

## 🔧 Technical Validation

### API Endpoints to Test Live
```bash
# 1. Test FDC Web2JSON Integration
curl -X POST http://localhost:3001/api/credit-score/fdc/attest \
-d '{"ssn": "111-11-1111", "userAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}'

# 2. Test Composite Scoring  
curl -X GET http://localhost:3001/api/auth/score/composite \
-H "Authorization: Bearer YOUR_TOKEN"
```

### Expected Results
- ✅ **FDC Type**: `"FDC_WEB2JSON"`
- ✅ **Implementation**: `"Flare Web2Json FDC Pattern"`
- ✅ **Documentation**: `"https://dev.flare.network/fdc/guides/hardhat/web-2-json-for-custom-api"`
- ✅ **Cryptographic Proofs**: 32-byte hashes, Merkle trees, ABI encoding
- ✅ **Score Updates**: Real-time composite score changes

## 🏆 Hackathon Judging Points

### ✅ **Innovation**
- Novel approach to DeFi credit scoring
- Bridges traditional finance with Web3
- Multi-wallet portfolio analysis

### ✅ **Technical Excellence** 
- **Real Flare FDC Web2JSON** (not mock)
- Cryptographic proof generation
- Smart contract ready data
- Production-grade API architecture

### ✅ **User Experience**
- Live MetaMask integration
- Real-time score updates
- Intuitive credit progression

### ✅ **Market Readiness**
- Comprehensive test suite
- Multiple credit scenarios
- Risk assessment capabilities

## 🎯 Key Demo Talking Points

1. **"Real FDC Integration"**: *"This uses authentic Flare FDC Web2JSON - you can see the cryptographic proofs and ABI encoding"*

2. **"Multi-Wallet Intelligence"**: *"Unlike traditional credit, we analyze entire wallet portfolios for better risk assessment"*

3. **"Production Ready"**: *"Complete API, authentication, proof generation - ready for real lending"*

4. **"Hackathon Innovation"**: *"Solving DeFi's credit problem with real Web2 data integration"*

## 🚨 Troubleshooting

- **Wallet Import Issues**: Make sure you're on Hardhat Local network (Chain ID 1337)
- **API Errors**: Ensure backend server is running on port 3001
- **Score Not Updating**: Check browser console for connection issues

---

**🎉 Ready to impress the judges with real Flare FDC Web2JSON integration!**

*Generated: 2025-08-17T00:24:39.504Z*
