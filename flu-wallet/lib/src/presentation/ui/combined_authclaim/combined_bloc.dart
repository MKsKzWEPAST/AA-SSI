import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:bloc/bloc.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_constants.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/env_config_entity.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/env_entity.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/filter_entity.dart';
import 'package:polygonid_flutter_sdk/credential/domain/entities/claim_entity.dart';
import 'package:polygonid_flutter_sdk/credential/domain/exceptions/credential_exceptions.dart';
import 'package:polygonid_flutter_sdk/iden3comm/domain/entities/authorization/request/auth_body_request.dart';
import 'package:polygonid_flutter_sdk/iden3comm/domain/entities/common/iden3_message_entity.dart';
import 'package:polygonid_flutter_sdk/iden3comm/domain/entities/credential/request/offer_iden3_message_entity.dart';
import 'package:polygonid_flutter_sdk/sdk/polygon_id_sdk.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import '../../../../utils/auth_model.dart';
import '../../../../utils/custom_strings.dart';
import '../../../../utils/nonce_utils.dart';
import '../../../../utils/qr_code_parser_utils.dart';
import '../../../../utils/secure_storage_keys.dart';
import '../../../data/secure_storage.dart';
import '../../dependency_injection/dependencies_provider.dart';
import '../claims/mappers/claim_model_mapper.dart';
import '../claims/models/claim_model.dart';
import '../common/widgets/profile_radio_button.dart';
import 'combined_event.dart';
import 'combined_state.dart';
import 'package:http/http.dart' as http;

class CombinedBloc extends Bloc<CombinedEvent, CombinedState> {
  final ClaimModelMapper _mapper;
  final PolygonIdSdk _polygonIdSdk;
  final QrcodeParserUtils _qrcodeParserUtils;
  final AuthModel _auth = getIt<AuthModel>();
  static const SelectedProfile _defaultProfile = SelectedProfile.public;
  SelectedProfile selectedProfile = _defaultProfile;

  CombinedBloc(
    this._mapper,
    this._polygonIdSdk,
    this._qrcodeParserUtils,
  ) : super(const CombinedState.initial()) {
    on<ClickScanQrCodeEvent>(_handleClickScanQrCode);
    on<ScanQrCodeResponse>(_handleScanQrCodeResponse);
    on<ProfileSelectedEvent>(_handleProfileSelected);
    on<FetchAndSaveClaimsEvent>(_fetchAndSaveClaims);
    on<GetClaimsEvent>(_getClaims);
    on<GetClaimsByIdsEvent>(_getClaimsByIds);
    on<RemoveClaimEvent>(_removeClaim);
    on<RemoveClaimsEvent>(_removeClaims);
    on<RemoveAllClaimsEvent>(_removeAllClaims);
    on<UpdateClaimEvent>(_updateClaim);
    on<OnClickClaim>(_handleClickClaim);
    on<OnClaimDetailRemoveResponse>(_handleRemoveClaimResponse);
  }

  AuthModel get auth => _auth;

  get qrcodeParserUtils => _qrcodeParserUtils;

  Future<void> _handleProfileSelected(
      ProfileSelectedEvent event, Emitter<CombinedState> emit) async {
    selectedProfile = event.profile;
    emit(CombinedState.profileSelected(event.profile));
  }

  ///
  Stream<String> get proofGenerationStepsStream =>
      _polygonIdSdk.proof.proofGenerationStepsStream();

  ///
  Future<void> _handleClickScanQrCode(
      ClickScanQrCodeEvent event, Emitter<CombinedState> emit) async {
    emit(const CombinedState.navigateToQrCodeScanner());
  }

