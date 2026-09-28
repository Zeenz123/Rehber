import sys
import os
from pathlib import Path

# Add backend and shared to path
backend_dir = str(Path(__file__).resolve().parents[1] / "backend")
shared_dir = str(Path(__file__).resolve().parents[1] / "shared" / "protocol")
sys.path.insert(0, backend_dir)
sys.path.insert(0, shared_dir)

import asyncio
from seed_data import seed

if __name__ == "__main__":
    print("Executing Rehber central database initialization and seeding...")
    asyncio.run(seed())
