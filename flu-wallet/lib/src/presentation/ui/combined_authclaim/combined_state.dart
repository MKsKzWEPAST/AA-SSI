import 'package:freezed_annotation/freezed_annotation.dart';
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


part 'combined_state.freezed.dart';

@freezed
class CombinedState with _$CombinedState {
  const factory CombinedState.initial() = InitCombinedState;

  const factory CombinedState.loading() = LoadingCombinedState;

  const factory CombinedState.profileSelected(SelectedProfile profile) =
  ProfileSelectedCombinedState;

  //qrcode
  const factory CombinedState.navigateToQrCodeScanner() =
  NavigateToQrCodeScannerCombinedState;

  const factory CombinedState.qrCodeScanned(Iden3MessageEntity iden3message) =
  QrCodeScannedCombinedState;

  const factory CombinedState.loaded(Iden3MessageEntity iden3message) =
  LoadedCombinedState;

  const factory CombinedState.error(String message) = ErrorCombinedState;

  const factory CombinedState.authenticated() = AuthenticatedCombinedState;

  const factory CombinedState.proofSent() = ProofSentCombinedState;

  const factory CombinedState.loadedClaims(List<ClaimModel> claimList) =
  LoadedDataCombinedState;

  const factory CombinedState.navigateToClaimDetail(ClaimModel claimModel) =
  NavigateToClaimDetailCombinedState;
}