  Future<void> _handleIden3Message(String response, Emitter<CombinedState> emit) async {
    try {
      final Iden3MessageEntity iden3message =
      await _qrcodeParserUtils.getIden3MessageFromQrCode(response);

      logger().i("[debugging-combined] Message content: [start] Id: ${iden3message.id}, Typ: ${iden3message.typ} "
          "Type: ${iden3message.type}, Message Type: ${iden3message.messageType.toString()} "
          "Thid: ${iden3message.thid}, Body: ${iden3message.body} "
          "From: ${iden3message.from}, To: ${iden3message.to ?? ''} [end]");

      switch (iden3message.messageType) {
        case Iden3MessageType.proofContractInvokeRequest:
          logger().i("[debugging-combined] -- On-chain verification: Checkpoint 1--");

          if (emit.isDone) return;

          emit(CombinedState.loaded(iden3message));

          emit(const CombinedState.loading());

          String? privateKey =
          await SecureStorage.read(key: SecureStorageKeys.privateKey);

          if (privateKey == null) {
            emit(const CombinedState.error("no private key found"));
            return;
          }

          EnvEntity env = await _polygonIdSdk.getEnv();
          final chainConfig = env.chainConfigs["80002"]!;
          final blockchain = chainConfig.blockchain;
          final network = chainConfig.network;

          String? did = await _polygonIdSdk.identity.getDidIdentifier(
              privateKey: privateKey,
              blockchain: blockchain,
              network: network);

          final BigInt nonce = selectedProfile == SelectedProfile.public
              ? GENESIS_PROFILE_NONCE
              : await NonceUtils(getIt()).getPrivateProfileNonce(
              did: did, privateKey: privateKey, from: iden3message.from);

          final config = EnvConfigEntity(ipfsNodeUrl: env.ipfsUrl,chainConfigs: env.chainConfigs,didMethods: []);

          final challenge = toLENumber(_auth.address);
          final proofs = await _polygonIdSdk.iden3comm.getProofs(message: iden3message, genesisDid: did, privateKey: privateKey, profileNonce: nonce,challenge: challenge, config: config);
          final proof = proofs[0];

          logger().i("[debugging-combined] -- Verification with proof $proof");

          final proxy = dotenv.env["PROXY_URL"];
          var url = Uri.parse('$proxy/api/forwardZKP');
          var response = await http.post(
            url,
            headers: {"Content-Type": "application/json"},
            body: jsonEncode({"proof": proof.toJson(), "id_token": _auth.id_token,"email":_auth.email}),
          );

          if (response.statusCode == 200) {
            logger().i('Success: ${response.body}');
            emit(const CombinedState.proofSent());
          } else {
            logger().i('Error: ${response.statusCode}');
            emit(const CombinedState.error("Couldn't send proof..."));
          }
          break;

        case Iden3MessageType.credentialOffer:
          logger().i("[debugging-combined] -- Claims: Checkpoint 1--");
          emit(CombinedState.qrCodeScanned(iden3message));
          break; // TODO web3 approach: put any claims we want in our wallet ?

        case Iden3MessageType.authRequest:
          logger().i("[debugging-combined] -- Auth: Checkpoint 1--");

          if (emit.isDone) return;

          emit(CombinedState.loaded(iden3message));

          String? privateKey =
          await SecureStorage.read(key: SecureStorageKeys.privateKey);

          if (privateKey == null) {
            emit(const CombinedState.error("no private key found"));
            return;
          }

          await _authenticate(
            iden3message: iden3message,
            privateKey: privateKey,
            emit: emit,
          );

          break;

        default:
          emit(const CombinedState.error("Iden3MessageType not auth.req nor cred.offer"));
      }
    } catch (error) {
      emit(CombinedState.error("Scanned code is not valid" + error.toString()));
    }
  }

  Future<void> _handleScanQrCodeResponse(
      ScanQrCodeResponse event, Emitter<CombinedState> emit) async {

    String? qrCodeResponse = event.response;
    if (qrCodeResponse == null || qrCodeResponse.isEmpty) {
      emit(const CombinedState.error("no qr code scanned"));
      return;
    }
   await  _handleIden3Message(qrCodeResponse,emit);
  }

