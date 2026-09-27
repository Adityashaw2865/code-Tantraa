# Running the backend test suite

```
cd backend
npm i
npm test
```

The tests use **mongodb-memory-server**: the first run downloads a real MongoDB binary
(needs internet access once; it's cached under `~/.cache/mongodb-binaries` after that) and
runs every test against a real, disposable in-memory MongoDB - no Docker or local Mongo
install needed, and it never touches your real database.

What's covered (`backend/tests/`):
- `auth.test.js` - register/login/duplicate-email, logout revocation, change-password
  (old token dies, new one works), forgot/reset-password, mobile OTP.
- `applications.test.js` - draft → submit → review → approved happens only in that order;
  an applicant can't see someone else's application; the `?status=draft` officer-leak fix;
  one officer can't act on another officer's assigned application; business-profile and
  grievance mass-assignment protection.
- `renewal.test.js` - a fresh licence can't be renewed early; renewing extends from the old
  expiry and links both records; renewing someone else's licence is blocked; duplicate
  licence issuance is blocked; public verification; certificate PDF download + ownership check.
- `health.test.js` - `/api/health` reports real DB connectivity.

**Note:** this suite could not be run to completion in the sandbox that built this project -
its network is locked to a small allow-list (npm/GitHub/PyPI) and MongoDB's download server
isn't on it. Every test file was confirmed to load, import and be discovered by Jest with no
errors (i.e. the code compiles and every route/model it touches resolves) - it just couldn't
reach the last step of downloading `mongod`. Please run `npm test` locally to get the actual
pass/fail results; if anything fails, share the output and it can be fixed.
