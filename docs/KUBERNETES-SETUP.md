# Kubernetes Deployment Setup

## Overview

DublinDash is deployed to AWS EKS using a simplified Docker + Kubernetes approach:

- **Frontend**: Vue.js app served by Nginx with runtime environment injection
- **Backend**: Node.js app with WebSocket support for real-time multiplayer
- **Both**: Built and deployed via GitHub Actions to your EKS cluster

## Required GitHub Variables

Go to your GitHub repository → Settings → Secrets and variables → Actions

### Variables (Repository Variables):
Create a single variable called `VARS` with this content:
```
AWS_REGION=us-east-1
FRONTEND_HOST=dublindash.wilde.agency
BACKEND_HOST=dublindash-api.wilde.agency
FRONTEND_REPLICAS=1
BACKEND_REPLICAS=1
DOCKER_REGISTRY=683145523527.dkr.ecr.us-east-1.amazonaws.com
EKS_CLUSTER_NAME=wa1
K8S_CONTEXT=arn:aws:eks:us-east-1:683145523527:cluster/wa1
```

### Secrets (Repository Secrets):
Create a single secret called `SECRETS` with this content:
```
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## Environment Variable Injection

### Frontend (Production)
The frontend Dockerfile creates an `env.js` file at runtime:
```javascript
window.env = {
  "BACKEND_URL": "https://dublindash-api.wilde.agency"
}
```

### Frontend (Development)
Create a `.env.local` file in `apps/frontend/`:
```bash
# apps/frontend/.env.local
BACKEND_URL=http://localhost:3010
```

## Deployment Process

1. **Push to main branch** triggers the workflow
2. **Build ID generation**: `main-20241212T1430-abc1234`
3. **GitHub Actions builds**: Frontend and backend compiled in CI
4. **Docker builds**: Fast copying of pre-built `dist/` folders (no compilation!)
5. **ECR push**: Images uploaded to your registry
6. **K8s deployment**: Using environment variable substitution
7. **Verification**: Check deployments, services, and ingresses

### Build Strategy Benefits
✅ **Fast Docker builds** - No compilation, just file copying
✅ **Easy debugging** - Build errors visible in GitHub Actions logs
✅ **Better caching** - CI caches dependencies across builds

## Manual Deployment

```bash
# Set environment variables
export BUILD_ID="manual-$(date +%Y%m%dT%H%M)"
export DOCKER_REGISTRY="your-ecr-registry"
export ENVIRONMENT="main"
# ... other vars

# Deploy backend
cd devops/scripts
./k8s-deploy.sh ../k8s/backend.yaml apply

# Deploy frontend
./k8s-deploy.sh ../k8s/frontend.yaml apply
```

## Architecture Benefits

✅ **WebSocket Support**: Unlike Vercel, EKS supports persistent connections
✅ **Environment Injection**: Runtime configuration without rebuilding
✅ **Scalable**: Independent scaling for frontend/backend
✅ **SSL/TLS**: Automatic certificates via cert-manager
✅ **Session Affinity**: WebSocket clients stick to same backend pod

## Monitoring

```bash
# Check deployments
kubectl get deployments -l app=dublindash-frontend-main
kubectl get deployments -l app=dublindash-backend-main

# Check pods
kubectl get pods -l app=dublindash-frontend-main
kubectl get pods -l app=dublindash-backend-main

# Check logs
kubectl logs -l app=dublindash-backend-main -f

# Check ingress
kubectl get ingress
```

## Troubleshooting

### WebSocket Issues
- Ensure session affinity is configured
- Check nginx ingress timeout settings
- Verify backend health probes

### Image Pull Errors
- Confirm ECR permissions
- Check DOCKER_REGISTRY format
- Verify BUILD_ID generation

### DNS Issues
- Check ingress configuration
- Verify cert-manager is working
- Confirm DNS records point to load balancer