import type { 
  Board, Block, Message, Connection, ApiKey, LtdOffer, PricingPlan, 
  BoardAddon, User, Team, TeamMember, Seat, Subscription, UserPlan,
  PlanCapabilities
} from '@/types';
import {
  FREE_PLAN_STORAGE_MB,
  FREE_PLAN_STORAGE_DISPLAY,
  FREE_PLAN_BOARDS,
  FREE_PLAN_BLOCKS_PER_BOARD,
  FREE_PLAN_SEATS,
} from '@/config/plan-constants';

// ============================================
// DEFAULT PLAN CAPABILITIES
// ============================================
const FREE_CAPABILITIES: PlanCapabilities = {
  api_access: false,
  custom_models: false,
  priority_support: false,
  export_json: false,
  export_pdf: false,
  sso_enabled: false,
  audit_logs: false,
  custom_branding: false,
  webhooks: false,
  advanced_analytics: false,
};

const PRO_CAPABILITIES: PlanCapabilities = {
  api_access: true,
  custom_models: true,
  priority_support: true,
  export_json: true,
  export_pdf: true,
  sso_enabled: false,
  audit_logs: false,
  custom_branding: false,
  webhooks: true,
  advanced_analytics: true,
};

const TEAM_CAPABILITIES: PlanCapabilities = {
  api_access: true,
  custom_models: true,
  priority_support: true,
  export_json: true,
  export_pdf: true,
  sso_enabled: true,
  audit_logs: true,
  custom_branding: true,
  webhooks: true,
  advanced_analytics: true,
};

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
    boards: FREE_PLAN_BOARDS,
    blocks_per_board: FREE_PLAN_BLOCKS_PER_BOARD,
    storage_mb: FREE_PLAN_STORAGE_MB,
    seats: FREE_PLAN_SEATS,
    features: [
      `${FREE_PLAN_BOARDS} board`,
      `${FREE_PLAN_BLOCKS_PER_BOARD} blocks per board`,
      `${FREE_PLAN_STORAGE_DISPLAY} storage`,
      'Basic AI models',
      'Community support',
    ],
    capabilities: FREE_CAPABILITIES,
    badge: 'Free Forever',
    sort_order: 0,
    is_active: true,
  },
  {
    id: 'pro-50',
    name: 'Pro 50',
    tier: 'pro',
    price_cents: 9900,
    billing_period: 'yearly',
    boards: 50,
    blocks_per_board: 'unlimited',
    storage_mb: 5120,
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
    capabilities: PRO_CAPABILITIES,
    badge: 'Yearly subscription',
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'pro-100',
    name: 'Pro 100',
    tier: 'pro',
    price_cents: 14900,
    billing_period: 'yearly',
    boards: 100,
    blocks_per_board: 'unlimited',
    storage_mb: 10240,
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
    capabilities: PRO_CAPABILITIES,
    highlight: true,
    badge: 'Best Value',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'team-50',
    name: 'Team 50',
    tier: 'team',
    price_cents: 12900,
    billing_period: 'yearly',
    boards: 50,
    blocks_per_board: 'unlimited',
    storage_mb: 20480,
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
    capabilities: TEAM_CAPABILITIES,
    badge: 'Yearly subscription for teams',
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'team-100',
    name: 'Team 100',
    tier: 'team',
    price_cents: 16900,
    billing_period: 'yearly',
    boards: 100,
    blocks_per_board: 'unlimited',
    storage_mb: 30720,
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
    capabilities: TEAM_CAPABILITIES,
    badge: 'Yearly subscription for teams',
    sort_order: 4,
    is_active: true,
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
    price_cents: 500,
    is_active: true,
  },
  {
    id: 'addon-20',
    name: '20 Extra Boards',
    boards: 20,
    storage_mb: 2048,
    price_cents: 1500,
    is_active: true,
  },
  {
    id: 'addon-50',
    name: '50 Extra Boards',
    boards: 50,
    storage_mb: 5120,
    price_cents: 3000,
    is_active: true,
  },
  {
    id: 'addon-100',
    name: '100 Extra Boards',
    boards: 100,
    storage_mb: 10240,
    price_cents: 5000,
    is_active: true,
  },
];

// ============================================
// MOCK TEAMS
// ============================================
export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Acme Research',
    slug: 'acme-research',
    owner_id: 'user-1',
    settings: {
      require_api_keys: false,
      allow_member_invites: true,
      shared_boards_enabled: true,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'member-1',
    team_id: 'team-1',
    user_id: 'user-1',
    role: 'owner',
    invited_by: 'user-1',
    invited_at: '2024-01-01T00:00:00Z',
    joined_at: '2024-01-01T00:00:00Z',
    status: 'active',
  },
  {
    id: 'member-2',
    team_id: 'team-1',
    user_id: 'user-2',
    role: 'member',
    invited_by: 'user-1',
    invited_at: '2024-01-10T00:00:00Z',
    joined_at: '2024-01-11T00:00:00Z',
    status: 'active',
  },
];

export const mockSeats: Seat[] = [
  {
    id: 'seat-1',
    team_id: 'team-1',
    user_id: 'user-1',
    assigned_at: '2024-01-01T00:00:00Z',
    seat_type: 'included',
    is_active: true,
  },
  {
    id: 'seat-2',
    team_id: 'team-1',
    user_id: 'user-2',
    assigned_at: '2024-01-11T00:00:00Z',
    seat_type: 'included',
    is_active: true,
  },
  {
    id: 'seat-3',
    team_id: 'team-1',
    user_id: undefined, // Unassigned seat
    seat_type: 'included',
    is_active: true,
  },
];

// ============================================
// MOCK SUBSCRIPTIONS
// ============================================
export const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    user_id: 'user-1',
    plan_id: 'pro-50',
    status: 'active',
    current_period_start: '2024-01-01T00:00:00Z',
    current_period_end: '2025-01-01T00:00:00Z',
    cancel_at_period_end: false,
    addon_ids: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockUserPlans: UserPlan[] = [
  {
    id: 'uplan-1',
    user_id: 'user-1',
    plan_id: 'pro-50',
    subscription_id: 'sub-1',
    status: 'active',
    effective_boards_limit: 50,
    effective_storage_mb: 5120,
    effective_seats: 1,
    boards_used: 3,
    storage_used_mb: 1250,
    purchased_at: '2024-01-01T00:00:00Z',
    addon_ids: [],
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
  storage_used_mb: 1250,
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
      model_id: 'gpt-4o',
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
      model_id: 'claude-3-sonnet',
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
      model_id: 'pplx-70b-online',
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
      model_id: 'grok-3',
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
      context_type: 'full',
      transform_template: 'Based on this context: {{output}}\n\nAnswer the question.',
      enabled: true,
      created_at: '2024-01-15T10:25:00Z',
      updated_at: '2024-01-15T10:25:00Z',
    },
    {
      id: 'conn-2',
      from_block: 'block-2',
      to_block: 'block-4',
      context_type: 'full',
      enabled: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
    },
  ] as Connection[],
  
  // Note: Mock API keys have empty key_value - users must add their own real keys
  apiKeys: [] as ApiKey[],
  
  // Teams, subscriptions, seats from mock data
  teams: mockTeams,
  teamMembers: mockTeamMembers,
  seats: mockSeats,
  subscriptions: mockSubscriptions,
  userPlans: mockUserPlans,
  
  // Legacy LTD offers (keeping for backward compatibility)
  ltdOffers: [] as LtdOffer[],
};
