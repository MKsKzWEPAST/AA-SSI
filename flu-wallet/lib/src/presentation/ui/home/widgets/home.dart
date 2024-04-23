import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:local_auth/local_auth.dart';
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

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final LocalAuthentication auth = LocalAuthentication();
  late final HomeBloc _bloc;
  late StreamSubscription _sub;

  @override
  void initState() {
    super.initState();
    _bloc = getIt<HomeBloc>();
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.background,
      body: SafeArea(
        child: Container(
          alignment: Alignment.center,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(height: 50),
                      _buildLogo(),
                      const SizedBox(height: 50),
                      _buildDescription(),
                      const SizedBox(height: 20),
                      _buildProgress(),
                      _buildWalletSection(),
                      _buildCreateIdentityButton(true),
                      const SizedBox(height: 20),
                      _buildErrorSection(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }


  ///
  Widget _buildIdentityActionButton() {
    return Align(
      alignment: Alignment.center,
      child: BlocBuilder(
        bloc: _bloc,
        builder: (BuildContext context, HomeState state) {
          bool enabled = state is! LoadingDataHomeState;
          bool showCreateIdentityButton =
              state.identifier == null || state.identifier!.isEmpty;

          return showCreateIdentityButton
              ? _buildCreateIdentityButton(enabled)
              : _buildRemoveIdentityButton(enabled);
        },
      ),
    );
  }

  ///
  Widget _buildCreateIdentityButton(bool enabled) {
    return AbsorbPointer(
      absorbing: !enabled,
      child: ElevatedButton(
        key: CustomWidgetsKeys.homeScreenButtonCreateIdentity,
        onPressed: () {
          _bloc.add(const HomeEvent.createIdentity());
        },
        style: enabled
            ? CustomButtonStyle.primaryButtonStyle
            : CustomButtonStyle.disabledPrimaryButtonStyle,
        child: const FittedBox(
          child: Text(
            CustomStrings.createID,
            textAlign: TextAlign.center,
            style: CustomTextStyles.primaryButtonTextStyle,
          ),
        ),
      ),
    );
  }

  ///
  Widget _buildRemoveIdentityButton(bool enabled) {
    return AbsorbPointer(
      absorbing: !enabled,
      child: ElevatedButton(
        key: CustomWidgetsKeys.homeScreenButtonRemoveIdentity,
        onPressed: () {
          _bloc.add(const HomeEvent.removeIdentity());
        },
        style: enabled
            ? CustomButtonStyle.outlinedPrimaryButtonStyle
            : CustomButtonStyle.disabledPrimaryButtonStyle,
        child: FittedBox(
          child: Text(
            CustomStrings.homeButtonRemoveIdentityCTA,
            textAlign: TextAlign.center,
            style: CustomTextStyles.primaryButtonTextStyle.copyWith(
              color: CustomColors.primaryButton,
            ),
          ),
        ),
      ),
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
                return state.identifier != null
                    ? Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment:
                  CrossAxisAlignment.center,
                  children: [
                    state.identifier!.isEmpty
                        ? Text(
                      CustomStrings.homeNoWallet,
                      style: CustomTextStyles
                          .descriptionTextStyle
                          .copyWith(
                          fontSize: 20,
                          fontWeight:
                          FontWeight.w700),
                    )
                        : Text(
                      CustomStrings.homeHasWallet,
                      style: CustomTextStyles
                          .descriptionTextStyle
                          .copyWith(fontSize: 15),
                    ),
                    const SizedBox(height: 20),
                    _buildEnterButton(CustomStrings.homeHasWallet),
                  ],
                )
                    : Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment:
                  CrossAxisAlignment.center,
                  children: [
                    Text(
                      CustomStrings.homeNoWallet,
                      style: CustomTextStyles
                          .descriptionTextStyle
                          .copyWith(fontSize: 15),
                    ),
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
  Widget _buildEnterButton(String text) {
    return ElevatedButton(
        onPressed: () => Navigator.pushNamed(context, Routes.combinedPath),
        child: Text(text));
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
