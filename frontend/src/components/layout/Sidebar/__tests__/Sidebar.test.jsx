import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock auth context
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAdmin: true,
    isSuperAdmin: true,
    hasPermission: () => true,
    hasProcurementAccess: () => true,
  }),
}));

// Mock theme context
vi.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({ mode: 'dark', toggleMode: vi.fn() }),
}));

import Sidebar from '../Sidebar';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderSidebar = (props = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isCollapsed={false} onToggle={vi.fn()} {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Sidebar', () => {
  it('renders sidebar element', () => {
    renderSidebar();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders all navigation items for admin user', () => {
    renderSidebar();
    expect(screen.getByTestId('sidebar-item-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-inventory')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-my-components')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-procurement')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-admin')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-guide')).toBeInTheDocument();
  });

  it('renders toggle button', () => {
    renderSidebar();
    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
  });

  it('applies collapsed class when collapsed', () => {
    renderSidebar({ isCollapsed: true });
    expect(screen.getByTestId('sidebar')).toHaveClass('sidebar--collapsed');
  });

  it('applies expanded class when expanded', () => {
    renderSidebar({ isCollapsed: false });
    expect(screen.getByTestId('sidebar')).toHaveClass('sidebar--expanded');
  });

  it('calls onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn();
    renderSidebar({ onToggle });
    screen.getByTestId('sidebar-toggle').click();
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
