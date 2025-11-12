# Google Cloud Platform Setup Guide

This guide walks you through setting up Google Cloud Platform (GCP) for the Family Weekend Planner application.

## Project Information

- **GCP Project ID**: `tech-verification-265409`
- **Region**: `us-central1` (recommended)

## Prerequisites

- Google Account
- Access to GCP project `tech-verification-265409`
- GCP billing enabled

## Step 1: Enable Required APIs

Navigate to the [GCP Console API Library](https://console.cloud.google.com/apis/library) and enable the following APIs:

### 1.1 Vertex AI API

```
https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=tech-verification-265409
```

- Click **"Enable"**
- This enables: Gemini models, Google Maps grounding

### 1.2 Google Maps Platform APIs

Enable each of the following:

**Maps JavaScript API**
```
https://console.cloud.google.com/apis/library/maps-backend.googleapis.com?project=tech-verification-265409
```

**Geocoding API**
```
https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com?project=tech-verification-265409
```

**Places API (New)**
```
https://console.cloud.google.com/apis/library/places-backend.googleapis.com?project=tech-verification-265409
```

**Directions API**
```
https://console.cloud.google.com/apis/library/directions-backend.googleapis.com?project=tech-verification-265409
```

**Distance Matrix API**
```
https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com?project=tech-verification-265409
```

## Step 2: Create Service Account for Backend

### 2.1 Navigate to Service Accounts

```
https://console.cloud.google.com/iam-admin/serviceaccounts?project=tech-verification-265409
```

### 2.2 Create Service Account

1. Click **"+ CREATE SERVICE ACCOUNT"**
2. Fill in details:
   - **Name**: `family-weekend-planner-backend`
   - **ID**: `family-weekend-planner-backend`
   - **Description**: `Service account for backend server to access Vertex AI and Maps APIs`
3. Click **"CREATE AND CONTINUE"**

### 2.3 Grant Roles

Add the following roles:

- **Vertex AI User** (`roles/aiplatform.user`)
  - Allows calling Vertex AI API
- **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`)
  - Allows generating tokens

Click **"CONTINUE"** then **"DONE"**

### 2.4 Create and Download Key

1. Click on the newly created service account
2. Go to the **"KEYS"** tab
3. Click **"ADD KEY"** → **"Create new key"**
4. Select **"JSON"** format
5. Click **"CREATE"**
6. Save the downloaded JSON file as:
   ```
   backend/config/service-account-key.json
   ```

⚠️ **Security Warning**: Never commit this file to git. It's already in `.gitignore`.

## Step 3: Create API Keys

### 3.1 Backend API Key (Server-side)

Navigate to:
```
https://console.cloud.google.com/apis/credentials?project=tech-verification-265409
```

1. Click **"+ CREATE CREDENTIALS"** → **"API key"**
2. Copy the API key
3. Click **"EDIT API KEY"** to restrict it:
   - **Name**: `Backend Maps API Key`
   - **Application restrictions**:
     - For development: None
     - For production: IP addresses (add your server IP)
   - **API restrictions**: Restrict to:
     - Geocoding API
     - Places API (New)
     - Directions API
     - Distance Matrix API
4. Save this key in `backend/.env` as `GOOGLE_MAPS_API_KEY`

### 3.2 Frontend API Key (Client-side)

1. Click **"+ CREATE CREDENTIALS"** → **"API key"**
2. Copy the API key
3. Click **"EDIT API KEY"** to restrict it:
   - **Name**: `Frontend Maps JavaScript API Key`
   - **Application restrictions**:
     - HTTP referrers (websites)
     - For development: `http://localhost:*`
     - For production: Add your domain (e.g., `https://yourdomain.com/*`)
   - **API restrictions**: Restrict to:
     - Maps JavaScript API
4. Save this key in `frontend/.env` as `VITE_GOOGLE_MAPS_API_KEY`

## Step 4: Verify Setup

### 4.1 Check Enabled APIs

```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# List enabled APIs
gcloud services list --enabled --project=tech-verification-265409
```

You should see:
- `aiplatform.googleapis.com`
- `maps-backend.googleapis.com`
- `geocoding-backend.googleapis.com`
- `places-backend.googleapis.com`
- `directions-backend.googleapis.com`
- `distance-matrix-backend.googleapis.com`

### 4.2 Test Service Account

```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="backend/config/service-account-key.json"

# Test authentication
gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS

# Verify access
gcloud projects get-iam-policy tech-verification-265409
```

## Step 5: Configure Backend Environment

1. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and fill in:
   ```bash
   GOOGLE_CLOUD_PROJECT_ID=tech-verification-265409
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=./config/service-account-key.json
   GOOGLE_MAPS_API_KEY=your-backend-api-key-here
   ```

## Step 6: Set Up Billing Alerts (Recommended)

### 6.1 Navigate to Billing

```
https://console.cloud.google.com/billing
```

### 6.2 Create Budget Alert

1. Go to **"Budgets & alerts"**
2. Click **"CREATE BUDGET"**
3. Configure:
   - **Name**: `Family Weekend Planner Budget`
   - **Projects**: Select `tech-verification-265409`
   - **Budget amount**: Set based on expected usage (e.g., $500/month)
   - **Threshold rules**:
     - 50% of budget
     - 90% of budget
     - 100% of budget
4. Add email notifications

## Cost Estimates

### Free Tier (First 90 days)
- $300 free credits for new GCP accounts

### Monthly Costs (After free tier)

**Vertex AI (Gemini 1.5 Pro)**
- Input: $3.50 per 1M tokens
- Output: $10.50 per 1M tokens
- Grounding: $35 per 1,000 requests

**Google Maps Platform**
- Each API has $200 monthly credit
- Additional usage charged beyond free tier

**Estimated for 1,000 users/month**: ~$95-150

See [PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md#cost-estimates) for detailed cost breakdown.

## Troubleshooting

### API Not Enabled Error

```
Error: API [servicename] not enabled
```

**Solution**: Enable the API at:
```
https://console.cloud.google.com/apis/library/[api-name]?project=tech-verification-265409
```

### Authentication Error

```
Error: Could not load the default credentials
```

**Solution**:
1. Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
2. Check the service account has proper roles
3. Ensure the JSON key file is valid

### Permission Denied

```
Error: Permission denied on resource
```

**Solution**:
1. Verify service account has required roles
2. Check API is enabled
3. Wait a few minutes for IAM changes to propagate

## Next Steps

After completing this setup:

1. ✅ All APIs are enabled
2. ✅ Service account is created with proper roles
3. ✅ API keys are created and restricted
4. ✅ Backend environment is configured
5. ✅ Billing alerts are set up

You can now proceed with backend development (Issue #2).

## Additional Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Google Maps Platform Documentation](https://developers.google.com/maps)
- [Grounding with Google Maps](https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/ground-with-google-maps)
- [GCP IAM Best Practices](https://cloud.google.com/iam/docs/best-practices)
