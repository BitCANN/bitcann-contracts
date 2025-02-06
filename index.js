const artifactRegistry = compileFile(new URL('./contracts/Registry.cash', import.meta.url));
const artifactDomain = compileFile(new URL('./contracts/Domain.cash', import.meta.url));
const artifactBid = compileFile(new URL('./contracts/Bid.cash', import.meta.url));
const artifactAuction = compileFile(new URL('./contracts/Auction.cash', import.meta.url));

import { compileFile } from 'cashc/dist/index.js';

import {
  TransactionBuilder,
  Contract,
  SignatureTemplate,  
  ElectrumNetworkProvider
// } from 'cashscript';
} from './cashscript/packages/cashscript/dist/index.js';

import {
  hash256,
  hexToBin,
  binToHex,
  cashAddressToLockingBytecode
} from '@bitauth/libauth';

import { alicePriv, aliceAddress } from './common-js.js';

// const provider = new MockNetworkProvider();
const provider = new ElectrumNetworkProvider();
const addressType = 'p2sh32';
const options = { provider, addressType }

console.log('INFO: aliceAddress', aliceAddress)

const aliceTemplate = new SignatureTemplate(alicePriv);
const aliceLockingBytecode = binToHex(cashAddressToLockingBytecode(aliceAddress).bytecode)

// const initialAuctionId = 0
// const registrationToken = randomNFT({
//   nft: {
//     capability: 'minting',
//     commitment: initialAuctionId.toString(8).padStart(32, '0')
//   }
// })

const domainCategory = 'a49f355d8a88d3aa2c0bc1f1ab8e0639074823df1da658773a67304b6f9f6c52'

console.log('INFO: Domain Category: ', domainCategory)

const constructSetup = () => {
  // Create a minting NFT with 0 value of 8 bytes, save the tokenID and use it here.
  // Set the authchain and burn it.
  // Deploy the registry contract
  // Deploy all the remaining contracts
  // Send the minting NFT to the registry contract
  // Send some random utxo to auction contract
  // Create transaction.
}


const nameHex = Buffer.from('test.sats').toString('hex')
const name = hexToBin(nameHex)
const extensionHex = Buffer.from('.sat').toString('hex')
let reverseDomainTokenCategory = binToHex(hexToBin(domainCategory).reverse())

// const domainContract = new Contract(artifactDomain, [nameHash, reverseDomainTokenCategory], options);  
const registryContract = new Contract(artifactRegistry, [reverseDomainTokenCategory], options);

const registryLockingBytecode = cashAddressToLockingBytecode(registryContract.address).bytecode
const auctionContract = new Contract(artifactAuction, [registryLockingBytecode], options);

console.log('registryContract.address: ', registryContract.address)
console.log('auctionContract.address: ', auctionContract.address)

const auctionLockingBytecode = cashAddressToLockingBytecode(auctionContract.address)
let auctionLockingBytecodeHex = binToHex(auctionLockingBytecode.bytecode)

console.log('auctionLockingBytecodeHex: ', auctionLockingBytecodeHex)
console.log('aliceLockingBytecode', aliceLockingBytecode)

let registryLockingBytecodeHex = binToHex(registryLockingBytecode)
console.log('registryLockingBytecodeHex: ', registryLockingBytecodeHex)

const addScriptUTXOToRegistryMock = () => {
  // Add registration token utxo to the registry
  const registrationTokenUTXO = randomUtxo({satoshis: 800n, vout: 0, token: registrationToken})
  provider.addUtxo(registryContract.address, registrationTokenUTXO)

  // HANDLE START AUCTION CONTRACT AND UTXOs
  
  const auctionContractUTXO = randomUtxo({satoshis: 800n, vout: 0, token: {category: registrationToken.category, amount: 0, nft: {capability: 'none', commitment: auctionLockingBytecodeHex}}})
  
  provider.addUtxo(registryContract.address, auctionContractUTXO)
  // Add any utxo to start auction contract
  provider.addUtxo(auctionContract.address, randomUtxo({satoshis: 800n, vout: 0}))
}

const getUtxos = async () => {
  const userUTXOs = await provider.getUtxos(aliceAddress)
  // console.log('INFO: userUTXOs', userUTXOs)
  // Add registration token utxo to the registry
  const registryUTXOs = await provider.getUtxos(registryContract.address)
  // console.log('INFO: registryUTXOs', registryUTXOs)
  // Add any utxo to start auction contract
  const auctionUTXOs = await provider.getUtxos(auctionContract.address)
  // console.log('INFO: auctionUTXOs', auctionUTXOs)

  return {
    userUTXOs,
    registryUTXOs,
    auctionUTXOs
  }
}

const addUtxosMock = async () => {
  const userUTXO = randomUtxo({satoshis: 100_000_000n, vout: 0})
  provider.addUtxo(aliceAddress, userUTXO)
}


