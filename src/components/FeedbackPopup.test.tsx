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

  it('does not render when user has already submitted feedback', () => {
    mockSessionStorage.getItem.mockReturnValue('true');

    render(
      <TestApp>
        <FeedbackPopup isOpen={true} />
      </TestApp>
    );

    expect(screen.queryByText('How are we doing?')).not.toBeInTheDocument();
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
});