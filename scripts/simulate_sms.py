"""
Rehber Cellular SMS Gateway Simulator Script.
Enables judges and developers to test low-bandwidth cellular message fallback from command line.
"""

import sys
import json
import httpx
from pathlib import Path

# Add shared to path
shared_dir = str(Path(__file__).resolve().parents[1] / "shared" / "protocol")
if shared_dir not in sys.path:
    sys.path.insert(0, shared_dir)

from sms_protocol import SmsProtocol, ActionCode

DEFAULT_WEBHOOK = "http://127.0.0.1:8000/api/sms/webhook"


def test_sms(raw_payload: str, webhook_url: str = DEFAULT_WEBHOOK):
    print(f"\n[+] Outbound SMS to Gateway:")
    print(f"    Raw Payload: {raw_payload}")
    print(f"    Length:      {len(raw_payload)} chars (Fits in single/dual SMS segment)")

    try:
        resp = httpx.post(webhook_url, json={"from_number": "+923001234567", "body": raw_payload}, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            print(f"[OK] Gateway Response:")
            print(f"    Status:      {data.get('status')}")
            print(f"    Student ID:  {data.get('student_id')}")
            print(f"    Action Code: {data.get('action_code')}")
            safe_reply = str(data.get('reply_sms', '')).encode('utf-8', errors='replace').decode('utf-8', errors='replace')
            try:
                print(f"    Reply SMS:   {safe_reply}")
            except UnicodeEncodeError:
                print(f"    Reply SMS (ASCII safe): {safe_reply.encode('ascii', errors='replace').decode('ascii')}")
        else:
            print(f"[!] Server returned HTTP {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[!] Could not reach backend webhook at {webhook_url}. (Ensure backend is running: scripts/run_backend.bat)")
        print(f"    Error: {e}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        payload = sys.argv[1]
        test_sms(payload)
    else:
        print("=== Rehber SMS Gateway Simulator ===")
        print("Testing 1: AI Question (ASK)")
        test_sms("STU101#ASK#Why do plants need sunlight?")

        print("\nTesting 2: Quiz Submission (QZ)")
        test_sms("STU102#QZ#QZ_MATH_01|Q_MATH_001:A,Q_MATH_002:B")

        print("\nTesting 3: Progress Checkpoint (PGR)")
        test_sms("STU104#PGR#MOD_SCI_01|92|840")
