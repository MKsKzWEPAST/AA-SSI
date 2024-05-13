import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:http/http.dart' as http;
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:wallet_app/src/presentation/dependency_injection/dependencies_provider.dart';
import 'package:wallet_app/src/presentation/navigations/routes.dart';
import 'package:wallet_app/utils/backend_plug.dart';
import 'package:wallet_app/utils/custom_colors.dart';

class BackendPlug extends StatefulWidget {
  const BackendPlug({super.key});

  @override
  State<BackendPlug> createState() => _BackendPlugState();
}

class _BackendPlugState extends State<BackendPlug> {
  final _formKey = GlobalKey<FormState>();
  String url = "";

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
                          } else if (!value.startsWith("https://")) {
                            return "The url format is not valid";
                          }
                          setState(() {
                            url = value;
                          });
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () async {
                          if (_formKey.currentState!.validate()) {
                            if (url != "") {
                              logger().i("ah ?");
                              try {
                                final response =
                                    await http.get(Uri.parse('$url/api/ping'));
                                if (response.statusCode != 200) {
                                  logger().i("Error with url $url");
                                  Fluttertoast.showToast(
                                      msg:
                                          "Failed to reach the backend: ${response.reasonPhrase}",
                                      toastLength: Toast.LENGTH_SHORT,
                                      gravity: ToastGravity.TOP,
                                      timeInSecForIosWeb: 1,
                                      backgroundColor: Colors.red,
                                      textColor: Colors.white,
                                      fontSize: 16.0);
                                } else {
                                  getIt<BackendPlugUtils>().setBackendURL(url);
                                  _validURL();
                                }
                              } catch (e) {
                                Fluttertoast.showToast(
                                    msg: "URL $url is not valid: $e",
                                    toastLength: Toast.LENGTH_SHORT,
                                    gravity: ToastGravity.TOP,
                                    timeInSecForIosWeb: 1,
                                    backgroundColor: Colors.red,
                                    textColor: Colors.white,
                                    fontSize: 16.0);
                              }
                            }
                          }
                        },
                        child: const Text('Submit'),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          getIt<BackendPlugUtils>().setBackendURL(
                              "https://broadly-assured-piglet.ngrok-free.app");
                          _validURL();
                        },
                        child: const Text('Léo NGROK'),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          getIt<BackendPlugUtils>().setBackendURL(
                              "https://griffon-loved-physically.ngrok-free.app");
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
