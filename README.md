# Backdate Labeller

A simple labeller for backdating posts.

## Running it

### 1. Setup your labeller

You'll need a Bluesky account, its DID (get it [here](https://internect.info)), and a server with a domain and SSL certificate.

Remember to save the signing key it gives you.

```
npx @skyware/labeler setup
```

### 2. Make an `.env` file

```
cp .env.example .env
```

Add the DID of your labeller to the `LABELER_DID` variable and the signing key to the `SIGNING_KEY` variable.

### 3. Run it

Requires Deno. Run this at the domain you gave to the setup CLI. You'll probably need to reverse-proxy from the domain to `localhost:14831` - I use Caddy to do this.

```
deno run -A main.ts
```
