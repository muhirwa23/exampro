//! SecurityPlatform trait and shared types for the per-OS security modules.

/// Crate name, used to confirm which implementation a build links.
pub const CRATE: &str = env!("CARGO_PKG_NAME");

#[cfg(test)]
mod tests {
    #[test]
    fn crate_name_matches_package() {
        assert!(super::CRATE.starts_with("te-"));
    }
}
