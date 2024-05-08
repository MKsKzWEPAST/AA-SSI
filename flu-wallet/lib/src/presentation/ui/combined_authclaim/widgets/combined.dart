import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';
import 'package:local_auth/local_auth.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/env_entity.dart';
import 'package:polygonid_flutter_sdk/iden3comm/domain/entities/common/iden3_message_entity.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:secure_application/secure_application_provider.dart';
import 'package:http/http.dart' as http;
import 'package:wallet_app/utils/auth_model.dart';
import 'package:wallet_app/utils/custom_button_style.dart';
import 'package:wallet_app/utils/custom_colors.dart';
import 'package:wallet_app/utils/custom_strings.dart';
import 'package:wallet_app/utils/custom_text_styles.dart';
import 'package:wallet_app/utils/custom_widgets_keys.dart';
import 'package:wallet_app/src/presentation/dependency_injection/dependencies_provider.dart';
import 'package:wallet_app/src/presentation/navigations/routes.dart';
import 'package:wallet_app/src/presentation/ui/claims/models/claim_model.dart';
import 'package:wallet_app/src/presentation/ui/claims/widgets/claim_card.dart';
import 'package:wallet_app/src/presentation/ui/common/widgets/profile_radio_button.dart';
import 'package:wallet_app/src/presentation/ui/combined_authclaim/combined_bloc.dart';
import 'package:wallet_app/src/presentation/ui/combined_authclaim/combined_event.dart';
import 'package:wallet_app/src/presentation/ui/combined_authclaim/combined_state.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:wallet_app/utils/wallet_utils.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:web3dart/web3dart.dart';
import 'package:url_launcher/url_launcher.dart'; // TODO find why error showing up?

import 'PaymentPopup.dart';
import 'TokenWallet.dart';

const TUSD = 'tusd';
const DAI = 'dai';

class CombinedScreen extends StatefulWidget {
  final CombinedBloc _bloc;

  CombinedScreen({super.key}) : _bloc = getIt<CombinedBloc>();

  @override
  State<CombinedScreen> createState() => _CombinedScreenState();
}

class _CombinedScreenState extends State<CombinedScreen> {
  late Timer _timer;
  Map<String, double> _stablecoinBalance = {TUSD: 0.0, DAI: 0.0};
  bool loadedBalance = false;

  String currency = TUSD;
  String address = "";
  final auth = getIt<AuthModel>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget._bloc.add(const CombinedEvent.getClaims());
      /*if (!SecureApplicationProvider.of(context)!.authenticated) {
        SecureApplicationProvider.of(context)!.lock();
      }*/
      if (auth.id_token == "") {
        Navigator.popAndPushNamed(context, Routes.homePath);
      }
      registerOrFetchSmartAccount(auth.id_token, auth.email)
          .then((_address) => setState(() {
                if (_address != "") {
                  address = _address;
                  auth.setUserAddress(_address);
                  print("\n\n\n=========== " +
                      _address +
                      auth.address +
                      "================\n\n\n");
                  _fetchCoinsBalance();
                }
              }));
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _showBackDialog() {
    showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Are you sure?'),
          content: const Text(
            'Are you sure you want to leave this page?',
          ),
          actions: <Widget>[
            TextButton(
              style: TextButton.styleFrom(
                textStyle: Theme
                    .of(context)
                    .textTheme
                    .labelLarge,
              ),
              child: const Text('Nevermind'),
              onPressed: () {
                Navigator.pop(context);
              },
            ),
            TextButton(
              style: TextButton.styleFrom(
                textStyle: Theme
                    .of(context)
                    .textTheme
                    .labelLarge,
              ),
              child: const Text('Leave'),
              onPressed: () {
                SystemNavigator.pop();
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (bool didPop) {
        if (didPop) return;
        _showBackDialog();
      },
      child: Scaffold(
        backgroundColor: CustomColors.background,
        appBar: _buildAppBar(),
        body: _buildBody(),
      )
    );
  }

  ///
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      elevation: 0.0,
      title: Text(
        "Wallet",
        textAlign: TextAlign.center,
        style: CustomTextStyles.titleTextStyle.copyWith(
            fontWeight: FontWeight.bold, color: Colors.deepPurpleAccent),
      ),
      backgroundColor: CustomColors.background,
      automaticallyImplyLeading: false,
      centerTitle: true,
    );
  }

