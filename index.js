import { compileFile } from 'cashc/dist/index.js';
import {
  TransactionBuilder,
  Contract,
  SignatureTemplate,  
  ElectrumNetworkProvider
// } from 'cashscript';
} from './cashscript/packages/cashscript/dist/index.js';
import {
  hexToBin,
  binToHex,
  cashAddressToLockingBytecode
} from '@bitauth/libauth';

import { alicePriv, aliceAddress, alicePkh } from './common-js.js';
const artifactRegistry = compileFile(new URL('./contracts/Registry.cash', import.meta.url));
const artifactAuction = compileFile(new URL('./contracts/Auction.cash', import.meta.url));

const provider = new ElectrumNetworkProvider();
const addressType = 'p2sh32';
const options = { provider, addressType }

const aliceTemplate = new SignatureTemplate(alicePriv);

const domainCategory = '5a48189d187490936959c04f28c70d26a4e4c5102b98866bf94b5a31ecdb4fb4'
const reverseDomainTokenCategory = binToHex(hexToBin(domainCategory).reverse())

const registryContract = new Contract(artifactRegistry, [reverseDomainTokenCategory], options);
const registryLockingBytecode = cashAddressToLockingBytecode(registryContract.address).bytecode

const auctionContract = new Contract(artifactAuction, [registryLockingBytecode], options);
const auctionLockingBytecode = cashAddressToLockingBytecode(auctionContract.address)
const auctionLockingBytecodeHex = binToHex(auctionLockingBytecode.bytecode)

const nameHex = Buffer.from('test.sats').toString('hex')
console.log('INFO: nameHex', nameHex)
const name = hexToBin(nameHex)


console.log('INFO: domainCategory', domainCategory)
console.log('INFO: aliceAddress', aliceAddress)
console.log('INFO: registryContract.address: ', registryContract.address)
console.log('INFO: auctionContract.address: ', auctionContract.address)
console.log('INFO: auctionLockingBytecodeHex: ', auctionLockingBytecodeHex)


const getUtxos = async () => {
  const userUTXOs = await provider.getUtxos(aliceAddress)
  const registryUTXOs = await provider.getUtxos(registryContract.address)
  const auctionUTXOs = await provider.getUtxos(auctionContract.address)

  return {
    userUTXOs,
    registryUTXOs,
    auctionUTXOs
  }
}

const auction = async () => {
  const currentBlock = await provider.getBlockHeight()

  console.log('INFO: currentBlock', currentBlock)

  const { userUTXOs, registryUTXOs, auctionUTXOs } = await getUtxos()

  const userUTXO = userUTXOs.find(utxo => !utxo.token && utxo.satoshis > 4000);
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
    utxo.token?.nft?.commitment === '0000000000000000' &&
    utxo.token?.amount > 0
  );

  console.log('INFO: registrationCounterUTXO', registrationCounterUTXO)

  if (!threadNFTUTXO) throw new Error('Could not find auctionThreadNFT with matching commitment');
  if (!registrationCounterUTXO) throw new Error('Could not find counter UTXO with minting capability');

  let newRegistrationId = parseInt(registrationCounterUTXO.token.nft.commitment, 16) + 1
  newRegistrationId = newRegistrationId.toString(16).padStart(16, '0')


  const transaction = await new TransactionBuilder({ provider })
  .addInput(auctionContractUTXO, auctionContract.unlock.start(name))
  .addInput(threadNFTUTXO, registryContract.unlock.call())
  // .addInput(auctionContractUTXO, auctionContract.unlock.start(name))
  .addInput(registrationCounterUTXO, registryContract.unlock.call())
  .addInput(userUTXO, aliceTemplate.unlockP2PKH())
  .addOutput({
    to: auctionContract.tokenAddress,
    amount: auctionContractUTXO.satoshis
  })
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
    to: registryContract.tokenAddress,
    amount: registrationCounterUTXO.satoshis,
    token: {
      category: registrationCounterUTXO.token.category,
      amount: registrationCounterUTXO.token.amount  - BigInt(1),
      nft: {
        capability: registrationCounterUTXO.token.nft.capability,
        commitment: newRegistrationId
      }
    }
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: BigInt(1000),
    token: {
      category: registrationCounterUTXO.token.category,
      amount: BigInt(1),
      nft: {
        capability: 'mutable',
        commitment: binToHex(alicePkh) + binToHex(name)
      }
    }
  })
  .addOpReturnOutput(['test.sats'])
  .addOutput({
    to: aliceAddress,
    amount: userUTXO.satoshis - BigInt(3300),
  })
  .send();

  console.log('INFO: transaction', transaction)
}


const main = async () => {
  await auction()
}

main()