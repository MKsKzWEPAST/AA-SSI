import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:polygonid_flutter_sdk/common/domain/domain_logger.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/env_entity.dart';
import 'package:polygonid_flutter_sdk/identity/domain/entities/private_identity_entity.dart';
import 'package:polygonid_flutter_sdk/identity/domain/exceptions/identity_exceptions.dart';
import 'package:polygonid_flutter_sdk/sdk/polygon_id_sdk.dart';
import 'package:wallet_app/src/data/secure_storage.dart';
import 'package:wallet_app/src/presentation/ui/home/home_event.dart';
import 'package:wallet_app/src/presentation/ui/home/home_state.dart';
import 'package:wallet_app/utils/custom_strings.dart';
import 'package:wallet_app/utils/secure_storage_keys.dart';

class HomeBloc extends Bloc<HomeEvent, HomeState> {
  final PolygonIdSdk _polygonIdSdk;

  HomeBloc(this._polygonIdSdk) : super(const HomeState.initial()) {
    on<CreateIdentityHomeEvent>(_createIdentity);
    on<GetIdentifierHomeEvent>(_getIdentifier);
    on<RemoveIdentityHomeEvent>(_removeIdentity);
  }

  ///
  Future<void> _getIdentifier(
      GetIdentifierHomeEvent event, Emitter<HomeState> emit) async {
    emit(const HomeState.loading());

    String? privateKey =
        await SecureStorage.read(key: SecureStorageKeys.privateKey);

    if (privateKey == null) {
      emit(const HomeState.error(message: "no private key found"));
      return;
    }

    EnvEntity env = await _polygonIdSdk.getEnv();
    final chainConfig = env.chainConfigs["80002"]!;
    final blockchain = chainConfig.blockchain;
    final network = chainConfig.network;

    String? identifier = await _polygonIdSdk.identity.getDidIdentifier(
        privateKey: privateKey, blockchain: blockchain, network: network);
    emit(HomeState.loaded(identifier: identifier));
  }

  ///
  Future<void> _createIdentity(
      CreateIdentityHomeEvent event, Emitter<HomeState> emit) async {
    emit(const HomeState.loading());

    try {
      String? privateKey =
          await SecureStorage.read(key: SecureStorageKeys.privateKey);
      if (privateKey != null) {
        EnvEntity env = await _polygonIdSdk.getEnv();
        final chainConfig = env.chainConfigs["80002"]!;
        final blockchain = chainConfig.blockchain;
        final network = chainConfig.network;

        String? identifier = await _polygonIdSdk.identity.getDidIdentifier(
            privateKey: privateKey, blockchain: blockchain, network: network);
        emit(HomeState.loaded(identifier: identifier));
        return;
      }
      PrivateIdentityEntity identity =
          await _polygonIdSdk.identity.addIdentity();
      logger().i("identity: ${identity.privateKey}");
      await SecureStorage.write(
          key: SecureStorageKeys.privateKey, value: identity.privateKey);
      emit(HomeState.loaded(identifier: identity.did));
    } on IdentityException catch (identityException) {
      emit(HomeState.error(message: identityException.error));
    } catch (_) {
      emit(const HomeState.error(message: CustomStrings.genericError));
    }
  }

  ///
  Future<void> _removeIdentity(
      RemoveIdentityHomeEvent event, Emitter<HomeState> emit) async {
    emit(const HomeState.loading());

    String? privateKey =
        await SecureStorage.read(key: SecureStorageKeys.privateKey);

    if (privateKey == null) {
      emit(const HomeState.error(message: "no private key found"));
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

    try {
      await _polygonIdSdk.identity
          .removeIdentity(genesisDid: did, privateKey: privateKey);
      await SecureStorage.delete(key: SecureStorageKeys.privateKey);
      emit(const HomeState.loaded());
    } on IdentityException catch (identityException) {
      emit(HomeState.error(message: identityException.error));
    } catch (_) {
      emit(const HomeState.error(message: CustomStrings.genericError));
    }
  }
}
