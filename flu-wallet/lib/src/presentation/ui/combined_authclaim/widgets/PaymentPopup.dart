import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:fluttertoast/fluttertoast.dart';

class PaymentPopup extends StatefulWidget {
  final double price;
  final String address;
  final int orderID;
  final Map<String, Map<String, Object>> tokens;
  final Function payFunction;
  final Function exitFunction;

  const PaymentPopup(
      {Key? key,
      required this.price,
      required this.address,
      required this.orderID,
      required this.tokens,
      required this.payFunction,
      required this.exitFunction})
      : super(key: key);

  @override
  _PaymentPopupState createState() => _PaymentPopupState();
}

class _PaymentPopupState extends State<PaymentPopup> {
  bool paying = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Center(
          child: !paying
              ? Text('Price: ${widget.price}\$')
              : const Text('Processing...')),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: !paying
            ? [
                const Text(
                  'Pay using one of your tokens:',
                  style: TextStyle(fontStyle: FontStyle.italic),
                ),
                Column(
                  children: widget.tokens.keys.map((tokenName) {
                    final token = widget.tokens[tokenName];
                    final tokenSymbolL = token!['symbolL']!.toString();
                    final tokenIcon = token['icon']!.toString();
                    double tokenQuantity =
                        double.parse(token['quantity']!.toString());
                    final canAfford = (tokenQuantity >= widget.price);

                    return buildTokenButton(canAfford, tokenSymbolL, context,
                        tokenIcon, tokenName, tokenQuantity);
                  }).toList(),
                ),
                ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(context);
                  },
                  child: const Text('Cancel'),
                ),
              ]
            : [const CircularProgressIndicator()],
      ),
    );
  }

  Container buildTokenButton(
      bool canAfford,
      String tokenSymbolL,
      BuildContext context,
      String tokenIcon,
      String tokenName,
      double tokenQuantity) {
    return Container(
      height: 50.0,
      margin: const EdgeInsets.symmetric(vertical: 5.0),
      child: TextButton(
        onPressed: canAfford
            ? () {
                setState(() {
                  paying = true;
                });
                widget
                    .payFunction(tokenSymbolL, widget.address, widget.orderID,
                        widget.price)
                    .then((result) => {
                          if (result)
                            {
                              Fluttertoast.showToast(
                                  msg: "Payment sent!",
                                  toastLength: Toast.LENGTH_SHORT,
                                  gravity: ToastGravity.BOTTOM,
                                  timeInSecForIosWeb: 1,
                                  backgroundColor: Colors.green,
                                  textColor: Colors.white,
                                  fontSize: 16.0)
                            }
                          else
                            {
                              Fluttertoast.showToast(
                                  msg: "Failed to send payment!",
                                  toastLength: Toast.LENGTH_SHORT,
                                  gravity: ToastGravity.BOTTOM,
                                  timeInSecForIosWeb: 1,
                                  backgroundColor: Colors.red,
                                  textColor: Colors.white,
                                  fontSize: 16.0)
                            }
                        })
                    .then((value) => {widget.exitFunction(context)});
              }
            : null,
        style: ButtonStyle(
          backgroundColor: MaterialStateProperty.resolveWith<Color?>(
            (states) {
              if (states.contains(MaterialState.disabled)) {
                return Colors.grey.withOpacity(0.5);
              }
              return Theme.of(context).cardColor;
            },
          ),
          shape: MaterialStateProperty.all<RoundedRectangleBorder>(
            RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(5.0),
            ),
          ),
          padding: MaterialStateProperty.all<EdgeInsetsGeometry>(
            const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                SvgPicture.asset(
                  tokenIcon,
                  width: 34,
                  height: 34,
                ),
                const SizedBox(width: 10),
                Text(
                  tokenName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            Text(
              '$tokenQuantity',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
