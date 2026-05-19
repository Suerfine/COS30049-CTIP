# BACKEND

# Instructions to install and run:

```
cd ./backend/

# Install dependencies
npm install

# Copy the example .env file
cp .env.example .env

# Seed and sync the database
npm run seed:dev

# Run the server
npm run dev

# Open http://localhost:5000 in your browser
```

!!! For development purposes, visit http://localhost:5000/api/docs for api reference!!!

# Commands:

`npm run seed:dev`

Seeds the database with test data and synchorise the database models. Call this to reset the database or when there is a changes to the database structure.

`npm run dev`

Starts the server on live hotreload (the server automatically restarts when it detects changes).

`npm run test {filePath?}`
Runs the test suite. See [Testing framework](./tests/README.md) section below for more details.

`npm run jobs:run -- {job_name}`
Runs a specific job. This is used to force run a job without waiting for the scheduled time. This is useful for testing and debugging jobs.
Use "job_name" `--list` to list all available jobs.

`npm run test:audit`

Runs automated verification for audit logging SCRUM items (schema, middleware logging, and log sanitization).

`npm run test:security`

Runs automated verification for encryption SCRUM items (AES-256 encrypted storage, role-based assessment decryption).

# Project Structure:

```
database/ #Database maintenance and testing
    factories/
    seeders/
src/
    config/ #All configurations go here
        Database.ts
    controllers/ #Business logic of routes
        ...
    enum/
        ...
    middleware/
        Auth.ts
        Authorize.ts
    models/ #Sequelize model delcerations
        ...
    types/ #Request and response types
        ...
    utils/ #All utility functions
        paginate.ts #pagination related utilities
        password.ts #Password hashing and verification
    server.ts #Starts the express server and the routes
storage/ #All files created during runtime
    dev_db.sqlite
    public/ #Files that wil be mounted and publically available
    private/ #Files that need to be authenticated before serving
tests/ #All tests
app.js #Entrypoint of the progam
package-lock.json
packagejson
tsconfig.json
```

# HTTPS/TLS configuration

The server supports optional TLS transport with environment variables:

- `HTTPS_ENABLED=true`
- `HTTPS_KEY_PATH=path/to/private-key.pem`
- `HTTPS_CERT_PATH=path/to/certificate.pem`
- `HTTPS_CA_PATH=path/to/ca-chain.pem` (optional)
- `FORCE_HTTPS_REDIRECT=true` (optional, for proxy deployments)

When `HTTPS_ENABLED=true`, the app starts as an HTTPS server and serves `https://localhost:<PORT>`.

### Dev setup with HTTPS (for LAN access from other devices)

The project uses [mkcert](https://github.com/FiloSottile/mkcert) to generate locally-trusted certificates.

**Install mkcert** (run once per machine):

```powershell
winget install FiloSottile.mkcert
# then trust the local CA:
mkcert -install
```

**Generate a cert that covers your LAN IP** (run on the machine hosting the backend):

```powershell
# Find your Wi-Fi IPv4 address first
ipconfig
# Then generate the cert (replace 192.168.x.x with your actual IP)
cd backend/certs
mkcert 192.168.x.x localhost 127.0.0.1
```

This produces `192.168.x.x+2.pem` and `192.168.x.x+2-key.pem`. Update `backend/.env`:

```
HTTPS_CERT_PATH=certs/192.168.x.x+2.pem
HTTPS_KEY_PATH=certs/192.168.x.x+2-key.pem
```

**On every other device** that needs to trust the cert, install mkcert and run `mkcert -install` once. That device must also install the CA from the host machine — copy the CA files from `mkcert -CAROOT` on the host and import them, or simply install mkcert on each device and re-run `mkcert -install`.
