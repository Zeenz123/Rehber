import pytest
from app.services.adaptive.irt_engine import IrtAdaptiveEngine
from app.services.adaptive.recommender import AdaptiveRecommender
from app.models.models import Student, Module, StudentMastery


def test_irt_probability_monotonicity():
    # If student ability (theta) is higher than difficulty (b), probability > 0.5
    prob_high = IrtAdaptiveEngine.probability_correct(theta=1.0, b=0.0)
    assert prob_high > 0.5

    # If student ability equals difficulty, probability is exactly 0.5
    prob_mid = IrtAdaptiveEngine.probability_correct(theta=0.0, b=0.0)
    assert abs(prob_mid - 0.5) < 1e-4

    # If student ability is lower than difficulty, probability < 0.5
    prob_low = IrtAdaptiveEngine.probability_correct(theta=-1.0, b=0.0)
    assert prob_low < 0.5


def test_irt_ability_update_progression():
    # Student answers 4 hard questions correctly: theta should increase significantly
    items_correct = [(1.0, True), (1.5, True), (0.5, True), (1.2, True)]
    new_theta, mastery, band = IrtAdaptiveEngine.update_ability(0.0, items_correct)

    assert new_theta > 0.0
    assert mastery > 0.5
    assert band in ("ON_TRACK", "ADVANCED")

    # Student answers questions incorrectly: theta should drop
    items_incorrect = [(-0.5, False), (-1.0, False), (0.0, False), (-0.8, False)]
    low_theta, low_mastery, low_band = IrtAdaptiveEngine.update_ability(0.0, items_incorrect)

    assert low_theta < -0.5
    assert low_mastery < 0.4
    assert low_band == "REMEDIAL"


def test_band_classification_boundaries():
    assert IrtAdaptiveEngine.classify_band(-1.2) == "REMEDIAL"
    assert IrtAdaptiveEngine.classify_band(-0.51) == "REMEDIAL"
    assert IrtAdaptiveEngine.classify_band(-0.50) == "ON_TRACK"
    assert IrtAdaptiveEngine.classify_band(0.4) == "ON_TRACK"
    assert IrtAdaptiveEngine.classify_band(1.0) == "ON_TRACK"
    assert IrtAdaptiveEngine.classify_band(1.05) == "ADVANCED"
