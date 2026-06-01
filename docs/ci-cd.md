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

## Google OAuth

Google Console should allow:

- Authorized JavaScript origin: `https://d8xawk4fn4vfd.cloudfront.net`
- Redirect URI is not required for the current popup/token flow.
