import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:wallet_app/src/presentation/dependency_injection/dependencies_provider.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/chain_config_entity.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/env_entity.dart';
import 'package:polygonid_flutter_sdk/sdk/polygon_id_sdk.dart';
import 'package:wallet_app/src/presentation/dependency_injection/dependencies_provider.dart'
    as di;
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:wallet_app/src/presentation/app.dart';
import 'dart:async';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // init DB for user credentials (social login tokens, smart account address..)
  final database = openDatabase(join(await getDatabasesPath(),'credentials.db'), 
  onCreate: (db,version) {
    return db.execute('CREATE TABLE credentials(user_id TEXT PRIMARY KEY, access_token TEXT, id_token TEXT, account_address TEXT, email TEXT)');
  }, version: 1,
  );

  //Dependency Injection initialization
  await di.init();
  PolygonIdSdk.I.switchLog(enabled: true);

  // App UI locked in portrait mode
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  if (true) { // todo: replace later with "wallet initialized with did and bio set-up"

  }

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const App());


}

