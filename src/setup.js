import { compileFile } from 'cashc/dist/index.js';
import {
  Contract,
  SignatureTemplate,  
  ElectrumNetworkProvider
// } from 'cashscript';
} from '../cashscript/packages/cashscript/dist/index.js';
import {
  hexToBin,
  binToHex,
  cashAddressToLockingBytecode,
  lockingBytecodeToCashAddress,
} from '@bitauth/libauth';

// import { buildLockScriptP2SH32, lockScriptToAddress} from './utils.js';

import { alicePriv, aliceAddress, alicePkh } from '../common-js.js';
export { alicePriv, aliceAddress, alicePkh };

export const artifactRegistry = compileFile(new URL('../contracts/Registry.cash', import.meta.url));
export const artifactAuction = compileFile(new URL('../contracts/Auction.cash', import.meta.url));
export const artifactBid = compileFile(new URL('../contracts/Bid.cash', import.meta.url));
export const artifactDomain = compileFile(new URL('../contracts/Domain.cash', import.meta.url));
export const artifactDomainFactory = compileFile(new URL('../contracts/DomainFactory.cash', import.meta.url));
export const artifactAuctionConflictResolver = compileFile(new URL('../contracts/AuctionConflictResolver.cash', import.meta.url));
export const artifactAuctionNameEnforcer = compileFile(new URL('../contracts/AuctionNameEnforcer.cash', import.meta.url));
export const artifactDomainOwnershipGuard = compileFile(new URL('../contracts/DomainOwnershipGuard.cash', import.meta.url));

export const provider = new ElectrumNetworkProvider();
export const addressType = 'p2sh32';
export const options = { provider, addressType }

export const aliceTemplate = new SignatureTemplate(alicePriv);

export const name = 'test'
export const nameHex = Buffer.from(name).toString('hex')
export const nameBin = hexToBin(nameHex)
export const tld = '.sats'
export const tldHex = Buffer.from(tld).toString('hex')
export const tldBin = hexToBin(tldHex)

export const fullName = name + tld
export const fullNameHex = Buffer.from(fullName).toString('hex')
export const fullNameBin = hexToBin(fullNameHex)

export const domainCategory = '10bf2e660d975ad8783dc5fc40214b6df410d0af9b08c4e182e18fad876163bb'
export const reverseDomainTokenCategory = binToHex(hexToBin(domainCategory).reverse())

export const registryContract = new Contract(artifactRegistry, [reverseDomainTokenCategory], options);

export const auctionContract = new Contract(artifactAuction, [], options);
export const auctionLockingBytecode = cashAddressToLockingBytecode(auctionContract.address)
export const auctionLockingBytecodeHex = binToHex(auctionLockingBytecode.bytecode)

export const bidContract = new Contract(artifactBid, [], options);
export const bidLockingBytecode = cashAddressToLockingBytecode(bidContract.address)
export const bidLockingBytecodeHex = binToHex(bidLockingBytecode.bytecode)

export const domainContract = new Contract(artifactDomain, [fullNameHex, reverseDomainTokenCategory], options);
export const domainLockingBytecode = cashAddressToLockingBytecode(domainContract.address)
export const domainLockingBytecodeHex = binToHex(domainLockingBytecode.bytecode)

// ANOTHER APPROACH is: domainContract.artifact.debug.bytecode
const sliceIndex = 2 + 64 + 2 + fullName.length*2
const domainPartialBytecode = domainContract.bytecode.slice(sliceIndex, domainContract.bytecode.length)

// const script = buildLockScriptP2SH32(domainContract.bytecode)
// console.log('INFO: script', script)
// const address = lockScriptToAddress(script)
// console.log('INFO: address', address)


export const domainFactoryContract = new Contract(artifactDomainFactory, [domainPartialBytecode, tldHex, alicePkh], options);
export const domainFactoryLockingBytecode = cashAddressToLockingBytecode(domainFactoryContract.address)
export const domainFactoryLockingBytecodeHex = binToHex(domainFactoryLockingBytecode.bytecode)

export const domainOwnershipGuardContract = new Contract(artifactDomainOwnershipGuard, [domainPartialBytecode, tldHex], options);
export const domainOwnershipGuardLockingBytecode = cashAddressToLockingBytecode(domainOwnershipGuardContract.address)
export const domainOwnershipGuardLockingBytecodeHex = binToHex(domainOwnershipGuardLockingBytecode.bytecode)

export const auctionConflictResolverContract = new Contract(artifactAuctionConflictResolver, [], options);
export const auctionConflictResolverLockingBytecode = cashAddressToLockingBytecode(auctionConflictResolverContract.address)
export const auctionConflictResolverLockingBytecodeHex = binToHex(auctionConflictResolverLockingBytecode.bytecode)

export const auctionNameEnforcerContract = new Contract(artifactAuctionNameEnforcer, [], options);
export const auctionNameEnforcerLockingBytecode = cashAddressToLockingBytecode(auctionNameEnforcerContract.address)
export const auctionNameEnforcerLockingBytecodeHex = binToHex(auctionNameEnforcerLockingBytecode.bytecode)

console.log('INFO: name', name, nameHex, nameBin)
console.log('INFO: tld', tld, tldHex, tldBin)
console.log('INFO: aliceAddress', aliceAddress)
console.log('INFO: alicePkh', binToHex(alicePkh))
console.log(`let domainTokenCategory = '${domainCategory}';`)
console.log(`let registryContractAddress = '${registryContract.address}';`)
console.log(`let auctionContractAddress = '${auctionContract.address}';`)
console.log(`let auctionLockingBytecode = '${auctionLockingBytecodeHex}';`)
console.log(`let bidContractAddress = '${bidContract.address}';`)
console.log(`let bidLockingBytecode = '${bidLockingBytecodeHex}';`)
console.log(`let domainOwnershipGuardContractAddress = '${domainOwnershipGuardContract.address}';`)
console.log(`let domainOwnershipGuardLockingBytecode = '${domainOwnershipGuardLockingBytecodeHex}';`)
console.log(`let auctionConflictResolverContractAddress = '${auctionConflictResolverContract.address}';`)
console.log(`let auctionConflictResolverLockingBytecode = '${auctionConflictResolverLockingBytecodeHex}';`)
console.log(`let auctionNameEnforcerContractAddress = '${auctionNameEnforcerContract.address}';`)
console.log(`let auctionNameEnforcerLockingBytecode = '${auctionNameEnforcerLockingBytecodeHex}';`)


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