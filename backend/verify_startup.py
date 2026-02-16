import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import app.main...")
    from app.main import app
    print("✅ app.main imported successfully!")
    
    print("Checking dependencies...")
    import httpx
    print("✅ httpx imported successfully!")
    
    print("Backend verification passed.")
    sys.exit(0)
except ImportError as e:
    print(f"❌ ImportError: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected Error: {e}")
    sys.exit(1)
