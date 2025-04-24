import {
  TransactionBuilder,
} from 'cashscript';
import { binToHex } from '@bitauth/libauth';
import {
  domainCategory,
  domainContract,
  provider,
  aliceAddress,
  aliceTokenAddress,
  aliceTemplate
} from '../common/setup.js'
import { findOwnershipNFTUTXO, findPureUTXO, getUtxos } from '../common/utils.js'

const selectInputs = async () =>{
  const { userUTXOs, domainUTXOs } = await getUtxos()

  const userOwnershipNFTUTXO = findOwnershipNFTUTXO(userUTXOs, domainCategory)
  const fundingUTXO = findPureUTXO(userUTXOs)

  // Utxo from registry contract that has authorizedContract's lockingbytecode in the nftCommitment
  const internalAuthNFTUTXO = domainUTXOs.find(utxo => 
    utxo.token?.nft?.capability === 'none' &&
    utxo.token?.category === domainCategory &&
    utxo.token?.nft?.commitment.length > 0
  );

  return {
    fundingUTXO,
    userOwnershipNFTUTXO,
    internalAuthNFTUTXO
  }
}


export const  main = async () => {
  const { fundingUTXO, userOwnershipNFTUTXO, internalAuthNFTUTXO } = await selectInputs()

  const record = 'avatar https://pbs.twimg.com/profile_images/1888892204594147328/oy0J2JAM_400x400.png'

  const change = fundingUTXO.satoshis - BigInt(2000)

  const transaction = await new TransactionBuilder({ provider })
  .addInput(internalAuthNFTUTXO, domainContract.unlock.useAuth(BigInt(1)))
  .addInput(userOwnershipNFTUTXO, aliceTemplate.unlockP2PKH())
  .addInput(fundingUTXO, aliceTemplate.unlockP2PKH())
  .addOutput({
    to: domainContract.tokenAddress,
    amount: internalAuthNFTUTXO.satoshis,
    token: {
      category: internalAuthNFTUTXO.token.category,
      amount: internalAuthNFTUTXO.token.amount,
      nft: {
        capability: internalAuthNFTUTXO.token.nft.capability,
        commitment: internalAuthNFTUTXO.token.nft.commitment
      }
    }
  })
  .addOutput({
    to: aliceTokenAddress,
    amount: userOwnershipNFTUTXO.satoshis,
    token: {
      category: userOwnershipNFTUTXO.token.category,
      amount: userOwnershipNFTUTXO.token.amount,
      nft: {
        capability: userOwnershipNFTUTXO.token.nft.capability,
        commitment: userOwnershipNFTUTXO.token.nft.commitment
      }
    }
  })
  .addOpReturnOutput([record])
  .addOutput({
    to: aliceAddress,
    amount: change,
  })
  .send();

  console.log('INFO: transaction', transaction)
}
