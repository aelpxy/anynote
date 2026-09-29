use serde::{Deserialize, Serialize};

use crate::error::AppError;

// same shape as @serenity-kit/opaque's KeyStretchingFunctionConfig
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum KeyStretching {
    RfcRecommended,
    #[default]
    MemoryConstrained,
    #[serde(rename = "argon2id-custom")]
    Argon2idCustom {
        iterations: u32,
        memory: u32,
        parallelism: u32,
    },
}

impl KeyStretching {
    pub fn validate(&self) -> Result<(), AppError> {
        if let Self::Argon2idCustom {
            iterations,
            memory,
            parallelism,
        } = self
        {
            // at least the RFC 9106 memory-constrained profile (64 MiB, 3 passes)
            if *memory < 65_536 || *iterations < 3 || *parallelism == 0 {
                return Err(AppError::bad_request(
                    "key stretching parameters are too weak",
                ));
            }
        }
        Ok(())
    }
}
