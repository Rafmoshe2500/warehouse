from slowapi import Limiter
from slowapi.util import get_remote_address
import uuid


def _rate_limit_key(request) -> str:
    """Custom key function for rate limiting.

    Requests from localhost (127.0.0.1 / ::1) each receive a unique ephemeral
    key so they are never grouped into the same bucket.  This effectively
    disables rate-limiting for local development and automated test runs while
    leaving normal per-IP limits intact for all other clients.
    """
    addr = get_remote_address(request)
    if addr in ("127.0.0.1", "::1"):
        # Each localhost request gets its own isolated bucket → never rate-limited
        return f"local-{uuid.uuid4()}"
    return addr


# Initialize Limiter
limiter = Limiter(key_func=_rate_limit_key)
