# Security Policy

This is a small, single-maintainer commercial project. There is no bug
bounty program, but reports are taken seriously and will be
acknowledged promptly.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security
vulnerabilities.

Preferred: use [GitHub Security Advisories](../../security/advisories/new)
for this repository, which allows a private disclosure and discussion.

Alternatively, email:

- Primary: sarashabbirshahed@gmail.com
- Alternative / technical: tahashahed88@gmail.com

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (or a proof of concept)
- Any relevant logs, screenshots, or affected URLs

## What to Expect

- Acknowledgement of your report within a few days
- An assessment of the issue and, where applicable, a fix timeline
- Credit in the fix notes, if you'd like it, once resolved

## Responsible Disclosure

Please give us a reasonable amount of time to investigate and address
a report before disclosing it publicly. Do not access, modify, or
delete data that does not belong to you while investigating an issue,
and avoid any testing that could degrade the service for real users
(including the production site).

## Scope Notes

This application stores personal data (names, contact details, and
health-related progress data such as weight and body measurements)
submitted by real clients in Firebase Authentication and Firestore.
Access is restricted using Firestore Security Rules
(`src/firestore.rules`) — reports involving unauthorized data access
across accounts are especially appreciated.
