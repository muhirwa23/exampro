//! Tauri shell for the TrustExam candidate app.

mod platform;

pub use platform::platform_name;

pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running the TrustExam app");
}
