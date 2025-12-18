/**
 * Services index
 * 
 * Centralized exports for all service modules.
 * Services are abstraction layers that can be swapped between
 * mock and real implementations.
 */

export { authService, initializeMockAuth } from './authService';
export type { AuthService } from './authService';
