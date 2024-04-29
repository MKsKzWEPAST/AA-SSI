import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:local_auth/local_auth.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/env_entity.dart';
import 'package:polygonid_flutter_sdk/iden3comm/domain/entities/common/iden3_message_entity.dart';
import 'package:provider/provider.dart';
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
const USDT = 'USDT';
const DAI = 'DAI';

class CombinedScreen extends StatefulWidget {
  final CombinedBloc _bloc;

  CombinedScreen({super.key}) : _bloc = getIt<CombinedBloc>();

  @override
  State<CombinedScreen> createState() => _CombinedScreenState();
}

class _CombinedScreenState extends State<CombinedScreen> {
  late Timer _timer;
  double _stablecoinBalance = 0.0;
  String currency = USDT;
  String address = "0x...";

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget._bloc.add(const CombinedEvent.getClaims());
      if (!SecureApplicationProvider.of(context)!.authenticated) {
        SecureApplicationProvider.of(context)!.lock();
      }
    });
  }


  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CustomColors.background,
      endDrawer: _buildDrawer(),
      appBar: _buildAppBar(),
      body: _buildBody(),
    );
  }

  ///
  Widget _buildDrawer() {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration:
                const BoxDecoration(color: Color.fromARGB(255, 129, 70, 227)),
            child: Text('Settings',
                style: CustomTextStyles.titleTextStyle
                    .copyWith(color: Colors.white)),
          ),
          _buildRadioButtons(),
          const SizedBox(height: 20),
          _buildRemoveAllClaimsButton(),
        ],
      ),
    );
  }

  ///
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      elevation: 0.0,
      title: const Text(
        "Wallet",
        textAlign: TextAlign.center,
        style: CustomTextStyles.titleTextStyle,
      ),
      backgroundColor: CustomColors.background,
      automaticallyImplyLeading: false,
      centerTitle: true,
    );
  }


  Future<void> _fetchCoinBalance(coin) async {

    final proxy = dotenv.env["PROXY_URL"];
    final response = await http.post(
      Uri.parse('$proxy/api/getBalance/...'),
      // replace with your POST request body
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      setState(() {
        _stablecoinBalance = json.decode(response.body)[coin];
      });
    } else {
      setState(() {
        _stablecoinBalance = coin == DAI ? 2500 : 1300;
      });
      // Handle errors
      logger().i('Failed to load data: ${response.statusCode}');
    }
  }


  ///
  Widget _buildBody() {
    return SafeArea(
      child: SizedBox(
        width: MediaQuery.of(context).size.width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Column(
              children: [
                Consumer<AuthModel>(builder:
                    (BuildContext context, AuthModel auth, Widget? child) {
                          final id_token = auth.id_token;
                          final email = auth.email;
                          return FutureBuilder<String>(
                            future: registerOrFetchSmartAccount(id_token, email), // Call your async function here
                            builder: (context, snapshot) {
                              if (snapshot.connectionState == ConnectionState.waiting) {
                                // Show loading indicator while the data is loading
                                return const CircularProgressIndicator();
                              } else if (snapshot.hasError) {
                                // Handle errors
                                return Text('Error: ${snapshot.error}');
                              } else {
                                // When data is fetched successfully, show your address
                                return Text('Address: ${snapshot.data}', style: CustomTextStyles.descriptionTextStyle);
                              }
                            },
                          );
                    },
                ),
                Padding(padding: const EdgeInsets.only(bottom: 16),
                  child: Text(_stablecoinBalance.toString()),
                ),
                DropdownButton<String>(hint: const Text("Choose your currency"),
                    value: currency,
                    items: const <String>[DAI,USDT].map<DropdownMenuItem<String>>((String v) {
                      return DropdownMenuItem<String>(
                        value: v,
                        child: Text(v),
                      );
                    }).toList(),
                    onChanged: (String? value) {
                      setState(() {
                        currency = value!;
                        _fetchCoinBalance(value);
                      });

                    }),
                const SizedBox(height: 10),
                _buildProgress(),
                const SizedBox(height: 10),
                _buildAuthenticationSuccessSection(),
                const SizedBox(height: 10),
                _buildErrorSection(),
                const SizedBox(height: 10),
                const SizedBox(height: 6),
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

  ///
  Widget _buildBlocListener() {
    return BlocListener<CombinedBloc, CombinedState>(
      bloc: widget._bloc,
      listener: (context, state) {
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

  ///
  Future<void> _handleNavigateToQrCodeScannerCombinedState() async {
    String? qrCodeScanningResult =
        await Navigator.pushNamed(context, Routes.qrCodeScannerPath) as String?;
    widget._bloc.add(CombinedEvent.onScanQrCodeResponse(qrCodeScanningResult));
  }

  ///
  Widget _buildProgress() {
    return BlocBuilder(
      bloc: widget._bloc,
      builder: (BuildContext context, CombinedState state) {
        if (state is! LoadingCombinedState) {
          return const SizedBox(
            height: 48,
            width: 48,
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
  Widget _buildAuthenticationSuccessSection() {
    return BlocBuilder(
      bloc: widget._bloc,
      builder: (BuildContext context, CombinedState state) {
        if (state is! AuthenticatedCombinedState)
          return const SizedBox.shrink();
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

  /*Widget _buildTAPBar() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: ElevatedButton(
        key: CustomWidgetsKeys.authScreenButtonConnect2,
        onPressed: () {
          widget._bloc.add(const CombinedEvent.clickTapButton());
        },
        style: CustomButtonStyle.primaryButtonStyle,
        child: const Text(
          "Tap for TAP",
          style: CustomTextStyles.primaryButtonTextStyle,
        ),
      ),
    );
  }*/

  Widget _buildBottomBar() {
    return ElevatedButton(
      key: CustomWidgetsKeys.authScreenButtonConnect,
      onPressed: () {
        widget._bloc
            .add(const CombinedEvent.clickScanQrCode());
      },
      style: CustomButtonStyle.primaryButtonStyle,
      child: const Text(
        "Scan QR code",
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
  Future<void> _handleNavigateToQrCodeScannerClaimsState() async {
    String? qrCodeScanningResult =
        await Navigator.pushNamed(context, Routes.qrCodeScannerPath) as String?;
    widget._bloc.add(CombinedEvent.onScanQrCodeResponse(qrCodeScanningResult));
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
}