  ///
  Future<void> _authenticate({
    required Iden3MessageEntity iden3message,
    required String privateKey,
    required Emitter<CombinedState> emit,
  }) async {
    emit(const CombinedState.loading());
    logger().i("[debugging-combined] -- Auth: Checkpoint 2--");


    EnvEntity env = await _polygonIdSdk.getEnv();
    final chainConfig = env.chainConfigs["80002"]!;
    final blockchain = chainConfig.blockchain;
    final network = chainConfig.network;
    String? did = await _polygonIdSdk.identity.getDidIdentifier(
        privateKey: privateKey,
        blockchain: blockchain,
        network: network);
    logger().i("[debugging-combined] -- Auth: Checkpoint 3--");

    try {
      final BigInt nonce = selectedProfile == SelectedProfile.public
          ? GENESIS_PROFILE_NONCE
          : await NonceUtils(getIt()).getPrivateProfileNonce(
              did: did, privateKey: privateKey, from: iden3message.from);

      logger().i("[debugging-combined] -- Auth: Checkpoint 4--");

      await _polygonIdSdk.iden3comm.authenticate(
        message: iden3message,
        genesisDid: did,
        privateKey: privateKey,
        profileNonce: nonce,
      );

      logger().i("[debugging-combined] -- Auth: Checkpoint 5--");

      emit(const CombinedState.authenticated());
      //http request => credential
    } catch (error) {
      logger().e("[debugging-combined] Auth: Error - ${error.toString()}");

      emit(CombinedState.error(error.toString()));
    }
  }

// Auth (above)
// Claims (below)

  ///
  Future<void> _fetchAndSaveClaims(
      FetchAndSaveClaimsEvent event, Emitter<CombinedState> emit) async {
    String? privateKey =
        await SecureStorage.read(key: SecureStorageKeys.privateKey);

    if (privateKey == null) {
      emit(const CombinedState.error("Private key not found"));
      return;
    }

    logger().i("[debugging-combined] --Checkpoint 4--");

    EnvEntity env = await _polygonIdSdk.getEnv();
    final chainConfig = env.chainConfigs["80002"]!;
    final blockchain = chainConfig.blockchain;
    final network = chainConfig.network;

    String didIdentifier = await _polygonIdSdk.identity.getDidIdentifier(
        privateKey: privateKey,
        blockchain: blockchain,
        network: network);

    logger().i("[debugging-combined] --Checkpoint 5--");

    emit(const CombinedState.loading());

    Iden3MessageEntity iden3message = event.iden3message;
    logger().i(iden3message.messageType);
    logger().i(iden3message.body);
    if (event.iden3message.messageType != Iden3MessageType.credentialOffer) {
      emit(const CombinedState.error("Read message is not of type offer"));
      return;
    }

    logger().i("[debugging-combined] --Checkpoint 6--");

    BigInt nonce = await NonceUtils(_polygonIdSdk).lookupNonce(
            did: didIdentifier,
            privateKey: privateKey,
            from: iden3message.from) ??
        GENESIS_PROFILE_NONCE;

    logger().i("[debugging-combined] --Checkpoint 7--");

    try {
      List<ClaimEntity> claimList =
          await _polygonIdSdk.iden3comm.fetchAndSaveClaims(
        message: event.iden3message as OfferIden3MessageEntity,
        genesisDid: didIdentifier,
        profileNonce: nonce,
        privateKey: privateKey,
      );

      logger().i("[debugging-combined] --Checkpoint 8--");

      if (claimList.isNotEmpty) {
        add(const GetClaimsEvent());
      }
    } catch (exception) {
      logger().e("[debugging-combined] Checkpoint: error - ${exception.toString()}");
      emit(const CombinedState.error(CustomStrings.iden3messageGenericError));
    }
  }

