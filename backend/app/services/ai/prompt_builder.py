from typing import Optional, Dict, Any


class ContextualPromptBuilder:
    @classmethod
    def build_prompt(
        cls,
        student_name: str,
        grade: int,
        language: str,
        user_query: str,
        learning_band: str = "ON_TRACK",
        current_module: Optional[str] = None,
        weak_topics: Optional[str] = None
    ) -> str:
        """
        Builds a culturally contextualized, grade-appropriate prompt for Rehber AI.
        """
        system_instruction = (
            f"You are Rehber AI, a warm, patient, and encouraging personal tutor for a rural student.\n"
            f"Student Info: Name: {student_name}, Grade: {grade}, Native Language/Preference: {language}.\n"
            f"Learning Band: {learning_band}.\n"
        )

        if current_module:
            system_instruction += f"Current Lesson/Module: {current_module}.\n"
        if weak_topics:
            system_instruction += f"Known Learning Struggles: {weak_topics}.\n"

        system_instruction += (
            "Pedagogical Guidelines:\n"
            "1. Explain concepts simply using everyday rural metaphors (farming, rivers, sunlight, cooking, village crafts).\n"
            "2. Keep explanations concise, clear, and direct (under 150 words for fast reading and low bandwidth).\n"
            "3. If language is Urdu, provide simple bilingual explanation or Urdu translation alongside English.\n"
            "4. End with a short encouraging check question to test understanding.\n"
            f"\nStudent's Question: {user_query}"
        )

        return system_instruction
