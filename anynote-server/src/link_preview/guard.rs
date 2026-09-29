use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, SocketAddr};

use reqwest::dns::{Addrs, Name, Resolve, Resolving};
use url::{Host, Url};

fn is_public_ipv4(ip: Ipv4Addr) -> bool {
    let [a, b, ..] = ip.octets();
    !(ip.is_private()
        || ip.is_loopback()
        || ip.is_link_local()
        || ip.is_broadcast()
        || ip.is_documentation()
        || ip.is_unspecified()
        || ip.is_multicast()
        || a == 0
        || a >= 240
        || (a == 100 && (64..128).contains(&b))
        || (a == 192 && b == 0)
        || (a == 198 && (18..20).contains(&b)))
}

fn is_public_ipv6(ip: Ipv6Addr) -> bool {
    if let Some(mapped) = ip.to_ipv4_mapped() {
        return is_public_ipv4(mapped);
    }
    let first = ip.segments()[0];
    !(ip.is_loopback()
        || ip.is_unspecified()
        || ip.is_multicast()
        || (first & 0xfe00) == 0xfc00
        || (first & 0xffc0) == 0xfe80
        || (first == 0x2001 && ip.segments()[1] == 0x0db8))
}

pub fn is_public_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ip) => is_public_ipv4(ip),
        IpAddr::V6(ip) => is_public_ipv6(ip),
    }
}

// ip literals never reach the resolver, so they're checked here for the first request and every redirect
pub fn is_allowed_url(url: &Url) -> bool {
    let public_host = match url.host() {
        Some(Host::Ipv4(ip)) => is_public_ipv4(ip),
        Some(Host::Ipv6(ip)) => is_public_ipv6(ip),
        Some(Host::Domain(domain)) => !domain.eq_ignore_ascii_case("localhost"),
        None => false,
    };
    matches!(url.scheme(), "http" | "https") && public_host
}

// every hostname lookup, including after redirects, drops internal addresses before connecting
pub struct PublicResolver;

impl Resolve for PublicResolver {
    fn resolve(&self, name: Name) -> Resolving {
        Box::pin(async move {
            let addrs: Vec<SocketAddr> = tokio::net::lookup_host((name.as_str(), 0))
                .await?
                .filter(|addr| is_public_ip(addr.ip()))
                .collect();
            if addrs.is_empty() {
                return Err("host resolves only to non-public addresses".into());
            }
            Ok(Box::new(addrs.into_iter()) as Addrs)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blocks_internal_addresses() {
        for blocked in [
            "http://127.0.0.1/",
            "http://10.0.0.5/",
            "http://192.168.1.1/",
            "http://172.16.0.1/",
            "http://169.254.169.254/latest/meta-data",
            "http://100.64.0.1/",
            "http://0.0.0.0/",
            "http://[::1]/",
            "http://[fd00::1]/",
            "http://[fe80::1]/",
            "http://[::ffff:127.0.0.1]/",
            "http://localhost:8080/",
            "file:///etc/passwd",
            "ftp://example.com/",
        ] {
            assert!(
                !is_allowed_url(&Url::parse(blocked).unwrap()),
                "{blocked} should be blocked"
            );
        }
    }

    #[test]
    fn allows_public_urls() {
        for allowed in [
            "https://example.com/",
            "http://93.184.216.34/",
            "https://[2606:4700::1111]/",
        ] {
            assert!(
                is_allowed_url(&Url::parse(allowed).unwrap()),
                "{allowed} should be allowed"
            );
        }
    }
}
