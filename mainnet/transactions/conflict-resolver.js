import {
  TransactionBuilder,
} from 'cashscript';
import {
  registryContract,
  auctionConflictResolverContract as authorizedContract,
  getUtxos,
  auctionConflictResolverLockingBytecodeHex as authorizedContractLockingBytecodeHex,
  domainCategory,
  provider,
  aliceAddress,
} from '../setup.js'
import { findPureUTXO } from '../utils.js'

const selectInputs = async () =>{
  const { userUTXOs, registryUTXOs, auctionConflictResolverUTXOs } = await getUtxos()

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

  // Find all auction UTXOs from registry contract, sorted by satoshi value
  const auctionUTXOs = registryUTXOs.filter(utxo => 
    utxo.token?.nft?.capability === 'mutable' &&
    utxo.token?.category === domainCategory &&
    utxo.token?.nft?.commitment &&
    utxo.token?.amount > 0
  ).sort((a, b) => Number(b.satoshis) - Number(a.satoshis));

  // Find two auction UTXOs with the same name in their commitment
  let auctionUTXOValid, auctionUTXOInvalid;
  
  for (let i = 0; i < auctionUTXOs.length; i++) {
    for (let j = i + 1; j < auctionUTXOs.length; j++) {
      const name1 = auctionUTXOs[i].token.nft.commitment.slice(40);
      const name2 = auctionUTXOs[j].token.nft.commitment.slice(40);
      
      if (name1 === name2) {
        // Compare token amounts and assign valid/invalid accordingly
        const amount1 = Number(auctionUTXOs[i].token.amount);
        const amount2 = Number(auctionUTXOs[j].token.amount);
        
        if (amount1 < amount2) {
          auctionUTXOValid = auctionUTXOs[i];
          auctionUTXOInvalid = auctionUTXOs[j];
        } else {
          auctionUTXOValid = auctionUTXOs[j];
          auctionUTXOInvalid = auctionUTXOs[i];
        }
        break;
      }
    }
    if (auctionUTXOValid) break;
  }

  if (!auctionUTXOValid || !auctionUTXOInvalid) {
    throw new Error('Could not find two auction UTXOs with the same name');
  }

  console.log('INFO: auctionUTXOValid', auctionUTXOValid)
  console.log('INFO: auctionUTXOInvalid', auctionUTXOInvalid)

  if (!threadNFTUTXO) throw new Error('Could not find threadNFT with matching commitment');

  return {
    userUTXO,
    threadNFTUTXO,
    auctionUTXOValid,
    auctionUTXOInvalid,
    authorizedContractUTXO: auctionConflictResolverUTXOs[0]
  }
}

export const main = async () => {
  const { threadNFTUTXO, auctionUTXOValid, auctionUTXOInvalid, authorizedContractUTXO } = await selectInputs()

  const minerFee = BigInt(3000)

  const transaction = await new TransactionBuilder({ provider })
  .addInput(threadNFTUTXO, registryContract.unlock.call())
  .addInput(authorizedContractUTXO, authorizedContract.unlock.call())
  .addInput(auctionUTXOValid, registryContract.unlock.call())
  .addInput(auctionUTXOInvalid, registryContract.unlock.call())
  .addOutput({
    to: registryContract.tokenAddress,
    amount: threadNFTUTXO.satoshis,
    token: {
      category: threadNFTUTXO.token.category,
      amount: threadNFTUTXO.token.amount + auctionUTXOInvalid.token.amount,
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
    amount: auctionUTXOValid.satoshis,
    token: {
      category: auctionUTXOValid.token.category,
      amount: auctionUTXOValid.token.amount,
      nft: {
        capability: auctionUTXOValid.token.nft.capability,
        commitment: auctionUTXOValid.token.nft.commitment
      }
    }
  })
  .addOutput({
    to: aliceAddress,
    amount: auctionUTXOInvalid.satoshis - minerFee,
  })
  .build();

  console.log('INFO: transaction', transaction)
}
