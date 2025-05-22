#!/bin/bash

set -euo pipefail

export AWS_PROFILE="nutrameg-677604542630"

# Input required
IMAGE_TAG="$1"
if [ -z "$IMAGE_TAG" ]; then
  echo "Usage: $0 <image-tag>"
  exit 1
fi

# Constants
AWS_ACCOUNT_ID="677604542630"
AWS_REGION="eu-north-1"
CLUSTER_NAME="ab-testing-prod-cluster"
SERVICE_NAME="adriana-ads-prod-service"
ECR_REPOSITORY="adriana-ads"
REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_URI="${REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

# Login to ECR
echo "Logging into Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$REGISTRY"

# Get current task definition
echo "Fetching current ECS task definition..."
TASK_DEF_JSON=$(aws ecs describe-task-definition --task-definition "$SERVICE_NAME")

# Create new task definition JSON with updated image
echo "Preparing new task definition..."
NEW_TASK_DEF=$(echo "$TASK_DEF_JSON" | jq --arg IMAGE "$IMAGE_URI" '
  .taskDefinition |
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy) |
  .containerDefinitions[0].image = $IMAGE
')

# Register new task definition
echo "Registering new ECS task definition..."
NEW_TASK_ARN=$(aws ecs register-task-definition --cli-input-json "$NEW_TASK_DEF" | jq -r '.taskDefinition.taskDefinitionArn')

# Update service
echo "Updating ECS service..."
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --task-definition "$NEW_TASK_ARN"

echo "Deployment complete. New task definition: $NEW_TASK_ARN"
