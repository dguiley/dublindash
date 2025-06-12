#!/bin/bash
# Kubernetes deployment script with environment variable replacement

set -e

# Function to show usage
usage() {
    echo "Usage: $0 <yaml-file> [apply|delete] [env-file]"
    echo ""
    echo "Examples:"
    echo "  $0 ../k8s/frontend.yaml apply"
    echo "  $0 ../k8s/backend.yaml delete"
    echo "  $0 ../k8s/frontend.yaml apply .env"
    exit 1
}

# Check arguments
if [ $# -eq 0 ]; then
    usage
fi

FILE_NAME=$1
KUBECTL_COMMAND="${2:-apply}"
ENV_FILE_NAME=$3

# Check if file exists
if [ ! -f "$FILE_NAME" ]; then
    echo "❌ File not found: $FILE_NAME"
    exit 1
fi

# Load environment file if provided
if [ ! -z "$ENV_FILE_NAME" ] && [ -f "$ENV_FILE_NAME" ]; then
    echo "📁 Loading environment from: $ENV_FILE_NAME"
    export $(grep -v '^#' "$ENV_FILE_NAME" | xargs)
fi

# Check required environment variables
required_vars=("BUILD_ID" "DOCKER_REGISTRY" "ENVIRONMENT")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Create deployment file with environment variable substitution
DEPLOYMENT_FILE_NAME="${FILE_NAME}.processed"
echo "🔧 Processing $FILE_NAME -> $DEPLOYMENT_FILE_NAME"

# Replace environment variables in the YAML file
envsubst < "$FILE_NAME" > "$DEPLOYMENT_FILE_NAME"

# Show processed file (with secrets masked)
echo "📋 Processed deployment file:"
echo "---"
cat "$DEPLOYMENT_FILE_NAME" | sed -E 's/((_PASSWORD|_SECRET|_KEY|_TOKEN).*[:=] ?).*/\1***/g'
echo "---"

# Apply or delete
echo "🚀 Running: kubectl $KUBECTL_COMMAND -f $DEPLOYMENT_FILE_NAME"
kubectl $KUBECTL_COMMAND -f "$DEPLOYMENT_FILE_NAME" --validate=false

# Clean up
rm -f "$DEPLOYMENT_FILE_NAME"

echo "✅ Deployment completed successfully!"