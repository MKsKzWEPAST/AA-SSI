import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_login/flutter_login.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:wallet_app/src/presentation/dependency_injection/dependencies_provider.dart';
import 'package:wallet_app/src/presentation/navigations/routes.dart';
import 'package:wallet_app/src/presentation/ui/home/home_bloc.dart';
import 'package:wallet_app/src/presentation/ui/home/home_event.dart';
import 'package:wallet_app/src/presentation/ui/home/home_state.dart';

import '../../../../../utils/auth_model.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  //final LocalAuthentication auth = LocalAuthentication();
  late final HomeBloc _bloc;
  late final AuthModel _auth;

  @override
  void initState() {
    super.initState();
    _bloc = getIt<HomeBloc>();
    _bloc.add(const HomeEvent.createIdentity());
    _auth = getIt<AuthModel>();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder(
      bloc: _bloc,
      builder: (BuildContext context, HomeState state) {
        return FlutterLogin(
          title: 'Secutix Wallet',
          logo: null,
          onLogin: signIn,
          onSignup: signUp,

          loginProviders: <LoginProvider>[
            LoginProvider(
              icon: FontAwesomeIcons.google,
              label: 'Google',
              callback: () async {
                final s = await signInGoogle();
                if (s != "") {
                  return s;
                }
                return null;
              },
            ),
          ],
          onSubmitAnimationCompleted: () {
            Navigator.pushNamed(context, Routes.combinedPath);
          },
          onRecoverPassword: (v) {
            Future.delayed(const Duration(milliseconds: 100)).then((value) => "Can't recover password");
            return null;
          },
        );
      },
      buildWhen: (_, currentState) =>
      currentState is LoadedIdentifierHomeState,
    );

  }

  Future<String?> signIn(LoginData data) async {
    try {
      final s = await _auth.signInPassword(data);
      return s;
    } catch (e) {
      logger().i("Error while signing in: $e");
      return e.toString();
    }
  }

  Future<String?> signUp(SignupData data) async {
    try {
      final s = await _auth.signUpPassword(data);
      return s;
    } catch (e) {
      logger().i("Error while signing up: $e");
      return e.toString();
    }
  }


  Future<String> signInGoogle() async {
    try {
      final s = await _auth.signInWithGoogle();
      return s;
    } catch (e) {
      logger().i("Error while signing in with Google: $e");
      return e.toString();
    }

  }
}
