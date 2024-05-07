import 'dart:collection';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_login/flutter_login.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:flutter/widgets.dart';
import 'package:polygonid_flutter_sdk/sdk/polygon_id_sdk.dart';
import 'package:wallet_app/utils/wallet_utils.dart';

class AuthModel {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  String _id_token = "";

  String get id_token => _id_token;

  String _email = "";

  String get email => _email;

  String _address = "";

  String get address => _address;

  Future<String> signInWithGoogle() async {
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

      _id_token = await _auth.currentUser?.getIdToken(true) ?? "";
      return "signed-in";
    } on Exception catch (e) {
      logger().i("error while signing in with google: " + e.toString());
      return e.toString();
    }
  }

  Future<String?> signInPassword(LoginData data) async {
    try {


      await _auth.signInWithEmailAndPassword(email: data.name, password: data.password);

      _email = _auth.currentUser?.email ?? "";

      _id_token = await _auth.currentUser?.getIdToken(true) ?? "";
    } on Exception catch (e) {
      logger().i("error while signing in: " + e.toString());
      return "Couldn't sign in";

    }
    return null;
  }

  Future<String?> signUpPassword(SignupData data) async {
    try {
      final n = data.name ?? "";
      final p = data.password ?? "";
      if (n == "" || p == "") {
        return "email or password is empty";
      }
      await _auth.createUserWithEmailAndPassword(email: n,password: p);

      _email = _auth.currentUser?.email ?? "";

      _id_token = await _auth.currentUser?.getIdToken(true) ?? "";
    } on Exception catch (e) {
      logger().i("error while signing up: " + e.toString());
        return "Couldn't sign up";
    }
    return null;
  }

  Future<void> signOutFromGoogle() async {
    _email = "";
    _id_token = "";
    await _auth.signOut();
    await GoogleSignIn().signOut();
  }

  void setUserAddress(String address) {
    assert(address.length == 42, "Invalid address.");
    _address = address;
  }
}
