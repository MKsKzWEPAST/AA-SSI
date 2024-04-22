import 'dart:convert';

import 'package:get_it/get_it.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/chain_config_entity.dart';
import 'package:polygonid_flutter_sdk/common/domain/entities/env_entity.dart';
import 'package:polygonid_flutter_sdk/iden3comm/data/mappers/iden3_message_type_mapper.dart';
import 'package:polygonid_flutter_sdk/sdk/polygon_id_sdk.dart';


import 'package:wallet_app/utils/qr_code_parser_utils.dart';
import 'package:wallet_app/src/presentation/ui/backup_identity/bloc/backup_identity_bloc.dart';
import 'package:wallet_app/src/presentation/ui/claim_detail/bloc/claim_detail_bloc.dart';
import 'package:wallet_app/src/presentation/ui/claims/mappers/claim_model_mapper.dart';
import 'package:wallet_app/src/presentation/ui/claims/mappers/claim_model_state_mapper.dart';
import 'package:wallet_app/src/presentation/ui/claims/mappers/proof_model_type_mapper.dart';
import 'package:wallet_app/src/presentation/ui/combined_authclaim/combined_bloc.dart';
import 'package:wallet_app/src/presentation/ui/home/home_bloc.dart';
import 'package:wallet_app/src/presentation/ui/restore_identity/bloc/restore_identity_bloc.dart';
import 'package:wallet_app/src/presentation/ui/splash/splash_bloc.dart';

final getIt = GetIt.instance;

/// Dependency Injection initializer
Future<void> init() async {
  registerEnv();
  await registerProviders();
  registerSplashDependencies();
  registerHomeDependencies();
  registerClaimDetailDependencies();
  registerCombinedDependencies();
  registerMappers();
  registerBackupIdentityDependencies();
  registerRestoreIdentityDependencies();
  registerUtilities();
}

void registerEnv() {
  Map<String, EnvEntity> env = {"amoy": EnvEntity(
    pushUrl: 'https://push-staging.polygonid.com/api/v1',
    ipfsUrl:
    "https://[YOUR-IPFS-API-KEY]:[YOUR-IPFS-API-KEY-SECRET]@ipfs.infura.io:5001",
    chainConfigs: {
      "80002": ChainConfigEntity(
        blockchain: 'polygon',
        network: 'amoy',
        rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/tZIEm32QWH6cinpYSA8Yo7u0m2ZqtF1i',
        stateContractAddr: '0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124',
      )
    },
    didMethods: [],
  )};

  /*{
    "mumbai": EnvEntity(
      blockchain: polygonMumbai['blockchain'],
      network: polygonMumbai['network'],
      web3Url: polygonMumbai['web3Url'],
      web3RdpUrl: polygonMumbai['web3RdpUrl'],
      web3ApiKey: polygonMumbai['web3ApiKey'],
      idStateContract: polygonMumbai['idStateContract'],
      pushUrl: polygonMumbai['pushUrl'],
      ipfsUrl: polygonMumbai['ipfsUrl'],
    ),
    "mainnet": EnvEntity(
      blockchain: polygonMainnet['blockchain'],
      network: polygonMainnet['network'],
      web3Url: polygonMainnet['web3Url'],
      web3RdpUrl: polygonMainnet['web3RdpUrl'],
      web3ApiKey: polygonMainnet['web3ApiKey'],
      idStateContract: polygonMainnet['idStateContract'],
      pushUrl: polygonMainnet['pushUrl'],
      ipfsUrl: polygonMainnet['ipfsUrl'],
    )
  };*/
  getIt.registerSingleton<Map<String, EnvEntity>>(env);
}

///
Future<void> registerProviders() async {
  await PolygonIdSdk.init(env: getIt<Map<String, EnvEntity>>()["amoy"]);
  getIt.registerLazySingleton<PolygonIdSdk>(() => PolygonIdSdk.I);
}

///
void registerSplashDependencies() {
  getIt.registerFactory(() => SplashBloc());
}

///
void registerHomeDependencies() {
  getIt.registerFactory(() => HomeBloc(getIt()));
}

///
void registerClaimDetailDependencies() {
  getIt.registerFactory(() => ClaimDetailBloc(getIt()));
}

///
void registerCombinedDependencies() {
  getIt.registerFactory(() => CombinedBloc(
        getIt(),
        getIt(),
        getIt(),
      ));
}

///
void registerMappers() {
  getIt.registerFactory(() => ClaimModelMapper(getIt(), getIt()));
  getIt.registerFactory(() => ClaimModelStateMapper());
  getIt.registerFactory(() => ProofModelTypeMapper());
  getIt.registerFactory(() => Iden3MessageTypeMapper());
}

///
void registerBackupIdentityDependencies() {
  getIt.registerFactory<BackupIdentityBloc>(() => BackupIdentityBloc(getIt()));
}

///
void registerRestoreIdentityDependencies() {
  getIt
      .registerFactory<RestoreIdentityBloc>(() => RestoreIdentityBloc(getIt()));
}

/// Register utilities
void registerUtilities() {
  getIt.registerLazySingleton<QrcodeParserUtils>(
      () => QrcodeParserUtils(getIt()));
}
