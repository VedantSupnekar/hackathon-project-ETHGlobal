require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Flare Network Configuration
  flare: {
    rpcUrl: process.env.FLARE_RPC_URL || 'https://flare-api.flare.network/ext/bc/C/rpc',
    networkId: process.env.FLARE_NETWORK_ID || 14
  },
  
  // Web2JSON FDC Configuration
  fdc: {
    attestationUrl: process.env.FDC_ATTESTATION_URL || 'https://fdc-api.flare.network',
    apiKey: process.env.FDC_API_KEY || 'demo_key'
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_jwt_secret_for_development'
  },
  
  // Circle API Configuration
  circle: {
    apiKey: process.env.CIRCLE_API_KEY || 'demo_circle_key',
    baseUrl: process.env.CIRCLE_BASE_URL || 'https://api.circle.com'
  }
};
