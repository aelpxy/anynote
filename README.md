<p align="center">
  <img src="public/logo.svg" alt="Anynote logo" width="80" height="80" />
</p>

<h1 align="center">Anynote</h1>

<p align="center">Notes with Markdown, folders, and end-to-end encryption.</p>

Anynote is a notes app you can host yourself. It has a rich text editor backed by Markdown, folders and workspaces to keep things organized, and search and export for when you need to find or move your notes.

## How it works

Your notes are encrypted in your browser before they're sent to the server. The server stores the encrypted data without access to your password, encryption keys, or note contents.

Sign-in uses [OPAQUE](https://datatracker.ietf.org/doc/rfc9807/) with your password and a random secret key, shown once when you sign up. This lets the server authenticate you without learning your password or being able to test password guesses offline.

OPAQUE provides an export key, which the browser derives an unlock key from using HKDF. That unlocks your private key. Each workspace has its own random encryption key, sealed to each member's public key.

Notes and folders use XChaCha20-Poly1305 with the workspace key. The encryption binds each item to its workspace and ID to prevent ciphertext from being swapped between items. Images are stream-encrypted with individual file keys, which are wrapped with the workspace key.

Search runs locally over notes decrypted into memory. Edits save locally first, then upload in the background with retries. Other devices receive changes over server-sent events.

The backend is written in Rust with [axum](https://github.com/tokio-rs/axum) and uses Postgres. The React frontend is built into the server binary.

### What the server can see

- Usernames and IP addresses.
- How many notes, folders and images you have, their rough sizes, and when they changed.
- Who belongs to which workspace.

You still need to trust the server that serves the app: if it's compromised, it could send your browser modified code that steals your keys.

### Recovery

Keep both your password and your secret key somewhere safe. If you lose either, there's no way to recover your notes, even with help from the server admin.

## Running it yourself

Copy the example environment file:

```sh
cp .env.example .env
```

Choose a `POSTGRES_PASSWORD` in `.env`, then generate the OPAQUE server setup:

```sh
docker compose run --rm app anynote-server generate-opaque-setup
```

Paste the generated value into `OPAQUE_SERVER_SETUP` in `.env`, then start the app:

```sh
docker compose up -d --build
```

The app listens on port `8085` by default. Keep the original `OPAQUE_SERVER_SETUP` value safe. Replacing it will prevent existing users from signing in.

### Backups

Back up the `pgdata` and `attachments` volumes together with your `.env` file. You'll need the original `OPAQUE_SERVER_SETUP` value to let users sign in after a restore.

## License

[MIT](LICENSE).
