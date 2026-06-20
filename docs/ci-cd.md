# UniBus CI/CD

GitHub Actions workflow: `.github/workflows/ci-cd.yml`.

## Flow

- Pull requests into `main`: run backend tests, frontend lint, and frontend production build.
- Pushes to `main`: run validation, build backend/frontend Docker images, push them to ECR, update ECS service, invalidate CloudFront, and smoke test the public HTTPS URL.
- Manual runs: use `workflow_dispatch` from GitHub Actions.

## AWS Resources

- Region: `ap-southeast-1`
- GitHub OIDC role: `arn:aws:iam::432439355654:role/unibus-github-actions-deploy-role`
- ECR backend: `432439355654.dkr.ecr.ap-southeast-1.amazonaws.com/unibus-backend`
- ECR frontend: `432439355654.dkr.ecr.ap-southeast-1.amazonaws.com/unibus-frontend`
- ECS cluster: `unibus-dev-cluster`
- ECS service: `unibus-dev-service`
- ECS task definition family: `unibus-dev`
- CloudFront distribution: `E3UXOP9YII5ML8`
- Public URL: `https://d8xawk4fn4vfd.cloudfront.net`

## Runtime Secrets

The workflow does not store DB, SMTP, Google secret, or AWS access keys in GitHub.
It downloads the current ECS task definition and changes only the backend/frontend image URIs.
Runtime secrets remain managed in AWS ECS task definition settings.
During task-definition cleanup, the workflow also removes the retired frontend mock flag from container environment variables so old ECS revisions do not keep carrying it forward.

## ECS Deploy Diagnostics

The deploy job waits up to 15 minutes for ECS service stability. If ECS cannot stabilize, the workflow prints:

- recent ECS service events;
- recent stopped task ARNs;
- stopped reasons and per-container exit codes/reasons.

Most ECS "stuck deploy" cases should be checked in this order:

1. Backend container exits on startup because Flyway validation fails against the shared DB.
2. Required task definition environment variables/secrets are missing, especially DB, JWT, SMTP, Google OAuth, OCR, or S3 settings.
3. The ECS service cannot pull the pushed ECR image or lacks task execution role permissions.
4. Target group health checks fail even though the task is running.
5. Container names in the task definition no longer match workflow env `BACKEND_CONTAINER=backend` and `FRONTEND_CONTAINER=frontend`.

## Google OAuth

Google Console should allow:

- Authorized JavaScript origin: `https://d8xawk4fn4vfd.cloudfront.net`
- Redirect URI is not required for the current popup/token flow.