  ///
  Future<void> _getClaims(
      GetClaimsEvent event, Emitter<CombinedState> emit) async {
    emit(const CombinedState.loading());

    List<FilterEntity>? filters = event.filters;

    String? privateKey =
        await SecureStorage.read(key: SecureStorageKeys.privateKey);

    if (privateKey == null) {
      emit(const CombinedState.error("Private key not found"));
      return;
    }

    EnvEntity env = await _polygonIdSdk.getEnv();
    final chainConfig = env.chainConfigs["80002"]!;
    final blockchain = chainConfig.blockchain;
    final network = chainConfig.network;

    String did = await _polygonIdSdk.identity.getDidIdentifier(
      privateKey: privateKey,
      blockchain: blockchain,
      network: network,
    );

    if (did.isEmpty) {
      emit(const CombinedState.error(
          "without an identity is impossible to remove credential"));
      return;
    }

    try {
      List<ClaimEntity> claimList = await _polygonIdSdk.credential.getClaims(
        filters: filters,
        genesisDid: did,
        privateKey: privateKey,
      );

      final prefs = await SharedPreferences.getInstance();

      List<ClaimModel> claimModelList =
          claimList.map((claimEntity) => _mapper.mapFrom(claimEntity)).toList();

      emit(CombinedState.loadedClaims(claimModelList));
    } on GetClaimsException catch (_) {
      emit(const CombinedState.error("error while retrieving claims"));
    } catch (_) {
      emit(const CombinedState.error("generic error"));
    }
  }

  ///
  Future<void> _getClaimsByIds(
      GetClaimsByIdsEvent event, Emitter<CombinedState> emit) async {
    emit(const CombinedState.loading());

    List<String> ids = event.ids;

    String? privateKey =
        await SecureStorage.read(key: SecureStorageKeys.privateKey);

    if (privateKey == null) {
      emit(const CombinedState.error("Private key not found"));
      return;
    }

    EnvEntity env = await _polygonIdSdk.getEnv();
    final chainConfig = env.chainConfigs["80002"]!;
    final blockchain = chainConfig.blockchain;
    final network = chainConfig.network;

    String did = await _polygonIdSdk.identity.getDidIdentifier(
      privateKey: privateKey,
      blockchain: blockchain,
      network: network,
    );

    if (did.isEmpty) {
      emit(const CombinedState.error(
          "without an identity is impossible to remove credential"));
      return;
    }

    try {
      List<ClaimEntity> claimList =
          await _polygonIdSdk.credential.getClaimsByIds(
        claimIds: ids,
        genesisDid: did,
        privateKey: privateKey,
      );

      List<ClaimModel> claimModelList =
          claimList.map((claimEntity) => _mapper.mapFrom(claimEntity)).toList();
      emit(CombinedState.loadedClaims(claimModelList));
    } on GetClaimsException catch (_) {
      emit(const CombinedState.error("error while retrieving claims"));
    } catch (_) {
      emit(const CombinedState.error("generic error"));
    }
  }

  ///
  Future<void> _removeClaim(
      RemoveClaimEvent event, Emitter<CombinedState> emit) async {
    String id = event.id;

    String? privateKey =
        await SecureStorage.read(key: SecureStorageKeys.privateKey);

    if (privateKey == null) {
      emit(const CombinedState.error("Private key not found"));
      return;
    }

    EnvEntity env = await _polygonIdSdk.getEnv();
    final chainConfig = env.chainConfigs["80002"]!;
    final blockchain = chainConfig.blockchain;
    final network = chainConfig.network;

    String did = await _polygonIdSdk.identity.getDidIdentifier(
      privateKey: privateKey,
      blockchain: blockchain,
      network: network,
    );

    if (did.isEmpty) {
      emit(const CombinedState.error(
          "without an identity is impossible to remove credential"));
      return;
    }

    try {
      await _polygonIdSdk.credential.removeClaim(
        claimId: id,
        genesisDid: did,
        privateKey: privateKey,
      );
      add(const GetClaimsEvent());
    } on RemoveClaimsException catch (_) {
      emit(const CombinedState.error("error while removing credential"));
    } catch (_) {
      emit(const CombinedState.error("generic error"));
    }
  }

  ///
  Future<void> _removeClaims(
      RemoveClaimsEvent event, Emitter<CombinedState> emit) async {
    List<String> ids = event.ids;

    String? privateKey =
        await SecureStorage.read(key: SecureStorageKeys.privateKey);

    if (privateKey == null) {
      emit(const CombinedState.error("Private key not found"));
      return;
    }

    EnvEntity env = await _polygonIdSdk.getEnv();
    final chainConfig = env.chainConfigs["80002"]!;
    final blockchain = chainConfig.blockchain;
    final network = chainConfig.network;

    String did = await _polygonIdSdk.identity.getDidIdentifier(
      privateKey: privateKey,
      blockchain: blockchain,
      network: network,
    );

    if (did.isEmpty) {
      emit(const CombinedState.error(
          "without an identity is impossible to remove claims"));
      return;
    }
    try {
      await _polygonIdSdk.credential.removeClaims(
        claimIds: ids,
        genesisDid: did,
        privateKey: privateKey,
      );
      add(const GetClaimsEvent());
    } on RemoveClaimsException catch (_) {
      emit(const CombinedState.error("error while removing claims"));
    } catch (_) {
      emit(const CombinedState.error("generic error"));
    }
  }

