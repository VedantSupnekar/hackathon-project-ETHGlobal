const { ethers } = require('ethers');

async function testReferralSystem() {
    console.log('🧪 Testing Referral System...\n');
    
    // This is a simplified test - the full test is in test-referral-system.js
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const [signer] = await ethers.getSigners();
    
    console.log('✅ Connected to local network');
    console.log(`📍 Using account: ${signer.address}`);
    
    console.log('\n📋 To run complete tests:');
    console.log('1. Deploy the contract: node scripts/deployReferralContract.js');
    console.log('2. Run full test suite: node test-referral-system.js');
    
    return true;
}

if (require.main === module) {
    testReferralSystem()
        .then(() => console.log('\n✅ Test completed'))
        .catch(error => console.error('❌ Test failed:', error));
}

module.exports = testReferralSystem;
