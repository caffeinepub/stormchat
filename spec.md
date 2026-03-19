# Storm

## Current State
Full-stack messaging app disguised as a weather app. Has backend for messages, profiles, conversations, and markAsRead. Frontend polls every 3-5s for updates. Read receipts show ✓ or ✓✓ based on readTimestamps. No typing indicators or real online/offline status.

## Requested Changes (Diff)

### Add
- Backend: `UserStatus` type with `isOnline: Bool` and `lastSeen: Time`
- Backend: `setOnlineStatus(isOnline: Bool)` - updates caller's presence
- Backend: `setTyping(recipient: Principal, isTyping: Bool)` - updates typing flag
- Backend: `getUserStatuses(users: [Principal])` - batch fetch statuses
- Backend: `getTypingStatus(from: Principal)` - check if someone is typing to caller
- Frontend: Typing indicator ("typing...") shown in chat header and conversation list
- Frontend: Real online/last seen status in chat header instead of hardcoded "Online"
- Frontend: Heartbeat (every 30s) calling setOnlineStatus(true) while app is open
- Frontend: setOnlineStatus(false) on app unload
- Frontend: Poll typing status every 2s when in a chat

### Modify
- Frontend: Chat header shows real status (Online / Last seen at HH:MM)
- Frontend: Read receipts: ✓ = sent, ✓✓ gray = delivered, ✓✓ blue = seen
- Backend: `markAsRead` already exists - keep it

### Remove
- Nothing removed

## Implementation Plan
1. Add UserStatus and typing state to Motoko backend
2. Add setOnlineStatus, setTyping, getUserStatuses, getTypingStatus functions
3. Update frontend hooks to call new backend APIs
4. Add heartbeat effect in MessagingOverlay
5. Add typing state management (debounce on input)
6. Update chat header to show real status
7. Update conversation list to reflect typing state
8. Keep all existing functionality intact
