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
  cashAddressToLockingBytecode,
  lockingBytecodeToCashAddress
} from '@bitauth/libauth';

import { alicePriv, aliceAddress, alicePkh } from './common-js.js';
const artifactRegistry = compileFile(new URL('./contracts/Registry.cash', import.meta.url));
const artifactAuction = compileFile(new URL('./contracts/Auction.cash', import.meta.url));
const artifactBid = compileFile(new URL('./contracts/Bid.cash', import.meta.url));

const provider = new ElectrumNetworkProvider();
const addressType = 'p2sh32';
const options = { provider, addressType }

const aliceTemplate = new SignatureTemplate(alicePriv);

const domainCategory = '10bf2e660d975ad8783dc5fc40214b6df410d0af9b08c4e182e18fad876163bb'
const reverseDomainTokenCategory = binToHex(hexToBin(domainCategory).reverse())

const registryContract = new Contract(artifactRegistry, [reverseDomainTokenCategory], options);

const auctionContract = new Contract(artifactAuction, [], options);
const auctionLockingBytecode = cashAddressToLockingBytecode(auctionContract.address)
const auctionLockingBytecodeHex = binToHex(auctionLockingBytecode.bytecode)

const bidContract = new Contract(artifactBid, [], options);
const bidLockingBytecode = cashAddressToLockingBytecode(bidContract.address)
const bidLockingBytecodeHex = binToHex(bidLockingBytecode.bytecode)

const nameHex = Buffer.from('test').toString('hex')
console.log('INFO: nameHex', nameHex)
const name = hexToBin(nameHex)

console.log('INFO: aliceAddress', aliceAddress)
console.log('INFO: alicePkh', binToHex(alicePkh))
console.log(`let domainTokenCategory = '${domainCategory}';`)
console.log(`let registryContractAddress = '${registryContract.address}';`)
console.log(`let auctionContractAddress = '${auctionContract.address}';`)
console.log(`let auctionLockingBytecode = '${auctionLockingBytecodeHex}';`)
console.log(`let bidContractAddress = '${bidContract.address}';`)
console.log(`let bidLockingBytecode = '${bidLockingBytecodeHex}';`)


const getUtxos = async () => {
  const userUTXOs = await provider.getUtxos(aliceAddress)
  const registryUTXOs = await provider.getUtxos(registryContract.address)
  const auctionUTXOs = await provider.getUtxos(auctionContract.address)
  const bidUTXOs = await provider.getUtxos(bidContract.address)
  return {
    userUTXOs,
    registryUTXOs,
    auctionUTXOs,
    bidUTXOs
  }
}

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

const bid = async () => {
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
        commitment: binToHex(alicePkh) + binToHex(name)
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
  .send();

  console.log('INFO: transaction', transaction)
}

const selectAuctionInputs = async () =>{
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

const auction = async () => {
  const { userUTXO, auctionContractUTXO, threadNFTUTXO, registrationCounterUTXO } = await selectAuctionInputs()

  let newRegistrationId = parseInt(registrationCounterUTXO.token.nft.commitment, 16) + 1
  newRegistrationId = newRegistrationId.toString(16).padStart(16, '0')

  const transaction = await new TransactionBuilder({ provider })
  .addInput(threadNFTUTXO, registryContract.unlock.call())
  .addInput(auctionContractUTXO, auctionContract.unlock.call(name))
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
  .addOpReturnOutput(['test'])
  .addOutput({
    to: aliceAddress,
    amount: userUTXO.satoshis - BigInt(3300),
  })
  .send();

  console.log('INFO: transaction', transaction)
}


const main = async () => {
  // await auction()

  await bid()
}

main()