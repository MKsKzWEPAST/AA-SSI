import 'package:flutter/material.dart';
import 'package:http/http.dart';
import 'package:web3dart/web3dart.dart';
import 'package:flutter/services.dart' show rootBundle;

class EthereumService {
  static final String rpcUrl = 'https://matic-mumbai.chainstacklabs.com';  // Update with actual RPC URL
  final Web3Client client;

  EthereumService() : client = Web3Client(rpcUrl, Client());

  Future<String> getBalance(EthereumAddress address) async {
    EtherAmount balance = await client.getBalance(address);
    return balance.getValueInUnit(EtherUnit.ether).toString();
  }

  Future<String> getUSDCBalance(EthereumAddress address, EthereumAddress daiContractAddress) async {
    final String daiAbi = await rootBundle.loadString('assets/abi/usdc_api');
    final DeployedContract daiContract = DeployedContract(ContractAbi.fromJson(daiAbi, 'DAI'), daiContractAddress);

    List<dynamic> result = await client.call(
      contract: daiContract,
      function: daiContract.function('balanceOf'),
      params: [address],
    );

    return result[0].toString();
  }
}
