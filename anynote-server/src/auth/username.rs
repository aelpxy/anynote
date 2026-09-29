use crate::error::AppError;

pub fn normalize_username(username: &str) -> Result<String, AppError> {
    let username = username.trim().to_lowercase();
    let is_valid = (3..=32).contains(&username.len())
        && username
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_');

    if is_valid {
        Ok(username)
    } else {
        Err(AppError::bad_request(
            "username must be 3-32 characters of a-z, 0-9 or _",
        ))
    }
}
