use sqlx::PgExecutor;
use uuid::Uuid;

pub struct LoginUser {
    pub id: Uuid,
    pub opaque_record: Vec<u8>,
    pub key_stretching: serde_json::Value,
}

pub struct LoginAttempt {
    pub user_id: Option<Uuid>,
    pub opaque_server_state: Vec<u8>,
}

pub async fn is_username_taken(
    db: impl PgExecutor<'_>,
    username: &str,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar!(
        r#"select exists(select 1 from users where username = $1) as "taken!""#,
        username,
    )
    .fetch_one(db)
    .await
}

pub async fn insert_user(
    db: impl PgExecutor<'_>,
    username: &str,
    opaque_record: &[u8],
    key_stretching: &serde_json::Value,
    public_key: &[u8],
    encrypted_private_key: &[u8],
) -> Result<Uuid, sqlx::Error> {
    sqlx::query_scalar!(
        "insert into users (username, opaque_record, key_stretching, public_key, encrypted_private_key)
         values ($1, $2, $3, $4, $5)
         returning id",
        username,
        opaque_record,
        key_stretching,
        public_key,
        encrypted_private_key,
    )
    .fetch_one(db)
    .await
}

pub async fn find_login_user(
    db: impl PgExecutor<'_>,
    username: &str,
) -> Result<Option<LoginUser>, sqlx::Error> {
    sqlx::query_as!(
        LoginUser,
        "select id, opaque_record, key_stretching from users where username = $1",
        username,
    )
    .fetch_optional(db)
    .await
}

pub async fn username(db: impl PgExecutor<'_>, user_id: Uuid) -> Result<String, sqlx::Error> {
    sqlx::query_scalar!("select username from users where id = $1", user_id)
        .fetch_one(db)
        .await
}

pub async fn update_credentials(
    db: impl PgExecutor<'_>,
    user_id: Uuid,
    opaque_record: &[u8],
    key_stretching: &serde_json::Value,
    encrypted_private_key: &[u8],
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "update users set opaque_record = $2, key_stretching = $3, encrypted_private_key = $4
         where id = $1",
        user_id,
        opaque_record,
        key_stretching,
        encrypted_private_key,
    )
    .execute(db)
    .await?;
    Ok(())
}

pub async fn insert_login_attempt(
    db: impl PgExecutor<'_>,
    user_id: Option<Uuid>,
    opaque_server_state: &[u8],
    ttl_seconds: f64,
) -> Result<Uuid, sqlx::Error> {
    sqlx::query_scalar!(
        "insert into login_attempts (user_id, opaque_server_state, expires_at)
         values ($1, $2, now() + make_interval(secs => $3))
         returning id",
        user_id,
        opaque_server_state,
        ttl_seconds,
    )
    .fetch_one(db)
    .await
}

pub async fn take_login_attempt(
    db: impl PgExecutor<'_>,
    login_id: Uuid,
) -> Result<Option<LoginAttempt>, sqlx::Error> {
    sqlx::query_as!(
        LoginAttempt,
        "delete from login_attempts where id = $1 and expires_at > now()
         returning user_id, opaque_server_state",
        login_id,
    )
    .fetch_optional(db)
    .await
}

pub async fn delete_expired_login_attempts(db: impl PgExecutor<'_>) -> Result<u64, sqlx::Error> {
    let deleted = sqlx::query!("delete from login_attempts where expires_at < now()")
        .execute(db)
        .await?;
    Ok(deleted.rows_affected())
}
