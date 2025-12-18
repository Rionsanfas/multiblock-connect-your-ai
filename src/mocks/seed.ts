import type { Board, Block, Message, Connection, ApiKey, LtdOffer, PricingPlan, BoardAddon, User } from '@/types';

// ============================================
// PRICING PLANS - TODO: Replace with Supabase data
// ============================================
export const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free / Starter',
    tier: 'free',
    price_cents: 0,
    billing_period: 'monthly',
    boards: 1,
    blocks_per_board: 3,
    storage_mb: 100,
    seats: 1,
    features: [
      '1 board',
      '3 blocks per board',
      '100 MB storage',
      'Basic AI models',
      'Community support',
    ],
    badge: 'Free Forever',
  },
  {
    id: 'pro-50',
    name: 'Pro 50',
    tier: 'pro',
    price_cents: 9900, // $99/year
    billing_period: 'yearly',
    boards: 50,
    blocks_per_board: 'unlimited',
    storage_mb: 5120, // 5 GB
    seats: 1,
    features: [
      '50 boards',
      'Unlimited blocks',
      '5 GB storage',
      'All AI models',
      'Priority support',
      'Export to JSON',
      'API access',
    ],
    badge: 'Yearly subscription',
  },
  {
    id: 'pro-100',
    name: 'Pro 100',
    tier: 'pro',
    price_cents: 14900, // $149/year
    billing_period: 'yearly',
    boards: 100,
    blocks_per_board: 'unlimited',
    storage_mb: 10240, // 10 GB
    seats: 1,
    features: [
      '100 boards',
      'Unlimited blocks',
      '10 GB storage',
      'All AI models',
      'Priority support',
      'Export to JSON',
      'API access',
      'Custom templates',
    ],
    highlight: true,
    badge: 'Best Value',
  },
  {
    id: 'team-50',
    name: 'Team 50',
    tier: 'team',
    price_cents: 12900, // $129/year
    billing_period: 'yearly',
    boards: 50,
    blocks_per_board: 'unlimited',
    storage_mb: 20480, // 20 GB
    seats: 5,
    features: [
      '50 boards',
      'Unlimited blocks',
      '20 GB storage',
      '5 team seats',
      'All AI models',
      'Team collaboration',
      'Admin dashboard',
      'Priority support',
    ],
    badge: 'Yearly subscription for teams',
  },
  {
    id: 'team-100',
    name: 'Team 100',
    tier: 'team',
    price_cents: 16900, // $169/year
    billing_period: 'yearly',
    boards: 100,
    blocks_per_board: 'unlimited',
    storage_mb: 30720, // 30 GB
    seats: 10,
    features: [
      '100 boards',
      'Unlimited blocks',
      '30 GB storage',
      '10 team seats',
      'All AI models',
      'Team collaboration',
      'Admin dashboard',
      'SSO integration',
      'Priority support',
    ],
    badge: 'Yearly subscription for teams',
  },
];

// ============================================
// BOARD ADD-ONS - TODO: Replace with Supabase data
// ============================================
export const boardAddons: BoardAddon[] = [
  {
    id: 'addon-5',
    name: '5 Extra Boards',
    boards: 5,
    storage_mb: 500,
    price_cents: 500, // $5
  },
  {
    id: 'addon-20',
    name: '20 Extra Boards',
    boards: 20,
    storage_mb: 2048, // 2 GB
    price_cents: 1500, // $15
  },
  {
    id: 'addon-50',
    name: '50 Extra Boards',
    boards: 50,
    storage_mb: 5120, // 5 GB
    price_cents: 3000, // $30
  },
  {
    id: 'addon-100',
    name: '100 Extra Boards',
    boards: 100,
    storage_mb: 10240, // 10 GB
    price_cents: 5000, // $50
  },
];

// ============================================
// MOCK USER DATA - TODO: Replace with Supabase auth
// ============================================
export const mockUser: User = {
  id: 'user-1',
  email: 'demo@multiblock.ai',
  name: 'Demo User',
  plan: 'pro-50',
  boards_limit: 50,
  boards_used: 3,
  storage_limit_mb: 5120,
  storage_used_mb: 1250, // Mock: ~1.2 GB used
  created_at: '2024-01-01T00:00:00Z',
};

