"""
Rehber Local Educational Rules Engine.
Provides deterministic, pedagogically sound answers to core curriculum questions
when offline, in low-bandwidth mode, or when cloud LLM APIs are unreachable.
"""

import re
from typing import Optional, Dict


class LocalRulesEngine:
    KNOWLEDGE_BASE: Dict[str, Dict[str, str]] = {
        "photosynthesis": {
            "english": "Photosynthesis is how plants make food using sunlight, water from soil, and carbon dioxide from air to create glucose and oxygen.",
            "urdu": "پودے سورج کی روشنی، پانی اور کاربن ڈائی آکسائیڈ کی مدد سے اپنی خوراک بناتے ہیں جسے فوٹو سنتھیس کہتے ہیں۔"
        },
        "fraction": {
            "english": "A fraction represents a part of a whole. For example, 1/2 means one part out of two equal halves of a roti.",
            "urdu": "کسر (Fraction) کسی پوری چیز کا ایک حصہ ہے۔ جیسے آدھی روٹی یعنی 1/2۔"
        },
        "gravity": {
            "english": "Gravity is the invisible pulling force of Earth that makes falling apples drop down towards the ground.",
            "urdu": "کششِ ثقل (Gravity) زمین کی وہ طاقت ہے جو تمام چیزوں کو اپنی طرف کھینچتی ہے۔"
        },
        "water_cycle": {
            "english": "The water cycle moves water from rivers to clouds by evaporation, and returns it as rain via condensation.",
            "urdu": "پانی کا چکر: سورج کی گرمی سے پانی بھاپ بن کر بادل بناتا ہے اور بارش بن کر دوبارہ زمین پر برستا ہے۔"
        },
        "cell": {
            "english": "A cell is the smallest building block of all living things, like a single brick in a village house.",
            "urdu": "خلیہ (Cell) جانداروں کی سب سے چھوٹی اکائی ہے، جیسے گھر بنانے کی ایک اینٹ۔"
        },
        "atom": {
            "english": "An atom is the tiny building block of all matter, composed of protons, neutrons, and electrons.",
            "urdu": "ایٹم کائنات کی تمام مادی اشیاء کا بنیادی چھوٹا ذرہ ہے۔"
        },
        "electricity": {
            "english": "Electricity is the flow of electric charge (electrons) through a conductor like a copper wire.",
            "urdu": "بجلی تاروں کے اندر برقی چارج (الیکٹران) کے بہاؤ کا نام ہے۔"
        }
    }

    @classmethod
    def answer_query(cls, query: str, language: str = "urdu") -> str:
        q_lower = query.lower()

        # Match keywords
        if any(w in q_lower for w in ["photosynthesis", "sunlight", "plant food", "khurak"]):
            item = cls.KNOWLEDGE_BASE["photosynthesis"]
        elif any(w in q_lower for w in ["fraction", "kasar", "half", "roti"]):
            item = cls.KNOWLEDGE_BASE["fraction"]
        elif any(w in q_lower for w in ["gravity", "fall", "apple", "kashish"]):
            item = cls.KNOWLEDGE_BASE["gravity"]
        elif any(w in q_lower for w in ["water cycle", "rain", "evaporation", "barish", "badal"]):
            item = cls.KNOWLEDGE_BASE["water_cycle"]
        elif any(w in q_lower for w in ["cell", "building block", "khaliya"]):
            item = cls.KNOWLEDGE_BASE["cell"]
        elif any(w in q_lower for w in ["atom", "electron", "proton"]):
            item = cls.KNOWLEDGE_BASE["atom"]
        elif any(w in q_lower for w in ["electricity", "current", "bijli"]):
            item = cls.KNOWLEDGE_BASE["electricity"]
        else:
            # General fallback educational response
            if "urdu" in language.lower():
                return f"رہبر مددگار: آپ کا سوال '{query[:40]}' نوٹ ہو گیا ہے۔ اس تصور کو سمجھنے کے لیے اپنے موجودہ سبق کے نوٹس پڑھیں یا اگلی کوئز میں پریکٹس کریں۔"
            return f"Rehber Tutor: Great curiosity! To master '{query[:40]}', review your current lesson summary and solve the practice MCQs."

        if "urdu" in language.lower():
            return f"{item['urdu']} ({item['english']})"
        return item["english"]
