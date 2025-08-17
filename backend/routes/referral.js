const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');

// Import contract ABI (will be generated after deployment)
let ReferralCreditNetworkABI;
try {
    const contractArtifact = require('../artifacts/contracts/ReferralCreditNetwork.sol/ReferralCreditNetwork.json');
    ReferralCreditNetworkABI = contractArtifact.abi;
} catch (error) {
    console.log('ReferralCreditNetwork ABI not found - contract may need to be compiled');
}

// Contract configuration
const REFERRAL_CONTRACT_ADDRESS = process.env.REFERRAL_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

// Initialize provider and contract
let provider, signer, referralContract;

function initializeContract() {
    if (!ReferralCreditNetworkABI) return null;
    
    provider = new ethers.JsonRpcProvider(RPC_URL);
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
    referralContract = new ethers.Contract(REFERRAL_CONTRACT_ADDRESS, ReferralCreditNetworkABI, signer);
    return referralContract;
}

/**
 * @route POST /api/referral/create-request
 * @desc Create a referral request
 */
router.post('/create-request', async (req, res) => {
    try {
        const { referrerWeb3Id, refereeEmail } = req.body;

        if (!referrerWeb3Id || !refereeEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Referrer web3Id and referee email are required' 
            });
        }

        const contract = initializeContract();
        if (!contract) {
            return res.status(500).json({ 
                success: false, 
                message: 'Contract not initialized' 
            });
        }

        // Check if referee email can be referred
        const canBeReferred = await contract.canBeReferred(refereeEmail);
        if (!canBeReferred) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email is already registered or has a pending referral request' 
            });
        }

        // Create referral request
        const tx = await contract.createReferralRequest(referrerWeb3Id, refereeEmail);
        const receipt = await tx.wait();

        // Extract request ID from events
        const event = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'ReferralRequested';
            } catch (e) {
                return false;
            }
        });

        let requestId = null;
        if (event) {
            const parsed = contract.interface.parseLog(event);
            requestId = parsed.args.requestId;
        }

        res.json({
            success: true,
            message: 'Referral request created successfully',
            data: {
                transactionHash: tx.hash,
                requestId: requestId,
                referrerWeb3Id,
                refereeEmail
            }
        });

    } catch (error) {
        console.error('Error creating referral request:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to create referral request' 
        });
    }
});

/**
 * @route POST /api/referral/accept-request
 * @desc Accept a referral request
 */
router.post('/accept-request', async (req, res) => {
    try {
        const { requestId, refereeWeb3Id, walletAddress } = req.body;

        if (!requestId || !refereeWeb3Id || !walletAddress) {
            return res.status(400).json({ 
                success: false, 
                message: 'Request ID, referee web3Id, and wallet address are required' 
            });
        }

        const contract = initializeContract();
        if (!contract) {
            return res.status(500).json({ 
                success: false, 
                message: 'Contract not initialized' 
            });
        }

        // Accept referral request
        const tx = await contract.acceptReferralRequest(requestId, refereeWeb3Id, walletAddress);
        const receipt = await tx.wait();

        res.json({
            success: true,
            message: 'Referral request accepted successfully',
            data: {
                transactionHash: tx.hash,
                requestId,
                refereeWeb3Id,
                walletAddress
            }
        });

    } catch (error) {
        console.error('Error accepting referral request:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to accept referral request' 
        });
    }
});

/**
 * @route POST /api/referral/reject-request
 * @desc Reject a referral request
 */
router.post('/reject-request', async (req, res) => {
    try {
        const { requestId, refereeEmail } = req.body;

        if (!requestId || !refereeEmail) {
            return res.status(400).json({ 
                success: false, 
                message: 'Request ID and referee email are required' 
            });
        }

        const contract = initializeContract();
        if (!contract) {
            return res.status(500).json({ 
                success: false, 
                message: 'Contract not initialized' 
            });
        }

        // Reject referral request
        const tx = await contract.rejectReferralRequest(requestId, refereeEmail);
        const receipt = await tx.wait();

        res.json({
            success: true,
            message: 'Referral request rejected successfully',
            data: {
                transactionHash: tx.hash,
                requestId,
                refereeEmail
            }
        });

    } catch (error) {
        console.error('Error rejecting referral request:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to reject referral request' 
        });
    }
});

/**
 * @route GET /api/referral/pending-request/:email
 * @desc Get pending referral request for an email
 */
router.get('/pending-request/:email', async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const contract = initializeContract();
        if (!contract) {
            return res.status(500).json({ 
                success: false, 
                message: 'Contract not initialized' 
            });
        }

        // Get pending referral request
        const request = await contract.getPendingReferralRequest(email);
        
        const [requestId, referrerWeb3Id, isActive, createdAt, expiresAt] = request;

        if (!isActive || requestId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            return res.json({
                success: true,
                message: 'No pending referral request found',
                data: null
            });
        }

        // Get referrer details if needed
        let referrerDetails = null;
        try {
            const referrerProfile = await contract.getUserProfile(referrerWeb3Id);
            referrerDetails = {
                web3Id: referrerProfile.web3IdOut,
                email: referrerProfile.email,
                walletAddress: referrerProfile.walletAddress
            };
        } catch (error) {
            console.log('Could not fetch referrer details:', error.message);
        }

        res.json({
            success: true,
            message: 'Pending referral request found',
            data: {
                requestId,
                referrerWeb3Id,
                referrerDetails,
                isActive,
                createdAt: createdAt.toString(),
                expiresAt: expiresAt.toString(),
                email
            }
        });

    } catch (error) {
        console.error('Error getting pending referral request:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to get pending referral request' 
        });
    }
});

