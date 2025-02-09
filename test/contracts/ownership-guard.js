import {
  TransactionBuilder,
// } from 'cashscript';
} from '../../cashscript/packages/cashscript/dist/index.js';
import {
  registryContract,
  domainContract,
  domainOwnershipGuardContract as authorizedContract,
  getUtxos,
  domainOwnershipGuardLockingBytecodeHex as authorizedContractLockingBytecodeHex,
  domainCategory,
  provider,
  aliceAddress,
  name
} from '../setup.js'


const selectInputs = async () =>{
  const { registryUTXOs, domainOwnershipGuardUTXOs, domainUTXOs } = await getUtxos()

  // Utxo from registry contract that has domainOwnershipGuard's lockingbytecode in the nftCommitment
  const threadNFTUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.commitment === authorizedContractLockingBytecodeHex &&
    utxo.token?.nft?.capability === 'none' &&
    utxo.token?.category === domainCategory
  );

  console.log('INFO: threadNFTUTXO', threadNFTUTXO)
  console.log('INFO: registryUTXOs', registryUTXOs)

  // Find all auction UTXOs from registry contract, sorted by satoshi value
  const runningAuctionUTXO = registryUTXOs.find(utxo => {
    const nftCommitment = utxo.token?.nft?.commitment;
    const nameHex = nftCommitment?.slice(40, nftCommitment.length);
    const nameFromCommitment = Buffer.from(nameHex, 'hex').toString();
    return utxo.token?.nft?.capability === 'mutable' &&
      utxo.token?.category === domainCategory &&
      nameFromCommitment === name &&
      utxo.token?.amount > 0;
  });

  
  const externalAuthUTXO = domainUTXOs.find(utxo => 
    utxo.token?.category === domainCategory &&
    !utxo.token?.nft?.commitment &&
    utxo.token?.nft?.capability === 'none'
  );

  if (!threadNFTUTXO) throw new Error('Could not find threadNFT with matching commitment');
  if (!externalAuthUTXO) throw new Error('Could not find externalAuth NFT');
  if (!runningAuctionUTXO) throw new Error('Could not find running auction UTXO');

  return {
    runningAuctionUTXO,
    threadNFTUTXO,
    externalAuthUTXO,
    authorizedContractUTXO: domainOwnershipGuardUTXOs[0]
  }
}

export const main = async () => {
  const { runningAuctionUTXO, threadNFTUTXO, externalAuthUTXO, authorizedContractUTXO } = await selectInputs()

  const minerFee = BigInt(3000)

  const transaction = await new TransactionBuilder({ provider })
  .addInput(threadNFTUTXO, registryContract.unlock.call())
  .addInput(authorizedContractUTXO, authorizedContract.unlock.call())
  .addInput(externalAuthUTXO, domainContract.unlock.externalUse())
  .addInput(runningAuctionUTXO, registryContract.unlock.call())
  .addOutput({
    to: registryContract.tokenAddress,
    amount: threadNFTUTXO.satoshis,
    token: {
      category: threadNFTUTXO.token.category,
      amount: threadNFTUTXO.token.amount + runningAuctionUTXO.token.amount,
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
    to: domainContract.tokenAddress,
    amount: externalAuthUTXO.satoshis,
    token: {
      category: externalAuthUTXO.token.category,
      amount: externalAuthUTXO.token.amount,
      nft: {
        capability: externalAuthUTXO.token.nft.capability,
        commitment: externalAuthUTXO.token.nft.commitment
      }
    }
  })
  .addOutput({
    to: aliceAddress,
    amount: runningAuctionUTXO.satoshis - minerFee,
  })
  .send();

  console.log('INFO: transaction', transaction)
}
