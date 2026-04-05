import logging
import sys
import os

# Create a standard human-readable format
# [Timestamp] [LEVEL] [Module] - Message
LOG_FORMAT = "%(asctime)s [%(levelname)s] [%(name)s] - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

def setup_logging():
    """
    Configures the central logging strategy for the application.
    Designed to output cleanly to the console (Docker container).
    """
    # Get the default log level from environment or default to INFO
    log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    log_level = getattr(logging, log_level_str, logging.INFO)

    # Configure root logger explicitly
    logging.basicConfig(
        level=log_level,
        format=LOG_FORMAT,
        datefmt=DATE_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ],
        force=True  # Ensure we overwrite any previously configured handlers
    )

    # Adjust third-party loggers to avoid console spam
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("boto3").setLevel(logging.WARNING)
    logging.getLogger("botocore").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    # Quick test log to confirm initialization
    logging.getLogger(__name__).info(f"Logging initialized at {log_level_str} level")
