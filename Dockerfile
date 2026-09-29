FROM node:lts-trixie-slim AS web
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.26.0 --activate \
    && pnpm config set store-dir /pnpm/store
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=anynote-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM rust:1-trixie AS server
WORKDIR /app/anynote-server
COPY anynote-server/ ./
COPY --from=web /app/build /app/build
ENV SQLX_OFFLINE=true
# target/ lives in a cache mount, so the binary is copied out before the mount goes away
RUN --mount=type=cache,id=anynote-cargo-registry,target=/usr/local/cargo/registry \
    --mount=type=cache,id=anynote-cargo-target,target=/app/anynote-server/target \
    cargo build --release \
    && cp target/release/anynote-server /usr/local/bin/anynote-server

FROM debian:trixie-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --no-create-home anynote \
    && mkdir -p /data/attachments \
    && chown anynote /data/attachments
COPY --from=server /usr/local/bin/anynote-server /usr/local/bin/anynote-server
USER anynote
ENV ADDR=0.0.0.0:8080 \
    STORAGE_DIR=/data/attachments \
    RUST_LOG=info
EXPOSE 8080
CMD ["anynote-server"]
