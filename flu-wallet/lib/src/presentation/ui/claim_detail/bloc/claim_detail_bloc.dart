import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/env_entity.dart';
import 'package:polygonid_flutter_sdk/sdk/polygon_id_sdk.dart';

import 'package:minimal_example/utils/custom_strings.dart';
import 'package:minimal_example/utils/secure_storage_keys.dart';
import 'package:minimal_example/src/data/secure_storage.dart';
import 'claim_detail_event.dart';
import 'claim_detail_state.dart';


class ClaimDetailBloc extends Bloc<ClaimDetailEvent, ClaimDetailState> {
  final PolygonIdSdk _polygonIdSdk;

  ClaimDetailBloc(this._polygonIdSdk)
      : super(const ClaimDetailState.initial()) {
    on<DeleteClaimEvent>(_deleteClaimEvent);
    on<RefreshClaimEvent>(_refreshClaimEvent);
  }

  ///
  Future<void> _deleteClaimEvent(
    DeleteClaimEvent event,
    Emitter<ClaimDetailState> emit,
  ) async {
    emit(const ClaimDetailState.loading());

    try {
      String? privateKey =
          await SecureStorage.read(key: SecureStorageKeys.privateKey);

      if (privateKey == null) {
        emit(const ClaimDetailState.error("no private key found"));
        return;
      }

      EnvEntity env = await _polygonIdSdk.getEnv();
      final chainConfig = env.chainConfigs["80002"]!;
      final blockchain = chainConfig.blockchain;
      final network = chainConfig.network;

      String? did = await _polygonIdSdk.identity.getDidIdentifier(
          privateKey: privateKey,
          blockchain: blockchain,
          network: network
      );

      await _polygonIdSdk.credential.removeClaims(
        claimIds: [event.claimId],
        genesisDid: did,
        privateKey: privateKey,
      );

      emit(const ClaimDetailState.claimDeleted());
    } catch (_) {
      emit(const ClaimDetailState.error(CustomStrings.claimRemovingError));
    }
  }

  Future<void> _refreshClaimEvent(
      RefreshClaimEvent event, Emitter<ClaimDetailState> emit) async {}
}
