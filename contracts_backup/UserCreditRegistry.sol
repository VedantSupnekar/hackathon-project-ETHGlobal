// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title UserCreditRegistry
 * @dev Secure on-chain storage for user credit data and wallet mappings
 */
contract UserCreditRegistry is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _userIdCounter;
    
    // Events
    event UserRegistered(bytes32 indexed web3Id, uint256 indexed userId, string email);
    event WalletLinked(bytes32 indexed web3Id, address indexed wallet, uint256 timestamp);
    event WalletUnlinked(bytes32 indexed web3Id, address indexed wallet, uint256 timestamp);
    event OnChainScoreUpdated(bytes32 indexed web3Id, uint256 newScore, uint256 timestamp);
    event OffChainScoreUpdated(bytes32 indexed web3Id, uint256 newScore, string attestationId, uint256 timestamp);
    event CompositeScoreUpdated(bytes32 indexed web3Id, uint256 newScore, uint256 timestamp);
    
    // Structs
    struct UserProfile {
        bytes32 web3Id;
        string email;
        string firstName;
        string lastName;
        uint256 onChainScore;
        uint256 offChainScore;
        uint256 compositeScore;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isActive;
        address[] linkedWallets;
        string fdcAttestationId;
    }
    
    struct WalletInfo {
        bytes32 ownerWeb3Id;
        uint256 onChainScore;
        uint256 linkedAt;
        bool isActive;
    }
    
    // Mappings
    mapping(bytes32 => UserProfile) public userProfiles;
    mapping(address => WalletInfo) public walletRegistry;
    mapping(bytes32 => bool) public web3IdExists;
    mapping(string => bytes32) public emailToWeb3Id;
    mapping(uint256 => bytes32) public userIdToWeb3Id;
    
    // Constants
    uint256 public constant MAX_WALLETS_PER_USER = 10;
    uint256 public constant MIN_SCORE = 300;
    uint256 public constant MAX_SCORE = 850;
    
    // Authorized score updaters (backend services)
    mapping(address => bool) public authorizedUpdaters;
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier validScore(uint256 score) {
        require(score >= MIN_SCORE && score <= MAX_SCORE, "Invalid score range");
        _;
    }
    
    modifier userExists(bytes32 web3Id) {
        require(web3IdExists[web3Id], "User does not exist");
        _;
    }
    
    constructor() {
        // Owner is automatically authorized
        authorizedUpdaters[msg.sender] = true;
    }
    
    /**
     * @dev Register a new user with Web3 ID
     */
    function registerUser(
        bytes32 web3Id,
        string memory email,
        string memory firstName,
        string memory lastName
    ) external onlyAuthorized nonReentrant {
        require(!web3IdExists[web3Id], "User already exists");
        require(bytes(email).length > 0, "Email required");
        require(emailToWeb3Id[email] == bytes32(0), "Email already registered");
        
        _userIdCounter.increment();
        uint256 userId = _userIdCounter.current();
        
        UserProfile storage profile = userProfiles[web3Id];
        profile.web3Id = web3Id;
        profile.email = email;
        profile.firstName = firstName;
        profile.lastName = lastName;
        profile.onChainScore = 0;
        profile.offChainScore = 0;
        profile.compositeScore = 0;
        profile.createdAt = block.timestamp;
        profile.lastUpdated = block.timestamp;
        profile.isActive = true;
        
        web3IdExists[web3Id] = true;
        emailToWeb3Id[email] = web3Id;
        userIdToWeb3Id[userId] = web3Id;
        
        emit UserRegistered(web3Id, userId, email);
    }
    
    /**
     * @dev Link a wallet to a user
     */
    function linkWallet(
        bytes32 web3Id,
        address wallet
    ) external onlyAuthorized nonReentrant userExists(web3Id) {
        require(wallet != address(0), "Invalid wallet address");
        require(walletRegistry[wallet].ownerWeb3Id == bytes32(0), "Wallet already linked");
        
        UserProfile storage profile = userProfiles[web3Id];
        require(profile.linkedWallets.length < MAX_WALLETS_PER_USER, "Max wallets reached");
        
        // Add to user's wallet list
        profile.linkedWallets.push(wallet);
        profile.lastUpdated = block.timestamp;
        
        // Register wallet
        walletRegistry[wallet] = WalletInfo({
            ownerWeb3Id: web3Id,
            onChainScore: 0,
            linkedAt: block.timestamp,
            isActive: true
        });
        
        emit WalletLinked(web3Id, wallet, block.timestamp);
    }
    
    /**
     * @dev Unlink a wallet from a user
     */
    function unlinkWallet(
        bytes32 web3Id,
        address wallet
    ) external onlyAuthorized nonReentrant userExists(web3Id) {
        require(walletRegistry[wallet].ownerWeb3Id == web3Id, "Wallet not owned by user");
        
        UserProfile storage profile = userProfiles[web3Id];
        
        // Remove from user's wallet list
        for (uint i = 0; i < profile.linkedWallets.length; i++) {
            if (profile.linkedWallets[i] == wallet) {
                profile.linkedWallets[i] = profile.linkedWallets[profile.linkedWallets.length - 1];
                profile.linkedWallets.pop();
                break;
            }
        }
        
        // Deactivate wallet registration
        walletRegistry[wallet].isActive = false;
        profile.lastUpdated = block.timestamp;
        
        emit WalletUnlinked(web3Id, wallet, block.timestamp);
    }
    
    /**
     * @dev Update on-chain score for a user
     */
    function updateOnChainScore(
        bytes32 web3Id,
        uint256 newScore
    ) external onlyAuthorized nonReentrant userExists(web3Id) validScore(newScore) {
        UserProfile storage profile = userProfiles[web3Id];
        profile.onChainScore = newScore;
        profile.lastUpdated = block.timestamp;
        
        emit OnChainScoreUpdated(web3Id, newScore, block.timestamp);
    }
    
    /**
     * @dev Update off-chain score for a user with FDC attestation
     */
    function updateOffChainScore(
        bytes32 web3Id,
        uint256 newScore,
        string memory attestationId
    ) external onlyAuthorized nonReentrant userExists(web3Id) validScore(newScore) {
        UserProfile storage profile = userProfiles[web3Id];
        profile.offChainScore = newScore;
        profile.fdcAttestationId = attestationId;
        profile.lastUpdated = block.timestamp;
        
        emit OffChainScoreUpdated(web3Id, newScore, attestationId, block.timestamp);
    }
    
    /**
     * @dev Update composite score for a user
     */
    function updateCompositeScore(
        bytes32 web3Id,
        uint256 newScore
    ) external onlyAuthorized nonReentrant userExists(web3Id) validScore(newScore) {
        UserProfile storage profile = userProfiles[web3Id];
        profile.compositeScore = newScore;
        profile.lastUpdated = block.timestamp;
        
        emit CompositeScoreUpdated(web3Id, newScore, block.timestamp);
    }
    
    /**
     * @dev Get user profile by Web3 ID
     */
    function getUserProfile(bytes32 web3Id) external view returns (UserProfile memory) {
        require(web3IdExists[web3Id], "User does not exist");
        return userProfiles[web3Id];
    }
    
    /**
     * @dev Get wallet info
     */
    function getWalletInfo(address wallet) external view returns (WalletInfo memory) {
        return walletRegistry[wallet];
    }
    
    /**
     * @dev Check if wallet is linked to any user
     */
    function isWalletLinked(address wallet) external view returns (bool) {
        return walletRegistry[wallet].ownerWeb3Id != bytes32(0) && walletRegistry[wallet].isActive;
    }
    
    /**
     * @dev Get user's linked wallets
     */
    function getUserWallets(bytes32 web3Id) external view returns (address[] memory) {
        require(web3IdExists[web3Id], "User does not exist");
        return userProfiles[web3Id].linkedWallets;
    }
    
    /**
     * @dev Get user by email
     */
    function getUserByEmail(string memory email) external view returns (UserProfile memory) {
        bytes32 web3Id = emailToWeb3Id[email];
        require(web3Id != bytes32(0), "Email not registered");
        return userProfiles[web3Id];
    }
    
    /**
     * @dev Add authorized score updater
     */
    function addAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = true;
    }
    
    /**
     * @dev Remove authorized score updater
     */
    function removeAuthorizedUpdater(address updater) external onlyOwner {
        authorizedUpdaters[updater] = false;
    }
    
    /**
     * @dev Emergency function to deactivate a user
     */
    function deactivateUser(bytes32 web3Id) external onlyOwner userExists(web3Id) {
        userProfiles[web3Id].isActive = false;
    }
    
    /**
     * @dev Get total number of registered users
     */
    function getTotalUsers() external view returns (uint256) {
        return _userIdCounter.current();
    }
    
    /**
     * @dev Get contract stats
     */
    function getContractStats() external view returns (
        uint256 totalUsers,
        uint256 totalLinkedWallets,
        uint256 usersWithScores
    ) {
        totalUsers = _userIdCounter.current();
        
        // Count linked wallets and users with scores
        totalLinkedWallets = 0;
        usersWithScores = 0;
        
        for (uint256 i = 1; i <= totalUsers; i++) {
            bytes32 web3Id = userIdToWeb3Id[i];
            if (web3Id != bytes32(0)) {
                UserProfile storage profile = userProfiles[web3Id];
                totalLinkedWallets += profile.linkedWallets.length;
                if (profile.compositeScore > 0) {
                    usersWithScores++;
                }
            }
        }
    }
}
