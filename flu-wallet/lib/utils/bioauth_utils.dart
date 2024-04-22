import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:secure_application/secure_gate.dart';

import 'custom_text_styles.dart';

const double blurr = 18;
const double opacity = 0.5;

Widget securedWidget(Widget child) {
  return SecureGate(
      blurr: blurr,
      opacity: opacity,
      child: child,
      lockedBuilder: (context, secureNotifier) {
        Future.sync(() async {
          await BiometricAuthService()
              .localAuthentication
              .stopAuthentication();
          bool success = false;
          while (!success) {
            success = await BiometricAuthService().authenticate();
            if (success) {
              secureNotifier?.authSuccess(unlock: true);
            }
          }
        });

        return const Center(
          child: CircularProgressIndicator(),
        );
      });
}

class BiometricAuthService extends ChangeNotifier {
  final LocalAuthentication _localAuthentication = LocalAuthentication();

  LocalAuthentication get localAuthentication => _localAuthentication;

  Future<bool> authenticate() async {
    try {
      return await _localAuthentication.authenticate(
        localizedReason: 'Accessing your credentials...',
        options: const AuthenticationOptions(
          biometricOnly: true,
          useErrorDialogs: true,
        ),
      );
    } catch (e) {
      logger().e('Authentication error: $e');
      return false;
    }
  }
}
