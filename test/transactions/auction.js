import {
  TransactionBuilder,
// } from 'cashscript';
} from '../../cashscript/packages/cashscript/dist/index.js';
import { binToHex } from '@bitauth/libauth';
import {
  registryContract,
  auctionContract as authorizedContract,
  getUtxos,
  auctionLockingBytecodeHex as authorizedContractLockingBytecodeHex,
  domainCategory,
  provider,
  aliceTemplate,
  alicePkh,
  aliceAddress,
  name,
  nameBin
} from '../setup.js'
import { findPureUTXO } from '../utils.js'

const selectInputs = async () =>{
  const { userUTXOs, registryUTXOs, auctionUTXOs } = await getUtxos()

  const userUTXO = findPureUTXO(userUTXOs)
  console.log('INFO: userUTXO', userUTXO)

  // The necessary UTXO to be used from the auction contract
  const authorizedContractUTXO = auctionUTXOs[0]

  console.log('INFO: authorizedContractUTXO', authorizedContractUTXO)
  if(!authorizedContractUTXO) throw new Error('Could not find authorized contract UTXO');

  // Utxo from registry contract that has authorizedContract's lockingbytecode in the nftCommitment
  const threadNFTUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.commitment === authorizedContractLockingBytecodeHex &&
    utxo.token?.nft?.capability === 'none' &&
    utxo.token?.category === domainCategory
  );

  console.log('INFO: threadNFTUTXO', threadNFTUTXO)
  console.log('INFO: registryUTXOs', registryUTXOs)

  // // Registration NFT UTXO from registry contract
  const registrationCounterUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.capability === 'minting' &&
    utxo.token?.category === domainCategory &&
    utxo.token?.nft?.commitment &&
    utxo.token?.amount > 0
  );

  console.log('INFO: registrationCounterUTXO', registrationCounterUTXO)

  if (!threadNFTUTXO) throw new Error('Could not find threadNFT with matching commitment');
  if (!registrationCounterUTXO) throw new Error('Could not find counter UTXO with minting capability');

  return {
    userUTXO,
    threadNFTUTXO,
    registrationCounterUTXO,
    authorizedContractUTXO,
  }
}


export const main = async () => {
  const { userUTXO, threadNFTUTXO, registrationCounterUTXO, authorizedContractUTXO } = await selectInputs()

  const newRegistrationId = parseInt(registrationCounterUTXO.token.nft.commitment, 16) + 1
  const newRegistrationIdCommitment = newRegistrationId.toString(16).padStart(16, '0')

  const auctionAmount = BigInt(10000)
  const minerFee = BigInt(1500)
  const change = userUTXO.satoshis - auctionAmount - minerFee

  const transaction = await new TransactionBuilder({ provider })
  .addInput(threadNFTUTXO, registryContract.unlock.call())
  .addInput(authorizedContractUTXO, authorizedContract.unlock.call(nameBin))
  .addInput(registrationCounterUTXO, registryContract.unlock.call())
  .addInput(userUTXO, aliceTemplate.unlockP2PKH())
  .addOutput({
    to: registryContract.tokenAddress,
    amount: threadNFTUTXO.satoshis,
    token: {
      category: threadNFTUTXO.token.category,
      amount: threadNFTUTXO.token.amount,
      nft: {
        capability: threadNFTUTXO.token.nft.capability,
        commitment: threadNFTUTXO.token.nft.commitment
      }
    }
  })
  .addOutput({
    to: authorizedContract.tokenAddress,
    amount: authorizedContractUTXO.satoshis
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: registrationCounterUTXO.satoshis,
    token: {
      category: registrationCounterUTXO.token.category,
      amount: registrationCounterUTXO.token.amount  - BigInt(newRegistrationId),
      nft: {
        capability: registrationCounterUTXO.token.nft.capability,
        commitment: newRegistrationIdCommitment
      }
    }
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: auctionAmount,
    token: {
      category: registrationCounterUTXO.token.category,
      amount: BigInt(newRegistrationId),
      nft: {
        capability: 'mutable',
        commitment: binToHex(alicePkh) + binToHex(nameBin)
      }
    }
  })
  .addOpReturnOutput([name])
  .addOutput({
    to: aliceAddress,
    amount: change,
  })
  .send();

  console.log('INFO: transaction', transaction)
}
