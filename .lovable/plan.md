

## Fix: "Let's Connect On..." Platform Links

### Root Cause

The `getPlatformUrl` function in `src/components/messages/types.ts` has three bugs:

1. **Ignores the platform parameter** -- always returns `sender.link` (a generic profile link) regardless of which platform was selected
2. **Uses the wrong profile** -- shows the sender's link instead of the recipient's platform-specific URL
3. **Missing data** -- `SenderProfile` only fetches `id, display_name, avatar_url, link` from the profiles table. It never fetches the platform-specific fields (`linkedin_url`, `instagram_url`, `whatsapp`, `contact_email`, `phone_number`)

This is why JD saw a link to "INdignified" (the sender's generic `link` field) when clicking "Let's connect on WhatsApp."

### Fix

#### 1. Expand `SenderProfile` type and query (`src/components/messages/types.ts` + `useMessagesData.ts`)

Add platform-specific fields to `SenderProfile`:

```typescript
export interface SenderProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  link: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
  contact_email: string | null;
  phone_number: string | null;
}
```

Update the profiles query in `useMessagesData.ts` to fetch these fields:

```typescript
.select("id, display_name, avatar_url, link, linkedin_url, instagram_url, whatsapp, contact_email, phone_number")
```

#### 2. Fix `getPlatformUrl` to use the correct field per platform (`src/components/messages/types.ts`)

```typescript
export const getPlatformUrl = (platform: string, profile?: SenderProfile): string | null => {
  if (!profile) return null;
  switch (platform) {
    case "linkedin":
      return profile.linkedin_url || null;
    case "instagram":
      return profile.instagram_url || null;
    case "whatsapp":
      return profile.whatsapp
        ? `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`
        : null;
    case "email":
      return profile.contact_email
        ? `mailto:${profile.contact_email}`
        : null;
    case "phone":
      return profile.phone_number
        ? `tel:${profile.phone_number}`
        : null;
    default:
      return profile.link || null;
  }
};
```

#### 3. Use the correct profile in `MessageBubble.tsx`

The `PlatformSuggestion` component currently passes `message.sender` to `getPlatformUrl`. For "Let's connect on X" links, we need the **other user's** profile -- when you receive a message saying "let's connect on WhatsApp," the link should go to the sender's WhatsApp. When you sent the message, the link should go to the recipient's WhatsApp.

Update `PlatformSuggestion` to pick the right profile:

- For received messages: use `message.sender` (the other person who sent the suggestion)
- For sent messages: use `message.recipient` (the person you want to connect with)

Since `MessageBubble` already receives `isReceived`, pass it down to `PlatformSuggestion`:

```typescript
const contactProfile = isReceived ? message.sender : message.recipient;
const platformUrl = getPlatformUrl(message.platform_suggestion, contactProfile);
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/messages/types.ts` | Expand `SenderProfile` with platform fields; rewrite `getPlatformUrl` to map each platform to the correct URL field |
| `src/components/messages/useMessagesData.ts` | Add platform fields to the profiles SELECT query |
| `src/components/messages/MessageBubble.tsx` | Pass `isReceived` to `PlatformSuggestion`; use correct profile (sender vs recipient) for the link |

### Privacy Note

The profiles query already respects RLS policies. The platform-specific fields (linkedin_url, instagram_url, etc.) are stored on public profiles and are already visible on the public profile page via `ProfileInfoCard`. No new data exposure occurs.

