import { compileFile } from 'cashc/dist/index.js';

const artifactRegistry = compileFile(new URL('./contracts/Registry.cash', import.meta.url));
const artifactDomain = compileFile(new URL('./contracts/Domain.cash', import.meta.url));
const artifactBid = compileFile(new URL('./contracts/Bid.cash', import.meta.url));
const artifactRegistrationAuction = compileFile(new URL('./contracts/RegistrationAuction.cash', import.meta.url));


import {
  TransactionBuilder,
  Contract,
  SignatureTemplate,  
  MockNetworkProvider,
  randomUtxo,
  randomNFT,
} from 'cashscript';

import {
  hash256,
  hexToBin,
  binToHex,
  cashAddressToLockingBytecode
} from '@bitauth/libauth';

import { alicePriv, aliceAddress } from './common-js.js';

const provider = new MockNetworkProvider();
const addressType = 'p2sh32';
const options = { provider, addressType}

const aliceTemplate = new SignatureTemplate(alicePriv);
const aliceLockingBytecode = binToHex(cashAddressToLockingBytecode(aliceAddress).bytecode)

const initialAuctionId = 0
const registrationToken = randomNFT({
  nft: {
    capability: 'minting',
    commitment: initialAuctionId.toString(8).padStart(32, '0')
  }
})

console.log('INFO: Domain Category: ', registrationToken.category)

const nameHex = Buffer.from('test').toString('hex')
const name = hexToBin(nameHex)
const extensionHex = Buffer.from('.sat').toString('hex')
const extension = hexToBin(extensionHex)
const nameHash = hash256(name)
let reverseTokenCategory = binToHex(hexToBin(registrationToken.category).reverse())

// const domainContract = new Contract(artifactDomain, [nameHash, reverseTokenCategory], options);  
const registryContract = new Contract(artifactRegistry, [reverseTokenCategory], options);

const registryLockingBytecode = cashAddressToLockingBytecode(registryContract.address).bytecode
const registrationAuctionContract = new Contract(artifactRegistrationAuction, [registryLockingBytecode], options);

let startAuctionlockingBytecodeHex

const addScriptUTXOToRegistry = () => {
  // Add registration token utxo to the registry
  const registrationTokenUTXO = randomUtxo({satoshis: 800n, vout: 0, token: registrationToken})
  provider.addUtxo(registryContract.address, registrationTokenUTXO)

  // HANDLE START AUCTION CONTRACT AND UTXOs
  const lockingBytecode = cashAddressToLockingBytecode(registrationAuctionContract.address)
  startAuctionlockingBytecodeHex = binToHex(lockingBytecode.bytecode)
  const startAuctionUTXO = randomUtxo({satoshis: 800n, vout: 0, token: {category: registrationToken.category, amount: 0, nft: {capability: 'immutable', commitment: startAuctionlockingBytecodeHex}}})
  
  provider.addUtxo(registryContract.address, startAuctionUTXO)
  // Add any utxo to start auction contract
  provider.addUtxo(registrationAuctionContract.address, randomUtxo({satoshis: 800n, vout: 0}))
}


const startAuction = async () => {
  const currentBlock = await provider.getBlockHeight()

  // Get start auction utxo
  let utxos = await provider.getUtxos(registrationAuctionContract.address)
  console.log('INFO: startAuctionUTXO', utxos)
  const startAuctionUTXO = utxos[0]

  const userUTXO = randomUtxo({satoshis: 100_000_000n, vout: 0})
  provider.addUtxo(aliceAddress, userUTXO)

  // Get registration utxo
  const registrationUTXOs = await provider.getUtxos(registryContract.address)
  console.log('INFO: registrationUTXO', registrationUTXOs)

  // Find registration UTXO with matching commitment
  const startAuctionThread = registrationUTXOs.find(utxo => 
    utxo.token?.nft?.commitment === startAuctionlockingBytecodeHex
  );

  if (!startAuctionThread) {
    throw new Error('Could not find registration UTXO with matching commitment');
  }

  // Find the counter NFT UTXO with minting capability
  const counterUTXO = registrationUTXOs.find(utxo => 
    utxo.token?.nft?.capability === 'minting'
  );

  if (!counterUTXO) {
    throw new Error('Could not find counter UTXO with minting capability');
  }

  let newRegistrationId = parseInt(counterUTXO.token.nft.commitment, 8) + 1
  newRegistrationId = newRegistrationId.toString(8).padStart(32, '0')

  const transaction = await new TransactionBuilder({ provider })
  .addInput(startAuctionThread, registryContract.unlock.call())
  .addInput(startAuctionUTXO, registrationAuctionContract.unlock.call(nameHash))
  .addInput(counterUTXO, registryContract.unlock.call())
  .addInput(userUTXO, aliceTemplate.unlockP2PKH())
  .addOutput({
    to: registrationAuctionContract.address,
    amount: startAuctionUTXO.satoshis
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: startAuctionThread.satoshis,
    token: {
      category: startAuctionThread.token.category,
      amount: startAuctionThread.token.amount,
      nft: {
        capability: startAuctionThread.token.nft.capability,
        commitment: startAuctionThread.token.nft.commitment
      }
    }
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: counterUTXO.satoshis,
    token: {
      category: counterUTXO.token.category,
      amount: counterUTXO.token.amount,
      nft: {
        capability: counterUTXO.token.nft.capability,
        commitment: newRegistrationId.toString(8).padStart(32, '0')
      }
    }
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: BigInt(5000000),
    token: {
      category: counterUTXO.token.category,
      amount: counterUTXO.token.amount,
      nft: {
        capability: 'immutable',
        commitment: newRegistrationId.toString(8).padStart(32, '0') + binToHex(nameHash)
      }
    }
  })
  .addOutput({
    to: registryContract.tokenAddress,
    amount: BigInt(1000),
    token: {
      category: counterUTXO.token.category,
      amount: counterUTXO.token.amount,
      nft: {
        capability: 'mutable',
        commitment: newRegistrationId.toString(8).padStart(32, '0') + currentBlock.toString(8).padStart(4, '0') + aliceLockingBytecode + '00'
      }
    }
  })
  .addOutput({
    to: aliceAddress,
    amount: userUTXO.satoshis - BigInt(5003000),
  })
  .build();

  console.log('INFO: transaction', transaction)
}


const main = async () => {


  // const ownerPkh = alicePkh
  // const userUTXO = randomUtxo({satoshis: 100_000_000n, vout: 0})

  addScriptUTXOToRegistry()


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