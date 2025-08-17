import { BigInt, Bytes, log } from "@graphprotocol/graph-ts"
import {
  UserRegistered,
  ReferralRequested,
  ReferralAccepted,
  ReferralRejected,
  CreditScoreUpdated,
  ReferralRewardDistributed,
  CreditEventRecorded
} from "../generated/ReferralCreditNetwork/ReferralCreditNetwork"
import {
  User,
  ReferralRelationship,
  CreditEvent,
  ReferralReward,
  ReferralPath,
  NetworkStats,
  DailyStats,
  UserMetrics,
  ReferralCode
} from "../generated/schema"

// Constants
const NETWORK_STATS_ID = "network-stats"
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export function handleUserRegistered(event: UserRegistered): void {
  let user = new User(event.params.web3Id.toHexString())
  
  user.web3Id = event.params.web3Id
  user.walletAddress = event.params.walletAddress
  user.onChainScore = BigInt.fromI32(0)
  user.referralScore = BigInt.fromI32(0)
  user.isRegistered = true
  user.registeredAt = event.block.timestamp
  user.totalReferrals = 0
  user.networkDepth = 0
  user.totalRewardsEarned = BigInt.fromI32(0)
  user.averageCreditScore = BigInt.fromI32(0).toBigDecimal()

  // Set referrer if provided
  if (event.params.referrerWeb3Id.toHexString() != ZERO_ADDRESS) {
    let referrerId = event.params.referrerWeb3Id.toHexString()
    user.referredBy = referrerId
    
    // Update referrer's total referrals
    let referrer = User.load(referrerId)
    if (referrer) {
      referrer.totalReferrals = referrer.totalReferrals + 1
      referrer.save()
    }
    
    // Create referral relationship
    let relationshipId = referrerId + "-" + user.id
    let relationship = new ReferralRelationship(relationshipId)
    relationship.referrer = referrerId
    relationship.referee = user.id
    relationship.createdAt = event.block.timestamp
    relationship.depth = calculateNetworkDepth(event.params.referrerWeb3Id) + 1
    relationship.isActive = true
    relationship.save()
    
    // Set user's network depth
    user.networkDepth = relationship.depth
    
    // Update/create referral path
    updateReferralPath(event.params.web3Id, event.params.referrerWeb3Id)
  }

  user.save()
  
  // Update network stats
  updateNetworkStats(event.block.timestamp, "USER_REGISTERED")
  
  // Update daily stats
  updateDailyStats(event.block.timestamp, "NEW_USER")
  
  // Initialize user metrics
  initializeUserMetrics(user.id, event.block.timestamp)
}

export function handleReferralAccepted(event: ReferralAccepted): void {
  // This event is emitted after UserRegistered, so the relationship should already exist
  // We can use this to track acceptance events specifically
  log.info("Referral accepted: referrer {} referee {} request {}", [
    event.params.referrerWeb3Id.toHexString(),
    event.params.refereeWeb3Id.toHexString(),
    event.params.requestId.toHexString()
  ])
  
  updateNetworkStats(event.block.timestamp, "REFERRAL_ACCEPTED")
  updateDailyStats(event.block.timestamp, "NEW_REFERRAL")
}

export function handleCreditScoreUpdated(event: CreditScoreUpdated): void {
  let user = User.load(event.params.web3Id.toHexString())
  if (!user) {
    log.warning("User not found for credit score update: {}", [event.params.web3Id.toHexString()])
    return
  }
  
  user.onChainScore = event.params.newScore
  user.averageCreditScore = user.onChainScore.plus(user.referralScore).toBigDecimal().div(BigInt.fromI32(2).toBigDecimal())
  user.save()
  
  // Update user metrics
  updateUserMetrics(user.id, event.params.change, event.block.timestamp)
}

export function handleCreditEventRecorded(event: CreditEventRecorded): void {
  let creditEvent = new CreditEvent(event.params.eventId.toString())
  
  creditEvent.eventId = event.params.eventId
  creditEvent.user = event.params.web3Id.toHexString()
  creditEvent.scoreChange = event.params.scoreChange
  creditEvent.timestamp = event.block.timestamp
  creditEvent.eventType = event.params.eventType
  creditEvent.description = event.params.eventType // Using eventType as description for now
  
  creditEvent.save()
  
  updateNetworkStats(event.block.timestamp, "CREDIT_EVENT")
  updateDailyStats(event.block.timestamp, "CREDIT_EVENT")
}

export function handleReferralRewardDistributed(event: ReferralRewardDistributed): void {
  let rewardId = event.params.originUserWeb3Id.toHexString() + "-" + 
                 event.params.referrerWeb3Id.toHexString() + "-" + 
                 event.params.depth.toString()
  
  let reward = new ReferralReward(rewardId)
  reward.referrer = event.params.referrerWeb3Id.toHexString()
  reward.originUser = event.params.originUserWeb3Id.toHexString()
  reward.reward = event.params.reward
  reward.isPenalty = false // Determine based on context if needed
  reward.depth = event.params.depth.toI32()
  reward.timestamp = event.block.timestamp
  reward.effectiveReward = reward.reward
  
  reward.save()
  
  // Update referrer's referral score
  let referrer = User.load(event.params.referrerWeb3Id.toHexString())
  if (referrer) {
    referrer.referralScore = referrer.referralScore.plus(event.params.reward)
    referrer.totalRewardsEarned = referrer.totalRewardsEarned.plus(event.params.reward)
    referrer.averageCreditScore = referrer.onChainScore.plus(referrer.referralScore).toBigDecimal().div(BigInt.fromI32(2).toBigDecimal())
    referrer.save()
  }
  
  updateNetworkStats(event.block.timestamp, "REWARD_DISTRIBUTED")
}