  Future<void> _fetchCoinBalance(coin) async {
    final proxy = dotenv.env["PROXY_URL"];
    final response = await http.post(
      Uri.parse('$proxy/api/getBalance/$address'),
      // replace with your POST request body
      headers: {"content-type": "application/json"},
      body: jsonEncode({"coin": coin}),
    );

    if (response.statusCode == 200) {
      setState(() {
        _stablecoinBalance[coin] =
            double.parse(json.decode(response.body)["balance"]);
      });
    } else {
      setState(() {
        _stablecoinBalance[coin] = 0;
      });
      // Handle errors
      logger().i('Failed to load data: ${response.statusCode}');
    }
  }

  void _fetchCoinsBalance() {
    _fetchCoinBalance(DAI);
    _fetchCoinBalance(TUSD);
  }

  ///
  Widget _buildBody() {
    var daiQty = _stablecoinBalance[DAI]!;
    var tusdQty = _stablecoinBalance[TUSD]!;
    var tokens = {
      'DAI': {
        'quantity': daiQty,
        'icon': 'assets/images/dai-logo.svg',
        'symbolL': "dai"
      },
      'TrueUSD': {
        'quantity': tusdQty,
        'icon': 'assets/images/tusd-logo.svg',
        'symbolL': "tusd"
      }
    };

    return SafeArea(
      child: SizedBox(
        width: MediaQuery.of(context).size.width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Column(
              children: [
                address == ""
                    ? const CircularProgressIndicator()
                    : Text('Address: ${address.substring(0, 10)}...',
                        style: const TextStyle(fontStyle: FontStyle.italic)),
                const SizedBox(height: 10),
                TokenWallet(
                  address: address,
                  tokens: tokens,
                ),
                const SizedBox(height: 10),
                TokenWalletActions(tokens),
                const SizedBox(height: 5),
                _buildProgress(),
                const SizedBox(height: 5),
                _buildProofSentSuccessSection(),
                const SizedBox(height: 5),
                _buildAuthenticationSuccessSection(),
                const SizedBox(height: 10),
                _buildErrorSection(),
                const SizedBox(height: 10),
                _buildTitle(),
              ],
            ),
            Expanded(
                child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),
                  _buildClaimList(),
                  const SizedBox(height: 40),
                ],
              ),
            )),
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                children: [
                  _buildBlocListener(),
                  _buildBottomBar(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Row TokenWalletActions(Map<String, Map<String, Object>> tokens) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Flexible(flex:1,child:refreshButton()),
        const SizedBox(width: 7),
        Flexible(flex:1,child:receiveButton()),
        const SizedBox(width: 7),
        Flexible(flex:1,child:scanToPayButton(tokens, context)),
        const SizedBox(width: 7),
        Flexible(flex:1,child: historyButton()),
      ],
    );
  }

  Future<void> _launchUrl(_url) async {
    if (!await launchUrl(_url)) {
      Fluttertoast.showToast(
          msg: "Couldn't see history.",
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          timeInSecForIosWeb: 1,
          backgroundColor: Colors.red,
          textColor: Colors.white,
          fontSize: 16.0);
    }
  }

  ElevatedButton refreshButton() {
    return   ElevatedButton(
      onPressed: () {
        _fetchCoinsBalance();
      },
      child: const FittedBox(
        fit: BoxFit.scaleDown,
        child: Text(
          "Refresh",
          maxLines: 1,
        ),
      ),
    );
  }
  ElevatedButton receiveButton() {
    return ElevatedButton(
      onPressed: () {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: Colors.white,
            title: const Text('Wallet Public Key'),
            content: SizedBox(
              width: MediaQuery.of(context).size.width * 0.6,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  QrImageView(
                    data: address,
                    version: QrVersions.auto,
                    size: 200.0,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    address,
                    style: const TextStyle(fontSize: 16),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const  FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    "Receive",
                    maxLines: 1,
                  ),
                ),
              ),
            ],
          ),
        );
      },
      child: const FittedBox(
      fit: BoxFit.scaleDown,
      child: Text(
        "Receive",
        maxLines: 1,
      ),
    ));
  }
  ElevatedButton historyButton() {
    return ElevatedButton(
      onPressed: () async {
        final Uri url = Uri.parse(
            "https://amoy.polygonscan.com/address/$address#tokentxns");
        _launchUrl(url);
      },
      child: const  FittedBox(
        fit: BoxFit.scaleDown,
        child: Text(
          "History",
          maxLines: 1,
        ),
      ),
    );
  }
  ElevatedButton scanToPayButton(
      Map<String, Map<String, Object>> tokens, context) {
    return ElevatedButton(
      onPressed: () async {
        String? qrCodeScanningResult =
            await Navigator.pushNamed(context, Routes.qrCodeScannerPath)
                as String?;
        var (ok, qr_chain, qr_address, qr_price, qr_orderID) =
            _checkPaymentQR(qrCodeScanningResult);
        if (ok) {
          showDialog(
              context: context,
              builder: (context) => PaymentPopup(
                  price: qr_price,
                  address: qr_address,
                  orderID: qr_orderID,
                  tokens: tokens,
                  payFunction: sendERC20Payment,
                  exitFunction: exitPay));
        } else {
          Fluttertoast.showToast(
              msg: "Invalid QR-code.",
              toastLength: Toast.LENGTH_SHORT,
              gravity: ToastGravity.BOTTOM,
              timeInSecForIosWeb: 1,
              backgroundColor: Colors.red,
              textColor: Colors.white,
              fontSize: 16.0);
        }
      },
      child: const FittedBox(
        fit: BoxFit.scaleDown,
        child: Text(
          "Pay",
          maxLines: 1,
        ),
      ),
    );
  }

  ///
  Widget _buildBlocListener() {
    return BlocListener<CombinedBloc, CombinedState>(
      bloc: widget._bloc,
      listener: (context, state) async {
        if (state is NavigateToQrCodeScannerCombinedState) {
          _handleNavigateToQrCodeScannerCombinedState();
        }
        if (state is QrCodeScannedCombinedState) {
          logger().i("[debugging-combined] --Checkpoint 2--");
          _handleQrCodeScanned(state.iden3message);
        }
        if (state is NavigateToClaimDetailCombinedState) {
          _handleNavigationToClaimDetail(state.claimModel);
        }
      },
      child: const SizedBox.shrink(),
    );
  }

  Future<bool?> _showConfirmationDialog(
      BuildContext context, Iden3MessageEntity msg) async {
    var actionText = "";
    switch (msg.messageType) {
      case Iden3MessageType.proofContractInvokeRequest:
        actionText = "Sending proof on chain";
        break;

      case Iden3MessageType.credentialOffer:
        actionText = "Receiving a credential";
        break;

      case Iden3MessageType.authRequest:
        actionText = "Authentication request";
        break;

      default:
        actionText = "Not supported";
    }

    return showDialog<bool>(
      context: context,
      barrierDismissible: false, // User must tap button to dismiss dialog
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirmation'),
          content: SingleChildScrollView(
            child: ListBody(
              children: <Widget>[
                Text('Action: ${actionText}.'),
              ],
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Ok'),
              onPressed: () {
                Navigator.of(context)
                    .pop(true); // Close the dialog and return true
              },
            ),
            TextButton(
              child: const Text('Cancel'),
              onPressed: () {
                Navigator.of(context)
                    .pop(false); // Close the dialog and return false
              },
            ),
          ],
        );
      },
    );
  }

  ///
  Future<void> _handleNavigateToQrCodeScannerCombinedState() async {
    String? qrCodeScanningResult =
        await Navigator.pushNamed(context, Routes.qrCodeScannerPath) as String?;
    try {
      final Iden3MessageEntity iden3message =
      await widget._bloc.qrcodeParserUtils.getIden3MessageFromQrCode(qrCodeScanningResult);

      if(mounted){
        bool? accept = await _showConfirmationDialog(context, iden3message);
        if (accept == null || !accept) {
          return;
        }
      }
    } catch (error) {
      Fluttertoast.showToast(
          msg: "Wrong QR Code...",
          toastLength: Toast.LENGTH_SHORT,
          gravity: ToastGravity.BOTTOM,
          timeInSecForIosWeb: 1,
          backgroundColor: Colors.red,
          textColor: Colors.white,
          fontSize: 16.0);
      // return;
    }

    widget._bloc.add(CombinedEvent.onScanQrCodeResponse(qrCodeScanningResult));
  }

  ///
  Widget _buildProgress() {
    return BlocBuilder(
      bloc: widget._bloc,
      builder: (BuildContext context, CombinedState state) {
        if (state is! LoadingCombinedState) {
          return const SizedBox(
            height: 40,
            width: 40,
          );
        }
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            StreamBuilder<String>(
              stream: widget._bloc.proofGenerationStepsStream,
              initialData: "",
              builder: (BuildContext context, AsyncSnapshot<String> snapshot) {
                return Text(
                  snapshot.data ?? "",
                  style: CustomTextStyles.descriptionTextStyle,
                );
              },
            ),
            const SizedBox(
              height: 48,
              width: 48,
              child: CircularProgressIndicator(
                backgroundColor: CustomColors.primaryButton,
              ),
            ),
          ],
        );
      },
    );
  }

  ///
  Widget _buildProofSentSuccessSection() {
    return BlocBuilder(
      bloc: widget._bloc,
      builder: (BuildContext context, CombinedState state) {
        if (state is! ProofSentCombinedState) {
          return const SizedBox.shrink();
        }
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            CustomStrings.proofSentSuccess,
            style: CustomTextStyles.descriptionTextStyle
                .copyWith(color: CustomColors.greenSuccess),
          ),
        );
      },
    );
  }

  ///
  Widget _buildAuthenticationSuccessSection() {
    return BlocBuilder(
      bloc: widget._bloc,
      builder: (BuildContext context, CombinedState state) {
        if (state is! AuthenticatedCombinedState) {
          return const SizedBox.shrink();
        }
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            CustomStrings.authSuccess,
            style: CustomTextStyles.descriptionTextStyle
                .copyWith(color: CustomColors.greenSuccess),
          ),
        );
      },
    );
  }

  ///
  Widget _buildErrorSection() {
    return BlocBuilder(
      bloc: widget._bloc,
      builder: (BuildContext context, CombinedState state) {
        if (state is! ErrorCombinedState) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            state.message,
            style: CustomTextStyles.descriptionTextStyle
                .copyWith(color: CustomColors.redError),
          ),
        );
      },
    );
  }

  ///
  Widget _buildRadioButtons() {
    void _selectProfile(SelectedProfile profile) {
      widget._bloc.add(CombinedEvent.profileSelected(profile));
    }

    return BlocBuilder(
        bloc: widget._bloc,
        builder: (BuildContext context, CombinedState state) {
          return ProfileRadio(widget._bloc.selectedProfile, _selectProfile);
        });
  }

