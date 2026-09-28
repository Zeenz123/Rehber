import 'dart:math';

class MobileIrtCalculator {
  static const double learningRate = 0.4;
  static const double minTheta = -3.0;
  static const double maxTheta = 3.0;

  static double probabilityCorrect(double theta, double b) {
    final z = theta - b;
    final boundedZ = z.clamp(-15.0, 15.0);
    return 1.0 / (1.0 + exp(-boundedZ));
  }

  static ({double theta, double mastery, String band}) updateAbility({
    required double currentTheta,
    required List<({double difficulty, bool isCorrect})> responses,
  }) {
    if (responses.isEmpty) {
      return (
        theta: currentTheta,
        mastery: thetaToMastery(currentTheta),
        band: classifyBand(currentTheta),
      );
    }

    double theta = currentTheta;
    for (final item in responses) {
      final actual = item.isCorrect ? 1.0 : 0.0;
      final expected = probabilityCorrect(theta, item.difficulty);
      final error = actual - expected;
      theta += learningRate * error;
    }

    final newTheta = theta.clamp(minTheta, maxTheta);
    final mastery = thetaToMastery(newTheta);
    final band = classifyBand(newTheta);

    return (
      theta: double.parse(newTheta.toStringAsFixed(3)),
      mastery: double.parse(mastery.toStringAsFixed(3)),
      band: band,
    );
  }

  static double thetaToMastery(double theta) {
    return 1.0 / (1.0 + exp(-theta));
  }

  static String classifyBand(double theta) {
    if (theta < -0.5) {
      return 'REMEDIAL';
    } else if (theta <= 1.0) {
      return 'ON_TRACK';
    } else {
      return 'ADVANCED';
    }
  }
}
