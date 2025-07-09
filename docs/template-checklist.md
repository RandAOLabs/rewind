# Template Setup Checklist

## Initial Setup

- [ ] Update package.json
  - [ ] Change name and version
  - [ ] Update description
  - [ ] Update repository URL
  - [ ] Update author information

## Analytics Setup

- [ ] Google Analytics
  - [ ] Set up GA4 property
  - [ ] Add GA4_MEASUREMENT_ID to GitHub Variables
    - Format: G-XXXXXXXXXX
    - Get from GA4 property settings

## Deployment Configuration

- [ ] GitHub Secrets
  - [ ] DEPLOY_KEY: Base64 encoded Arweave wallet keyfile

- [ ] GitHub Variables
  - [ ] DEPLOY_ANT_PROCESS_ID: ArNS name's ANT process ID
  - [ ] DEPLOY_UNDERNAME (optional): For ArNS undername
  - [ ] GA4_MEASUREMENT_ID: Google Analytics measurement ID

## PWA Configuration

- [ ] Update vite.config.ts PWA settings
  - [ ] App name and description
  - [ ] Theme colors
  - [ ] Icons configuration
  - [ ] Cache strategies

## Assets and Branding

- [ ] Replace logos in public/
  - [ ] Update favicon.ico
  - [ ] Add PWA icons (192x192 and 512x512)
  - [ ] Update other brand assets
