import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/filter_entity.dart';
import 'package:polygonid_flutter_sdk/credential/domain/entities/claim_entity.dart';
import 'package:polygonid_flutter_sdk/iden3comm/domain/entities/common/iden3_message_entity.dart';

import '../claims/models/claim_model.dart';
import '../../../../utils/custom_strings.dart';
import '../../../../utils/nonce_utils.dart';
import '../../../../utils/qr_code_parser_utils.dart';
import '../../../../utils/secure_storage_keys.dart';
import '../../../data/secure_storage.dart';
import '../../dependency_injection/dependencies_provider.dart';
import '../claims/mappers/claim_model_mapper.dart';
import '../common/widgets/profile_radio_button.dart';
import 'combined_event.dart';
import 'combined_state.dart';

part 'combined_event.freezed.dart';

@freezed
class CombinedEvent with _$CombinedEvent {

  // prev auth
  const factory CombinedEvent.profileSelected(SelectedProfile profile) =
  ProfileSelectedEvent;
  const factory CombinedEvent.clickScanQrCode() = ClickScanQrCodeEvent;
  const factory CombinedEvent.onScanQrCodeResponse(String? response) =
  ScanQrCodeResponse;

  // no QR code flow
  const factory CombinedEvent.clickTapButton() = ClickTapButtonEvent;

  // prev claims
  const factory CombinedEvent.fetchAndSaveClaims(
      {required Iden3MessageEntity iden3message}) = FetchAndSaveClaimsEvent;

  const factory CombinedEvent.getClaims({List<FilterEntity>? filters}) =
  GetClaimsEvent;

  const factory CombinedEvent.getClaimsByIds({required List<String> ids}) =
  GetClaimsByIdsEvent;

  const factory CombinedEvent.removeClaim({required String id}) =
  RemoveClaimEvent;

  const factory CombinedEvent.removeClaims({required List<String> ids}) =
  RemoveClaimsEvent;

  const factory CombinedEvent.removeAllClaims() = RemoveAllClaimsEvent;

  const factory CombinedEvent.updateClaim({
    required String id,
    String? issuer,
    String? did,
    ClaimState? state,
    String? expiration,
    String? type,
    Map<String, dynamic>? data,
  }) = UpdateClaimEvent;

  const factory CombinedEvent.onClickClaim(ClaimModel claimModel) = OnClickClaim;

  const factory CombinedEvent.onClaimDetailRemoveResponse(bool? removed) =
  OnClaimDetailRemoveResponse;

}
