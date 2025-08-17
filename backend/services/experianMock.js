/**
 * Mock Experian Credit Score API
 * Simulates real Experian API responses for development and testing
 * Updated to support demo wallets for hackathon presentation
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class ExperianMockService {
  constructor() {
    // Mock database of credit profiles
    this.creditProfiles = new Map();
    this.walletCreditMapping = {};
    this.loadDemoWalletMapping();
    this.initializeMockData();
  }

  loadDemoWalletMapping() {
    try {
      const mappingPath = path.join(__dirname, '../config/walletCreditMapping.json');
      if (fs.existsSync(mappingPath)) {
        const mappingData = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
        this.walletCreditMapping = mappingData.walletCreditMapping || {};
        console.log('✅ Loaded demo wallet credit mapping for hackathon demo');
        console.log(`   Mapped ${Object.keys(this.walletCreditMapping).length} demo wallets`);
      }
    } catch (error) {
      console.log('⚠️  Demo wallet mapping not found, using default mock data');
    }
  }

  initializeMockData() {
    // Initialize some sample credit profiles
    const sampleProfiles = [
      {
        ssn: '123-45-6789',
        creditScore: 750,
        creditHistory: 8,
        paymentHistory: 95,
        creditUtilization: 25,
        accountsOpen: 5,
        recentInquiries: 2,
        publicRecords: 0,
        delinquencies: 0
      },
      {
        ssn: '987-65-4321',
        creditScore: 620,
        creditHistory: 3,
        paymentHistory: 78,
        creditUtilization: 65,
        accountsOpen: 8,
        recentInquiries: 5,
        publicRecords: 1,
        delinquencies: 2
      },
      {
        ssn: '555-12-3456',
        creditScore: 800,
        creditHistory: 15,
        paymentHistory: 98,
        creditUtilization: 15,
        accountsOpen: 12,
        recentInquiries: 1,
        publicRecords: 0,
        delinquencies: 0
      }
    ];

    sampleProfiles.forEach(profile => {
      this.creditProfiles.set(profile.ssn, profile);
    });
  }

  /**
   * Mock Experian Credit Report Request
   * @param {Object} requestData - Credit report request data
   * @returns {Object} Mock Experian API response
   */
  async getCreditReport(requestData) {
    const { ssn, firstName, lastName, dateOfBirth, address } = requestData;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Validate required fields
    if (!ssn || !firstName || !lastName) {
      return this.createErrorResponse('INVALID_REQUEST', 'Missing required fields');
    }

    // Check if we have mock data for this SSN
    let profile = this.creditProfiles.get(ssn);
    
    // If no mock data exists, generate a random profile
    if (!profile) {
      profile = this.generateRandomCreditProfile(ssn);
      this.creditProfiles.set(ssn, profile);
    }

    return this.createSuccessResponse(profile, requestData);
  }

  generateRandomCreditProfile(ssn) {
    const creditScore = Math.floor(Math.random() * (850 - 300) + 300);
    
    return {
      ssn,
      creditScore,
      creditHistory: Math.floor(Math.random() * 20 + 1),
      paymentHistory: Math.floor(Math.random() * 40 + 60),
      creditUtilization: Math.floor(Math.random() * 80 + 10),
      accountsOpen: Math.floor(Math.random() * 15 + 1),
      recentInquiries: Math.floor(Math.random() * 10),
      publicRecords: Math.floor(Math.random() * 3),
      delinquencies: Math.floor(Math.random() * 5)
    };
  }

  createSuccessResponse(profile, requestData) {
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    return {
      success: true,
      requestId,
      timestamp,
      consumer: {
        firstName: requestData.firstName,
        lastName: requestData.lastName,
        ssn: profile.ssn,
        dateOfBirth: requestData.dateOfBirth,
        address: requestData.address
      },
      creditReport: {
        creditScore: {
          value: profile.creditScore,
          model: 'FICO Score 8',
          range: '300-850',
          date: timestamp
        },
        creditFactors: {
          paymentHistory: {
            score: profile.paymentHistory,
            weight: 35,
            description: 'Payment history on credit accounts'
          },
          creditUtilization: {
            score: 100 - profile.creditUtilization,
            weight: 30,
            utilization: profile.creditUtilization,
            description: 'Credit utilization ratio'
          },
          creditHistory: {
            score: Math.min(profile.creditHistory * 5, 100),
            weight: 15,
            lengthInYears: profile.creditHistory,
            description: 'Length of credit history'
          },
          creditMix: {
            score: Math.max(100 - profile.accountsOpen * 2, 60),
            weight: 10,
            accountsOpen: profile.accountsOpen,
            description: 'Types of credit accounts'
          },
          newCredit: {
            score: Math.max(100 - profile.recentInquiries * 10, 50),
            weight: 10,
            recentInquiries: profile.recentInquiries,
            description: 'Recent credit inquiries'
          }
        },
        publicRecords: {
          bankruptcies: profile.publicRecords,
          liens: 0,
          judgments: 0
        },
        delinquencies: {
          thirtyDaysLate: profile.delinquencies,
          sixtyDaysLate: Math.floor(profile.delinquencies / 2),
          ninetyDaysLate: Math.floor(profile.delinquencies / 3)
        },
        accounts: this.generateMockAccounts(profile),
        inquiries: this.generateMockInquiries(profile.recentInquiries)
      }
    };
  }

  generateMockAccounts(profile) {
    const accounts = [];
    const accountTypes = ['Credit Card', 'Auto Loan', 'Mortgage', 'Personal Loan', 'Student Loan'];
    
    for (let i = 0; i < profile.accountsOpen; i++) {
      accounts.push({
        accountId: uuidv4(),
        accountType: accountTypes[Math.floor(Math.random() * accountTypes.length)],
        creditorName: `Creditor ${i + 1}`,
        balance: Math.floor(Math.random() * 50000),
        creditLimit: Math.floor(Math.random() * 100000 + 10000),
        paymentStatus: Math.random() > 0.1 ? 'Current' : 'Late',
        openDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * profile.creditHistory).toISOString()
      });
    }
    
    return accounts;
  }

  generateMockInquiries(count) {
    const inquiries = [];
    const inquiryTypes = ['Credit Card', 'Auto Loan', 'Mortgage', 'Personal Loan'];
    
    for (let i = 0; i < count; i++) {
      inquiries.push({
        inquiryId: uuidv4(),
        creditorName: `Lender ${i + 1}`,
        inquiryType: inquiryTypes[Math.floor(Math.random() * inquiryTypes.length)],
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return inquiries;
  }

  createErrorResponse(errorCode, message) {
    return {
      success: false,
      error: {
        code: errorCode,
        message,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get simplified credit score for Web2JSON mapping
   * @param {string} ssn - Social Security Number
   * @returns {Object} Simplified credit data for blockchain mapping
   */
  async getSimplifiedCreditData(ssn) {
    // First check demo wallet mapping for hackathon demo
    if (this.walletCreditMapping[ssn]) {
      const demoData = this.walletCreditMapping[ssn];
      console.log(`🎭 Using demo wallet credit data for SSN: ${ssn}`);
      console.log(`   Profile: ${demoData.name} (${demoData.profile})`);
      console.log(`   Wallet: ${demoData.walletAddress}`);
      console.log(`   Credit Score: ${demoData.creditData.creditScore}`);
      
      return {
        success: true,
        ...demoData.creditData,
        profile: demoData.profile,
        walletAddress: demoData.walletAddress,
        name: demoData.name,
        isDemoWallet: true
      };
    }

    // Fallback to regular mock profiles
    const profile = this.creditProfiles.get(ssn);
    if (!profile) {
      return null;
    }

    return {
      creditScore: profile.creditScore,
      paymentHistory: profile.paymentHistory,
      creditUtilization: profile.creditUtilization,
      creditHistoryLength: profile.creditHistory,
      accountsOpen: profile.accountsOpen,
      recentInquiries: profile.recentInquiries,
      publicRecords: profile.publicRecords,
      delinquencies: profile.delinquencies,
      timestamp: Date.now()
    };
  }
}

module.exports = new ExperianMockService();
