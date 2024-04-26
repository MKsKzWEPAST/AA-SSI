import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class Credentials {

  final String user_id;
  final String access_token;
  final String id_token;
  final String account_address;
  final String email;

  const Credentials({
    required this.user_id,
    required this.access_token,
    required this.id_token,
    required this.account_address,
    required this.email
  });

  Map<String,Object?> toMap() {
    return {
      'user_id': user_id,
      'access_token': access_token,
      'id_token': id_token,
      'account_address': account_address,
      'email': email,
    };
  }

  @override
  String toString() {
    return 'Credentials{}';
  }
}

Future<void> insertCredentials(Credentials cred) async {
  final db = await openDatabase(join(await getDatabasesPath(),'credentials.db'),
    onCreate: (db,version) {
      return db.execute('CREATE TABLE credentials(user_id TEXT PRIMARY KEY, access_token TEXT, id_token TEXT, account_address TEXT, email TEXT)');
    }, version: 1,
  );

  await db.insert('credentials', cred.toMap(),conflictAlgorithm: ConflictAlgorithm.replace);
}