  ///
  Future<void> _updateClaim(
      UpdateClaimEvent event, Emitter<CombinedState> emit) async {
    String id = event.id;
    String? issuer = event.issuer;
    String? did = event.did;
    ClaimState? state = event.state;
    String? expiration = event.expiration;
    String? type = event.type;
    Map<String, dynamic>? data = event.data;

    String? privateKey =
        await SecureStorage.read(key: SecureStorageKeys.privateKey);

    if (privateKey == null) {
      emit(const CombinedState.error("Private key not found"));
      return;
    }

    if (did == null || did.isEmpty) {
      emit(const CombinedState.error(
          "without an identity is impossible to update a credential"));
      return;
    }
    try {
      await _polygonIdSdk.credential.updateClaim(
        claimId: id,
        issuer: issuer,
        genesisDid: did,
        state: state,
        expiration: expiration,
        type: type,
        data: data,
        privateKey: privateKey,
      );

      add(const GetClaimsEvent());
    } on UpdateClaimException catch (_) {
      emit(const CombinedState.error("error while updating credential"));
    } catch (_) {
      emit(const CombinedState.error("generic error"));
    }
  }

  ///
  Future<void> _handleClickClaim(OnClickClaim event, Emitter<CombinedState> emit) async {
    emit(const CombinedState.loading());
    emit(CombinedState.navigateToClaimDetail(event.claimModel));
  }

  ///
  Future<void> _handleRemoveClaimResponse(
      OnClaimDetailRemoveResponse event, Emitter<CombinedState> emit) async {
    bool removed = event.removed ?? false;

    if (!removed) {
      return;
    }

    add(const GetClaimsEvent());
  }

  ///
  Future<void> _removeAllClaims(
      RemoveAllClaimsEvent event, Emitter<CombinedState> emit) async {
    emit(const CombinedState.loading());

    String? privateKey =
        await SecureStorage.read(key: SecureStorageKeys.privateKey);

    if (privateKey == null) {
      emit(const CombinedState.error("Private key not found"));
      return;
    }

    EnvEntity env = await _polygonIdSdk.getEnv();
    final chainConfig = env.chainConfigs["80002"]!;
    final blockchain = chainConfig.blockchain;
    final network = chainConfig.network;

    String did = await _polygonIdSdk.identity.getDidIdentifier(
      privateKey: privateKey,
      blockchain: blockchain,
      network: network,
    );

    if (did.isEmpty) {
      emit(const CombinedState.error(
          "without an identity is impossible to remove all claims"));
      return;
    }

    try {
      List<ClaimEntity> claimList = await _polygonIdSdk.credential.getClaims(
        genesisDid: did,
        privateKey: privateKey,
      );

      List<String> claimIds = claimList.map((claim) => claim.id).toList();
      await _polygonIdSdk.credential.removeClaims(
        claimIds: claimIds,
        genesisDid: did,
        privateKey: privateKey,
      );
      add(const GetClaimsEvent());
    } catch (_) {
      emit(const CombinedState.error("error while removing claims"));
    }
  }

  toLENumber(String address) {
    assert(address.length == 42, "Invalid address.");
    String bigEndianAddress = address.substring(2); // Remove '0x' prefix

    List<String> pairs = [];
    for (int i = 0; i < bigEndianAddress.length; i += 2) {
      pairs.add(bigEndianAddress.substring(i, i + 2));
    }

    pairs = pairs.reversed.toList(); // Reverse the order of pairs

    return BigInt.parse(pairs.join(), radix: 16).toString();
  }
}
