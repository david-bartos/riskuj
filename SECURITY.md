# Security Policy

## Supported versions

Security fixes are handled on the `main` branch.

## Reporting a vulnerability

Please do not open a public issue for security vulnerabilities.

Use GitHub private vulnerability reporting if it is available on this
repository. If it is not available, contact the maintainer privately through
GitHub and include:

- A short description of the issue.
- Steps to reproduce it.
- The affected version or commit.
- Any suggested fix or mitigation.

The maintainer will review reports before public disclosure.

## Public deployment notes

- Set `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD` when deploying a public
  instance that should not expose the admin interface.
- Do not commit uploaded audio files, secrets, `.env` files, or local runtime
  data from `data/`.
- Review third-party audio, question content, and branding rights before
  publishing a game package.
