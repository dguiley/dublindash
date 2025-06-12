# GitHub Variables Template

Copy these exact values into your GitHub repository settings.

## Repository Variables

### Variable Name: `VARS`
```
AWS_REGION=us-east-1
FRONTEND_HOST=dublindash.wilde.house
BACKEND_HOST=dublindash-api.wilde.house
FRONTEND_REPLICAS=1
BACKEND_REPLICAS=1
DOCKER_REGISTRY=683145523527.dkr.ecr.us-east-1.amazonaws.com
EKS_CLUSTER_NAME=wa1
K8S_CONTEXT=arn:aws:eks:us-east-1:683145523527:cluster/wa1
```

## Repository Secrets

### Secret Name: `SECRETS`
```
AWS_ACCESS_KEY_ID=________
AWS_SECRET_ACCESS_KEY=________
OPENAI_API_KEY=________
```

## Setup Instructions

1. Go to your GitHub repository
2. Navigate to: Settings → Secrets and variables → Actions
3. Click on "Variables" tab
4. Click "New repository variable"
5. Name: `VARS`
6. Value: Copy the VARS content above
7. Click "Add variable"
8. Click on "Secrets" tab
9. Click "New repository secret"
10. Name: `SECRETS`
11. Value: Copy the SECRETS content above
12. Click "Add secret"

That's it! The workflow will automatically parse these values and use them for deployment.