import { compileFile } from 'cashc/dist/index.js';
import {
  TransactionBuilder,
  Contract,
  SignatureTemplate,  
  ElectrumNetworkProvider
// } from 'cashscript';
} from '../cashscript/packages/cashscript/dist/index.js';
import {
  hexToBin,
  binToHex,
  cashAddressToLockingBytecode,
  lockingBytecodeToCashAddress
} from '@bitauth/libauth';

import { alicePriv, aliceAddress, alicePkh } from '../common-js.js';
export { alicePriv, aliceAddress, alicePkh };

export const artifactRegistry = compileFile(new URL('../contracts/Registry.cash', import.meta.url));
export const artifactAuction = compileFile(new URL('../contracts/Auction.cash', import.meta.url));
export const artifactBid = compileFile(new URL('../contracts/Bid.cash', import.meta.url));

export const provider = new ElectrumNetworkProvider();
export const addressType = 'p2sh32';
export const options = { provider, addressType }

export const aliceTemplate = new SignatureTemplate(alicePriv);

export const domainCategory = '10bf2e660d975ad8783dc5fc40214b6df410d0af9b08c4e182e18fad876163bb'
export const reverseDomainTokenCategory = binToHex(hexToBin(domainCategory).reverse())

export const registryContract = new Contract(artifactRegistry, [reverseDomainTokenCategory], options);

export const auctionContract = new Contract(artifactAuction, [], options);
export const auctionLockingBytecode = cashAddressToLockingBytecode(auctionContract.address)
export const auctionLockingBytecodeHex = binToHex(auctionLockingBytecode.bytecode)

export const bidContract = new Contract(artifactBid, [], options);
export const bidLockingBytecode = cashAddressToLockingBytecode(bidContract.address)
export const bidLockingBytecodeHex = binToHex(bidLockingBytecode.bytecode)

export const nameHex = Buffer.from('test').toString('hex')
console.log('INFO: nameHex', nameHex)
export const name = hexToBin(nameHex)

console.log('INFO: aliceAddress', aliceAddress)
console.log('INFO: alicePkh', binToHex(alicePkh))
console.log(`let domainTokenCategory = '${domainCategory}';`)
console.log(`let registryContractAddress = '${registryContract.address}';`)
console.log(`let auctionContractAddress = '${auctionContract.address}';`)
console.log(`let auctionLockingBytecode = '${auctionLockingBytecodeHex}';`)
console.log(`let bidContractAddress = '${bidContract.address}';`)
console.log(`let bidLockingBytecode = '${bidLockingBytecodeHex}';`)


export const getUtxos = async () => {
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