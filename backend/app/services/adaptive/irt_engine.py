"""
Adaptive Learning Engine using Item Response Theory (IRT) 1PL Rasch Model approximation.

Assumptions & Rules:
- Student latent ability: theta (range: -3.0 to +3.0, default: 0.0)
- Item difficulty: b (range: -3.0 to +3.0)
- Logistic probability function: P(correct | theta, b) = 1 / (1 + exp(-(theta - b)))
- Step-wise Newton-Raphson / Stochastic Gradient update for ability theta
- Band mapping:
    theta < -0.50  -> REMEDIAL
    -0.50 <= theta <= 1.00 -> ON_TRACK
    theta > 1.00   -> ADVANCED
"""

import math
from typing import List, Dict, Tuple


class IrtAdaptiveEngine:
    LEARNING_RATE = 0.4
    MIN_THETA = -3.0
    MAX_THETA = 3.0

    @classmethod
    def probability_correct(cls, theta: float, b: float) -> float:
        """Computes Rasch probability of answering item correctly."""
        z = theta - b
        # Bound z to avoid numerical overflow in exp
        bounded_z = max(-15.0, min(15.0, z))
        return 1.0 / (1.0 + math.exp(-bounded_z))

    @classmethod
    def update_ability(
        cls, current_theta: float, items_with_responses: List[Tuple[float, bool]]
    ) -> Tuple[float, float, str]:
        """
        Updates student ability theta based on response vector.
        items_with_responses: List of (b_difficulty, is_correct)

        Returns: (new_theta, new_mastery_0_to_1, learning_band)
        """
        if not items_with_responses:
            mastery = cls.theta_to_mastery(current_theta)
            band = cls.classify_band(current_theta)
            return current_theta, mastery, band

        theta = current_theta

        for b, is_correct in items_with_responses:
            actual = 1.0 if is_correct else 0.0
            expected = cls.probability_correct(theta, b)
            error = actual - expected
            # Update step
            theta += cls.LEARNING_RATE * error

        # Clip to realistic boundaries
        new_theta = max(cls.MIN_THETA, min(cls.MAX_THETA, theta))
        mastery = cls.theta_to_mastery(new_theta)
        band = cls.classify_band(new_theta)

        return round(new_theta, 3), round(mastery, 3), band

    @classmethod
    def theta_to_mastery(cls, theta: float) -> float:
        """Transforms latent ability theta into normalized mastery score [0.0, 1.0]."""
        # Sigmoid mapping centered at 0.0
        return 1.0 / (1.0 + math.exp(-theta))

    @classmethod
    def classify_band(cls, theta: float) -> str:
        """Classifies student into learning band for pedagogical intervention."""
        if theta < -0.5:
            return "REMEDIAL"
        elif theta <= 1.0:
            return "ON_TRACK"
        else:
            return "ADVANCED"
