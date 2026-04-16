import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CollectionCard from '../CollectionCard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-icons/fa', () => ({
  FaUser: () => <span data-testid="icon-user" />,
  FaUsers: () => <span data-testid="icon-users" />,
  FaArrowLeft: () => <span data-testid="icon-arrow-left" />,
  FaLayerGroup: () => <span data-testid="icon-layer-group" />,
}));

vi.mock('../../common', () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('../../../pages/MyComponents/MyComponents.css', () => ({}));

const baseCollection = {
  id: 'col-1',
  name: 'אוסף בדיקה',
  description: 'תיאור לבדיקה',
  role: 'OWNER',
  permissions: [
    { type: 'user', userId: 'u1' },
    { type: 'group', groupId: 'g1' },
    { type: 'group', groupId: 'g2' },
  ],
  updated_at: '2024-01-15T10:00:00Z',
};

describe('CollectionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the collection name', () => {
    render(<CollectionCard collection={baseCollection} />);
    expect(screen.getByText('אוסף בדיקה')).toBeInTheDocument();
  });

  it('renders the collection description', () => {
    render(<CollectionCard collection={baseCollection} />);
    expect(screen.getByText('תיאור לבדיקה')).toBeInTheDocument();
  });

  it('renders fallback description when none provided', () => {
    const col = { ...baseCollection, description: '' };
    render(<CollectionCard collection={col} />);
    expect(screen.getByText('אין תיאור.')).toBeInTheDocument();
  });

  it('shows "בעלים" badge for OWNER role', () => {
    render(<CollectionCard collection={baseCollection} />);
    expect(screen.getByText('בעלים')).toBeInTheDocument();
  });

  it('shows role badge for shared collection', () => {
    const col = { ...baseCollection, role: 'viewer' };
    render(<CollectionCard collection={col} />);
    expect(screen.getByText('viewer')).toBeInTheDocument();
  });

  it('shows groups count', () => {
    render(<CollectionCard collection={baseCollection} />);
    expect(screen.getByText('2 קבוצות')).toBeInTheDocument();
  });

  it('shows users count for owner', () => {
    render(<CollectionCard collection={baseCollection} />);
    expect(screen.getByText('1 משתמשים')).toBeInTheDocument();
  });

  it('does not show users count for non-owner', () => {
    const col = { ...baseCollection, role: 'viewer' };
    render(<CollectionCard collection={col} />);
    expect(screen.queryByText(/משתמשים/)).not.toBeInTheDocument();
  });

  it('renders card-icon-bg icon watermark', () => {
    render(<CollectionCard collection={baseCollection} />);
    expect(screen.getByTestId('icon-layer-group')).toBeInTheDocument();
  });

  it('navigates to collection page on card click', () => {
    render(<CollectionCard collection={baseCollection} />);
    const card = screen.getByText('אוסף בדיקה').closest('.collection-card');
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith('/my-components/col-1');
  });

  it('navigates to collection page on "צפה" button click', () => {
    render(<CollectionCard collection={baseCollection} />);
    const btn = screen.getByText(/צפה/);
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/my-components/col-1');
  });

  it('uses _id as fallback when id is missing', () => {
    const col = { ...baseCollection, id: undefined, _id: 'fallback-id' };
    render(<CollectionCard collection={col} />);
    const card = screen.getByText('אוסף בדיקה').closest('.collection-card');
    fireEvent.click(card);
    expect(mockNavigate).toHaveBeenCalledWith('/my-components/fallback-id');
  });

  it('renders owner stripe class for owner role', () => {
    render(<CollectionCard collection={baseCollection} />);
    const stripe = document.querySelector('.card-header-stripe.owner');
    expect(stripe).toBeInTheDocument();
  });

  it('renders shared stripe class for non-owner role', () => {
    const col = { ...baseCollection, role: 'viewer' };
    render(<CollectionCard collection={col} />);
    const stripe = document.querySelector('.card-header-stripe.shared');
    expect(stripe).toBeInTheDocument();
  });
});
