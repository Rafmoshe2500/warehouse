import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkEditModal from '../BulkEditModal/BulkEditModal';

// Mock common components
vi.mock('../../common/Modal/Modal', () => ({
  default: ({ isOpen, onClose, title, footer, children }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <div data-testid="modal-body">{children}</div>
        <div data-testid="modal-footer">{footer}</div>
      </div>
    );
  },
}));

vi.mock('../../common/Input/Input', () => ({
  default: ({ value, onChange, disabled, placeholder, ...props }) => (
    <input
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      data-testid={placeholder}
      {...props}
    />
  ),
}));

vi.mock('../../common/Button/Button', () => ({
  default: ({ children, onClick, disabled, variant, ...props }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../constants/sites', () => ({
  TARGET_SITES: ['אתר א', 'אתר ב', 'אתר ג'],
}));

describe('BulkEditModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    selectedCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(<BulkEditModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should render 3 field checkboxes', () => {
    render(<BulkEditModal {...defaultProps} />);

    expect(screen.getByLabelText('יעוד')).toBeInTheDocument();
    expect(screen.getByLabelText('אתר יעד')).toBeInTheDocument();
    expect(screen.getByLabelText('הערות')).toBeInTheDocument();
  });

  it('should disable field inputs by default', () => {
    render(<BulkEditModal {...defaultProps} />);

    const purposeInput = screen.getByTestId('הכנס יעוד חדש');
    const notesInput = screen.getByTestId('הכנס הערה');
    expect(purposeInput).toBeDisabled();
    expect(notesInput).toBeDisabled();
  });

  it('should enable purpose input when checkbox checked', () => {
    render(<BulkEditModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('יעוד'));

    expect(screen.getByTestId('הכנס יעוד חדש')).not.toBeDisabled();
  });

  it('should enable notes input when checkbox checked', () => {
    render(<BulkEditModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('הערות'));

    expect(screen.getByTestId('הכנס הערה')).not.toBeDisabled();
  });

  it('should show selected count in confirm button', () => {
    render(<BulkEditModal {...defaultProps} />);

    expect(screen.getByText(/עדכן 5 פריטים/)).toBeInTheDocument();
  });

  it('should disable confirm when no fields selected', () => {
    render(<BulkEditModal {...defaultProps} />);

    const confirmBtn = screen.getByText(/עדכן 5 פריטים/);
    expect(confirmBtn).toBeDisabled();
  });

  it('should enable confirm when at least one field is selected', () => {
    render(<BulkEditModal {...defaultProps} />);

    fireEvent.click(screen.getByLabelText('יעוד'));

    const confirmBtn = screen.getByText(/עדכן 5 פריטים/);
    expect(confirmBtn).not.toBeDisabled();
  });

  it('should call onConfirm with only enabled fields', () => {
    render(<BulkEditModal {...defaultProps} />);

    // Enable purpose
    fireEvent.click(screen.getByLabelText('יעוד'));
    fireEvent.change(screen.getByTestId('הכנס יעוד חדש'), {
      target: { value: 'ייעוד חדש' },
    });

    // Confirm
    fireEvent.click(screen.getByText(/עדכן 5 פריטים/));

    expect(defaultProps.onConfirm).toHaveBeenCalledWith({
      purpose: 'ייעוד חדש',
    });
  });

  it('should not include unchecked fields in confirm data', () => {
    render(<BulkEditModal {...defaultProps} />);

    // Enable only notes
    fireEvent.click(screen.getByLabelText('הערות'));
    fireEvent.change(screen.getByTestId('הכנס הערה'), {
      target: { value: 'הערה חדשה' },
    });

    fireEvent.click(screen.getByText(/עדכן 5 פריטים/));

    const callArg = defaultProps.onConfirm.mock.calls[0][0];
    expect(callArg).toEqual({ notes: 'הערה חדשה' });
    expect(callArg).not.toHaveProperty('purpose');
    expect(callArg).not.toHaveProperty('target_site');
  });

  it('should call onClose when cancel clicked', () => {
    render(<BulkEditModal {...defaultProps} />);

    fireEvent.click(screen.getByText('ביטול'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should reset state on close', () => {
    const { rerender } = render(<BulkEditModal {...defaultProps} />);

    // Enable a field
    fireEvent.click(screen.getByLabelText('יעוד'));
    expect(screen.getByTestId('הכנס יעוד חדש')).not.toBeDisabled();

    // Close and reopen
    fireEvent.click(screen.getByText('ביטול'));

    rerender(<BulkEditModal {...defaultProps} />);

    // Should be disabled again after close
    expect(screen.getByTestId('הכנס יעוד חדש')).toBeDisabled();
  });

  it('should show warning message', () => {
    render(<BulkEditModal {...defaultProps} />);

    expect(screen.getByText(/השינויים יחולו על כל הפריטים/)).toBeInTheDocument();
  });
});
