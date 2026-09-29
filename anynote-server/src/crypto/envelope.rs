use crate::error::AppError;

const VERSION: u8 = 0x01;
const MIN_LENGTH: usize = 1 + 24 + 16;

// the server can't decrypt, but it can reject anything that isn't shaped like a v1 envelope
pub fn validate(field: &str, bytes: &[u8]) -> Result<(), AppError> {
    if bytes.len() >= MIN_LENGTH && bytes[0] == VERSION {
        Ok(())
    } else {
        Err(AppError::bad_request(format!(
            "{field} is not a valid encrypted envelope"
        )))
    }
}
