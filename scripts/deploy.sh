#!/usr/bin/env sh
# pulls, builds and restarts anynote on a host that runs it as a systemd service
set -eu

INSTALL_DIR="${INSTALL_DIR:-/opt/anynote}"
SERVICE="${SERVICE:-anynote.service}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8095/api/health}"

cd "$(dirname "$0")/.."

git pull --ff-only
pnpm install --frozen-lockfile
pnpm build

# builds against the same debian release as the host so the binary links against its glibc
docker run --rm \
  -v "$PWD":/src \
  -v anynote-cargo-registry:/usr/local/cargo/registry \
  -w /src/anynote-server \
  -e SQLX_OFFLINE=true \
  rust:1-bookworm \
  sh -c "cargo build --release && chown -R $(id -u):$(id -g) target"

cp "$INSTALL_DIR/anynote-server" "$INSTALL_DIR/anynote-server.bak"
install -m 755 anynote-server/target/release/anynote-server "$INSTALL_DIR/anynote-server.new"
mv "$INSTALL_DIR/anynote-server.new" "$INSTALL_DIR/anynote-server"
sudo systemctl restart "$SERVICE"

sleep 2
curl -fsS -o /dev/null "$HEALTH_URL"
echo "deployed $(git rev-parse --short HEAD)"
