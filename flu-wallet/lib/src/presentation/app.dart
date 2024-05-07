import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:local_auth/local_auth.dart';

import 'package:wallet_app/src/presentation/navigations/routes.dart';
import 'package:wallet_app/src/presentation/ui/splash/widgets/splash.dart';
import 'package:wallet_app/utils/auth_model.dart';
import 'package:wallet_app/utils/custom_colors.dart';
import 'package:wallet_app/utils/custom_strings.dart';
import 'package:wallet_app/utils/custom_text_styles.dart';

import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:secure_application/secure_application.dart';
import 'package:wallet_app/src/presentation/ui/home/widgets/home.dart';

import 'dependency_injection/dependencies_provider.dart';
class App extends StatefulWidget {
  const App({Key? key}) : super(key: key);

  @override
  State<App> createState() => AppState();
}

class AppState extends State<App> with WidgetsBindingObserver {
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  StreamSubscription<bool>? subLock;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // if the app is terminated, log out
    if (state == AppLifecycleState.detached) {
     getIt<AuthModel>().signOutFromGoogle().then((value) =>  logger().i("signed-out"));
    }
  }

  @override
  Widget build(BuildContext context) {
    /*return SecureApplication( // FIXME/TODO: remove to allow screenshots
      nativeRemoveDelay: 700,
      child: Builder(
        builder: (context) {
          // FIXME/TODO: remove both lines to use with no-bio-secured phones
          SecureApplicationProvider.of(context)?.secure();
          SecureApplicationProvider.of(context)?.lock();*/
          return MaterialApp(
            title: CustomStrings.appTitle,
            home: const SplashScreen(),
            routes: Routes.getRoutes(context),
            navigatorKey: navigatorKey,
            theme: ThemeData(
              primarySwatch: CustomColors.primaryWhite,
              buttonTheme: const ButtonThemeData(
                buttonColor: CustomColors.primaryOrange,
                textTheme: ButtonTextTheme.accent,
              ),
            ),
          );
        /*},
      ),
    );*/
  }
}
