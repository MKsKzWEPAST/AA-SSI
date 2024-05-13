# Wallet App

**Contents**
1. [Setup](#setup)
2. [Functionalities](#functionalities)
## Setup

### Install
1. Clone the `polygonid-flutter-sdk` repository.
2. Run `flutter pub get` from root directory.
3. Configure the environment per the instructions below.
4. Run `build_runner` to generate `.g.dart` files:
```bash
dart run build_runner build --delete-conflicting-outputs
```
5. After the previous steps, build and run the project.

## Functionalities

### Receive

In order to load money onto your smart account, click the "Receive" Button, which will open a QR code. Use your Metamask
account in order to scan it and send DAI / TUSD on the Polygon Amoy network.

### History

We make use of [Polygonscan](https://amoy.polygonscan.com/) in order to display the transactions history of your smart account

### Refresh

Your wallet balance is refreshed on the push of this button

### Pay

The 'Pay' button will open a QR code scanner. You can then scan the corresponding qr code onto the webshop when 
purchasing a beer or pizza.

### ID Qr scanner

This button has several functionalities:
* **Authenticate**: Before fetching a credentials from the PolygonID issuer, you need to authenticate.
* **Fetch credential**: After authentication, the same scanner is used to fetch an age credential.
* **Verify credential**: On the webshop, when buying a beer, you will need to scan the age verification QR code in order
to prove that you are over 18.
