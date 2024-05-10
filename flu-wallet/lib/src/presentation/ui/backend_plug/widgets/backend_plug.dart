import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:wallet_app/src/presentation/dependency_injection/dependencies_provider.dart';
import 'package:wallet_app/src/presentation/navigations/routes.dart';
import 'package:wallet_app/src/presentation/ui/splash/splash_bloc.dart';
import 'package:wallet_app/src/presentation/ui/splash/splash_event.dart';
import 'package:wallet_app/src/presentation/ui/splash/splash_state.dart';
import 'package:wallet_app/utils/backend_plug.dart';
import 'package:wallet_app/utils/custom_button_style.dart';
import 'package:wallet_app/utils/custom_colors.dart';
import 'package:wallet_app/utils/custom_text_styles.dart';
import 'package:wallet_app/utils/image_resources.dart';
import 'package:secure_application/secure_application_provider.dart';
import 'package:http/http.dart' as http;

class BackendPlug extends StatefulWidget {
  const BackendPlug({super.key});

  @override
  State<BackendPlug> createState() => _BackendPlugState();
}

class _BackendPlugState extends State<BackendPlug> {

  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.background,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.5),
                        spreadRadius: 1,
                        blurRadius: 6,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextFormField(
                        decoration: const InputDecoration(
                          labelText: 'Backend URL',
                          border: OutlineInputBorder(),
                          hintText: 'Enter your backend URL here',
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Enter backend URL';
                          }
                          try {
                            http.get(Uri.parse('$value/api/ping')).then(
                                  (response) {
                                if (response.statusCode != 200) {
                                  return "Backend is down or unavailable";
                                }
                                getIt<BackendPlugUtils>().setBackendURL(value);
                                return null;
                              },
                            );
                          } catch (e) {
                            logger().i('An error occurred: $e');
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () {
                          if (_formKey.currentState!.validate()) {
                            _validURL();
                          }
                        },
                        child: const Text('Submit'),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          getIt<BackendPlugUtils>().setBackendURL("https://broadly-assured-piglet.ngrok-free.app");
                          _validURL();
                        },
                        child: const Text('Léo NGROK'),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          getIt<BackendPlugUtils>().setBackendURL("https://griffon-loved-physically.ngrok-free.app");
                          _validURL();
                        },
                        child: const Text('Victor NGROK'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
  ///
  void _validURL() {
    Navigator.of(context).pushReplacementNamed(Routes.homePath);
  }

}
