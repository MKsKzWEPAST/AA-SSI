import 'dart:collection';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:flutter/widgets.dart';
import 'package:polygonid_flutter_sdk/sdk/polygon_id_sdk.dart';

class AuthModel {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String _id_token = "";

  String get id_token => _id_token;

  String _email = "";

  String get email => _email;

  Future<void> signInWithGoogle() async {
    await signOutFromGoogle();
    try {
      logger().i("SIGNING IN WITH GOOGLE");

      final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();

      final GoogleSignInAuthentication? googleAuth =
      await googleUser?.authentication;

      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth?.accessToken,
        idToken: googleAuth?.idToken,
      );


      await _auth.signInWithCredential(credential);

      _email = _auth.currentUser?.email ?? "";

      _id_token = googleAuth?.idToken ?? "";
    } on Exception catch (e) {
      logger().i("error while signing up: " + e.toString());
    }
  }

  Future<void> signOutFromGoogle() async {
    _email = "";
    _id_token = "";
    await _auth.signOut();
    await GoogleSignIn().signOut();
  }
}