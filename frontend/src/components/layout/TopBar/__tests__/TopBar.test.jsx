import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock auth context
vi.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser', role: 'Admin' },
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

import TopBar from '../TopBar';

const renderTopBar = (props = {}) => {
  return render(
    <MemoryRouter>
      <TopBar onOpenSearch={vi.fn()} {...props} />
    </MemoryRouter>
  );
};

describe('TopBar', () => {
  it('renders topbar element', () => {
    renderTopBar();
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
  });

  it('renders logo', () => {
    renderTopBar();
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  it('renders search button', () => {
    renderTopBar();
    expect(screen.getByLabelText('חיפוש גלובלי')).toBeInTheDocument();
  });

  it('renders user menu button', () => {
    renderTopBar();
    expect(screen.getByTestId('user-menu-btn')).toBeInTheDocument();
  });

  it('shows username in user button', () => {
    renderTopBar();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('opens user dropdown on click', () => {
    renderTopBar();
    fireEvent.click(screen.getByTestId('user-menu-btn'));
    expect(screen.getByTestId('user-dropdown')).toBeInTheDocument();
  });
});
