/// Entity Secret Encryption Module
/// Implements RSA-OAEP encryption for Circle entity secrets
/// 
/// SECURITY: This module handles cryptographic operations for sensitive data

use rsa::{RsaPublicKey, Oaep, pkcs8::DecodePublicKey};
use sha2::Sha256;
use base64::{Engine as _, engine::general_purpose};
use std::fs;

/// Encrypt entity secret using Circle's RSA public key
/// 
/// # Arguments
/// * `plaintext` - The entity secret to encrypt
/// * `public_key_pem` - Circle's public key in PEM format
/// 
/// # Returns
/// Base64-encoded ciphertext
pub fn encrypt_entity_secret(
    plaintext: &str,
    public_key_pem: &str,
) -> Result<String, String> {
    // Parse public key
    let public_key = RsaPublicKey::from_public_key_pem(public_key_pem)
        .map_err(|e| format!("Failed to parse public key: {}", e))?;

    // Create OAEP padding with SHA-256
    let padding = Oaep::new::<Sha256>();

    // Encrypt
    let mut rng = rand::thread_rng();
    let ciphertext = public_key
        .encrypt(&mut rng, padding, plaintext.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Encode as base64
    Ok(general_purpose::STANDARD.encode(ciphertext))
}

/// Decrypt entity secret (not implemented - Circle handles decryption)
/// This is a placeholder for documentation purposes
/// 
/// SECURITY: The entity secret should NEVER be decrypted on our server.
/// Circle's API accepts the encrypted secret and handles decryption internally.
#[allow(dead_code)]
pub fn decrypt_entity_secret_placeholder(
    _ciphertext_b64: &str,
    _private_key_pem: &str,
) -> Result<String, String> {
    Err(
        "Decryption should never happen on our server. \
        Circle's API accepts encrypted secrets directly."
        .to_string()
    )
}

/// Load Circle's public key from file
pub fn load_circle_public_key(path: &str) -> Result<String, String> {
    fs::read_to_string(path)
        .map_err(|e| format!("Failed to read public key file: {}", e))
}

/// Validate that a string is properly encrypted (basic check)
pub fn is_encrypted(value: &str) -> bool {
    // Encrypted values should be base64-encoded and reasonably long
    value.len() > 100 && general_purpose::STANDARD.decode(value).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_encrypted_validates_format() {
        // Short string = not encrypted
        assert!(!is_encrypted("short"));
        
        // Long base64 string = likely encrypted
        let encrypted = general_purpose::STANDARD.encode(&[0u8; 256]);
        assert!(is_encrypted(&encrypted));
    }

    #[test]
    fn test_plaintext_detection() {
        let plaintext = "my-secret-key-12345";
        assert!(!is_encrypted(plaintext));
    }

    // Note: Full encryption test requires a real RSA public key
    // Integration tests should use Circle's actual public key
}
