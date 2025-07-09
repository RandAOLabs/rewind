# Deployment Guide

This template is configured for automatic deployment to Arweave using permaweb-deploy and GitHub Actions.

## Prerequisites

Before you can deploy, you'll need:

1. An Arweave wallet with:
   - Sufficient [Turbo Credits](https://docs.ardrive.io/docs/turbo/what-is-turbo.html) for deployment (purchase at [turbo-topup.com](https://turbo-topup.com/))
   - Owner or controller access to your target ArNS name

## GitHub Configuration

### Secrets

1. `DEPLOY_KEY`: Your base64-encoded Arweave wallet keyfile
   - To convert your wallet file to base64:
     ```bash
     # Mac/Linux
     base64 wallet.json | pbcopy
     
     # Windows
     base64 wallet.json | clip
     ```

### Variables

1. `DEPLOY_ANT_PROCESS_ID`: Your ArNS name's ANT process ID
   - Get this from [arns.app/#/manage/names](https://arns.app/#/manage/names)
   - Connect your wallet that owns/controls the ArNS name
   - Find your ArNS name in the list
   - Copy the process ID displayed with your name

2. `DEPLOY_UNDERNAME` (optional): If deploying to an undername of your ArNS name
   - Set this to the desired undername

3. `GA4_MEASUREMENT_ID`: Your Google Analytics 4 measurement ID
   - Format: G-XXXXXXXXXX
   - Get this from your GA4 property settings

## Deployment

Once configured, deployment is automatic:
- Every push to the `main` branch triggers a deployment
- The app is built with environment variables injected
- The build is deployed to Arweave
- Your ArNS name is updated to point to the new deployment

For manual deployments or troubleshooting, refer to:
- [AR.IO Deployment Guide](https://docs.ar.io/guides/perma-deploy/index.html)
- [permaweb-deploy Repository](https://github.com/permaweb/permaweb-deploy)
