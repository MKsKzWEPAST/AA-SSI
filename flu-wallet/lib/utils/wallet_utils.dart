import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';

Future<String> registerOrFetchSmartAccount(String id_token, String email) async {
  try {
    Map<String, String> headers = {
      'Content-Type': 'application/json',
    };

    Map<String, dynamic> body = {
      'id_token': id_token,
      'email': email,
    };

    final proxy = dotenv.env["PROXY_URL"];
    logger().i(proxy);
    // Make the HTTP POST request to the provided URL
    http.Response response = await http.post(
      Uri.parse('$proxy/api/getaddress'),
      headers: headers,
      body: jsonEncode(body),
    );

    // Check if the request was successful
    if (response.statusCode == 200) {
      // Decode the JSON response
      Map<String, dynamic> res = jsonDecode(response.body);

      // Check if the response body contains 'success' and 'address'
      if (res.containsKey('success') && res.containsKey('address')){
        return res['success'] ? res['address'] : "";
      } else {
        logger().i("Invalid response body, missing success or address");
         return "";
      }
    } else {
      // Handle the case where the server did not return a 200 OK response
      logger().i("Error, received non-200 response when fetching address: ${response.reasonPhrase}");
      Fluttertoast.showToast(
          msg: "Couldn't retrieve account",
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          timeInSecForIosWeb: 1,
          backgroundColor: Colors.red,
          textColor: Colors.white,
          fontSize: 16.0);
      return "";
    }
  } catch (e) {
    logger().i("error! ${e.toString()}");
    return "";
  }
}