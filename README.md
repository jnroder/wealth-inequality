# Wealth Inequality Dashboard

A real-time visualization dashboard tracking wealth inequality metrics using various data sources, including:
- FRED (Federal Reserve Economic Data) API
- United States Census Bureau Data APIs

## Features
- Real-time data fetching from FRED API
- Interactive data visualization
- Serverless architecture using AWS Lambda
- CDN delivery via CloudFront

## Tech Stack
- Frontend: React + Vite
- Design: TailwindCSS
- Backend: AWS Lambda
- Infrastructure: AWS CDK
- Data Source: FRED API

## Prerequisites
- Node.js and npm
- AWS Account and CLI
- Docker Desktop
- AWS SAM CLI

## Project Setup

### Clone the Repository
You can clone this repository in two ways:

1. Clone with submodules (recommended):
```bash
git clone --recurse-submodules git@github.com:jnroder/wealth-inequality.git
```

2. Or if you've already cloned the repository:
```bash
git clone git@github.com:jnroder/wealth-inequality.git
cd wealth-inequality
git submodule init
git submodule update
```

## Development

### Frontend Development
```bash
npm run dev  # Start Vite dev server
```
Runs on http://localhost:5173

```bash
npx tailwindcss -i ./src/input.css -o ./src/output.css --watch # Compile CSS usin g Tailwind build process
```

### Local Lambda Testing - This serves *our* API endpoints
```bash
cd infrastructure

# Windows
cdk synth --no-staging | Out-File -Encoding UTF8 template.yaml  # Generate CloudFormation template
# Mac / Linux
cdk synth --no-staging | cat > template.yaml # Generate CloudFormation template

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

## Infrastructure Updates
The infrastructure code is maintained in a separate repository and included as a git submodule. To update the infrastructure:

1. Navigate to the infrastructure directory:
```bash
cd infrastructure
```

2. Pull latest changes:
```bash
git pull origin main
```

3. Return to root and commit the submodule update:
```bash
cd ..
git add infrastructure
git commit -m "Update infrastructure submodule"
```

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