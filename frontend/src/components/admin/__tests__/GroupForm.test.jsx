import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupForm from '../GroupForm';

// Mock sub-components
vi.mock('../../common', () => ({
  Button: ({ children, onClick, type, disabled }) => (
    <button type={type} onClick={onClick} disabled={disabled}>{children}</button>
  ),
  Input: ({ name, value, onChange, placeholder }) => (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid={`input-${name}`}
    />
  ),
}));

vi.mock('../PermissionSelector', () => ({
  default: ({ selectedPermissions, onChange }) => (
    <div data-testid="permission-selector">
      <button onClick={() => onChange(['procurement:ro'])}>Set Permission</button>
      <span>{selectedPermissions.join(',')}</span>
    </div>
  ),
}));

describe('GroupForm - new group', () => {
  const defaultProps = { onSubmit: vi.fn(), onCancel: vi.fn() };

  beforeEach(() => vi.clearAllMocks());

  it('renders form with data-testid="group-form"', () => {
    render(<GroupForm {...defaultProps} />);
    expect(screen.getByTestId('group-form')).toBeInTheDocument();
  });

  it('renders name input', () => {
    render(<GroupForm {...defaultProps} />);
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
  });

  it('renders permission selector', () => {
    render(<GroupForm {...defaultProps} />);
    expect(screen.getByTestId('permission-selector')).toBeInTheDocument();
  });

  it('shows "קבוצה חדשה" as heading for new group', () => {
    render(<GroupForm {...defaultProps} />);
    expect(screen.getByText('קבוצה חדשה')).toBeInTheDocument();
  });

  it('calls onSubmit with form data on submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GroupForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByTestId('input-name'), {
      target: { name: 'name', value: 'DevTeam' },
    });

    fireEvent.submit(screen.getByTestId('group-form'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('displays error message when onSubmit throws', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      response: { data: { detail: 'Group name already exists' } },
    });
    render(<GroupForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.submit(screen.getByTestId('group-form'));

    await waitFor(() => {
      expect(screen.getByText('Group name already exists')).toBeInTheDocument();
    });
  });

  it('shows generic error when no detail in response', async () => {
    const onSubmit = vi.fn().mockRejectedValue({});
    render(<GroupForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.submit(screen.getByTestId('group-form'));

    await waitFor(() => {
      expect(screen.getByText('שגיאה בשמירת הקבוצה')).toBeInTheDocument();
    });
  });
});

describe('GroupForm - editing existing group', () => {
  const existingGroup = {
    name: 'QA Team',
    role: 'user',
    permissions: ['inventory:ro'],
    is_active: true,
  };

  beforeEach(() => vi.clearAllMocks());

  it('pre-fills name from existing group', () => {
    render(<GroupForm group={existingGroup} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    // In edit mode, name is shown as static meta text (no editable input for name)
    const nameEls = screen.getAllByText('QA Team');
    expect(nameEls.length).toBeGreaterThan(0);
  });

  it('shows group name as heading', () => {
    render(<GroupForm group={existingGroup} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    // Name appears in header and meta grid — use getAllByText since it appears multiple times
    expect(screen.getAllByText('QA Team')[0]).toBeInTheDocument();
  });

  it('shows existing permissions in permission selector', () => {
    render(<GroupForm group={existingGroup} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('inventory:ro')).toBeInTheDocument();
  });

  it('permission selector changes update form state', async () => {
    const user = userEvent.setup();
    render(<GroupForm group={existingGroup} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    // Initially shows existing group permissions
    expect(screen.getByText('inventory:ro')).toBeInTheDocument();

    // Click triggers onChange which updates GroupForm's formData
    await user.click(screen.getByText('Set Permission'));

    // The PermissionSelector re-renders with the new selectedPermissions, confirming state updated
    await waitFor(() => {
      expect(screen.getByText('procurement:ro')).toBeInTheDocument();
    });
  });
});
