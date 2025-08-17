// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ReferralCreditNetwork
 * @dev Manages referral relationships and credit score propagation through referral chains
 */
contract ReferralCreditNetwork is Ownable, ReentrancyGuard {
    uint256 private _eventIdCounter;
    
    // Events
    event UserRegistered(bytes32 indexed web3Id, address indexed walletAddress, bytes32 indexed referrerWeb3Id);
    event ReferralRequested(bytes32 indexed referrerWeb3Id, string indexed refereeEmail, bytes32 indexed requestId);
    event ReferralAccepted(bytes32 indexed referrerWeb3Id, bytes32 indexed refereeWeb3Id, bytes32 indexed requestId);
    event ReferralRejected(bytes32 indexed referrerWeb3Id, bytes32 indexed refereeWeb3Id, bytes32 indexed requestId);
    event CreditScoreUpdated(bytes32 indexed web3Id, uint256 oldScore, uint256 newScore, int256 change);
    event ReferralRewardDistributed(bytes32 indexed referrerWeb3Id, bytes32 indexed originUserWeb3Id, uint256 reward, uint256 depth);
    event CreditEventRecorded(uint256 indexed eventId, bytes32 indexed web3Id, int256 scoreChange, string eventType);
    
    // Structs
    struct User {
        bytes32 web3Id;
        address walletAddress;
        string email;
        bytes32 referredBy; // web3Id of referrer
        uint256 onChainScore;
        uint256 referralScore; // Score from referral rewards
        bool isRegistered;
        uint256 registeredAt;
        bytes32[] directReferrals; // Array of web3Ids of direct referrals
    }
    
    struct ReferralRequest {
        bytes32 requestId;
        bytes32 referrerWeb3Id;
        string refereeEmail;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt; // 7 days from creation
    }
    
    struct CreditEvent {
        uint256 eventId;
        bytes32 web3Id;
        int256 scoreChange;
        string eventType;
        string description;
        uint256 timestamp;
    }
    
    // Mappings
    mapping(bytes32 => User) public users;
    mapping(address => bytes32) public walletToWeb3Id;
    mapping(string => bytes32) public emailToWeb3Id;
    mapping(bytes32 => bool) public web3IdExists;
    mapping(bytes32 => ReferralRequest) public referralRequests;
    mapping(string => bytes32) public emailToPendingRequest; // Track pending requests by email
    
    // Constants
    uint256 public constant REFERRAL_REQUEST_VALIDITY = 7 days;
    uint256 public constant MAX_REFERRAL_DEPTH = 10; // Prevent infinite loops
    uint256 public constant BASE_REWARD = 1000; // 1 point = 1000 wei equivalent
    uint256 public constant DEPTH_DECAY_FACTOR = 1000; // 0.001 multiplier per depth level
    
    // Score change thresholds for rewards
    int256 public constant GOOD_CREDIT_THRESHOLD = 5; // +5 points or more
    int256 public constant BAD_CREDIT_THRESHOLD = -5; // -5 points or more
    
    // Authorized score updaters
    mapping(address => bool) public authorizedUpdaters;
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier userExists(bytes32 web3Id) {
        require(web3IdExists[web3Id], "User does not exist");
        _;
    }
    
    modifier validEmail(string memory email) {
        require(bytes(email).length > 0, "Invalid email");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        authorizedUpdaters[msg.sender] = true;
    }
    
    /**
     * @dev Register a new user in the referral network
     */
    function registerUser(
        bytes32 web3Id,
        address walletAddress,
        string memory email,
        bytes32 referrerWeb3Id
    ) external onlyAuthorized nonReentrant validEmail(email) {
        require(!web3IdExists[web3Id], "User already exists");
        require(walletAddress != address(0), "Invalid wallet address");
        require(walletToWeb3Id[walletAddress] == bytes32(0), "Wallet already linked");
        require(emailToWeb3Id[email] == bytes32(0), "Email already registered");
        
        // If referrer specified, validate they exist
        if (referrerWeb3Id != bytes32(0)) {
            require(web3IdExists[referrerWeb3Id], "Referrer does not exist");
        }
        
        // Create user
        User storage user = users[web3Id];
        user.web3Id = web3Id;
        user.walletAddress = walletAddress;
        user.email = email;
        user.referredBy = referrerWeb3Id;
        user.onChainScore = 0;
        user.referralScore = 0;
        user.isRegistered = true;
        user.registeredAt = block.timestamp;
        
        // Update mappings
        web3IdExists[web3Id] = true;
        walletToWeb3Id[walletAddress] = web3Id;
        emailToWeb3Id[email] = web3Id;
        
        // Add to referrer's direct referrals if applicable
        if (referrerWeb3Id != bytes32(0)) {
            users[referrerWeb3Id].directReferrals.push(web3Id);
        }
        
        emit UserRegistered(web3Id, walletAddress, referrerWeb3Id);
    }
    
    /**
     * @dev Create a referral request (referrer initiates)
     */
    function createReferralRequest(
        bytes32 referrerWeb3Id,
        string memory refereeEmail
    ) external onlyAuthorized nonReentrant userExists(referrerWeb3Id) validEmail(refereeEmail) {
        require(emailToWeb3Id[refereeEmail] == bytes32(0), "Email already registered");
        require(emailToPendingRequest[refereeEmail] == bytes32(0), "Pending request exists for this email");
        
        bytes32 requestId = keccak256(abi.encodePacked(referrerWeb3Id, refereeEmail, block.timestamp));
        
        ReferralRequest storage request = referralRequests[requestId];
        request.requestId = requestId;
        request.referrerWeb3Id = referrerWeb3Id;
        request.refereeEmail = refereeEmail;
        request.isActive = true;
        request.createdAt = block.timestamp;
        request.expiresAt = block.timestamp + REFERRAL_REQUEST_VALIDITY;
        
        emailToPendingRequest[refereeEmail] = requestId;
        
        emit ReferralRequested(referrerWeb3Id, refereeEmail, requestId);
    }
    
    /**
     * @dev Accept a referral request (referee accepts)
     */
    function acceptReferralRequest(
        bytes32 requestId,
        bytes32 refereeWeb3Id,
        address walletAddress
    ) external onlyAuthorized nonReentrant {
        ReferralRequest storage request = referralRequests[requestId];
        require(request.isActive, "Request not active");
        require(block.timestamp <= request.expiresAt, "Request expired");
        require(!web3IdExists[refereeWeb3Id], "User already exists");
        
        string memory refereeEmail = request.refereeEmail;
        bytes32 referrerWeb3Id = request.referrerWeb3Id;
        
        // Deactivate the request
        request.isActive = false;
        delete emailToPendingRequest[refereeEmail];
        
        // Register the user with referrer
        this.registerUser(refereeWeb3Id, walletAddress, refereeEmail, referrerWeb3Id);
        
        emit ReferralAccepted(referrerWeb3Id, refereeWeb3Id, requestId);
    }
    
    /**
     * @dev Reject a referral request (referee rejects)
     */
    function rejectReferralRequest(bytes32 requestId, string memory refereeEmail) 
        external onlyAuthorized nonReentrant validEmail(refereeEmail) {
        ReferralRequest storage request = referralRequests[requestId];
        require(request.isActive, "Request not active");
        require(keccak256(abi.encodePacked(request.refereeEmail)) == keccak256(abi.encodePacked(refereeEmail)), "Email mismatch");
        
        bytes32 referrerWeb3Id = request.referrerWeb3Id;
        
        // Deactivate the request
        request.isActive = false;
        delete emailToPendingRequest[refereeEmail];
        
        emit ReferralRejected(referrerWeb3Id, bytes32(0), requestId);
    }
    
    /**
     * @dev Update user's credit score and propagate rewards through referral chain
     */
    function updateCreditScore(
        bytes32 web3Id,
        uint256 newScore,
        int256 scoreChange,
        string memory eventType,
        string memory description
    ) external onlyAuthorized nonReentrant userExists(web3Id) {
        User storage user = users[web3Id];
        uint256 oldScore = user.onChainScore;
        user.onChainScore = newScore;
        
        // Record the credit event
        _eventIdCounter++;
        uint256 eventId = _eventIdCounter;
        
        emit CreditScoreUpdated(web3Id, oldScore, newScore, scoreChange);
        emit CreditEventRecorded(eventId, web3Id, scoreChange, eventType);
        
        // Propagate rewards/penalties through referral chain if significant change
        if (scoreChange >= GOOD_CREDIT_THRESHOLD || scoreChange <= BAD_CREDIT_THRESHOLD) {
            _propagateReferralRewards(web3Id, scoreChange, eventId);
        }
    }
    
    /**
     * @dev Internal function to propagate rewards through referral chain
     */
    function _propagateReferralRewards(bytes32 originWeb3Id, int256 scoreChange, uint256 eventId) internal {
        bytes32 currentWeb3Id = originWeb3Id;
        uint256 depth = 0;
        bool isPositive = scoreChange > 0;
        
        // Walk up the referral chain
        while (currentWeb3Id != bytes32(0) && depth < MAX_REFERRAL_DEPTH) {
            User storage currentUser = users[currentWeb3Id];
            bytes32 referrerWeb3Id = currentUser.referredBy;
            
            if (referrerWeb3Id == bytes32(0)) break; // No more referrers
            
            depth++;
            User storage referrer = users[referrerWeb3Id];
            
            // Calculate reward based on depth and whether it's positive/negative
            uint256 baseReward = BASE_REWARD;
            if (depth == 1) {
                // Direct referrer gets 1 point (1000 wei)
                baseReward = BASE_REWARD;
            } else {
                // Indirect referrers get 0.001 per level: 1000 * (1000 / 1000000) = 1
                baseReward = (BASE_REWARD * DEPTH_DECAY_FACTOR) / (1000 ** depth);
            }
            
            // Apply the reward/penalty
            if (isPositive) {
                referrer.referralScore += baseReward;
            } else {
                // Apply penalty (but don't go below 0)
                if (referrer.referralScore >= baseReward) {
                    referrer.referralScore -= baseReward;
                } else {
                    referrer.referralScore = 0;
                }
            }
            
            emit ReferralRewardDistributed(referrerWeb3Id, originWeb3Id, baseReward, depth);
            
            currentWeb3Id = referrerWeb3Id;
        }
    }
    
    /**
     * @dev Get user's complete profile
     */
    function getUserProfile(bytes32 web3Id) external view userExists(web3Id) returns (
        bytes32 web3IdOut,
        address walletAddress,
        string memory email,
        bytes32 referredBy,
        uint256 onChainScore,
        uint256 referralScore,
        uint256 totalScore,
        bytes32[] memory directReferrals,
        uint256 registeredAt
    ) {
        User storage user = users[web3Id];
        return (
            user.web3Id,
            user.walletAddress,
            user.email,
            user.referredBy,
            user.onChainScore,
            user.referralScore,
            user.onChainScore + user.referralScore,
            user.directReferrals,
            user.registeredAt
        );
    }
    
    /**
     * @dev Get referral path for a user (up to root)
     */
    function getReferralPath(bytes32 web3Id) external view userExists(web3Id) returns (bytes32[] memory path) {
        bytes32[] memory tempPath = new bytes32[](MAX_REFERRAL_DEPTH + 1);
        uint256 pathLength = 0;
        bytes32 currentWeb3Id = web3Id;
        
        while (currentWeb3Id != bytes32(0) && pathLength < MAX_REFERRAL_DEPTH + 1) {
            tempPath[pathLength] = currentWeb3Id;
            pathLength++;
            
            if (users[currentWeb3Id].referredBy == bytes32(0)) break;
            currentWeb3Id = users[currentWeb3Id].referredBy;
        }
        
        // Create properly sized array
        path = new bytes32[](pathLength);
        for (uint256 i = 0; i < pathLength; i++) {
            path[i] = tempPath[i];
        }
    }
    
    /**
     * @dev Get all direct referrals for a user
     */
    function getDirectReferrals(bytes32 web3Id) external view userExists(web3Id) returns (bytes32[] memory) {
        return users[web3Id].directReferrals;
    }
    
    /**
     * @dev Get pending referral request by email
     */
    function getPendingReferralRequest(string memory email) external view returns (
        bytes32 requestId,
        bytes32 referrerWeb3Id,
        bool isActive,
        uint256 createdAt,
        uint256 expiresAt
    ) {
        bytes32 reqId = emailToPendingRequest[email];
        if (reqId == bytes32(0)) {
            return (bytes32(0), bytes32(0), false, 0, 0);
        }
        
        ReferralRequest storage request = referralRequests[reqId];
        return (
            request.requestId,
            request.referrerWeb3Id,
            request.isActive && block.timestamp <= request.expiresAt,
            request.createdAt,
            request.expiresAt
        );
    }
    
    /**
     * @dev Check if user can be referred (email not registered and no pending request)
     */
    function canBeReferred(string memory email) external view returns (bool) {
        return emailToWeb3Id[email] == bytes32(0) && emailToPendingRequest[email] == bytes32(0);
    }
    
    /**
     * @dev Get network statistics
     */
    function getNetworkStats() external view returns (
        uint256 totalUsers,
        uint256 totalReferralRelationships,
        uint256 totalCreditEvents,
        uint256 averageReferralScore
    ) {
        totalUsers = 0;
        totalReferralRelationships = 0;
        totalCreditEvents = _eventIdCounter;
        uint256 totalReferralScore = 0;
        
        // This is expensive but provides network overview
        // In production, these would be tracked incrementally
        for (uint256 i = 0; i < 1000; i++) { // Limit iteration for gas
            bytes32 web3Id = bytes32(i);
            if (web3IdExists[web3Id]) {
                totalUsers++;
                if (users[web3Id].referredBy != bytes32(0)) {
                    totalReferralRelationships++;
                }
                totalReferralScore += users[web3Id].referralScore;
            }
        }
        
        averageReferralScore = totalUsers > 0 ? totalReferralScore / totalUsers : 0;
    }
    
    /**
     * @dev Add authorized updater
     */
    function addAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
    }
    
    /**
     * @dev Remove authorized updater
     */
    function removeAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
    }
    
    /**
     * @dev Emergency cleanup of expired requests
     */
    function cleanupExpiredRequests(bytes32[] memory requestIds) external onlyAuthorized {
        for (uint256 i = 0; i < requestIds.length; i++) {
            ReferralRequest storage request = referralRequests[requestIds[i]];
            if (request.isActive && block.timestamp > request.expiresAt) {
                request.isActive = false;
                delete emailToPendingRequest[request.refereeEmail];
            }
        }
    }
}
