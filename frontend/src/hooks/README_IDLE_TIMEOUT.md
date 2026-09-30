# useIdleTimeout Hook - Quick Reference

## Installation
Already integrated! Just import and use.

## Basic Usage

```javascript
import useIdleTimeout from './hooks/useIdleTimeout';

function MyComponent() {
  const { showWarning, remainingTime, resetTimer } = useIdleTimeout({
    idleTimeout: 120000,  // 2 minutes
    warningTime: 30000,   // 30 seconds
    enabled: true
  });

  return (
    <Modal show={showWarning}>
      <p>Logging out in {remainingTime} seconds</p>
      <button onClick={resetTimer}>Stay Logged In</button>
    </Modal>
  );
}
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `idleTimeout` | number | 120000 | Total idle time in milliseconds before logout |
| `warningTime` | number | 30000 | Warning countdown time in milliseconds |
| `enabled` | boolean | true | Enable/disable the idle timeout |

## Returns

| Property | Type | Description |
|----------|------|-------------|
| `showWarning` | boolean | Whether to display warning modal |
| `remainingTime` | number | Seconds remaining before auto-logout |
| `resetTimer` | function | Function to reset the idle timer |

## Tracked Events

The hook monitors these user activities:
- Mouse movements
- Mouse clicks  
- Keyboard input
- Scrolling
- Touch events

Any of these events will reset the idle timer.

## How It Works

```
User Activity → Timer Starts → ... Idle ... 
→ Warning (last 30s) → Countdown → Auto Logout
```

## Examples

### Default (2 min idle, 30 sec warning)
```javascript
const { showWarning, remainingTime, resetTimer } = useIdleTimeout();
```

### Custom Timing (5 min idle, 1 min warning)
```javascript
const { showWarning, remainingTime, resetTimer } = useIdleTimeout({
  idleTimeout: 300000,  // 5 minutes
  warningTime: 60000,   // 1 minute
});
```

### Disable for Admins
```javascript
const isAdmin = userInfo?.role === 'admin';

const { showWarning, remainingTime, resetTimer } = useIdleTimeout({
  enabled: !isAdmin
});
```

### Only Enable When Logged In
```javascript
const isLoggedIn = !!userInfo;

const { showWarning, remainingTime, resetTimer } = useIdleTimeout({
  enabled: isLoggedIn
});
```

## Integration with Warning Modal

```javascript
import useIdleTimeout from './hooks/useIdleTimeout';
import IdleTimeoutWarning from './components/IdleTimeoutWarning';

function App() {
  const { showWarning, remainingTime, resetTimer } = useIdleTimeout();

  return (
    <>
      <YourAppContent />
      <IdleTimeoutWarning
        show={showWarning}
        remainingTime={remainingTime}
        onStayLoggedIn={resetTimer}
      />
    </>
  );
}
```

## Production Setup

The hook is already integrated in `/frontend/src/App.jsx` via the `IdleTimeoutManager` component:

```javascript
// In App.jsx
import IdleTimeoutManager from './components/IdleTimeoutManager/IdleTimeoutManager.jsx';

const App = () => {
  return (
    <>
      <IdleTimeoutManager /> {/* Auto-logout feature */}
      {/* rest of app */}
    </>
  )
}
```

## Testing

For quick testing with shorter timeouts:

```javascript
const { showWarning, remainingTime } = useIdleTimeout({
  idleTimeout: 30000,   // 30 seconds
  warningTime: 10000,   // 10 seconds
});
```

See `IdleTimeoutDemo.jsx` component for a full testing interface.

## Notes

- ⚠️ Timer resets on ANY user activity
- ⚠️ Each browser tab has independent timer
- ⚠️ Closing modal requires clicking "Stay Logged In"
- ✅ Automatic cleanup on component unmount
- ✅ Works with existing logout system
- ✅ No backend changes needed

## Related Files

- `/hooks/useIdleTimeout.js` - Main hook
- `/hooks/useLogout.js` - Logout functionality
- `/components/IdleTimeoutWarning/` - Warning modal
- `/components/IdleTimeoutManager/` - App integration
- `/IDLE_TIMEOUT_GUIDE.md` - Full documentation
