# ADR 0001: SeaweedFS replaces MinIO as the local S3 server

- Status: accepted
- Date: 2026-10-10

## Context
The architecture named MinIO for local S3-compatible storage. MinIO no longer publishes community container images: `minio/minio` and `minio/mc` cannot be pulled from Docker Hub, and the frozen legacy images get no security fixes. The local stack must start with one command on any machine.

## Decision
Use SeaweedFS (`chrislusf/seaweedfs`, Apache 2.0) in `infra/docker-compose.yml` as the local S3 server, exposed on port 9000 with fixed local credentials, plus a one-shot `amazon/aws-cli` container that creates the `trustexam-evidence` bucket.

## Consequences
- The API only talks the S3 protocol (AWS SDK v3 with `S3_ENDPOINT` and path-style addressing), so nothing outside `infra/` depends on which server runs locally. Production uses a managed S3-compatible service (P8-02).
- There is no MinIO web console locally; use the AWS CLI against `http://localhost:9000` to inspect objects.
- If SeaweedFS ever blocks a feature we need (for example, object lock), revisit with another S3 server; only `infra/` changes.
