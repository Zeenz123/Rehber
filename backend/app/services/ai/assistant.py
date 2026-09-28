import os
import httpx
from typing import Optional
from app.core.config import settings
from app.services.ai.prompt_builder import ContextualPromptBuilder
from app.services.ai.local_rules_engine import LocalRulesEngine


class RehberAiAssistant:
    @classmethod
    async def ask_question(
        cls,
        student_name: str,
        grade: int,
        language: str,
        query: str,
        learning_band: str = "ON_TRACK",
        current_module: Optional[str] = None,
        weak_topics: Optional[str] = None
    ) -> str:
        """
        Processes an educational query using Gemini API if configured,
        or gracefully falls back to the deterministic local rules engine.
        """
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

        prompt = ContextualPromptBuilder.build_prompt(
            student_name=student_name,
            grade=grade,
            language=language,
            user_query=query,
            learning_band=learning_band,
            current_module=current_module,
            weak_topics=weak_topics
        )

        if api_key and len(api_key) > 5:
            try:
                # Call Gemini API via httpx for reliable non-blocking async execution
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 200}
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if text:
                                return text.strip()
            except Exception as e:
                # Log and fallback silently to local rules engine
                pass

        # Fallback to local rule engine
        return LocalRulesEngine.answer_query(query, language=language)
