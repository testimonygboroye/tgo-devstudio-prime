# Phase 15 — Unified Communications Reliability

## Implemented in this phase

- Preserve per-member WhatsApp mirroring: the company sender is shared, while every TGO account registers its own personal WhatsApp destination and consent.
- Route inbound WhatsApp messages in private AI conversations through the same approval governance as in-platform AI messages.
- Persist approval-required WhatsApp AI tasks in the AI Workforce queue and publish approved results back into the originating conversation.
- Enforce the configured daily AI token budget before automatic WhatsApp AI execution, and record an explanatory system message when the budget is exhausted.
- Show direct-message and group-message read receipts using each message's readBy member list rather than treating one reader as a global conversation-wide read.
- Add unit coverage for AI approval/budget policy and read-receipt summaries.

## Existing communication capabilities retained

Direct messages, groups, channels, AI employee conversations, text and message search, threads, reactions, message edits/deletion/pinning, attachment uploads, voice notes, browser-supported live speech recognition, translation, history export, delivery state, and the opt-in per-user WhatsApp mirror remain part of the existing Communications Hub.

## Security and governance

- Conversation access remains membership-based; founder status does not grant access to another user's private conversations.
- WhatsApp webhook requests continue to require Meta HMAC signature validation and inbound sender-to-user matching.
- Per-user WhatsApp mirroring requires explicit destination consent and remains subject to Meta's service-window and template rules.
- Approval-gated AI agents do not answer inbound WhatsApp messages until a founder approves and executes the task.
- AI task results return only to the originating conversation; the task execution endpoint checks that the requesting user belongs to that conversation.
- Read receipts are scoped to conversation participants.

## Known limitations not represented as completed

- Inbound WhatsApp media download and secure storage are not implemented; media currently appears as a placeholder.
- Approved WhatsApp template selection and delivery outside the 24-hour service window are not exposed.
- Voice transcription uses browser speech recognition where supported; server-side transcription is not guaranteed.
- Presence, typing indicators, and push notifications for new conversation messages remain future enhancements.
