#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    anynote_server::run().await
}
