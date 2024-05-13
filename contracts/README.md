# Contracts Directory 

This directory contains various Ethereum smart contracts along with deployment scripts for ease of deployment.
Below is a brief overview of each subdirectory:

- **erc20**: Contains ERC20 token contracts for DAI and TUSD stable coins.

- **smart_money**: Holds the smart money contract.

- **verifier**: Holds the verifier contract, which implements the polygon ID framework.

- **scripts**: contains a deployment script (deploy_contracts) and a script for updating the query for age verification (deploy_zkp)


Feel free to explore each subdirectory for detailed contract implementations, deployment instructions, and scripts.

## Notes

* All the contracts are currently deployed, and ready to use


* The need for deploying the proof for age verification on a daily basis is due to the fact that the proof query contains 
the minimum date for which an individual is 18 years old. Thus, this date is changing every day.


