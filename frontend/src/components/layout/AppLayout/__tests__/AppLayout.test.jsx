import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock auth context
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser', role: 'Admin' },
    isAdmin: true,
    isSuperAdmin: true,
    hasPermission: () => true,
    hasProcurementAccess: () => true,
    logout: vi.fn(),
  }),
}));

// Mock theme context
vi.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({ mode: 'dark', toggleMode: vi.fn(), variant: 'normal', setVariant: vi.fn() }),
}));

// Mock cart context
vi.mock('../../../../context/CartContext', () => ({
  useCart: () => ({ cartCount: 0 }),
}));

import AppLayout from '../AppLayout';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderAppLayout = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppLayout onOpenSearch={vi.fn()}>
          <div data-testid="page-content">Page Content</div>
        </AppLayout>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AppLayout', () => {
  it('renders the layout container', () => {
    renderAppLayout();
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });

  it('renders TopBar', () => {
    renderAppLayout();
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
  });

  it('renders Sidebar', () => {
    renderAppLayout();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderAppLayout();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });
});
