// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title IPFSCreditRegistry
 * @dev Decentralized credit registry using IPFS for data storage
 * Only stores IPFS hashes on-chain for maximum decentralization
 */
contract IPFSCreditRegistry is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _userIdCounter;
    
    // Events
    event UserRegistered(bytes32 indexed web3Id, uint256 indexed userId, string ipfsHash);
    event CreditScoreUpdated(bytes32 indexed web3Id, string ipfsHash, uint256 timestamp);
    event WalletLinked(bytes32 indexed web3Id, address indexed wallet, string ipfsHash);
    event WalletUnlinked(bytes32 indexed web3Id, address indexed wallet, uint256 timestamp);
    event DataUpdated(bytes32 indexed web3Id, string dataType, string ipfsHash);
    
    // Structs
    struct UserRecord {
        bytes32 web3Id;
        string profileIpfsHash;      // IPFS hash of user profile data
        string scoresIpfsHash;       // IPFS hash of credit scores
        string walletsIpfsHash;      // IPFS hash of linked wallets data
        string completeDataHash;     // IPFS hash of complete user dataset
        uint256 createdAt;
        uint256 lastUpdated;
        bool isActive;
        uint256 totalWallets;
        uint256 currentScore;        // Latest composite score (for quick queries)
    }
    
    struct WalletRecord {
        bytes32 ownerWeb3Id;
        string linkDataHash;         // IPFS hash of wallet linking data
        uint256 linkedAt;
        bool isActive;
    }
    
    // Mappings
    mapping(bytes32 => UserRecord) public userRecords;
    mapping(address => WalletRecord) public walletRecords;
    mapping(bytes32 => bool) public web3IdExists;
    mapping(uint256 => bytes32) public userIdToWeb3Id;
    mapping(bytes32 => string[]) public userDataHistory; // Track all IPFS hashes for a user
    
    // Constants
    uint256 public constant MAX_WALLETS_PER_USER = 10;
    uint256 public constant MIN_SCORE = 300;
    uint256 public constant MAX_SCORE = 850;
    
    // Authorized updaters (backend services)
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
     * @dev Register a new user with IPFS data
     */
    function registerUser(
        bytes32 web3Id,
        string memory profileIpfsHash
    ) external onlyAuthorized nonReentrant {
        require(!web3IdExists[web3Id], "User already exists");
        require(bytes(profileIpfsHash).length > 0, "Profile IPFS hash required");
        
        _userIdCounter.increment();
        uint256 userId = _userIdCounter.current();
        
        UserRecord storage record = userRecords[web3Id];
        record.web3Id = web3Id;
        record.profileIpfsHash = profileIpfsHash;
        record.createdAt = block.timestamp;
        record.lastUpdated = block.timestamp;
        record.isActive = true;
        record.totalWallets = 0;
        record.currentScore = 0;
        
        web3IdExists[web3Id] = true;
        userIdToWeb3Id[userId] = web3Id;
        
        // Add to data history
        userDataHistory[web3Id].push(profileIpfsHash);
        
        emit UserRegistered(web3Id, userId, profileIpfsHash);
    }
    
    /**
     * @dev Update user's credit scores with IPFS hash
     */
    function updateCreditScores(
        bytes32 web3Id,
        string memory scoresIpfsHash,
        uint256 compositeScore
    ) external onlyAuthorized nonReentrant userExists(web3Id) validScore(compositeScore) {
        require(bytes(scoresIpfsHash).length > 0, "Scores IPFS hash required");
        
        UserRecord storage record = userRecords[web3Id];
        record.scoresIpfsHash = scoresIpfsHash;
        record.currentScore = compositeScore;
        record.lastUpdated = block.timestamp;
        
        // Add to data history
        userDataHistory[web3Id].push(scoresIpfsHash);
        
        emit CreditScoreUpdated(web3Id, scoresIpfsHash, block.timestamp);
        emit DataUpdated(web3Id, "credit-scores", scoresIpfsHash);
    }
    
    /**
     * @dev Link a wallet with IPFS data
     */
    function linkWallet(
        bytes32 web3Id,
        address wallet,
        string memory linkDataHash
    ) external onlyAuthorized nonReentrant userExists(web3Id) {
        require(wallet != address(0), "Invalid wallet address");
        require(!walletRecords[wallet].isActive, "Wallet already linked");
        require(bytes(linkDataHash).length > 0, "Link data hash required");
        
        UserRecord storage userRecord = userRecords[web3Id];
        require(userRecord.totalWallets < MAX_WALLETS_PER_USER, "Max wallets reached");
        
        // Create wallet record
        walletRecords[wallet] = WalletRecord({
            ownerWeb3Id: web3Id,
            linkDataHash: linkDataHash,
            linkedAt: block.timestamp,
            isActive: true
        });
        
        // Update user record
        userRecord.totalWallets++;
        userRecord.lastUpdated = block.timestamp;
        
        // Add to data history
        userDataHistory[web3Id].push(linkDataHash);
        
        emit WalletLinked(web3Id, wallet, linkDataHash);
        emit DataUpdated(web3Id, "wallet-link", linkDataHash);
    }
    
    /**
     * @dev Unlink a wallet
     */
    function unlinkWallet(
        bytes32 web3Id,
        address wallet
    ) external onlyAuthorized nonReentrant userExists(web3Id) {
        require(walletRecords[wallet].ownerWeb3Id == web3Id, "Wallet not owned by user");
        require(walletRecords[wallet].isActive, "Wallet not active");
        
        // Deactivate wallet
        walletRecords[wallet].isActive = false;
        
        // Update user record
        UserRecord storage userRecord = userRecords[web3Id];
        userRecord.totalWallets--;
        userRecord.lastUpdated = block.timestamp;
        
        emit WalletUnlinked(web3Id, wallet, block.timestamp);
    }
    
    /**
     * @dev Update complete user dataset
     */
    function updateCompleteUserData(
        bytes32 web3Id,
        string memory completeDataHash,
        string memory walletsIpfsHash
    ) external onlyAuthorized nonReentrant userExists(web3Id) {
        require(bytes(completeDataHash).length > 0, "Complete data hash required");
        
        UserRecord storage record = userRecords[web3Id];
        record.completeDataHash = completeDataHash;
        if (bytes(walletsIpfsHash).length > 0) {
            record.walletsIpfsHash = walletsIpfsHash;
        }
        record.lastUpdated = block.timestamp;
        
        // Add to data history
        userDataHistory[web3Id].push(completeDataHash);
        if (bytes(walletsIpfsHash).length > 0) {
            userDataHistory[web3Id].push(walletsIpfsHash);
        }
        
        emit DataUpdated(web3Id, "complete-data", completeDataHash);
    }
    
    /**
     * @dev Get user record
     */
    function getUserRecord(bytes32 web3Id) external view returns (UserRecord memory) {
        require(web3IdExists[web3Id], "User does not exist");
        return userRecords[web3Id];
    }
    
    /**
     * @dev Get wallet record
     */
    function getWalletRecord(address wallet) external view returns (WalletRecord memory) {
        return walletRecords[wallet];
    }
    
    /**
     * @dev Check if wallet is linked
     */
    function isWalletLinked(address wallet) external view returns (bool) {
        return walletRecords[wallet].isActive;
    }
    
    /**
     * @dev Get user's data history (all IPFS hashes)
     */
    function getUserDataHistory(bytes32 web3Id) external view returns (string[] memory) {
        require(web3IdExists[web3Id], "User does not exist");
        return userDataHistory[web3Id];
    }
    
    /**
     * @dev Get latest IPFS hashes for a user
     */
    function getLatestUserHashes(bytes32 web3Id) external view returns (
        string memory profileHash,
        string memory scoresHash,
        string memory walletsHash,
        string memory completeHash
    ) {
        require(web3IdExists[web3Id], "User does not exist");
        UserRecord memory record = userRecords[web3Id];
        return (
            record.profileIpfsHash,
            record.scoresIpfsHash,
            record.walletsIpfsHash,
            record.completeDataHash
        );
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
     * @dev Emergency function to deactivate a user
     */
    function deactivateUser(bytes32 web3Id) external onlyOwner userExists(web3Id) {
        userRecords[web3Id].isActive = false;
    }
    
    /**
     * @dev Get total number of registered users
     */
    function getTotalUsers() external view returns (uint256) {
        return _userIdCounter.current();
    }
    
    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 totalUsers,
        uint256 totalLinkedWallets,
        uint256 usersWithScores,
        uint256 totalDataRecords
    ) {
        totalUsers = _userIdCounter.current();
        
        // Count active wallets and users with scores
        uint256 activeWallets = 0;
        uint256 scoredUsers = 0;
        uint256 dataRecords = 0;
        
        for (uint256 i = 1; i <= totalUsers; i++) {
            bytes32 web3Id = userIdToWeb3Id[i];
            if (web3Id != bytes32(0)) {
                UserRecord memory record = userRecords[web3Id];
                activeWallets += record.totalWallets;
                if (record.currentScore > 0) {
                    scoredUsers++;
                }
                dataRecords += userDataHistory[web3Id].length;
            }
        }
        
        return (totalUsers, activeWallets, scoredUsers, dataRecords);
    }
    
    /**
     * @dev Get IPFS gateway URL for verification
     */
    function getIpfsGatewayUrl(string memory ipfsHash) external pure returns (string memory) {
        return string(abi.encodePacked("https://gateway.ipfs.io/ipfs/", ipfsHash));
    }
}
