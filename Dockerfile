FROM node:lts-trixie-slim AS web
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.26.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM rust:1-trixie AS server
WORKDIR /app/anynote-server
COPY anynote-server/ ./
COPY --from=web /app/build /app/build
ENV SQLX_OFFLINE=true
RUN cargo build --release

FROM debian:trixie-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --no-create-home anynote \
    && mkdir -p /data/attachments \
    && chown anynote /data/attachments
COPY --from=server /app/anynote-server/target/release/anynote-server /usr/local/bin/anynote-server
USER anynote
ENV ADDR=0.0.0.0:8080 \
    STORAGE_DIR=/data/attachments \
    RUST_LOG=info
EXPOSE 8080
CMD ["anynote-server"]