const startAuction = async () => {
  const currentBlock = await provider.getBlockHeight()

  console.log('INFO: currentBlock', currentBlock)

  const { userUTXOs, registryUTXOs, auctionUTXOs } = await getUtxos()

  const userUTXO = userUTXOs.find(utxo => !utxo.token);
  if (!userUTXO) throw new Error('Could not find user UTXO without token');

  console.log('INFO: userUTXO', userUTXO)

  const tempMintingCopyUTXO = userUTXOs.find(utxo => utxo.token.category === domainCategory);
  if (!tempMintingCopyUTXO) throw new Error('Could not find user UTXO without token');

  console.log('INFO: tempMintingCopyUTXO', tempMintingCopyUTXO)

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

  // // Registration NFT UTXO from registry contract
  const registrationCounterUTXO = registryUTXOs.find(utxo => 
    utxo.token?.nft?.capability === 'minting' &&
    utxo.token?.category === domainCategory &&
    utxo.token?.nft?.commitment === '0000000000000000'
  );

  console.log('INFO: registrationCounterUTXO', registrationCounterUTXO)

  if (!threadNFTUTXO) throw new Error('Could not find auctionThreadNFT with matching commitment');
  if (!registrationCounterUTXO) throw new Error('Could not find counter UTXO with minting capability');

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
      amount: registrationCounterUTXO.token.amount,
      nft: {
        capability: registrationCounterUTXO.token.nft.capability,
        commitment: newRegistrationId
      }
    }
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: BigInt(800),
    token: {
      category: registrationCounterUTXO.token.category,
      amount: BigInt(0),
      nft: {
        capability: 'none',
        commitment: newRegistrationId + binToHex(name)
      }
    }
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: BigInt(1000),
    token: {
      category: registrationCounterUTXO.token.category,
      amount: BigInt(0),
      nft: {
        capability: 'mutable',
        commitment: newRegistrationId + currentBlock.toString(16).padStart(8, '0') + aliceLockingBytecode
      }
    }
  })
  .addOpReturnOutput([nameHex])
  .addOutput({
    to: aliceAddress,
    amount: userUTXO.satoshis - BigInt(3300),
  })
  .setLocktime(currentBlock)
  .build();

  console.log('INFO: transaction', transaction)
}


const main = async () => {


  // const ownerPkh = alicePkh
  // const userUTXO = randomUtxo({satoshis: 100_000_000n, vout: 0})

  // await addScriptUTXOToRegistryMock()

  await getUtxos()


  await startAuction()
  // const registrationIdTokenUTXO = randomUtxo({satoshis: 800n, vout: 0, token: registrationIdToken})

  // provider.addUtxo(registryContract.address, registrationIdTokenUTXO)
  // provider.addUtxo(wallet.cashaddr, userUTXO)

  // const newRegistrationId = registrationId + 1
  // const isRegistered = 0


  // const years = 2
  // const yearsHex = years.toString(16) // Convert decimal 2 to hex
  // const yearsBin = hexToBin(yearsHex)

  // let registrationFee = 10000 * years;
  // if (name.length >= 1 && name.length <= 3) {
  //   // Registration fee for [1-3] characters is 1 BCH
  //   registrationFee = 10000000 * years;
  // } else if (name.length >= 4 && name.length <= 6) {
  //   // Registration fee for [4-6] characters is 0.1 BCH
  //   registrationFee = 1000000 * years;
  // } else if (name.length >= 7 && name.length <= 10) {
  //   // Registration fee for [7-10] characters is 0.01 BCH
  //   registrationFee = 100000 * years;
  // }

  // const domainCommitment = isRegistered.toString(16).padStart(2, '0') + newRegistrationId.toString(16).padStart(16, '0') + ownerPkh + '440a0200' + 'e4a40300';


  // const txn = await registryContract.functions.call()
  // .from(registrationIdTokenUTXO)
  // .fromP2PKH(userUTXO, new SignatureTemplate(wallet.privateKeyWif, HashType.SIGHASH_ALL | HashType.SIGHASH_UTXOS ))
  // .to([
  //   {
  //     to: registryContract.tokenAddress,
  //     amount: BigInt(Number(registrationIdTokenUTXO.satoshis)),
  //     token: {
  //       amount: BigInt(Number(0)),
  //       category: registrationIdTokenUTXO.token.category,
  //       nft: {
  //         capability: registrationIdTokenUTXO.token.nft.capability,
  //         commitment: newRegistrationId.toString(16).padStart(32, '0')
  //       }
  //     }
  //   },
  //   {
  //     to: domainContract.tokenAddress,
  //     amount: BigInt(registrationFee),
  //     token: {
  //       amount: BigInt(Number(0)),
  //       category: registrationIdTokenUTXO.token.category,
  //       nft: {
  //         capability: registrationIdTokenUTXO.token.nft.capability,
  //         commitment: domainCommitment
  //       }
  //     }
  //   },
  //   {
  //     to: wallet.tokenaddr,
  //     amount: BigInt(Number(800)),
  //   }
  // ])
  // .withoutChange()
  // .send();

  // console.log('INFO: txn', txn)

}


main()