// Helper functions

function calculateNetworkDepth(web3Id: Bytes): i32 {
  // This would require querying the contract or tracking depth in the subgraph
  // For now, return 0 and update with proper logic
  return 0
}

function updateReferralPath(userWeb3Id: Bytes, referrerWeb3Id: Bytes): void {
  let pathId = userWeb3Id.toHexString()
  let path = new ReferralPath(pathId)
  
  path.user = userWeb3Id.toHexString()
  path.path = [userWeb3Id] // Would build full path in production
  path.depth = 1 // Would calculate actual depth
  path.updatedAt = BigInt.fromI32(0) // Would use block timestamp
  
  path.save()
}

function updateNetworkStats(timestamp: BigInt, eventType: string): void {
  let stats = NetworkStats.load(NETWORK_STATS_ID)
  if (!stats) {
    stats = new NetworkStats(NETWORK_STATS_ID)
    stats.totalUsers = BigInt.fromI32(0)
    stats.totalReferralRelationships = BigInt.fromI32(0)
    stats.totalCreditEvents = BigInt.fromI32(0)
    stats.totalRewardsDistributed = BigInt.fromI32(0)
    stats.averageNetworkDepth = BigInt.fromI32(0).toBigDecimal()
  }
  
  if (eventType == "USER_REGISTERED") {
    stats.totalUsers = stats.totalUsers.plus(BigInt.fromI32(1))
  } else if (eventType == "REFERRAL_ACCEPTED") {
    stats.totalReferralRelationships = stats.totalReferralRelationships.plus(BigInt.fromI32(1))
  } else if (eventType == "CREDIT_EVENT") {
    stats.totalCreditEvents = stats.totalCreditEvents.plus(BigInt.fromI32(1))
  } else if (eventType == "REWARD_DISTRIBUTED") {
    stats.totalRewardsDistributed = stats.totalRewardsDistributed.plus(BigInt.fromI32(1))
  }
  
  stats.lastUpdated = timestamp
  stats.save()
}

function updateDailyStats(timestamp: BigInt, eventType: string): void {
  let dayId = timestamp.toI32() / 86400 // Convert to days since epoch
  let dateString = dayId.toString()
  
  let dailyStats = DailyStats.load(dateString)
  if (!dailyStats) {
    dailyStats = new DailyStats(dateString)
    dailyStats.date = dateString
    dailyStats.newUsers = BigInt.fromI32(0)
    dailyStats.newReferrals = BigInt.fromI32(0)
    dailyStats.creditEvents = BigInt.fromI32(0)
    dailyStats.rewardsDistributed = BigInt.fromI32(0)
    dailyStats.averageScoreChange = BigInt.fromI32(0).toBigDecimal()
  }
  
  if (eventType == "NEW_USER") {
    dailyStats.newUsers = dailyStats.newUsers.plus(BigInt.fromI32(1))
  } else if (eventType == "NEW_REFERRAL") {
    dailyStats.newReferrals = dailyStats.newReferrals.plus(BigInt.fromI32(1))
  } else if (eventType == "CREDIT_EVENT") {
    dailyStats.creditEvents = dailyStats.creditEvents.plus(BigInt.fromI32(1))
  }
  
  dailyStats.save()
}

function initializeUserMetrics(userId: string, timestamp: BigInt): void {
  let metrics = new UserMetrics(userId)
  
  metrics.user = userId
  metrics.directReferrals = 0
  metrics.indirectReferrals = 0
  metrics.maxDepthBelow = 0
  metrics.totalScoreChanges = BigInt.fromI32(0)
  metrics.positiveEvents = 0
  metrics.negativeEvents = 0
  metrics.averageScoreChange = BigInt.fromI32(0).toBigDecimal()
  metrics.totalRewardsEarned = BigInt.fromI32(0)
  metrics.totalPenaltiesReceived = BigInt.fromI32(0)
  metrics.netRewardEarnings = BigInt.fromI32(0)
  metrics.lastActivityAt = timestamp
  metrics.daysSinceRegistration = 0
  metrics.referralRank = 0
  metrics.scoreRank = 0
  metrics.rewardRank = 0
  
  metrics.save()
}

function updateUserMetrics(userId: string, scoreChange: BigInt, timestamp: BigInt): void {
  let metrics = UserMetrics.load(userId)
  if (!metrics) {
    initializeUserMetrics(userId, timestamp)
    metrics = UserMetrics.load(userId)!
  }
  
  metrics.totalScoreChanges = metrics.totalScoreChanges.plus(scoreChange.abs())
  
  if (scoreChange.gt(BigInt.fromI32(0))) {
    metrics.positiveEvents = metrics.positiveEvents + 1
  } else if (scoreChange.lt(BigInt.fromI32(0))) {
    metrics.negativeEvents = metrics.negativeEvents + 1
  }
  
  // Update average score change
  let totalEvents = metrics.positiveEvents + metrics.negativeEvents
  if (totalEvents > 0) {
    metrics.averageScoreChange = metrics.totalScoreChanges.toBigDecimal().div(BigInt.fromI32(totalEvents).toBigDecimal())
  }
  
  metrics.lastActivityAt = timestamp
  metrics.save()
}
