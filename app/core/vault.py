import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from dotenv import load_dotenv

load_dotenv()

# Master key should be injected via environment variables in production.
# If missing, we generate a deterministic one based on a fallback secret for local dev.
VAULT_MASTER_KEY = os.getenv("VAULT_MASTER_KEY", "holmes-local-dev-master-key-change-me")

def _get_fernet() -> Fernet:
    # Derive a safe 32-byte url-safe base64 key from the master string
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"holmes-vault-salt",
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(VAULT_MASTER_KEY.encode()))
    return Fernet(key)

def encrypt_secret(secret_string: str) -> str:
    if not secret_string:
        return ""
    f = _get_fernet()
    encrypted = f.encrypt(secret_string.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_secret(encrypted_string: str) -> str:
    if not encrypted_string:
        return ""
    try:
        f = _get_fernet()
        decrypted = f.decrypt(encrypted_string.encode('utf-8'))
        return decrypted.decode('utf-8')
    except Exception as e:
        print(f"Vault Decryption Error: {e}")
        return ""
