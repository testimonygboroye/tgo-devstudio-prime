# TGO DevStudio Prime — Provider setup and verification

## Google Search Console and Google Analytics

The existing Google OAuth client ID is available as `GOOGLE_CLIENT_ID`. The production environment does not currently contain a Google OAuth client secret. Add the secret from the same OAuth 2.0 Web application client in Google Cloud Console.

1. Open Google Cloud Console → APIs & Services → Credentials.
2. Open the existing OAuth 2.0 Client ID used by TGO DevStudio.
3. Copy its client secret. Do not paste it into a chat or source file.
4. In Vercel → TGO DevStudio Prime → Settings → Environment Variables, add:
   - Key: `GOOGLE_CLIENT_SECRET`
   - Value: the secret from the existing Web application OAuth client
   - Environments: Production and Preview (Development optional)
5. Keep the existing `GOOGLE_CLIENT_ID` and `SITE_URL` values.
6. In Google Cloud Console → APIs & Services → Credentials → the same OAuth client → Authorized redirect URIs, add exactly:
   - `https://tgo-devstudio-prime.vercel.app/api/platform/integrations/google/callback`
   - If Google OAuth is also used on Render, add `https://tgo-devstudio-prime.onrender.com/api/platform/integrations/google/callback`.
7. Save the OAuth client, redeploy after the environment variable is added, then use Admin → Integrations → Google Search Console / Google Analytics → Authorize.

The app accepts either `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` or `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`. `GOOGLE_OAUTH_REDIRECT_URI` can override the callback URL when a deployment requires a specific registered URI. The callback URL sent to Google must match an Authorized redirect URI exactly.

## Brevo

Transactional email uses `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` from the production environment. The integration test now prefers these environment values and, after a successful account and active-sender check, stores the verified values in the encrypted integration record. Run Admin → Integrations → Brevo → Verify sender & account. No email is sent by this verification check.

## Twilio SMS

The Twilio integration test reads `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_SMS_FROM` from the production environment. It verifies account access and confirms that the configured sender is an active phone number on the account. A Twilio account without a verified sender is not marked connected. No SMS is sent by the verification check.

WhatsApp business messaging uses the direct Meta WhatsApp Cloud API integration, not Twilio. Personal WhatsApp mirroring is only attempted for users who explicitly opt in and while the 24-hour service window is open.

## Paystack

The Paystack integration check calls the read-only balance endpoint. It does not initialize a charge, refund a payment or alter a customer transaction. End-to-end payment tests must use Paystack test-mode credentials and a dedicated test order before any live payment is attempted.

## Bank transfers

The two founder-supplied NGN receiving accounts are configured in Finance Settings and are shown only to authenticated clients in the Client Portal. Client submissions remain pending until a human verifies the bank credit. A submitted reference alone never marks an invoice or order paid.
