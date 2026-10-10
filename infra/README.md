# infra

`docker-compose.yml` runs the local stack:

| Service | Ports | Notes |
|---|---|---|
| Postgres 16 | 5432 | user/password/db `trustexam` |
| Redis 7 | 6379 | |
| S3 (SeaweedFS) | 9000 | S3 API; bucket `trustexam-evidence` created by `s3-init`; keys in `seaweedfs/s3.json` |
| Mailpit | 1025 (SMTP), 8025 (inbox UI) | open http://localhost:8025 |

`pnpm docker:up` starts it and waits until every service is healthy; `pnpm docker:down` stops it (add `-v` to wipe data). Credentials match `apps/api/.env.example` and are for local use only. Why SeaweedFS instead of MinIO: `docs/adr/0001-local-s3-seaweedfs.md`.
