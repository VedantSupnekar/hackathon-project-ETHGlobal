/**
 * Deploy UserCreditRegistry Smart Contract
 * Run with: node scripts/deployUserRegistry.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function deployContract() {
  console.log('🚀 Starting UserCreditRegistry deployment...\n');
  
  try {
    // Connect to local network
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    const network = await provider.getNetwork();
    console.log(`🔗 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get deployer account
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts available for deployment');
    }
    
    const deployer = provider.getSigner(accounts[0]);
    const deployerAddress = await deployer.getAddress();
    const balance = await deployer.getBalance();
    
    console.log(`👤 Deployer: ${deployerAddress}`);
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH\n`);
    
    // Note: For this to work, you need to compile the contract first
    // This is a placeholder for the actual deployment process
    
    console.log('⚠️  CONTRACT COMPILATION REQUIRED');
    console.log('To deploy the UserCreditRegistry contract:');
    console.log('');
    console.log('1. Install Hardhat and OpenZeppelin:');
    console.log('   npm install --save-dev hardhat');
    console.log('   npm install @openzeppelin/contracts');
    console.log('');
    console.log('2. Compile the contract:');
    console.log('   npx hardhat compile');
    console.log('');
    console.log('3. Create a deployment script in scripts/deploy.js:');
    console.log('');
    console.log('   const { ethers } = require("hardhat");');
    console.log('   ');
    console.log('   async function main() {');
    console.log('     const UserCreditRegistry = await ethers.getContractFactory("UserCreditRegistry");');
    console.log('     const registry = await UserCreditRegistry.deploy();');
    console.log('     await registry.deployed();');
    console.log('     console.log("Contract deployed to:", registry.address);');
    console.log('   }');
    console.log('   ');
    console.log('   main().catch(console.error);');
    console.log('');
    console.log('4. Deploy with:');
    console.log('   npx hardhat run scripts/deploy.js --network localhost');
    console.log('');
    
    // Create a configuration file for manual deployment
    const deployConfig = {
      network: {
        name: network.name,
        chainId: network.chainId,
        rpcUrl: 'http://127.0.0.1:8545'
      },
      deployer: {
        address: deployerAddress,
        balance: ethers.utils.formatEther(balance)
      },
      contractName: 'UserCreditRegistry',
      contractPath: 'contracts/UserCreditRegistry.sol',
      deploymentInstructions: [
        'npm install --save-dev hardhat',
        'npm install @openzeppelin/contracts', 
        'npx hardhat compile',
        'npx hardhat run scripts/deploy.js --network localhost'
      ]
    };
    
    const configPath = path.join(__dirname, '..', 'deployment-config.json');
    fs.writeFileSync(configPath, JSON.stringify(deployConfig, null, 2));
    console.log(`📄 Deployment configuration saved to: ${configPath}`);
    
    return {
      success: true,
      message: 'Deployment preparation complete - follow instructions above',
      configPath
    };
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run deployment if called directly
if (require.main === module) {
  deployContract()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Deployment preparation completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Deployment preparation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = deployContract;
