# Feedback System

This project includes a feedback popup system that collects user ratings and improvement suggestions via encrypted Nostr DMs.

## Features

- ⭐ **Star Rating**: 1-5 star rating system with hover effects
- 💬 **Improvement Suggestions**: Free-text feedback with 500 character limit
- 🔒 **Encrypted DMs**: Feedback sent via NIP-44 encrypted direct messages
- ⏰ **Auto-popup**: Automatically shows after 30 seconds for logged-in users
- 🔄 **Minimized Button**: After dismissal/submission, shows a small button to reopen
- 🚫 **Session Tracking**: Prevents multiple auto-popups per session
- 🎨 **Responsive Design**: Works on mobile and desktop

## Configuration

### Default Recipient

The default feedback recipient is configured in the code:

```typescript
// In src/components/FeedbackPopup.tsx
const DEFAULT_FEEDBACK_NPUB = 'npub17dmmwz9dcs6rehfwvr4yd35r7fg8na6hu5fqfnhrs80q7etjveyq24tduz';
```

### App Configuration

You can also configure the feedback recipient via the app configuration:

```typescript
// In src/App.tsx or wherever you set up AppProvider
const defaultConfig: AppConfig = {
  theme: "light",
  relayUrl: "wss://relay.primal.net",
  feedbackRecipient: "npub1your_custom_npub_here", // Optional
};
```

### Component Props

The `FeedbackPopup` component accepts these props:

```typescript
interface FeedbackPopupProps {
  /** The npub to send feedback to (overrides config and default) */
  feedbackRecipient?: string;
  /** Whether to show the popup initially */
  isOpen?: boolean;
  /** Callback when popup is closed */
  onClose?: () => void;
}
```

## Usage

### Automatic Integration

The feedback popup is automatically integrated into the app and will:

1. Show automatically after 30 seconds for logged-in users
2. Only auto-show once per session (prevents spam)
3. After dismissal or submission, show a minimized button for easy access
4. Allow multiple feedback submissions via the minimized button
5. Require user login to submit feedback
6. Require NIP-44 encryption support in the user's signer

### User Flow

1. **First Visit**: Popup appears automatically after 30 seconds
2. **User Dismisses**: Popup closes, minimized button appears in bottom-right
3. **User Submits**: Feedback sent, minimized button appears for future feedback
4. **Subsequent Use**: User can click minimized button to provide more feedback

### Manual Control

You can also control the popup manually:

```tsx
import { FeedbackPopup } from '@/components/FeedbackPopup';
import { useFeedback } from '@/hooks/useFeedback';

function MyComponent() {
  const { isOpen, openFeedback, closeFeedback } = useFeedback();

  return (
    <div>
      <button onClick={openFeedback}>
        Give Feedback
      </button>

      <FeedbackPopup
        isOpen={isOpen}
        onClose={closeFeedback}
        feedbackRecipient="npub1custom_recipient"
      />
    </div>
  );
}
```

## Message Format

Feedback is sent as encrypted DMs with this format:

```
App Feedback:

Rating: 4/5 stars

What could be improved:
The dark mode could be better

Submitted: 2025-08-05T12:34:56.789Z
URL: https://yourapp.com/current-page
```

## Requirements

- **User Login**: Users must be logged in to submit feedback
- **NIP-44 Support**: User's signer must support NIP-44 encryption
- **Valid Recipient**: Feedback recipient must be a valid npub

## Security

- All feedback is encrypted using NIP-44 before sending
- Only the intended recipient can decrypt and read the feedback
- No sensitive user data is included beyond what they explicitly type
- Session tracking prevents auto-popup spam but allows manual submissions
- Session data doesn't persist across browser sessions

## Customization

### Styling

The popup uses Tailwind CSS classes and can be customized by modifying the component styles.

### Minimized Button

The minimized button appears as a circular button with a MessageSquare icon. To customize its appearance, modify the Button component in the `FeedbackPopup.tsx` file:

```tsx
<Button
  onClick={handleReopen}
  className="rounded-full h-12 w-12 shadow-lg" // Customize these classes
  aria-label="Open feedback"
>
  <MessageSquare className="h-5 w-5" />
</Button>
```

### Timing

To change the auto-popup delay, modify the timeout in `FeedbackPopup.tsx`:

```typescript
const timer = setTimeout(() => {
  setIsVisible(true);
}, 30000); // Change this value (in milliseconds)
```

### Character Limit

To change the feedback text limit, modify the `maxLength` prop:

```tsx
<Textarea
  maxLength={500} // Change this value
  // ...
/>
```