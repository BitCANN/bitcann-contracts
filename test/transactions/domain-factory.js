import {
  TransactionBuilder,
// } from 'cashscript';
} from '../../cashscript/packages/cashscript/dist/index.js';
import { binToHex } from '@bitauth/libauth';
import {
  registryContract,
  domainFactoryContract as authorizedContract,
  domainContract,
  getUtxos,
  domainFactoryLockingBytecodeHex as authorizedContractLockingBytecodeHex,
  domainCategory,
  provider,
  aliceTemplate,
  alicePkh,
  aliceAddress,
  aliceTokenAddress,
  name,
  nameBin
} from '../setup.js'
import { findPureUTXO } from '../utils.js'

const selectInputs = async () =>{
  const { userUTXOs, registryUTXOs, domainFactoryUTXOs } = await getUtxos()

  const userUTXO = findPureUTXO(userUTXOs)
  console.log('INFO: userUTXO', userUTXO)

  // Utxo from registry contract that has authorizedContract's lockingbytecode in the nftCommitment
  const threadNFTUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.commitment === authorizedContractLockingBytecodeHex &&
    utxo.token?.nft?.capability === 'none' &&
    utxo.token?.category === domainCategory
  );

  console.log('INFO: threadNFTUTXO', threadNFTUTXO)
  console.log('INFO: registryUTXOs', registryUTXOs)

  // // Registration NFT UTXO from registry contract
  const runningAuctionUTXOs = registryUTXOs.filter(utxo => 
    utxo.token?.nft?.capability === 'mutable' &&
    utxo.token?.category === domainCategory &&
    utxo.token?.amount > 0
  );

  console.log('INFO: runningAuctionUTXOs', runningAuctionUTXOs)

  // Find auction UTXO with matching name in commitment
  const auctionUTXO = runningAuctionUTXOs.find(utxo => {
    const nftCommitment = utxo.token.nft.commitment;
    const nameHex = nftCommitment.slice(40, nftCommitment.length);
    const nameString = Buffer.from(nameHex, 'hex').toString()
    return nameString === name;
  });

  const domainMintingUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.capability === 'minting' &&
    utxo.token?.category === domainCategory &&
    !utxo.token?.nft?.commitment &&
    utxo.token?.amount === BigInt(0)
  );

  console.log('INFO: domainMintingUTXO', domainMintingUTXO);
  console.log('INFO: auctionUTXO', auctionUTXO);

  // console.log('INFO: domainFactoryUTXOs', domainFactoryUTXOs)
    // The necessary UTXO to be used from the auction contract
  const authorizedContractUTXO = domainFactoryUTXOs[domainFactoryUTXOs.length-1]
  
  if(!authorizedContractUTXO) throw new Error('Could not find authorized contract UTXO');
  if (!auctionUTXO) throw new Error('Could not find auction UTXO with matching name');
  if (!threadNFTUTXO) throw new Error('Could not find threadNFT with matching commitment');

  console.log('INFO: authorizedContractUTXO', authorizedContractUTXO)

  return {
    userUTXO,
    threadNFTUTXO,
    auctionUTXO,
    domainMintingUTXO,
    authorizedContractUTXO: domainFactoryUTXOs[0],
  }
}


export const  main = async () => {
  const blockHeight = await provider.getBlockHeight()
  console.log('INFO: blockHeight', blockHeight)
  const { userUTXO, threadNFTUTXO, domainMintingUTXO, authorizedContractUTXO, auctionUTXO } = await selectInputs()

  const auctionAmount = auctionUTXO.satoshis
  // const minerFee = BigInt(2000)
  // const change = userUTXO.satoshis - auctionAmount - minerFee
  const platformFee = BigInt(Math.floor(Number(auctionAmount)/2))

  const registrationId = auctionUTXO.token.amount.toString(16).padStart(16, '0')

  const transaction = await new TransactionBuilder({ provider })
  .addInput(threadNFTUTXO, registryContract.unlock.call(), { sequence: 0 })
  .addInput(authorizedContractUTXO, authorizedContract.unlock.call(), { sequence: 0 })
  .addInput(domainMintingUTXO, registryContract.unlock.call(), { sequence: 0 })
  .addInput(auctionUTXO, registryContract.unlock.call(), { sequence: 1 })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: threadNFTUTXO.satoshis,
    token: {
      category: threadNFTUTXO.token.category,
      amount: threadNFTUTXO.token.amount + auctionUTXO.token.amount,
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
    amount: domainMintingUTXO.satoshis,
    token: {
      category: domainMintingUTXO.token.category,
      amount: domainMintingUTXO.token.amount,
      nft: {
        capability: domainMintingUTXO.token.nft.capability,
        commitment: domainMintingUTXO.token.nft.commitment
      }
    }
  })
  .addOutput({
    to: domainContract.tokenAddress,
    amount: BigInt(1000),
    token: {
      category: domainMintingUTXO.token.category,
      amount: BigInt(0),
      nft: {
        capability: 'none',
        commitment: ""
      }
    }
  })
  .addOutput({
    to: domainContract.tokenAddress,
    amount: BigInt(1000),
    token: {
      category: domainMintingUTXO.token.category,
      amount: BigInt(0),
      nft: {
        capability: 'none',
        commitment: registrationId
      }
    }
  })
  .addOutput({
    to: aliceTokenAddress,
    amount: BigInt(1000),
    token: {
      category: domainMintingUTXO.token.category,
      amount: BigInt(0),
      nft: {
        capability: 'none',
        commitment: registrationId + binToHex(nameBin)
      }
    }
  })
  .addOutput({
    to: aliceAddress,
    amount: platformFee,
  })
  .send();

  console.log('INFO: transaction', transaction)
}
