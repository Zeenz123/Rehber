import sys
import os
from pathlib import Path

# Add shared to path if needed
shared_path = str(Path(__file__).resolve().parents[4] / "shared" / "protocol")
if shared_path not in sys.path:
    sys.path.insert(0, shared_path)

from sms_protocol import SmsProtocol, ParsedSmsMessage, SmsProtocolException, ActionCode


class SmsParser:
    @staticmethod
    def parse_message(raw_text: str) -> ParsedSmsMessage:
        """
        Parses raw SMS text into a validated ParsedSmsMessage.
        Format: [StudentID]#[ActionCode]#[PayloadData]
        """
        return SmsProtocol.parse(raw_text)
