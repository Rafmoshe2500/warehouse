"""
Tests for password hashing utilities.
Covers hash_password and verify_password functions.
"""
import pytest
from app.core.password import hash_password, verify_password


class TestHashPassword:
    """Test hash_password function."""

    def test_returns_string(self):
        result = hash_password("mypassword")
        assert isinstance(result, str)

    def test_returns_bcrypt_hash(self):
        result = hash_password("mypassword")
        assert result.startswith("$2b$") or result.startswith("$2a$")

    def test_different_calls_produce_different_hashes(self):
        """bcrypt uses random salt - same input should produce different hashes."""
        h1 = hash_password("samepassword")
        h2 = hash_password("samepassword")
        assert h1 != h2

    def test_hash_is_not_plain_password(self):
        plain = "secretpassword"
        result = hash_password(plain)
        assert plain not in result

    def test_minimum_length_password(self):
        result = hash_password("a")
        assert result.startswith("$2b$") or result.startswith("$2a$")

    def test_long_password(self):
        long_pw = "x" * 128
        result = hash_password(long_pw)
        assert isinstance(result, str)

    def test_special_characters(self):
        result = hash_password("P@$$w0rd!#%^&*()")
        assert isinstance(result, str)


class TestVerifyPassword:
    """Test verify_password function."""

    def test_correct_password_returns_true(self):
        plain = "correctpassword"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_wrong_password_returns_false(self):
        hashed = hash_password("correctpassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_empty_string_vs_empty_hash(self):
        """verify_password with invalid hash should return False gracefully."""
        assert verify_password("something", "") is False

    def test_empty_password_vs_its_hash(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True

    def test_wrong_hash_format_returns_false(self):
        """Non-bcrypt hash should not crash, just return False."""
        assert verify_password("password", "not_a_valid_hash") is False

    def test_case_sensitive(self):
        hashed = hash_password("Password")
        assert verify_password("password", hashed) is False
        assert verify_password("PASSWORD", hashed) is False
        assert verify_password("Password", hashed) is True

    def test_whitespace_matters(self):
        hashed = hash_password("password")
        assert verify_password("password ", hashed) is False
        assert verify_password(" password", hashed) is False
