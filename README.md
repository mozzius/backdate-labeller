# Backdate Labeller

A labeller for backdating posts.

## Running it

### 1. Setup your labeller

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

Require Deno

```
deno run -A main.ts
```
