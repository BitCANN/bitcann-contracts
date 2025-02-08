import {
  TransactionBuilder,
// } from 'cashscript';
} from '../cashscript/packages/cashscript/dist/index.js';
import { binToHex } from '@bitauth/libauth';
import {
  registryContract,
  auctionContract,
  getUtxos,
  auctionLockingBytecodeHex,
  domainCategory,
  provider,
  aliceTemplate,
  alicePkh,
  aliceAddress,
  name,
  nameBin
} from './setup.js'


const selectAuctionInputs = async () =>{
  const { userUTXOs, registryUTXOs, auctionUTXOs } = await getUtxos()

  const userUTXO = userUTXOs.reduce((max, utxo) => 
    (!utxo.token && utxo.satoshis > (max?.satoshis || 0)) ? utxo : max, 
    null
  );
  if (!userUTXO) throw new Error('Could not find user UTXO without token');

  console.log('INFO: userUTXO', userUTXO)

  // The necessary UTXO to be used from the auction contract
  const auctionContractUTXO = auctionUTXOs[0]

  console.log('INFO: auctionContractUTXO', auctionContractUTXO)
  if(!auctionContractUTXO) throw new Error('Could not find auction contract UTXO');

  // Utxo from registry contract that has auctionContract's lockingbytecode in the nftCommitment
  const threadNFTUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.commitment === auctionLockingBytecodeHex &&
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

  if (!threadNFTUTXO) throw new Error('Could not find auctionThreadNFT with matching commitment');
  if (!registrationCounterUTXO) throw new Error('Could not find counter UTXO with minting capability');

  return {
    userUTXO,
    auctionContractUTXO,
    threadNFTUTXO,
    registrationCounterUTXO
  }
}


export const auction = async () => {
  const { userUTXO, auctionContractUTXO, threadNFTUTXO, registrationCounterUTXO } = await selectAuctionInputs()

  const newRegistrationId = parseInt(registrationCounterUTXO.token.nft.commitment, 16) + 1
  const newRegistrationIdCommitment = newRegistrationId.toString(16).padStart(16, '0')

  const auctionAmount = BigInt(5000)
  const minerFee = BigInt(2000)
  const change = userUTXO.satoshis - auctionAmount - minerFee

  const transaction = await new TransactionBuilder({ provider })
  .addInput(threadNFTUTXO, registryContract.unlock.call())
  .addInput(auctionContractUTXO, auctionContract.unlock.call(nameBin))
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
    to: auctionContract.tokenAddress,
    amount: auctionContractUTXO.satoshis
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
