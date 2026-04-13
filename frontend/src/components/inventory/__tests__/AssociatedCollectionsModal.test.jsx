import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssociatedCollectionsModal from '../AssociatedCollectionsModal/AssociatedCollectionsModal';

// Mock dependencies
vi.mock('../../common/Modal/Modal', () => ({
  default: ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button data-testid="modal-close" onClick={onClose}>X</button>
        <div data-testid="modal-body">{children}</div>
      </div>
    );
  },
}));

vi.mock('../../common/Spinner/Spinner', () => ({
  default: ({ message }) => <div data-testid="spinner">{message}</div>,
}));

vi.mock('../../../api/services/itemService', () => ({
  default: {
    getItemCollections: vi.fn(),
  },
}));

import itemService from '../../../api/services/itemService';

describe('AssociatedCollectionsModal', () => {
  const mockItem = { _id: 'item1', catalog_number: 'CAT-001' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(
      <AssociatedCollectionsModal isOpen={false} onClose={vi.fn()} item={mockItem} />
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should show loading state', async () => {
    itemService.getItemCollections.mockReturnValue(new Promise(() => {})); // Never resolves

    render(
      <AssociatedCollectionsModal isOpen={true} onClose={vi.fn()} item={mockItem} />
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should display collections table with data', async () => {
    itemService.getItemCollections.mockResolvedValue([
      { collection_name: 'Team Alpha', owner_id: 'user1' },
      { collection_name: 'Team Beta', owner_id: 'user2' },
    ]);

    render(
      <AssociatedCollectionsModal isOpen={true} onClose={vi.fn()} item={mockItem} />
    );

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
    });
  });

  it('should show table headers', async () => {
    itemService.getItemCollections.mockResolvedValue([
      { collection_name: 'Team A', owner_id: 'user1' },
    ]);

    render(
      <AssociatedCollectionsModal isOpen={true} onClose={vi.fn()} item={mockItem} />
    );

    await waitFor(() => {
      expect(screen.getByText('שם האוסף/צוות')).toBeInTheDocument();
      expect(screen.getByText('בעלים (ID)')).toBeInTheDocument();
    });
  });

  it('should show empty state for no collections', async () => {
    itemService.getItemCollections.mockResolvedValue([]);

    render(
      <AssociatedCollectionsModal isOpen={true} onClose={vi.fn()} item={mockItem} />
    );

    await waitFor(() => {
      expect(screen.getByText('פריט זה לא משוייך לשום צוות.')).toBeInTheDocument();
    });
  });

  it('should show error state on fetch failure', async () => {
    itemService.getItemCollections.mockRejectedValue(new Error('Network error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AssociatedCollectionsModal isOpen={true} onClose={vi.fn()} item={mockItem} />
    );

    await waitFor(() => {
      expect(screen.getByText('שגיאה בטעינת הנתונים')).toBeInTheDocument();
    });

    console.error.mockRestore();
  });

  it('should close on X button click', async () => {
    const onClose = vi.fn();
    itemService.getItemCollections.mockResolvedValue([]);

    render(
      <AssociatedCollectionsModal isOpen={true} onClose={onClose} item={mockItem} />
    );

    fireEvent.click(screen.getByTestId('modal-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should include item identifier in title', () => {
    itemService.getItemCollections.mockResolvedValue([]);

    render(
      <AssociatedCollectionsModal isOpen={true} onClose={vi.fn()} item={mockItem} />
    );

    expect(screen.getByTestId('modal-title')).toHaveTextContent('CAT-001');
  });

  it('should fetch collections when opened with different item', async () => {
    itemService.getItemCollections.mockResolvedValue([]);

    const { rerender } = render(
      <AssociatedCollectionsModal isOpen={true} onClose={vi.fn()} item={mockItem} />
    );

    await waitFor(() => {
      expect(itemService.getItemCollections).toHaveBeenCalledWith('item1');
    });

    const newItem = { _id: 'item2', catalog_number: 'CAT-002' };
    rerender(
      <AssociatedCollectionsModal isOpen={true} onClose={vi.fn()} item={newItem} />
    );

    await waitFor(() => {
      expect(itemService.getItemCollections).toHaveBeenCalledWith('item2');
    });
  });
});
