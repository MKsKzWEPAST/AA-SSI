import 'package:flutter/material.dart';

class CustomWidgetsKeys {
  CustomWidgetsKeys._();

  /// HOME SCREEN
  static const Key homeScreenButtonNextAction = Key("homeButtonNextAction");
  static const Key homeScreenButtonCreateIdentity =
      Key("homeButtonCreateIdentity");
  static const Key homeScreenButtonRemoveIdentity =
      Key("homeButtonRemoveIdentity");

  /// AUTH SCREEN
  static const Key authScreenButtonNextAction =
      Key("authScreenButtonNextAction");
  static const Key authScreenButtonConnect = Key("authScreenButtonConnect");
  static const Key authScreenButtonConnect2 = Key("authScreenButtonConnect2");

  /// SIGN SCREEN
  static const Key signScreenButtonSignMessage =
      Key("signScreenButtonSignMessage");
  static const Key signWidget = Key("signWidget");
}