// Auth (above)
// Claim (below)

  ///
  Widget _buildTitle() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Text(
        CustomStrings.claimsTitle,
        style: CustomTextStyles.titleTextStyle.copyWith(fontSize: 20),
      ),
    );
  }

  ///
  Widget _buildDescriptionClaims() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 24),
      child: Text(
        CustomStrings.claimsDescription,
        textAlign: TextAlign.start,
        style: CustomTextStyles.descriptionTextStyle,
      ),
    );
  }

  Widget _buildBottomBar() {
    return ElevatedButton(
      key: CustomWidgetsKeys.authScreenButtonConnect,
      onPressed: () {
        widget._bloc.add(const CombinedEvent.clickScanQrCode());
      },
      style: CustomButtonStyle.primaryButtonStyle,
      child: const Text(
        "QR scan (ID)",
        style: CustomTextStyles.primaryButtonTextStyle,
      ),
    );
  }

  ///
  Widget _buildRemoveAllClaimsButton() {
    return Align(
      alignment: Alignment.center,
      child: BlocBuilder(
          bloc: widget._bloc,
          builder: (BuildContext context, CombinedState state) {
            bool loading = state is LoadingCombinedState;
            return ElevatedButton(
              onPressed: () {
                if (!loading) {
                  widget._bloc.add(const CombinedEvent.removeAllClaims());
                }
              },
              style: CustomButtonStyle.outlinedPrimaryButtonStyle,
              child: Container(
                constraints: const BoxConstraints(
                  minWidth: 120,
                  maxWidth: 120,
                  maxHeight: 20,
                ),
                child: Center(
                  child: FittedBox(
                    child: Text(
                      CustomStrings.deleteAllClaimsButtonCTA,
                      style: CustomTextStyles.primaryButtonTextStyle
                          .copyWith(color: CustomColors.primaryButton),
                    ),
                  ),
                ),
              ),
            );
          }),
    );
  }

  ///
  Widget _buildClaimList() {
    return BlocBuilder(
      bloc: widget._bloc,
      builder: (BuildContext context, CombinedState state) {
        if (state is LoadedDataCombinedState) {
          List<ClaimModel> claimList = state.claimList;
          List<Widget> claimWidgetList = _buildClaimCardWidgetList(claimList);
          return claimList.isNotEmpty
              ? Column(
                  mainAxisSize: MainAxisSize.min,
                  children: claimWidgetList,
                )
              : const Center(
                  child: Text(CustomStrings.claimsListNoResult),
                );
        }
        return const SizedBox.shrink();
      },
      buildWhen: (_, CombinedState currentState) {
        bool rebuild = currentState is LoadedDataCombinedState;
        return rebuild;
      },
    );
  }

  ///
  List<Widget> _buildClaimCardWidgetList(List<ClaimModel> claimList) {
    return claimList
        .map(
          (claimModelItem) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: InkWell(
              onTap: () {
                widget._bloc.add(CombinedEvent.onClickClaim(claimModelItem));
              },
              child: ClaimCard(claimModel: claimModelItem),
            ),
          ),
        )
        .toList();
  }

  ///
  void _handleQrCodeScanned(Iden3MessageEntity iden3message) {
    logger().i("[debugging-combined] --Checkpoint 3--");
    widget._bloc
        .add(CombinedEvent.fetchAndSaveClaims(iden3message: iden3message));
  }

  ///
  Future<void> _handleNavigationToClaimDetail(ClaimModel claimModel) async {
    bool? deleted = await Navigator.pushNamed(
      context,
      Routes.claimDetailPath,
      arguments: claimModel,
    ) as bool?;

    widget._bloc.add(CombinedEvent.onClaimDetailRemoveResponse(deleted));
  }

  ///
  Widget _buildCircularProgress() {
    return const SizedBox(
      height: 20,
      width: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        backgroundColor: CustomColors.primaryButton,
      ),
    );
  }

  ///
  Widget _buildErrorClaims() {
    return BlocBuilder(
      bloc: widget._bloc,
      builder: (BuildContext context, CombinedState state) {
        if (state is ErrorCombinedState) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              state.message,
              textAlign: TextAlign.start,
              style: CustomTextStyles.descriptionTextStyle
                  .copyWith(color: CustomColors.redError),
            ),
          );
        }
        return const Text("");
      },
    );
  }

  (bool, String, String, double, int) _checkPaymentQR(String? qrContent) {
    try {
      List<String> parts = qrContent!.split(':');
      assert(parts.length == 4, "Content doesn't match payment QR.");

      // Assign each part to the respective variable
      String qr_chain = parts[0];
      assert(qr_chain == "amoy", "Unsupported chain.");
      String qr_address = parts[1];
      EthereumAddress.fromHex(qr_address, enforceEip55: true);

      double qr_price = double.parse(parts[2]);
      assert(qr_price > 0, "Invalid price.");

      int qr_orderID = int.parse(parts[3]);
      assert(qr_orderID > 0, "Invalid order ID.");

      return (true, qr_chain, qr_address, qr_price, qr_orderID);
    } catch (e) {
      // Error reading the qrContent
      return (false, "", "", 0, 0);
    }
  }

  Future<bool> sendERC20Payment(
      String coin, String storeAddress, int orderID, double amount) async {
    final proxy = dotenv.env["PROXY_URL"];
    final response = await http.post(
      Uri.parse(
          '$proxy/api/sendERC20?storeAddress=$storeAddress&orderID=$orderID&amount=$amount&token=$coin'),
      headers: {"content-type": "application/json"},
      body: jsonEncode({
        "coin": coin,
        "id_token": widget._bloc.auth.id_token,
        "email": widget._bloc.auth.email
      }),
    );

    if (response.statusCode == 200) {
      return true;
    } else {
      // Handle errors

      return false;
    }
  }

  exitPay(BuildContext context) {
    Navigator.pop(context);
    _fetchCoinsBalance();
  }
}
