// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CreditScoreOracle
 * @dev Smart contract for storing and verifying credit scores using Flare FDC Web2JSON attestations
 * Based on Flare FDC Web2JSON implementation patterns
 */

// Interface for FDC Web2JSON verification
interface IWeb2JsonVerification {
    struct Proof {
        bytes32 merkleProof;
        CreditScoreData data;
    }
    
    struct CreditScoreData {
        uint256 creditScore;
        uint256 paymentHistory;
        uint256 creditUtilization;
        uint256 creditHistoryLength;
        uint256 accountsOpen;
        uint256 recentInquiries;
        uint256 publicRecords;
        uint256 delinquencies;
        uint256 timestamp;
    }
}

contract CreditScoreOracle {
    // Events
    event CreditScoreUpdated(
        address indexed user,
        uint256 creditScore,
        string attestationId,
        uint256 timestamp
    );
    
    event AttestationVerified(
        string indexed attestationId,
        bytes32 dataHash,
        bytes32 merkleRoot,
        uint256 blockNumber
    );

    // Structs
    struct UserCreditProfile {
        uint256 creditScore;
        uint256 paymentHistory;
        uint256 creditUtilization;
        uint256 creditHistoryLength;
        uint256 accountsOpen;
        uint256 recentInquiries;
        uint256 publicRecords;
        uint256 delinquencies;
        uint256 lastUpdated;
        string attestationId;
        bool isVerified;
    }

    struct AttestationProof {
        string requestId;
        bytes32 dataHash;
        bytes32 merkleRoot;
        uint256 blockNumber;
        bytes32 transactionHash;
        uint256 timestamp;
        bool isVerified;
    }

    // State variables
    mapping(address => UserCreditProfile) public creditProfiles;
    mapping(string => AttestationProof) public attestationProofs;
    mapping(address => bool) public authorizedUpdaters;
    
    address public owner;
    uint256 public totalUsers;
    uint256 public totalAttestations;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedUpdaters[msg.sender] = true;
    }

    /**
     * @dev Update user credit score with FDC Web2JSON proof
     * @param user The user's address
     * @param proof The FDC Web2JSON proof structure
     */
    function updateCreditScoreWithProof(
        address user,
        IWeb2JsonVerification.Proof memory proof
    ) external onlyAuthorized {
        require(user != address(0), "Invalid user address");
        require(proof.data.creditScore >= 300 && proof.data.creditScore <= 850, "Invalid credit score range");
        require(proof.data.timestamp > 0, "Invalid timestamp");

        // Store the credit profile
        UserCreditProfile storage profile = creditProfiles[user];
        
        bool isNewUser = profile.lastUpdated == 0;
        
        profile.creditScore = proof.data.creditScore;
        profile.paymentHistory = proof.data.paymentHistory;
        profile.creditUtilization = proof.data.creditUtilization;
        profile.creditHistoryLength = proof.data.creditHistoryLength;
        profile.accountsOpen = proof.data.accountsOpen;
        profile.recentInquiries = proof.data.recentInquiries;
        profile.publicRecords = proof.data.publicRecords;
        profile.delinquencies = proof.data.delinquencies;
        profile.lastUpdated = block.timestamp;
        profile.isVerified = true;

        if (isNewUser) {
            totalUsers++;
        }

        emit CreditScoreUpdated(
            user,
            proof.data.creditScore,
            profile.attestationId,
            block.timestamp
        );
    }

    /**
     * @dev Store FDC attestation proof for verification
     * @param attestationId The unique attestation ID
     * @param dataHash Hash of the attested data
     * @param merkleRoot Merkle root from FDC
     * @param blockNumber Block number of attestation
     * @param transactionHash Transaction hash of attestation
     */
    function storeAttestationProof(
        string memory attestationId,
        bytes32 dataHash,
        bytes32 merkleRoot,
        uint256 blockNumber,
        bytes32 transactionHash
    ) external onlyAuthorized {
        require(bytes(attestationId).length > 0, "Invalid attestation ID");
        require(dataHash != bytes32(0), "Invalid data hash");
        require(merkleRoot != bytes32(0), "Invalid merkle root");

        AttestationProof storage proof = attestationProofs[attestationId];
        proof.requestId = attestationId;
        proof.dataHash = dataHash;
        proof.merkleRoot = merkleRoot;
        proof.blockNumber = blockNumber;
        proof.transactionHash = transactionHash;
        proof.timestamp = block.timestamp;
        proof.isVerified = true;

        totalAttestations++;

        emit AttestationVerified(
            attestationId,
            dataHash,
            merkleRoot,
            blockNumber
        );
    }

    /**
     * @dev Get user's credit profile
     * @param user The user's address
     * @return The user's complete credit profile
     */
    function getCreditProfile(address user) external view returns (UserCreditProfile memory) {
        return creditProfiles[user];
    }

    /**
     * @dev Get user's credit score only
     * @param user The user's address
     * @return The user's credit score
     */
    function getCreditScore(address user) external view returns (uint256) {
        return creditProfiles[user].creditScore;
    }

    /**
     * @dev Check if user has a verified credit profile
     * @param user The user's address
     * @return True if user has verified credit profile
     */
    function isUserVerified(address user) external view returns (bool) {
        return creditProfiles[user].isVerified && creditProfiles[user].lastUpdated > 0;
    }

    /**
     * @dev Get attestation proof details
     * @param attestationId The attestation ID
     * @return The attestation proof details
     */
    function getAttestationProof(string memory attestationId) external view returns (AttestationProof memory) {
        return attestationProofs[attestationId];
    }

    /**
     * @dev Calculate composite credit score based on multiple factors
     * @param user The user's address
     * @return Weighted composite score (0-1000 scale)
     */
    function getCompositeScore(address user) external view returns (uint256) {
        UserCreditProfile memory profile = creditProfiles[user];
        
        if (!profile.isVerified) {
            return 0;
        }

        // Weighted scoring algorithm
        uint256 baseScore = profile.creditScore; // 300-850 range
        uint256 paymentWeight = (profile.paymentHistory * 35) / 100; // 35% weight
        uint256 utilizationWeight = ((100 - profile.creditUtilization) * 30) / 100; // 30% weight (inverted)
        uint256 historyWeight = (profile.creditHistoryLength * 15) / 100; // 15% weight
        uint256 mixWeight = (profile.accountsOpen * 10) / 100; // 10% weight
        uint256 inquiryWeight = ((10 - profile.recentInquiries) * 10) / 100; // 10% weight (inverted)

        // Penalty for public records and delinquencies
        uint256 penalty = (profile.publicRecords * 50) + (profile.delinquencies * 25);

        uint256 compositeScore = baseScore + paymentWeight + utilizationWeight + 
                                historyWeight + mixWeight + inquiryWeight;
        
        if (compositeScore > penalty) {
            compositeScore -= penalty;
        } else {
            compositeScore = 0;
        }

        // Cap at 1000
        return compositeScore > 1000 ? 1000 : compositeScore;
    }

    /**
     * @dev Determine loan eligibility based on credit profile
     * @param user The user's address
     * @param loanAmount The requested loan amount
     * @return eligible True if eligible for loan
     * @return maxLoanAmount Maximum loan amount user qualifies for
     * @return interestRate Suggested interest rate (basis points)
     */
    function getLoanEligibility(address user, uint256 loanAmount) 
        external 
        view 
        returns (bool eligible, uint256 maxLoanAmount, uint256 interestRate) 
    {
        UserCreditProfile memory profile = creditProfiles[user];
        
        if (!profile.isVerified) {
            return (false, 0, 0);
        }

        uint256 compositeScore = this.getCompositeScore(user);
        
        // Determine max loan amount based on composite score
        if (compositeScore >= 750) {
            maxLoanAmount = 100000 * 1e18; // $100k
            interestRate = 500; // 5% APR
        } else if (compositeScore >= 650) {
            maxLoanAmount = 50000 * 1e18; // $50k
            interestRate = 800; // 8% APR
        } else if (compositeScore >= 550) {
            maxLoanAmount = 25000 * 1e18; // $25k
            interestRate = 1200; // 12% APR
        } else {
            maxLoanAmount = 10000 * 1e18; // $10k
            interestRate = 1800; // 18% APR
        }

        // Additional checks
        if (profile.publicRecords > 0 || profile.delinquencies > 3) {
            maxLoanAmount = maxLoanAmount / 2; // Reduce by 50%
            interestRate += 300; // Add 3% penalty
        }

        eligible = loanAmount <= maxLoanAmount && compositeScore >= 500;
        
        return (eligible, maxLoanAmount, interestRate);
    }

    /**
     * @dev Add authorized updater
     * @param updater Address to authorize
     */
    function addAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
    }

    /**
     * @dev Remove authorized updater
     * @param updater Address to remove authorization
     */
    function removeAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
    }

    /**
     * @dev Get contract statistics
     * @return totalUsers Total number of users with credit profiles
     * @return totalAttestations Total number of attestations stored
     * @return contractBalance Contract balance
     */
    function getContractStats() external view returns (uint256, uint256, uint256) {
        return (totalUsers, totalAttestations, address(this).balance);
    }

    /**
     * @dev Emergency function to pause/unpause contract (for upgrades)
     */
    bool public paused = false;
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
    }
}
