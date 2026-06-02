import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import EmailPreview from './EmailPreview';

// ── Mock react-icons ──────────────────────────────────────────────────────────

vi.mock('react-icons/fi', () => ({
  FiCopy: () => <span>copy</span>,
  FiCheck: () => <span>check</span>,
  FiMail: () => <span>mail</span>,
  FiX: () => <span>x</span>,
}));

// ── Tests ────────────────────────────────────────────────────────────────────

const EMAIL_TEXT = '* SN-001 | LOC-A\n\nהציוד משורין להתקנות באתר: PROD-SITE';

describe('EmailPreview', () => {
  it('renders the email text in a <pre>', () => {
    render(<EmailPreview emailText={EMAIL_TEXT} targetSite="PROD-SITE" onClose={vi.fn()} />);
    expect(screen.getByText(/SN-001/)).toBeInTheDocument();
  });

  it('calls navigator.clipboard.writeText on copy click', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<EmailPreview emailText={EMAIL_TEXT} targetSite="PROD-SITE" onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('copy').closest('button'));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(EMAIL_TEXT);
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<EmailPreview emailText={EMAIL_TEXT} targetSite="PROD-SITE" onClose={onClose} />);
    fireEvent.click(screen.getByText('x').closest('button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('sets window.location.href to mailto: when Outlook button clicked', () => {
    const orig = window.location;
    delete window.location;
    window.location = { href: '' };

    render(<EmailPreview emailText={EMAIL_TEXT} targetSite="MY-SITE" onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('mail').closest('button'));

    expect(window.location.href).toContain('mailto:');
    expect(window.location.href).toContain('MY-SITE');

    window.location = orig;
  });
});
