#!/usr/bin/env node

/**
 * Comprehensive Referral System Testing Script
 * Tests the complete referral invitation and approval workflow
 */

const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost:3001/api';

class ReferralSystemTester {
  constructor() {
    this.users = {};
    this.invitations = {};
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    switch (type) {
      case 'success':
        console.log(`[${timestamp}] ✅ ${message}`.green);
        break;
      case 'error':
        console.log(`[${timestamp}] ❌ ${message}`.red);
        break;
      case 'info':
        console.log(`[${timestamp}] ℹ️  ${message}`.blue);
        break;
      case 'warning':
        console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
        break;
      case 'header':
        console.log(`\n${'='.repeat(60)}`.cyan);
        console.log(`${message}`.cyan.bold);
        console.log(`${'='.repeat(60)}`.cyan);
        break;
    }
  }

  async test(description, testFn) {
    this.testResults.total++;
    try {
      this.log(`Testing: ${description}`, 'info');
      await testFn();
      this.testResults.passed++;
      this.log(`✅ PASSED: ${description}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.log(`❌ FAILED: ${description} - ${error.message}`, 'error');
      if (error.response?.data) {
        this.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
      }
    }
  }

  async registerUser(email, password, firstName, lastName, ssn) {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      email,
      password,
      firstName,
      lastName,
      ssn
    });
    
    if (!response.data.success) {
      throw new Error(`Registration failed: ${response.data.error}`);
    }
    
    const user = {
      email,
      token: response.data.token,
      userId: response.data.user.userId,
      web3Id: response.data.user.web3Id,
      firstName,
      lastName
    };
    
    this.users[email] = user;
    return user;
  }

  async registerUserInReferralNetwork(user) {
    const response = await axios.post(`${API_BASE}/referral/register`, {
      web3Id: user.web3Id,
      walletAddress: `0x${Math.random().toString(16).substr(2, 40)}` // Generate random wallet
    }, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    
    if (!response.data.success) {
      throw new Error(`Referral network registration failed: ${response.data.error}`);
    }
    
    return response.data;
  }

  async sendInvitation(inviter, inviteeEmail, message = '') {
    const response = await axios.post(`${API_BASE}/referral/invite`, {
      inviterWeb3Id: inviter.web3Id,
      inviterEmail: inviter.email,
      inviterName: `${inviter.firstName} ${inviter.lastName}`,
      inviteeEmail,
      message
    }, {
      headers: { Authorization: `Bearer ${inviter.token}` }
    });
    
    if (!response.data.success) {
      throw new Error(`Invitation failed: ${response.data.error}`);
    }
    
    return response.data.invitation;
  }

  async acceptInvitation(token, email = null) {
    const response = await axios.post(`${API_BASE}/referral/accept`, {
      token,
      email
    });
    
    if (!response.data.success) {
      throw new Error(`Accept invitation failed: ${response.data.error}`);
    }
    
    return response.data.invitation;
  }

  async rejectInvitation(token) {
    const response = await axios.post(`${API_BASE}/referral/reject`, {
      token
    });
    
    if (!response.data.success) {
      throw new Error(`Reject invitation failed: ${response.data.error}`);
    }
    
    return response.data;
  }

  async getInvitation(token) {
    const response = await axios.get(`${API_BASE}/referral/invitation/${token}`);
    
    if (!response.data.success) {
      throw new Error(`Get invitation failed: ${response.data.error}`);
    }
    
    return response.data.invitation;
  }

  async getUserInvitations(user) {
    const response = await axios.get(`${API_BASE}/referral/invitations?email=${user.email}`, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    
    if (!response.data.success) {
      throw new Error(`Get user invitations failed: ${response.data.error}`);
    }
    
    return response.data.invitations;
  }

  async getInvitationStats() {
    const response = await axios.get(`${API_BASE}/referral/invitation-stats`);
    
    if (!response.data.success) {
      throw new Error(`Get invitation stats failed: ${response.data.error}`);
    }
    
    return response.data.stats;
  }

  async simulateCreditEvent(user, eventType) {
    const response = await axios.post(`${API_BASE}/referral/simulate-event`, {
      web3Id: user.web3Id,
      eventType
    }, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
    
    if (!response.data.success) {
      throw new Error(`Simulate event failed: ${response.data.error}`);
    }
    
    return response.data;
  }

  async getLeaderboard(type = 'score') {
    const response = await axios.get(`${API_BASE}/referral/leaderboard?type=${type}`);
    
    if (!response.data.success) {
      throw new Error(`Get leaderboard failed: ${response.data.error}`);
    }
    
    return response.data.leaderboard;
  }

  async resetDemo() {
    const response = await axios.post(`${API_BASE}/referral/demo/reset`);
    
    if (!response.data.success) {
      throw new Error(`Demo reset failed: ${response.data.error}`);
    }
    
    return response.data;
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Referral System Tests', 'header');
    
    try {
      // Reset demo data first
      await this.test('Reset demo data', async () => {
        await this.resetDemo();
      });

      // Test 1: User Registration and Setup
      await this.test('Register Alice (Inviter)', async () => {
        await this.registerUser('alice@test.com', 'pass123', 'Alice', 'Smith', '111-11-1111');
        await this.registerUserInReferralNetwork(this.users['alice@test.com']);
      });

      await this.test('Register Bob (Invitee)', async () => {
        await this.registerUser('bob@test.com', 'pass123', 'Bob', 'Jones', '222-22-2222');
        await this.registerUserInReferralNetwork(this.users['bob@test.com']);
      });

      await this.test('Register Charlie (Chain Invitee)', async () => {
        await this.registerUser('charlie@test.com', 'pass123', 'Charlie', 'Brown', '333-33-3333');
        await this.registerUserInReferralNetwork(this.users['charlie@test.com']);
      });

      // Test 2: Invitation Creation and Validation
      await this.test('Alice sends invitation to Bob', async () => {
        const invitation = await this.sendInvitation(
          this.users['alice@test.com'], 
          'bob@test.com', 
          'Join me on this amazing DeFi platform!'
        );
        this.invitations.aliceToBob = invitation;
        
        if (!invitation.token) {
          throw new Error('Invitation token not generated');
        }
      });

      await this.test('Validate invitation details', async () => {
        const invitation = await this.getInvitation(this.invitations.aliceToBob.token);
        
        if (invitation.inviterEmail !== 'alice@test.com') {
          throw new Error('Incorrect inviter email');
        }
        if (invitation.inviteeEmail !== 'bob@test.com') {
          throw new Error('Incorrect invitee email');
        }
        if (invitation.status !== 'pending') {
          throw new Error('Invitation should be pending');
        }
      });

      // Test 3: Duplicate Invitation Prevention
      await this.test('Prevent duplicate invitation (Alice to Bob)', async () => {
        try {
          await this.sendInvitation(this.users['alice@test.com'], 'bob@test.com');
          throw new Error('Should have prevented duplicate invitation');
        } catch (error) {
          if (!error.message.includes('already pending')) {
            throw error;
          }
        }
      });

      // Test 4: Self-Referral Prevention
      await this.test('Prevent self-referral', async () => {
        try {
          await this.sendInvitation(this.users['alice@test.com'], 'alice@test.com');
          throw new Error('Should have prevented self-referral');
        } catch (error) {
          if (!error.message.includes('Cannot refer yourself')) {
            throw error;
          }
        }
      });

      // Test 5: Invitation Acceptance
      await this.test('Bob accepts invitation from Alice', async () => {
        const result = await this.acceptInvitation(
          this.invitations.aliceToBob.token, 
          'bob@test.com'
        );
        
        if (!result.inviterWeb3Id) {
          throw new Error('Missing inviter Web3 ID in acceptance result');
        }
      });

      // Test 6: Verify Invitation Status Change
      await this.test('Verify invitation status changed to accepted', async () => {
        const invitation = await this.getInvitation(this.invitations.aliceToBob.token);
        
        if (invitation.status !== 'accepted') {
          throw new Error(`Expected status 'accepted', got '${invitation.status}'`);
        }
        if (!invitation.acceptedAt) {
          throw new Error('AcceptedAt timestamp missing');
        }
      });

      // Test 7: Chain Referral (Bob invites Charlie)
      await this.test('Bob sends invitation to Charlie', async () => {
        const invitation = await this.sendInvitation(
          this.users['bob@test.com'], 
          'charlie@test.com', 
          'Alice referred me, now I\'m referring you!'
        );
        this.invitations.bobToCharlie = invitation;
      });

      await this.test('Charlie accepts invitation from Bob', async () => {
        await this.acceptInvitation(
          this.invitations.bobToCharlie.token, 
          'charlie@test.com'
        );
      });

      // Test 8: User Invitations Tracking
      await this.test('Check Alice\'s invitation history', async () => {
        const invitations = await this.getUserInvitations(this.users['alice@test.com']);
        
        if (invitations.sent.length !== 1) {
          throw new Error(`Expected 1 sent invitation, got ${invitations.sent.length}`);
        }
        if (invitations.received.length !== 0) {
          throw new Error(`Expected 0 received invitations, got ${invitations.received.length}`);
        }
      });

      await this.test('Check Bob\'s invitation history', async () => {
        const invitations = await this.getUserInvitations(this.users['bob@test.com']);
        
        if (invitations.sent.length !== 1) {
          throw new Error(`Expected 1 sent invitation, got ${invitations.sent.length}`);
        }
        if (invitations.received.length !== 1) {
          throw new Error(`Expected 1 received invitation, got ${invitations.received.length}`);
        }
      });

      // Test 9: Credit Events and Cascading Rewards
      await this.test('Charlie has positive credit event', async () => {
        const result = await this.simulateCreditEvent(
          this.users['charlie@test.com'], 
          'LOAN_PAID_EARLY'
        );
        
        if (result.scoreChange !== 10) {
          throw new Error(`Expected score change of 10, got ${result.scoreChange}`);
        }
      });

      // Test 10: Leaderboard Verification
      await this.test('Check leaderboard after credit events', async () => {
        const leaderboard = await this.getLeaderboard('score');
        
        if (leaderboard.length < 3) {
          throw new Error(`Expected at least 3 users in leaderboard, got ${leaderboard.length}`);
        }
        
        // Charlie should be at the top with highest score
        const charlie = leaderboard.find(user => user.web3Id === this.users['charlie@test.com'].web3Id);
        if (!charlie || charlie.onChainScore < 10) {
          throw new Error('Charlie should have highest on-chain score');
        }
      });

      // Test 11: Invitation Stats
      await this.test('Verify invitation statistics', async () => {
        const stats = await this.getInvitationStats();
        
        if (stats.totalInvitations < 2) {
          throw new Error(`Expected at least 2 invitations, got ${stats.totalInvitations}`);
        }
        if (stats.acceptedInvitations < 2) {
          throw new Error(`Expected at least 2 accepted invitations, got ${stats.acceptedInvitations}`);
        }
      });

      // Test 12: Invitation Rejection
      await this.test('Alice sends invitation to new user (Dave)', async () => {
        const invitation = await this.sendInvitation(
          this.users['alice@test.com'], 
          'dave@test.com', 
          'Join us Dave!'
        );
        this.invitations.aliceToDave = invitation;
      });

      await this.test('Dave rejects invitation from Alice', async () => {
        await this.rejectInvitation(this.invitations.aliceToDave.token);
      });

      await this.test('Verify invitation status changed to rejected', async () => {
        const invitation = await this.getInvitation(this.invitations.aliceToDave.token);
        
        if (invitation.status !== 'rejected') {
          throw new Error(`Expected status 'rejected', got '${invitation.status}'`);
        }
      });

      // Test 13: Invalid Token Handling
      await this.test('Handle invalid invitation token', async () => {
        try {
          await this.getInvitation('invalid_token_123');
          throw new Error('Should have failed with invalid token');
        } catch (error) {
          if (!error.message.includes('not found')) {
            throw error;
          }
        }
      });

      // Test Results Summary
      this.log('📊 Test Results Summary', 'header');
      this.log(`Total Tests: ${this.testResults.total}`, 'info');
      this.log(`Passed: ${this.testResults.passed}`, 'success');
      this.log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'info');
      this.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`, 
        this.testResults.failed > 0 ? 'warning' : 'success');

      if (this.testResults.failed === 0) {
        this.log('🎉 ALL TESTS PASSED! Referral system is working perfectly!', 'success');
      } else {
        this.log(`⚠️  ${this.testResults.failed} tests failed. Please review the errors above.`, 'warning');
      }

    } catch (error) {
      this.log(`💥 Test suite failed with critical error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ReferralSystemTester();
  tester.runAllTests().then(() => {
    process.exit(tester.testResults.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = ReferralSystemTester;