export const seedData = {
  boards: [
    {
      id: 'board-1',
      title: 'Research Assistant',
      user_id: 'user-1',
      metadata: {
        description: 'Multi-model research workflow',
        tags: ['research', 'academic'],
      },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z',
    },
    {
      id: 'board-2',
      title: 'Content Pipeline',
      user_id: 'user-1',
      metadata: {
        description: 'Blog post generation workflow',
        tags: ['content', 'marketing'],
      },
      created_at: '2024-01-18T09:00:00Z',
      updated_at: '2024-01-19T14:00:00Z',
    },
    {
      id: 'board-3',
      title: 'Code Review Chain',
      user_id: 'user-1',
      metadata: {
        description: 'Automated code review with multiple perspectives',
        tags: ['development', 'code'],
      },
      created_at: '2024-01-10T08:00:00Z',
      updated_at: '2024-01-22T11:00:00Z',
    },
  ] as Board[],
  
  blocks: [
    {
      id: 'block-1',
      board_id: 'board-1',
      title: 'What is a blackhole?',
      type: 'chat',
      model: 'gpt-4o',
      system_prompt: 'You are a knowledgeable physics expert. Explain concepts clearly.',
      config: { temperature: 0.7, max_tokens: 2048 },
      position: { x: 100, y: 100 },
      created_at: '2024-01-15T10:05:00Z',
      updated_at: '2024-01-20T15:30:00Z',
    },
    {
      id: 'block-2',
      board_id: 'board-1',
      title: 'Explain relativity',
      type: 'chat',
      model: 'claude-3-sonnet',
      system_prompt: 'You are an expert in theoretical physics.',
      config: { temperature: 0.6, max_tokens: 2048 },
      position: { x: 500, y: 50 },
      created_at: '2024-01-15T10:10:00Z',
      updated_at: '2024-01-20T15:30:00Z',
    },
    {
      id: 'block-3',
      board_id: 'board-1',
      title: 'Do we have proof?',
      type: 'chat',
      model: 'pplx-70b-online',
      system_prompt: 'You are a research assistant with access to recent papers.',
      config: { temperature: 0.5, max_tokens: 4096 },
      position: { x: 400, y: 350 },
      created_at: '2024-01-15T10:15:00Z',
      updated_at: '2024-01-20T15:30:00Z',
    },
    {
      id: 'block-4',
      board_id: 'board-1',
      title: 'Ask a follow up',
      type: 'chat',
      model: 'grok-3',
      system_prompt: 'Generate thoughtful follow-up questions.',
      config: { temperature: 0.8, max_tokens: 1024 },
      position: { x: 800, y: 150 },
      created_at: '2024-01-15T10:20:00Z',
      updated_at: '2024-01-20T15:30:00Z',
    },
  ] as Block[],
  
  messages: [
    {
      id: 'msg-1',
      block_id: 'block-1',
      role: 'user',
      content: 'What is a black hole and how does it form?',
      size_bytes: 44,
      created_at: '2024-01-20T15:00:00Z',
    },
    {
      id: 'msg-2',
      block_id: 'block-1',
      role: 'assistant',
      content: 'A black hole is a region in space where the gravitational pull is so strong that nothing, not even light, can escape from it. This occurs when a massive star collapses under its own gravity at the end of its life cycle. The boundary surrounding a black hole is called the event horizon; once something crosses this boundary, it cannot escape.',
      size_bytes: 349,
      meta: { tokens: 156, cost: 0.0023, model: 'gpt-4o', latency_ms: 1240 },
      created_at: '2024-01-20T15:00:05Z',
    },
    {
      id: 'msg-3',
      block_id: 'block-2',
      role: 'user',
      content: 'Explain the theory of relativity in simple terms.',
      size_bytes: 49,
      created_at: '2024-01-20T15:10:00Z',
    },
    {
      id: 'msg-4',
      block_id: 'block-2',
      role: 'assistant',
      content: 'The theory of relativity, developed by Albert Einstein in the early 20th century, fundamentally changed our understanding of physics. It consists of two main parts: special relativity and general relativity. Special relativity deals with objects moving at constant speeds, while general relativity explains gravity as the curvature of spacetime caused by mass and energy.',
      size_bytes: 371,
      meta: { tokens: 142, cost: 0.0018, model: 'claude-3-sonnet', latency_ms: 980 },
      created_at: '2024-01-20T15:10:08Z',
    },
  ] as Message[],
  
  connections: [
    {
      id: 'conn-1',
      from_block: 'block-1',
      to_block: 'block-3',
      mode: 'append',
      transform_template: 'Based on this context: {{output}}\n\nAnswer the question.',
    },
    {
      id: 'conn-2',
      from_block: 'block-2',
      to_block: 'block-4',
      mode: 'append',
    },
  ] as Connection[],
  
  apiKeys: [
    {
      id: 'key-1',
      provider: 'openai',
      key_masked: 'sk-...Xk4m',
      is_valid: true,
      client_only: false,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'key-2',
      provider: 'anthropic',
      key_masked: 'sk-ant-...9f2a',
      is_valid: true,
      client_only: false,
      created_at: '2024-01-05T00:00:00Z',
    },
  ] as ApiKey[],
  
  // Legacy LTD offers (keeping for backward compatibility)
  ltdOffers: [] as LtdOffer[],
};
