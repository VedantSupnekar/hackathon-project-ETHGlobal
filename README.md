# DeFi Lending Platform

A comprehensive DeFi lending platform that enables banks to pool money and customers to borrow based on a multi-factor credit scoring system combining on-chain, off-chain (via Flare FDC), and referral-based scoring.

## 🏗️ Architecture Overview

### Core Components

1. **Credit Scoring System**
   - **On-chain Score**: Based on blockchain transaction history and DeFi activity
   - **Off-chain Score**: Traditional credit data via Experian API → Web2JSON FDC mapping
   - **Referral Score**: Social credit scoring via The Graph protocol

2. **User Interface**
   - Account creation with SSN verification
   - Circle integration for on-chain verification
   - Unique wallet generation per user
   - Credit score dashboard with breakdowns
   - Loan application and management
   - Referral system

3. **Bank Interface**
   - Wallet connection for banks
   - APY monitoring and returns tracking
   - Money pooling and management
   - Default protection via insurance pool

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd hackathon-project

# Install dependencies for all packages
npm run install:all

# Start development servers
npm run dev
```

This will start:
- Backend API server on http://localhost:5000
- Frontend development server on http://localhost:3000

## 📊 Current Implementation Status

### ✅ Completed Features

1. **Mock Experian API Service**
   - Realistic credit report generation
   - Multiple test profiles with different credit scores
   - Comprehensive credit factors (payment history, utilization, etc.)
   - Mock account and inquiry data

2. **Web2JSON FDC Integration**
   - Flare Data Connector integration
   - Off-chain to on-chain data mapping
   - Attestation proof generation
   - Merkle proof system for verification
   - Smart contract ready data formatting

3. **API Infrastructure**
   - RESTful API endpoints
   - Complete credit score flow
   - Error handling and validation
   - Comprehensive documentation

### 🔄 In Progress

- User authentication system
- Wallet generation service
- On-chain credit scoring logic
- The Graph integration for referrals

### 📋 Planned Features

- Frontend user interface
- Bank management dashboard
- Smart contract deployment
- Insurance pool implementation
- Loan approval automation

## 🧪 Testing the Current Implementation

### Start the Backend Server

```bash
cd backend
npm install
node server.js &
```

The server will start on http://localhost:3001

### Run the Interactive Demo

```bash
cd backend
node demo.js
```

This interactive demo showcases:
- Complete credit scoring pipeline for 3 different user profiles
- Experian API integration with realistic credit reports
- Web2JSON FDC attestation with cryptographic proofs
- Smart contract ready data generation

### Run the Test Suite

```bash
cd backend
node test/testFlow.js
```

This comprehensive test suite validates:
- Health check endpoint
- Mock Experian API calls
- Web2JSON attestation process
- Complete credit score flow
- All API endpoints

### API Endpoints

#### Health Check
```bash
GET http://localhost:5000/health
```

#### Get Mock Test Data
```bash
GET http://localhost:5000/api/credit-score/mock-data
```

#### Complete Credit Score Flow
```bash
POST http://localhost:5000/api/credit-score/complete-flow
Content-Type: application/json

{
  "ssn": "123-45-6789",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-15",
  "userAddress": "0x742d35Cc6634C0532925a3b8D4C9d1E6b0Db1d46"
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development

# Flare Network Configuration
FLARE_RPC_URL=https://flare-api.flare.network/ext/bc/C/rpc
FLARE_NETWORK_ID=14

# Web2JSON FDC Configuration
FDC_ATTESTATION_URL=https://fdc-api.flare.network
FDC_API_KEY=your_fdc_api_key_here

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Circle API Configuration
CIRCLE_API_KEY=your_circle_api_key_here
CIRCLE_BASE_URL=https://api.circle.com
```

## 📚 API Documentation

### Credit Score Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/credit-score/test` | GET | Test API availability |
| `/api/credit-score/experian/report` | POST | Get full Experian credit report |
| `/api/credit-score/experian/simplified` | POST | Get simplified credit data |
| `/api/credit-score/web2json/attest` | POST | Create Web2JSON attestation |
| `/api/credit-score/complete-flow` | POST | Complete credit scoring flow |
| `/api/credit-score/mock-data` | GET | Get available test profiles |

Full API documentation available at: http://localhost:5000/api/docs

## 🔍 Example Response - Complete Flow

```json
{
  "success": true,
  "flow": "complete",
  "data": {
    "fullCreditReport": {
      "creditScore": { "value": 750, "model": "FICO Score 8" },
      "creditFactors": { /* detailed breakdown */ }
    },
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
    "attestation": {
      "attestationId": "web2json_1699123456789_abc123def",
      "contractData": {
        "creditScore": 750,
        "dataHash": "0x1234567890abcdef...",
        "merkleRoot": "0xfedcba0987654321...",
        "blockNumber": 5123456,
        "timestamp": 1699123456
      }
    }
  }
}
```

## 🛠️ Development Roadmap

### Phase 1: Foundation (Current)
- ✅ Mock Experian API
- ✅ Web2JSON FDC integration
- ✅ Basic API infrastructure

### Phase 2: Core Features
- [ ] Smart contract development
- [ ] On-chain credit scoring
- [ ] User authentication system
- [ ] Wallet generation

### Phase 3: Advanced Features
- [ ] The Graph integration for referrals
- [ ] Frontend user interface
- [ ] Bank management dashboard
- [ ] Loan approval automation

### Phase 4: Production Ready
- [ ] Security audits
- [ ] Performance optimization
- [ ] Real Experian API integration
- [ ] Deployment and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or support, please open an issue in the repository or contact the development team.

---

**Note**: This is a hackathon project demonstrating the integration of traditional credit scoring with blockchain technology using Flare's FDC for Web2-to-Web3 data bridging.
