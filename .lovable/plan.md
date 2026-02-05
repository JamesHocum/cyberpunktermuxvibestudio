
# Update GitHub OAuth Secrets

## Problem
The GitHub OAuth 404 error is caused by an invalid or mismatched `GITHUB_CLIENT_ID` stored in Lovable Cloud secrets. The current secret value doesn't match your OAuth App registered at GitHub.

## Solution
Update the two GitHub OAuth secrets to match your registered OAuth App:

| Secret | New Value |
|--------|-----------|
| `GITHUB_CLIENT_ID` | `Ov23lithJ8qJNvVP42mj` |
| `GITHUB_CLIENT_SECRET` | `65afef8ae82da7f326f81d9cd300574da228c43f` |

## Implementation Steps

1. **Update GITHUB_CLIENT_ID secret** - Replace with your OAuth App's Client ID
2. **Update GITHUB_CLIENT_SECRET secret** - Replace with your OAuth App's Client Secret
3. **Redeploy the github-oauth edge function** - Ensure it picks up the new secret values

## Expected Result
After updating the secrets:
- Clicking "Connect GitHub" will open GitHub's authorize page correctly (no 404)
- The OAuth flow will complete and redirect back to `https://cyberpunk-termux.spell-weaver-studio.com/github/callback`
- Your GitHub account will be linked successfully

## No Code Changes Required
This fix only requires updating the secret values - no code modifications needed.
