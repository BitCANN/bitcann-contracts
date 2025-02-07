import {
  TransactionBuilder,
// } from 'cashscript';
} from '../cashscript/packages/cashscript/dist/index.js';
import {
  hexToBin,
  binToHex,
  lockingBytecodeToCashAddress
} from '@bitauth/libauth';

import {
  registryContract,
  bidContract,
  getUtxos,
  bidLockingBytecodeHex,
  domainCategory,
  provider,
  aliceTemplate,
  alicePkh,
  aliceAddress,
  nameBin
} from './setup.js'


const selectBidInputs = async () => {
  const { userUTXOs, registryUTXOs, bidUTXOs } = await getUtxos()

  const userUTXO = userUTXOs.find(utxo => !utxo.token && utxo.satoshis > 4000);
  if (!userUTXO) throw new Error('Could not find user UTXO without token');

  console.log('INFO: userUTXO', userUTXO)

  // Utxo from registry contract that has bidContract's lockingbytecode in the nftCommitment
  const threadNFTUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.commitment === bidLockingBytecodeHex &&
    utxo.token?.nft?.capability === 'none' &&
    utxo.token?.category === domainCategory
  );

  console.log('INFO: threadNFTUTXO', threadNFTUTXO)
  console.log('INFO: registryUTXOs', registryUTXOs)

  // // Registration NFT UTXO from registry contract
  const runningAuctionUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.capability === 'mutable' &&
    utxo.token?.category === domainCategory &&
    utxo.token?.amount > 0
  );


  console.log('INFO: runningAuctionUTXO', runningAuctionUTXO)

  const nftCommitment = runningAuctionUTXO.token.nft.commitment
  const pkhHex = nftCommitment.slice(0, 40)
  const nameHex = nftCommitment.slice(40, nftCommitment.length)

  console.log('INFO: pkhHex', pkhHex)

  const bidderLockingBytecode = '76a914' + pkhHex + '88ac'
  console.log('INFO: bidderLockingBytecode', bidderLockingBytecode)
  const bidderAddress = lockingBytecodeToCashAddress({ prefix: 'bitcoincash', bytecode: hexToBin(bidderLockingBytecode) }).address
  console.log('INFO: bidderAddress', bidderAddress)

  const name = Buffer.from(nameHex, 'hex').toString()
  console.log('INFO: name', name)

  // The necessary UTXO to be used from the auction contract
  const bidContractUTXO = bidUTXOs[0]

  console.log('INFO: bidContractUTXO', bidContractUTXO)

  if(!bidContractUTXO) throw new Error('Could not find bid contract UTXO');
  if (!threadNFTUTXO) throw new Error('Could not find auctionThreadNFT with matching commitment');
  if (!runningAuctionUTXO) throw new Error('Could not find counter UTXO with mutable capability');

  return {
    userUTXO,
    bidContractUTXO,
    threadNFTUTXO,
    runningAuctionUTXO
  }
}

export const bid = async () => {
  const { userUTXO, bidContractUTXO, threadNFTUTXO, runningAuctionUTXO } = await selectBidInputs()

  const transaction = await new TransactionBuilder({ provider })
  .addInput(threadNFTUTXO, registryContract.unlock.call())
  .addInput(bidContractUTXO, bidContract.unlock.call())
  .addInput(runningAuctionUTXO, registryContract.unlock.call())
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
    to: bidContract.tokenAddress,
    amount: runningAuctionUTXO.satoshis
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: BigInt(Math.ceil(Number(runningAuctionUTXO.satoshis) * 1.05)),
    token: {
      category: runningAuctionUTXO.token.category,
      amount: BigInt(1),
      nft: {
        capability: 'mutable',
        commitment: binToHex(alicePkh) + binToHex(nameBin)
      }
    }
  })
  .addOutput({
    to: aliceAddress,
    amount: runningAuctionUTXO.satoshis,
  })
  .addOutput({
    to: aliceAddress,
    amount: userUTXO.satoshis - BigInt(3300),
  })
  .build();

  console.log('INFO: transaction', transaction)
}
