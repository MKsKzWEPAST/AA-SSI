import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:local_auth/local_auth.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:wallet_app/src/presentation/dependency_injection/dependencies_provider.dart';
import 'package:wallet_app/src/presentation/navigations/routes.dart';
import 'package:wallet_app/src/presentation/ui/common/widgets/button_next_action.dart';
import 'package:wallet_app/src/presentation/ui/common/widgets/feature_card.dart';
import 'package:wallet_app/src/presentation/ui/home/home_bloc.dart';
import 'package:wallet_app/src/presentation/ui/home/home_event.dart';
import 'package:wallet_app/src/presentation/ui/home/home_state.dart';
import 'package:wallet_app/utils/custom_button_style.dart';
import 'package:wallet_app/utils/custom_colors.dart';
import 'package:wallet_app/utils/custom_strings.dart';
import 'package:wallet_app/utils/custom_text_styles.dart';
import 'package:wallet_app/utils/custom_widgets_keys.dart';
import 'package:wallet_app/utils/image_resources.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../../utils/auth_model.dart';
import 'package:flutter_login/flutter_login.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

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
                await signInGoogle();
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

  ///
  Widget _buildLogo() {
    return SvgPicture.asset(
      ImageResources.logo,
      width: 120,
    );
  }

  ///
  Widget _buildDescription() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 24),
      child: Text(
        CustomStrings.homeDescription,
        textAlign: TextAlign.center,
        style: CustomTextStyles.descriptionTextStyle,
      ),
    );
  }

  ///
  Widget _buildProgress() {
    return BlocBuilder(
      bloc: _bloc,
      builder: (BuildContext context, HomeState state) {
        if (state is! LoadingDataHomeState) return const SizedBox.shrink();
        return Column(children: [
          Text(
            CustomStrings.loading,
            textAlign: TextAlign.center,
            style: CustomTextStyles.descriptionTextStyle.copyWith(fontSize: 20),
          ),
          const CircularProgressIndicator(
            backgroundColor: CustomColors.primaryButton,
          ),
        ]);
      },
    );
  }

  Widget _buildWalletSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: BlocBuilder(
        bloc: _bloc,
        builder: (BuildContext context, HomeState state) {
          return Align(
            alignment: Alignment.center,
            child: BlocBuilder(
              bloc: _bloc,
              builder: (BuildContext context, HomeState state) {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment:
                  CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 10),
                    _buildGoogleButton(CustomStrings.homeSocialLogin),
                  ],
                );
              },
            ),
          );
        },
        buildWhen: (_, currentState) =>
        currentState is LoadedIdentifierHomeState,
      ),
    );
  }

  ///
  Widget _buildGoogleButton(String text){
    return ElevatedButton(
        onPressed: () => {
          signInGoogle()
        },
        child: Text(text));
  }
  Future<String?> signIn(LoginData data) async {
    try {
      final s = await _auth.signInPassword(data);
      return s;
    } catch (e) {
      return "Issue with the sign-in: $e";
    }
  }

  Future<String?> signUp(SignupData data) async {
    try {
      final s = await _auth.signUpPassword(data);
      return s;
    } catch (e) {
      return "Issue with the sign-in: $e";
    }
  }


  Future<String> signInGoogle() async {
    try {
      final s = await _auth.signInWithGoogle();
      return s;
    } catch (error) {
      logger().i("Error while signing in: $error");
      return "";
    }

  }
  ///
  Widget _buildErrorSection() {
    return BlocBuilder(
      bloc: _bloc,
      builder: (BuildContext context, HomeState state) {
        if (state is! ErrorHomeState) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            state.message,
            style: CustomTextStyles.descriptionTextStyle
                .copyWith(color: CustomColors.redError),
          ),
        );
      },
    );
  }

  ///
  Widget _buildFeaturesSection() {
    return ListView(
      shrinkWrap: true,
      physics: const ClampingScrollPhysics(),
      children: [
        _buildCombinedFeatureCard(),
        _buildBackupIdentityFeatureCard(),
        _buildRestoreIdentityFeatureCard(),
      ],
    );
  }

  ///
  Widget _buildCombinedFeatureCard() {
    return BlocBuilder(
      bloc: _bloc,
      builder: (BuildContext context, HomeState state) {
        bool enabled = (state is! LoadingDataHomeState) &&
            (state.identifier != null && state.identifier!.isNotEmpty);
        return FeatureCard(
          methodName: "auth() / getCredential()",
          title: "Combined Test",
          description: "Combined QR for auth and Claims",
          onTap: () {
            Navigator.pushNamed(context, Routes.combinedPath);
          },
          enabled: enabled,
          disabledReason: CustomStrings.homeFeatureCardDisabledReason,
        );
      },
    );
  }

  ///
  Widget _buildBackupIdentityFeatureCard() {
    return BlocBuilder(
      bloc: _bloc,
      builder: (BuildContext context, HomeState state) {
        bool enabled = (state is! LoadingDataHomeState) &&
            (state.identifier != null && state.identifier!.isNotEmpty);
        return FeatureCard(
          methodName: CustomStrings.backupIdentityMethod,
          title: CustomStrings.backupIdentityTitle,
          description: CustomStrings.backupIdentityDescription,
          onTap: () {
            Navigator.pushNamed(context, Routes.backupIdentityPath);
          },
          enabled: enabled,
          disabledReason: CustomStrings.homeFeatureCardDisabledReason,
        );
      },
    );
  }

  ///
  Widget _buildRestoreIdentityFeatureCard() {
    return BlocBuilder(
      bloc: _bloc,
      builder: (BuildContext context, HomeState state) {
        bool enabled = (state is! LoadingDataHomeState) &&
            (state.identifier != null && state.identifier!.isNotEmpty);
        return FeatureCard(
          methodName: CustomStrings.restoreIdentityMethod,
          title: CustomStrings.restoreIdentityTitle,
          description: CustomStrings.restoreIdentityDescription,
          onTap: () {
            Navigator.pushNamed(context, Routes.restoreIdentityPath);
          },
          enabled: enabled,
          disabledReason: CustomStrings.homeFeatureCardDisabledReason,
        );
      },
    );
  }
}
