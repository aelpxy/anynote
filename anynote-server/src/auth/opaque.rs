use opaque_ke::{CipherSuite, Ristretto255, ServerSetup, TripleDh, ksf::Identity};
use rand::rngs::OsRng;

use crate::http::b64;

pub struct Suite;

impl CipherSuite for Suite {
    type OprfCs = Ristretto255;
    type KeyExchange = TripleDh<Ristretto255, sha2::Sha512>;
    // argon2id key stretching runs on the client, never on the server
    type Ksf = Identity;
}

pub type OpaqueServerSetup = ServerSetup<Suite>;

pub fn generate_server_setup() -> String {
    b64::encode(OpaqueServerSetup::new(&mut OsRng).serialize())
}

pub fn load_server_setup(encoded: &str) -> Result<OpaqueServerSetup, String> {
    let bytes = b64::decode(encoded).map_err(|error| error.to_string())?;
    OpaqueServerSetup::deserialize(&bytes).map_err(|error| error.to_string())
}
