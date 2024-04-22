class TapInitData {
  String email;
  String nonce;
  String timestamp;
  String signature;

  TapInitData({
    required this.email,
    required this.nonce,
    required this.timestamp,
    required this.signature,
  });

  factory TapInitData.fromJson(Map<String, dynamic> json) {
    return TapInitData(
      email: json['email'] as String,
      nonce: json['nonce'] as String,
      timestamp: json['timestamp'] as String,
      signature: json['signature'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'nonce': nonce,
      'timestamp': timestamp,
      'signature': signature,
    };
  }
}