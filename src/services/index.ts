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
export { useBoardBlocks, useBlock, useBlockActions, useBoardBlockStats } from '@/hooks/useBoardBlocks';
