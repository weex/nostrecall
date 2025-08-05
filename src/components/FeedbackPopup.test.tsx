import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { FeedbackPopup } from './FeedbackPopup';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('FeedbackPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('renders when isOpen is true', () => {
    render(
      <TestApp>
        <FeedbackPopup isOpen={true} />
      </TestApp>
    );

    expect(screen.getByText('How are we doing?')).toBeInTheDocument();
    expect(screen.getByText('Rate your experience:')).toBeInTheDocument();
    expect(screen.getByText('What could we improve?')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <TestApp>
        <FeedbackPopup isOpen={false} />
      </TestApp>
    );

    expect(screen.queryByText('How are we doing?')).not.toBeInTheDocument();
  });

  it('shows minimized button when user has already submitted feedback', () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'feedback-submitted') return 'true';
      return null;
    });

    render(
      <TestApp>
        <FeedbackPopup />
      </TestApp>
    );

    expect(screen.queryByText('How are we doing?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open feedback' })).toBeInTheDocument();
  });

  it('shows minimized button when user has dismissed feedback', () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'feedback-dismissed') return 'true';
      return null;
    });

    render(
      <TestApp>
        <FeedbackPopup />
      </TestApp>
    );

    expect(screen.queryByText('How are we doing?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open feedback' })).toBeInTheDocument();
  });

  it('allows rating selection', () => {
    render(
      <TestApp>
        <FeedbackPopup isOpen={true} />
      </TestApp>
    );

    const stars = screen.getAllByRole('button').filter(button =>
      button.querySelector('svg')?.classList.contains('lucide-star')
    );

    expect(stars).toHaveLength(5);

    // Click on the third star
    fireEvent.click(stars[2]);

    // The submit button should be enabled now
    const submitButton = screen.getByText('Send Feedback');
    expect(submitButton).not.toBeDisabled();
  });

  it('allows typing in the improvement textarea', () => {
    render(
      <TestApp>
        <FeedbackPopup isOpen={true} />
      </TestApp>
    );

    const textarea = screen.getByPlaceholderText('Share your thoughts and suggestions...');
    fireEvent.change(textarea, { target: { value: 'Great app, but could use dark mode!' } });

    expect(textarea).toHaveValue('Great app, but could use dark mode!');
  });

  it('shows character count for textarea', () => {
    render(
      <TestApp>
        <FeedbackPopup isOpen={true} />
      </TestApp>
    );

    const textarea = screen.getByPlaceholderText('Share your thoughts and suggestions...');
    fireEvent.change(textarea, { target: { value: 'Test feedback' } });

    expect(screen.getByText('13/500')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();

    render(
      <TestApp>
        <FeedbackPopup isOpen={true} onClose={onClose} />
      </TestApp>
    );

    const closeButton = screen.getByRole('button', { name: 'Close feedback popup' });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows login required message when user is not logged in', () => {
    render(
      <TestApp>
        <FeedbackPopup isOpen={true} />
      </TestApp>
    );

    expect(screen.getByText('Login required to send feedback')).toBeInTheDocument();
  });

  it('shows DM recipient information', () => {
    render(
      <TestApp>
        <FeedbackPopup isOpen={true} />
      </TestApp>
    );

    expect(screen.getByText(/Feedback will be sent via encrypted DM to npub17dmmwz9/)).toBeInTheDocument();
  });

  it('shows custom recipient npub when provided', () => {
    const customNpub = 'npub1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890';

    render(
      <TestApp>
        <FeedbackPopup isOpen={true} feedbackRecipient={customNpub} />
      </TestApp>
    );

    expect(screen.getByText(/Feedback will be sent via encrypted DM to npub1abc123d/)).toBeInTheDocument();
  });

  it('reopens feedback popup when minimized button is clicked', () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'feedback-dismissed') return 'true';
      return null;
    });

    render(
      <TestApp>
        <FeedbackPopup />
      </TestApp>
    );

    // Should show minimized button initially
    const minimizedButton = screen.getByRole('button', { name: 'Open feedback' });
    expect(minimizedButton).toBeInTheDocument();

    // Click to reopen
    fireEvent.click(minimizedButton);

    // Should now show the full popup
    expect(screen.getByText('How are we doing?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open feedback' })).not.toBeInTheDocument();
  });

  it('shows minimized button after dismissing popup', () => {
    render(
      <TestApp>
        <FeedbackPopup isOpen={true} />
      </TestApp>
    );

    // Dismiss the popup
    const dismissButton = screen.getByText('Not now');
    fireEvent.click(dismissButton);

    // Should now show minimized button
    expect(screen.queryByText('How are we doing?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open feedback' })).toBeInTheDocument();
  });
});