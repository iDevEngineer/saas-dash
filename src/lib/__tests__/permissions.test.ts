import { describe, it, expect } from 'vitest';
import { hasPermission, hasRole, isAdmin, isSuperAdmin } from '../permissions';
import type { UserWithRole } from '@/types/permissions';

describe('Permissions System', () => {
  const mockUser: UserWithRole = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  };

  const mockAdmin: UserWithRole = {
    id: '2',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
  };

  const mockSuperAdmin: UserWithRole = {
    id: '3',
    email: 'superadmin@example.com',
    name: 'Super Admin',
    role: 'super_admin',
  };

  describe('hasPermission', () => {
    it('should allow user to view dashboard', () => {
      expect(hasPermission(mockUser, 'view_dashboard')).toBe(true);
    });

    it('should not allow user to manage API keys', () => {
      expect(hasPermission(mockUser, 'manage_api_keys')).toBe(false);
    });

    it('should allow admin to manage API keys', () => {
      expect(hasPermission(mockAdmin, 'manage_api_keys')).toBe(true);
    });

    it('should allow super admin to manage API keys', () => {
      expect(hasPermission(mockSuperAdmin, 'manage_api_keys')).toBe(true);
    });
  });

  describe('hasRole', () => {
    it('should correctly identify user role', () => {
      expect(hasRole(mockUser, 'user')).toBe(true);
      expect(hasRole(mockUser, 'admin')).toBe(false);
    });

    it('should support role hierarchy', () => {
      expect(hasRole(mockAdmin, 'user')).toBe(true);
      expect(hasRole(mockAdmin, 'admin')).toBe(true);
      expect(hasRole(mockAdmin, 'super_admin')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return false for regular user', () => {
      expect(isAdmin(mockUser)).toBe(false);
    });

    it('should return true for admin', () => {
      expect(isAdmin(mockAdmin)).toBe(true);
    });

    it('should return true for super admin', () => {
      expect(isAdmin(mockSuperAdmin)).toBe(true);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return false for regular user', () => {
      expect(isSuperAdmin(mockUser)).toBe(false);
    });

    it('should return false for admin', () => {
      expect(isSuperAdmin(mockAdmin)).toBe(false);
    });

    it('should return true for super admin', () => {
      expect(isSuperAdmin(mockSuperAdmin)).toBe(true);
    });
  });
});
