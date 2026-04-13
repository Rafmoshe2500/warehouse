import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContextMenu from '../ContextMenu/ContextMenu';

describe('ContextMenu', () => {
  const defaultProps = {
    position: { x: 100, y: 200 },
    selectedItemsCount: 2,
    selectedCellsCount: 3,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onCopy: vi.fn(),
    onClose: vi.fn(),
    onAddToCollection: vi.fn(),
    userCollections: [
      { id: 'col1', name: 'Collection A' },
      { id: 'col2', name: 'Collection B' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render at correct position', () => {
    const { container } = render(<ContextMenu {...defaultProps} />);

    const menu = container.querySelector('.context-menu');
    expect(menu).toHaveStyle({ top: '200px', left: '100px' });
  });

  it('should not render when position is null', () => {
    const { container } = render(<ContextMenu {...defaultProps} position={null} />);

    expect(container.querySelector('.context-menu')).not.toBeInTheDocument();
  });

  it('should show copy option with cell count', () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByTestId('context-menu-copy')).toHaveTextContent('העתק תאים (3)');
  });

  it('should show edit option with item count', () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByTestId('context-menu-edit')).toHaveTextContent('עריכה (2)');
  });

  it('should show delete option with item count', () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByTestId('context-menu-delete')).toHaveTextContent('מחיקה (2)');
  });

  it('should disable copy when no cells selected', () => {
    render(<ContextMenu {...defaultProps} selectedCellsCount={0} />);

    expect(screen.getByTestId('context-menu-copy')).toBeDisabled();
  });

  it('should disable edit when no items selected', () => {
    render(<ContextMenu {...defaultProps} selectedItemsCount={0} />);

    expect(screen.getByTestId('context-menu-edit')).toBeDisabled();
  });

  it('should disable delete when no items selected', () => {
    render(<ContextMenu {...defaultProps} selectedItemsCount={0} />);

    expect(screen.getByTestId('context-menu-delete')).toBeDisabled();
  });

  it('should call onCopy and onClose when copy clicked', () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.click(screen.getByTestId('context-menu-copy'));

    expect(defaultProps.onCopy).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onEdit and onClose when edit clicked', () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.click(screen.getByTestId('context-menu-edit'));

    expect(defaultProps.onEdit).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onDelete and onClose when delete clicked', () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.click(screen.getByTestId('context-menu-delete'));

    expect(defaultProps.onDelete).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should render collections submenu when onAddToCollection provided', () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByText('שייך למלאי שלי')).toBeInTheDocument();
    expect(screen.getByText('Collection A')).toBeInTheDocument();
    expect(screen.getByText('Collection B')).toBeInTheDocument();
  });

  it('should not render submenu when onAddToCollection is not provided', () => {
    render(<ContextMenu {...defaultProps} onAddToCollection={undefined} />);

    expect(screen.queryByText('שייך למלאי שלי')).not.toBeInTheDocument();
  });

  it('should call onAddToCollection with correct collection when clicked', () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.click(screen.getByText('Collection A'));

    expect(defaultProps.onAddToCollection).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'col1', name: 'Collection A' })
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show "no collections" message when userCollections is empty', () => {
    render(<ContextMenu {...defaultProps} userCollections={[]} />);

    expect(screen.getByText('אין אוספים זמינים')).toBeInTheDocument();
  });

  it('should disable submenu trigger when no items selected', () => {
    render(<ContextMenu {...defaultProps} selectedItemsCount={0} />);

    const trigger = screen.getByText('שייך למלאי שלי').closest('button');
    expect(trigger).toBeDisabled();
  });
});