/**
 * @route GET /api/referral/user-profile/:web3Id
 * @desc Get user's referral profile
 */
router.get('/user-profile/:web3Id', async (req, res) => {
    try {
        const { web3Id } = req.params;

        if (!web3Id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Web3 ID is required' 
            });
        }

        const contract = initializeContract();
        if (!contract) {
            return res.status(500).json({ 
                success: false, 
                message: 'Contract not initialized' 
            });
        }

        // Get user profile
        const profile = await contract.getUserProfile(web3Id);
        const [web3IdOut, walletAddress, email, referredBy, onChainScore, referralScore, totalScore, directReferrals, registeredAt] = profile;

        // Get referral path
        const referralPath = await contract.getReferralPath(web3Id);

        res.json({
            success: true,
            message: 'User profile retrieved successfully',
            data: {
                web3Id: web3IdOut,
                walletAddress,
                email,
                referredBy: referredBy === '0x0000000000000000000000000000000000000000000000000000000000000000' ? null : referredBy,
                onChainScore: onChainScore.toString(),
                referralScore: referralScore.toString(),
                totalScore: totalScore.toString(),
                directReferrals: directReferrals.map(id => id.toString()),
                referralPath: referralPath.map(id => id.toString()),
                registeredAt: registeredAt.toString(),
                networkDepth: referralPath.length - 1
            }
        });

    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to get user profile' 
        });
    }
});

/**
 * @route GET /api/referral/network-stats
 * @desc Get referral network statistics
 */
router.get('/network-stats', async (req, res) => {
    try {
        const contract = initializeContract();
        if (!contract) {
            return res.status(500).json({ 
                success: false, 
                message: 'Contract not initialized' 
            });
        }

        // Get network statistics
        const stats = await contract.getNetworkStats();
        const [totalUsers, totalReferralRelationships, totalCreditEvents, averageReferralScore] = stats;

        res.json({
            success: true,
            message: 'Network statistics retrieved successfully',
            data: {
                totalUsers: totalUsers.toString(),
                totalReferralRelationships: totalReferralRelationships.toString(),
                totalCreditEvents: totalCreditEvents.toString(),
                averageReferralScore: averageReferralScore.toString()
            }
        });

    } catch (error) {
        console.error('Error getting network stats:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to get network statistics' 
        });
    }
});

/**
 * @route POST /api/referral/update-credit-score
 * @desc Update user's credit score and propagate rewards
 */
router.post('/update-credit-score', async (req, res) => {
    try {
        const { web3Id, newScore, scoreChange, eventType, description } = req.body;

        if (!web3Id || newScore === undefined || scoreChange === undefined || !eventType) {
            return res.status(400).json({ 
                success: false, 
                message: 'Web3 ID, new score, score change, and event type are required' 
            });
        }

        const contract = initializeContract();
        if (!contract) {
            return res.status(500).json({ 
                success: false, 
                message: 'Contract not initialized' 
            });
        }

        // Update credit score
        const tx = await contract.updateCreditScore(
            web3Id,
            newScore,
            scoreChange,
            eventType,
            description || eventType
        );
        const receipt = await tx.wait();

        // Extract events from receipt
        const events = receipt.logs.map(log => {
            try {
                return contract.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).filter(event => event !== null);

        res.json({
            success: true,
            message: 'Credit score updated successfully',
            data: {
                transactionHash: tx.hash,
                web3Id,
                newScore,
                scoreChange,
                eventType,
                events: events.map(e => ({
                    name: e.name,
                    args: Object.keys(e.args).reduce((acc, key) => {
                        if (isNaN(key)) {
                            acc[key] = e.args[key].toString();
                        }
                        return acc;
                    }, {})
                }))
            }
        });

    } catch (error) {
        console.error('Error updating credit score:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to update credit score' 
        });
    }
});

/**
 * @route GET /api/referral/can-be-referred/:email
 * @desc Check if an email can be referred
 */
router.get('/can-be-referred/:email', async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        const contract = initializeContract();
        if (!contract) {
            return res.status(500).json({ 
                success: false, 
                message: 'Contract not initialized' 
            });
        }

        const canBeReferred = await contract.canBeReferred(email);

        res.json({
            success: true,
            message: canBeReferred ? 'Email can be referred' : 'Email cannot be referred',
            data: {
                email,
                canBeReferred
            }
        });

    } catch (error) {
        console.error('Error checking if email can be referred:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Failed to check referral eligibility' 
        });
    }
});

module.exports = router;
