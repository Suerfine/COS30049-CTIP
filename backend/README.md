# BACKEND

## Instructions to install and run:

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

`npm run test:audit`

Runs automated verification for audit logging SCRUM items (schema, middleware logging, and log sanitization).

`npm run test:security`

Runs automated verification for encryption SCRUM items (AES-256 encrypted storage, role-based assessment decryption).

## HTTPS/TLS configuration

The server supports optional TLS transport with environment variables:

- `HTTPS_ENABLED=true`
- `HTTPS_KEY_PATH=path/to/private-key.pem`
- `HTTPS_CERT_PATH=path/to/certificate.pem`
- `HTTPS_CA_PATH=path/to/ca-chain.pem` (optional)
- `FORCE_HTTPS_REDIRECT=true` (optional, for proxy deployments)

When `HTTPS_ENABLED=true`, the app starts as an HTTPS server and serves `https://localhost:<PORT>`.

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
app.js #Entrypoint of the progam
package-lock.json
packagejson
tsconfig.json
```
