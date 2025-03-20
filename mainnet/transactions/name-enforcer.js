import {
  TransactionBuilder,
} from 'cashscript';
import {
  registryContract,
  auctionNameEnforcerContract,
  getUtxos,
  auctionNameEnforcerLockingBytecodeHex,
  domainCategory,
  provider,
  aliceAddress,
} from '../setup.js'
import { findPureUTXO } from '../utils.js'


const selectInputs = async () =>{
  const { userUTXOs, registryUTXOs, auctionNameEnforcerUTXOs } = await getUtxos()

  const userUTXO = findPureUTXO(userUTXOs)
  console.log('INFO: userUTXO', userUTXO)

  // Utxo from registry contract that has auctionContract's lockingbytecode in the nftCommitment
  const threadNFTUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.commitment === auctionNameEnforcerLockingBytecodeHex &&
    utxo.token?.nft?.capability === 'none' &&
    utxo.token?.category === domainCategory
  );

  console.log('INFO: threadNFTUTXO', threadNFTUTXO)
  console.log('INFO: registryUTXOs', registryUTXOs)

  const validCharacters = [
    ...'abcdefghijklmnopqrstuvwxyz'.split(''),
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    ...'0123456789'.split(''),
    '-'
  ]

  // Find all auction UTXOs from registry contract, sorted by satoshi value
  const auctionUTXOs = registryUTXOs.filter(utxo => {
    if (!(utxo.token?.nft?.capability === 'mutable' &&
        utxo.token?.category === domainCategory &&
        utxo.token?.nft?.commitment &&
        utxo.token?.amount > 0)) {
      return false;
    }

    const nftCommitment = utxo.token.nft.commitment;
    const nameHex = nftCommitment.slice(40, nftCommitment.length);
    const name = Buffer.from(nameHex, 'hex').toString();
    console.log('INFO: name', name)
    // Check each character against valid characters
    for (let i = 0; i < name.length; i++) {
      if (!validCharacters.includes(name[i])) {
        return true;
      }
    }
    return false;
  });

  console.log('INFO: auctionUTXO', auctionUTXOs)

  if (!threadNFTUTXO) throw new Error('Could not find threadNFT with matching commitment');

  return {
    userUTXO,
    threadNFTUTXO,
    auctionUTXO: auctionUTXOs[0],
    authorizedContractUTXO: auctionNameEnforcerUTXOs[0]
  }
}

export const main = async () => {
  const { threadNFTUTXO, auctionUTXO, authorizedContractUTXO } = await selectInputs()

  const authorizedContract = auctionNameEnforcerContract;
  const minerFee = BigInt(3000)

  const transaction = await new TransactionBuilder({ provider })
  .addInput(threadNFTUTXO, registryContract.unlock.call())
  .addInput(authorizedContractUTXO, authorizedContract.unlock.call(BigInt(4)))
  .addInput(auctionUTXO, registryContract.unlock.call())
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
    to: aliceAddress,
    amount: auctionUTXO.satoshis - minerFee,
  })
  .send();

  console.log('INFO: transaction', transaction)
}
