# Wealth Inequality Dashboard

A real-time visualization dashboard tracking wealth inequality metrics using FRED (Federal Reserve Economic Data) API.

## Features
- Real-time data fetching from FRED API
- Interactive data visualization
- Serverless architecture using AWS Lambda
- CDN delivery via CloudFront

## Tech Stack
- Frontend: React + Vite
- Backend: AWS Lambda
- Infrastructure: AWS CDK
- Data Source: FRED API

## Prerequisites
- Node.js and npm
- AWS Account and CLI
- Docker Desktop
- AWS SAM CLI

## Development Tools

### Frontend Development
```bash
npm run dev  # Start Vite dev server
```
Runs on http://localhost:5173

### Local Lambda Testing
```bash
cd infrastructure
cdk synth --no-staging | Out-File -Encoding UTF8 template.yaml  # Generate CloudFormation template
# cdk synth --no-staging | cat > template.yaml # bash
npm run lambda # Start local API. Docker must be running for this to work.
```
Runs on http://localhost:3000

### Deployment
```bash
npm run build          # Build frontend
cd infrastructure
cdk deploy            # Deploy to AWS
```

## Environment Setup

Create the following files:

`.env.development`:
```
VITE_API_URL=http://localhost:3000
VITE_FRED_API_KEY=your_key_here
```

`.env.production`:
```
VITE_API_URL=https://your-api-gateway-url/prod
```

`infrastructure/.env`:
```
FRED_API_KEY=your_key_here
```

## Architecture
- Frontend hosted on S3, distributed via CloudFront
- API Gateway triggers Lambda function
- Lambda fetches and processes FRED data
- Environment-specific configurations for local and production

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## Local Development
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Start local Lambda: `npm run lambda`

## Production Deployment
1. Build frontend: `npm run build`
2. Deploy: `cd infrastructure && cdk deploy`
3. Access via provided CloudFront URL
