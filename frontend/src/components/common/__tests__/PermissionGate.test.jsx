import React from 'react';
import { render, screen } from '@testing-library/react';
import PermissionGate from '../PermissionGate';

// Mock useAuth so we can control permissions
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../../context/AuthContext';

describe('PermissionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user has the required permission', () => {
    useAuth.mockReturnValue({ hasPermission: () => true });

    render(
      <PermissionGate permission="inventory:ro">
        <span>Protected Content</span>
      </PermissionGate>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders fallback when user lacks the required permission', () => {
    useAuth.mockReturnValue({ hasPermission: () => false });

    render(
      <PermissionGate permission="inventory:rw" fallback={<span>Access Denied</span>}>
        <span>Protected Content</span>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders nothing (null) when user lacks permission and no fallback provided', () => {
    useAuth.mockReturnValue({ hasPermission: () => false });

    const { container } = render(
      <PermissionGate permission="inventory:rw">
        <span>Protected Content</span>
      </PermissionGate>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('always renders children when no permission prop is provided', () => {
    useAuth.mockReturnValue({ hasPermission: () => false });

    render(
      <PermissionGate permission={undefined}>
        <span>Open Content</span>
      </PermissionGate>
    );

    expect(screen.getByText('Open Content')).toBeInTheDocument();
  });

  it('calls hasPermission with the correct permission string', () => {
    const hasPermission = vi.fn(() => true);
    useAuth.mockReturnValue({ hasPermission });

    render(
      <PermissionGate permission="procurement:rw">
        <span>Procurement</span>
      </PermissionGate>
    );

    expect(hasPermission).toHaveBeenCalledWith('procurement:rw');
  });

  it('renders children for superadmin (hasPermission always returns true)', () => {
    useAuth.mockReturnValue({ hasPermission: () => true });

    render(
      <PermissionGate permission="item:delete">
        <button>Delete</button>
      </PermissionGate>
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('renders fallback for user with no permissions', () => {
    useAuth.mockReturnValue({ hasPermission: () => false });

    render(
      <PermissionGate permission="item:delete" fallback={<span>Not Allowed</span>}>
        <button>Delete</button>
      </PermissionGate>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Not Allowed')).toBeInTheDocument();
  });
});
