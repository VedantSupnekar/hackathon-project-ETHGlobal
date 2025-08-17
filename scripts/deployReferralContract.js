const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('🚀 Starting ReferralCreditNetwork contract deployment...\n');

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log('📝 Deploying contracts with account:', deployer.address);
    
    // Check deployer balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log('💰 Account balance:', ethers.formatEther(balance), 'ETH\n');

    try {
        // Deploy ReferralCreditNetwork contract
        console.log('📦 Deploying ReferralCreditNetwork contract...');
        const ReferralCreditNetwork = await ethers.getContractFactory('ReferralCreditNetwork');
        const referralContract = await ReferralCreditNetwork.deploy();
        
        await referralContract.waitForDeployment();
        const contractAddress = await referralContract.getAddress();
        
        console.log('✅ ReferralCreditNetwork deployed to:', contractAddress);
        console.log('🔗 Transaction hash:', referralContract.deploymentTransaction().hash);

        // Verify deployment
        console.log('\n🔍 Verifying deployment...');
        const owner = await referralContract.owner();
        console.log('👑 Contract owner:', owner);
        
        const isAuthorized = await referralContract.authorizedUpdaters(deployer.address);
        console.log('✅ Deployer authorized:', isAuthorized);

        // Save deployment info
        const deploymentInfo = {
            network: 'localhost', // Update based on network
            contractAddress: contractAddress,
            deployerAddress: deployer.address,
            deploymentHash: referralContract.deploymentTransaction().hash,
            deployedAt: new Date().toISOString(),
            contractName: 'ReferralCreditNetwork',
            abi: ReferralCreditNetwork.interface.formatJson()
        };

        // Create deployments directory if it doesn't exist
        const deploymentsDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        // Save deployment info
        const deploymentPath = path.join(deploymentsDir, 'referral-contract.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log('📄 Deployment info saved to:', deploymentPath);

        // Update subgraph configuration
        const subgraphConfigPath = path.join(__dirname, '..', 'subgraph', 'subgraph.yaml');
        if (fs.existsSync(subgraphConfigPath)) {
            let subgraphConfig = fs.readFileSync(subgraphConfigPath, 'utf8');
            
            // Replace contract address
            subgraphConfig = subgraphConfig.replace(
                /address: "0x[a-fA-F0-9]{40}"/,
                `address: "${contractAddress}"`
            );
            
            fs.writeFileSync(subgraphConfigPath, subgraphConfig);
            console.log('📊 Updated subgraph configuration with contract address');
        }

        // Create .env update instructions
        console.log('\n📋 Environment Variables to Update:');
        console.log('Add these to your .env file:');
        console.log(`REFERRAL_CONTRACT_ADDRESS=${contractAddress}`);
        console.log(`REFERRAL_CONTRACT_OWNER=${owner}`);

        // Test basic contract functionality
        console.log('\n🧪 Testing basic contract functionality...');
        
        try {
            const networkStats = await referralContract.getNetworkStats();
            console.log('📊 Initial network stats:');
            console.log('  - Total users:', networkStats[0].toString());
            console.log('  - Total referral relationships:', networkStats[1].toString());
            console.log('  - Total credit events:', networkStats[2].toString());
            console.log('  - Average referral score:', networkStats[3].toString());
        } catch (error) {
            console.log('⚠️  Could not fetch network stats (this is normal for a new contract)');
        }

        console.log('\n✅ ReferralCreditNetwork deployment completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Update your .env file with the contract address');
        console.log('2. Deploy the subgraph with: npm run deploy-subgraph');
        console.log('3. Start the backend server to test the referral API');
        console.log('4. Test the referral system with the frontend');

        return {
            contractAddress,
            deploymentHash: referralContract.deploymentTransaction().hash,
            owner
        };

    } catch (error) {
        console.error('❌ Deployment failed:', error);
        throw error;
    }
}

// Execute deployment
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('❌ Deployment script failed:', error);
            process.exit(1);
        });
}

module.exports = main;
