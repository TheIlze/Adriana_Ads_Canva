#!/bin/bash

set -euo pipefail

export AWS_PROFILE="nutrameg-677604542630"

# Constants
AWS_ACCOUNT_ID="677604542630"
AWS_REGION="eu-north-1"
AWS_ROLE_ARN="arn:aws:iam::677604542630:role/github-oidc-provider-aws"
ECR_REPOSITORY="adriana-ads"
APP_DIR="./app/adriana-ads"

# Get current timestamp and short SHA
TIMESTAMP=$(date +"%Y-%m-%d-%H")00
SHA_SHORT=$(git rev-parse --short HEAD)
IMAGE_TAG="${TIMESTAMP}-${SHA_SHORT}"

# Assume AWS role using OIDC if needed (replace with proper login method if not in GitHub Actions)
echo "Logging into AWS..."
aws sts get-caller-identity

# Login to ECR
echo "Logging into Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Build and tag image
echo "Building Docker image..."
cd "$APP_DIR"
REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

docker build -t "$IMAGE_URI" .
docker tag "$IMAGE_URI" "${REGISTRY}/${ECR_REPOSITORY}:latest"

# Push image
echo "Pushing Docker images to ECR..."
docker push "$IMAGE_URI"
docker push "${REGISTRY}/${ECR_REPOSITORY}:latest"

echo "Build and push complete. Image tag: $IMAGE_TAG"


# ./build_and_push.sh
# ./deploy_to_ecs.sh 2025-05-21-1500-abcdefg