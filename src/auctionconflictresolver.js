import {
  TransactionBuilder,
// } from 'cashscript';
} from '../cashscript/packages/cashscript/dist/index.js';
import { binToHex } from '@bitauth/libauth';
import {
  registryContract,
  auctionConflictResolverContract,
  getUtxos,
  auctionLockingBytecodeHex,
  domainCategory,
  provider,
  aliceAddress,
} from './setup.js'


const selectInputs = async () =>{
  const { userUTXOs, registryUTXOs, auctionConflictResolverUTXOs } = await getUtxos()

  const userUTXO = userUTXOs.find(utxo => !utxo.token && utxo.satoshis > 4000);
  if (!userUTXO) throw new Error('Could not find user UTXO without token');

  console.log('INFO: userUTXO', userUTXO)

  // Utxo from registry contract that has auctionContract's lockingbytecode in the nftCommitment
  const threadNFTUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.commitment === auctionLockingBytecodeHex &&
    utxo.token?.nft?.capability === 'none' &&
    utxo.token?.category === domainCategory
  );

  console.log('INFO: threadNFTUTXO', threadNFTUTXO)
  console.log('INFO: registryUTXOs', registryUTXOs)

  // Find all auction UTXOs from registry contract
  const auctionUTXOs = registryUTXOs.filter(utxo => 
    utxo.token?.nft?.capability === 'mutable' &&
    utxo.token?.category === domainCategory &&
    utxo.token?.nft?.commitment &&
    utxo.token?.amount > 0
  );

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

  if (!threadNFTUTXO) throw new Error('Could not find auctionThreadNFT with matching commitment');

  return {
    userUTXO,
    threadNFTUTXO,
    auctionUTXOValid,
    auctionUTXOInvalid,
    auctionConflictResolverUTXO: auctionConflictResolverUTXOs[0]
  }
}

export const auctionConflictResolver = async () => {
  const { threadNFTUTXO, auctionUTXOValid, auctionUTXOInvalid, auctionConflictResolverUTXO } = await selectInputs()

  const transaction = await new TransactionBuilder({ provider })
  .addInput(threadNFTUTXO, registryContract.unlock.call())
  .addInput(auctionConflictResolverUTXO, auctionConflictResolverContract.unlock.call())
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
    to: auctionConflictResolverContract.tokenAddress,
    amount: auctionConflictResolverUTXO.satoshis
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
    amount: auctionUTXOValid.satoshis - BigInt(3300),
  })
  .send();

  console.log('INFO: transaction', transaction)
}
