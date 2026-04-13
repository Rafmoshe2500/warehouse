import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteModal from '../DeleteModal/DeleteModal';

// Mock the Modal component to render children directly
vi.mock('../Modal/Modal', () => ({
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

vi.mock('../Button/Button', () => ({
  default: ({ children, onClick, disabled, loading, variant, ...props }) => (
    <button onClick={onClick} disabled={disabled || loading} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

describe('DeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('type="reason" (default)', () => {
    it('should render textarea for deletion reason', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.getByText('סיבת מחיקה')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should show audit trail hint', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.getByText(/הסיבה תישמר ביומן הפעולות/)).toBeInTheDocument();
    });

    it('should show error when reason is less than 3 characters', () => {
      render(<DeleteModal {...defaultProps} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ab' } });
      fireEvent.click(screen.getByText('מחק לצמיתות'));

      expect(screen.getByText(/לפחות 3 תווים/)).toBeInTheDocument();
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('should show error when reason is empty', () => {
      render(<DeleteModal {...defaultProps} />);

      fireEvent.click(screen.getByText('מחק לצמיתות'));

      expect(screen.getByText(/לפחות 3 תווים/)).toBeInTheDocument();
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });

    it('should call onConfirm with reason when valid', () => {
      render(<DeleteModal {...defaultProps} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'לא בשימוש' },
      });
      fireEvent.click(screen.getByText('מחק לצמיתות'));

      expect(defaultProps.onConfirm).toHaveBeenCalledWith('לא בשימוש');
    });

    it('should show warning text', () => {
      render(<DeleteModal {...defaultProps} />);

      expect(screen.getByText('פעולה זו בלתי הפיכה!')).toBeInTheDocument();
    });

    it('should clear error on input change', () => {
      render(<DeleteModal {...defaultProps} />);

      // Trigger error
      fireEvent.click(screen.getByText('מחק לצמיתות'));
      expect(screen.getByText(/לפחות 3 תווים/)).toBeInTheDocument();

      // Type something
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'valid reason' } });
      expect(screen.queryByText(/לפחות 3 תווים/)).not.toBeInTheDocument();
    });
  });

  describe('type="verification"', () => {
    it('should render input with verification text prompt', () => {
      render(
        <DeleteModal
          {...defaultProps}
          type="verification"
          verificationText="DELETE"
        />
      );

      expect(screen.getByText(/כדי לאשר, אנא הקלד/)).toBeInTheDocument();
      expect(screen.getByText('DELETE')).toBeInTheDocument();
    });

    it('should disable confirm until verification text matches', () => {
      render(
        <DeleteModal
          {...defaultProps}
          type="verification"
          verificationText="DELETE"
        />
      );

      const confirmBtn = screen.getByText('מחק לצמיתות');
      expect(confirmBtn).toBeDisabled();

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'DELETE' },
      });
      expect(confirmBtn).not.toBeDisabled();
    });

    it('should show error when verification text does not match', () => {
      render(
        <DeleteModal
          {...defaultProps}
          type="verification"
          verificationText="DELETE"
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'WRONG' } });

      const confirmBtn = screen.getByText('מחק לצמיתות');
      // Button should be disabled for non-matching text
      expect(confirmBtn).toBeDisabled();
    });

    it('should prevent paste in verification mode', () => {
      render(
        <DeleteModal
          {...defaultProps}
          type="verification"
          verificationText="DELETE"
        />
      );

      const input = screen.getByRole('textbox');
      const pasteEvent = new Event('paste', { bubbles: true });
      const preventDefaultSpy = vi.spyOn(pasteEvent, 'preventDefault');

      fireEvent(input, pasteEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('type="confirmation"', () => {
    it('should render without any input', () => {
      render(<DeleteModal {...defaultProps} type="confirmation" />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should call onConfirm directly on confirm click', () => {
      render(<DeleteModal {...defaultProps} type="confirmation" />);

      fireEvent.click(screen.getByText('מחק לצמיתות'));

      expect(defaultProps.onConfirm).toHaveBeenCalled();
    });

    it('should not disable confirm button', () => {
      render(<DeleteModal {...defaultProps} type="confirmation" />);

      expect(screen.getByText('מחק לצמיתות')).not.toBeDisabled();
    });
  });

  describe('general behavior', () => {
    it('should not render when isOpen is false', () => {
      render(<DeleteModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should show custom title', () => {
      render(<DeleteModal {...defaultProps} title="מחיקת אוסף" />);

      expect(screen.getByTestId('modal-title')).toHaveTextContent('מחיקת אוסף');
    });

    it('should show custom confirm text', () => {
      render(<DeleteModal {...defaultProps} confirmText="אשר מחיקה" />);

      expect(screen.getByText('אשר מחיקה')).toBeInTheDocument();
    });

    it('should disable buttons when isProcessing', () => {
      render(<DeleteModal {...defaultProps} isProcessing={true} />);

      const confirmBtn = screen.getByText('מחק לצמיתות');
      const cancelBtn = screen.getByText('ביטול');
      expect(confirmBtn).toBeDisabled();
      expect(cancelBtn).toBeDisabled();
    });

    it('should call onClose when cancel is clicked', () => {
      render(<DeleteModal {...defaultProps} />);

      fireEvent.click(screen.getByText('ביטול'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
