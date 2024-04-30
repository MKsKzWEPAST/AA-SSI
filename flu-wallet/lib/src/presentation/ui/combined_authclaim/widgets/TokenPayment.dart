import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';

class TokenPayment extends StatefulWidget {
  const TokenPayment({super.key});

  @override
  _TokenPaymentState createState() => _TokenPaymentState();
}

class _TokenPaymentState extends State<TokenPayment> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');

  QRViewController? controller;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        QRView(
          key: qrKey,
          onQRViewCreated: _onQRViewCreated,
        ),
        Positioned(
          bottom: 20.0,
          child: ElevatedButton(
            onPressed: () {
              // Handle actions when the button is pressed
              // You can open the scanner view here
              // or call a function that does so
            },
            child: Text('Open Scanner'),
          ),
        ),
      ],
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      // Handle the scanned QR code data
      print(scanData.code);
    });
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }
}
