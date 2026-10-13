//! Picks the security platform implementation at compile time.
//! Windows and macOS use their native crates; the `mock` feature or any other OS uses the mock.

#[cfg(any(feature = "mock", not(any(target_os = "windows", target_os = "macos"))))]
pub fn platform_name() -> &'static str {
    te_platform_mock::CRATE
}

#[cfg(all(not(feature = "mock"), target_os = "windows"))]
pub fn platform_name() -> &'static str {
    te_platform_windows::CRATE
}

#[cfg(all(not(feature = "mock"), target_os = "macos"))]
pub fn platform_name() -> &'static str {
    te_platform_macos::CRATE
}

#[cfg(test)]
mod tests {
    use super::platform_name;

    #[test]
    fn selects_a_platform_for_this_build() {
        let expected = if cfg!(feature = "mock") {
            "te-platform-mock"
        } else if cfg!(target_os = "windows") {
            "te-platform-windows"
        } else if cfg!(target_os = "macos") {
            "te-platform-macos"
        } else {
            "te-platform-mock"
        };
        assert_eq!(platform_name(), expected);
    }
}
