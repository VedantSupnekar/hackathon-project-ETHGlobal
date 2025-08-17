import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  userId: string;
  web3Id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  ssn: string;
  dateOfBirth?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface WalletLinkRequest {
  walletAddress: string;
  signature?: string;
}

export interface OffChainScoreRequest {
  ssn: string;
  firstName: string;
  lastName: string;
}

export interface CreditScores {
  onChain: number | null;
  offChain: number | null;
  composite: number | null;
}

export interface WalletInfo {
  address: string;
  score: number;
  profile?: string;
}

export interface PortfolioSummary {
  totalWallets: number;
  walletBreakdown: WalletInfo[];
  lastUpdate: string;
}

export interface ScoresResponse {
  scores: CreditScores;
  weights: {
    onChain: number;
    offChain: number;
  };
  portfolioSummary: PortfolioSummary;
}

// API Methods
export const authAPI = {
  register: async (data: RegisterRequest) => {
    const response = await api.post('/api/portfolio/register', data);
    return response.data;
  },

  login: async (data: LoginRequest) => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },
};

// Demo API calls
export const demoAPI = {
  resetAllData: () => api.post('/api/portfolio/demo/reset'),
  getStats: () => api.get('/api/portfolio/demo/stats'),
};

export const portfolioAPI = {
  linkWallet: async (data: WalletLinkRequest) => {
    const response = await api.post('/api/portfolio/link-wallet', data);
    return response.data;
  },

  setOffChainScore: async (data: OffChainScoreRequest) => {
    const response = await api.post('/api/portfolio/set-offchain-score', data);
    return response.data;
  },

  getScores: async (): Promise<ScoresResponse> => {
    const response = await api.get('/api/portfolio/scores');
    return response.data;
  },

  getPortfolioDetails: async () => {
    const response = await api.get('/api/portfolio/details');
    return response.data;
  },
};

export default api;
