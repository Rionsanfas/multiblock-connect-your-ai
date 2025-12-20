/**
 * Services index
 * 
 * Centralized exports for all service modules.
 * Services are abstraction layers that can be swapped between
 * mock and real implementations.
 */

export { authService, initializeMockAuth } from './authService';
export type { AuthService } from './authService';

// Re-export hooks for convenience
export { useBoardBlocks, useBlockActions, useBoardBlockStats } from '@/hooks/useBoardBlocks';
export { 
  useBlockMessages, 
  useBlockUsage, 
  useBoardUsage, 
  useMessageActions, 
  useTotalUsage,
  calculateByteSize,
  formatBytes 
} from '@/hooks/useBlockMessages';
export {
  useBoardConnections,
  useBlockIncomingConnections,
  useBlockOutgoingConnections,
  useBlockIncomingContext,
  useConnectionActions,
  useBlockConnectionStats,
} from '@/hooks/useBlockConnections';
export {
  useBlockModelConfig,
  useAvailableModels,
  useModelsGroupedByProvider,
  useAvailableProviders,
  useModelCapabilities,
  formatModelCost,
  formatContextWindow,
  getSpeedBadge,
  getQualityBadge,
  estimateCost,
} from '@/hooks/useModelConfig';
