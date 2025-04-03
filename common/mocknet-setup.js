import {
  randomUtxo,
  randomNFT
} from 'cashscript';
import { hexToBin, binToHex } from '@bitauth/libauth';
import { intToBytesToHex, hexToInt } from './utils.js';
import {
  provider,
  domainCategory,
  auctionContract,
  auctionConflictResolverContract,
  auctionNameEnforcerContract,
  domainFactoryContract,
  domainOwnershipGuardContract,
  domainContract,
  bidContract,
  registryContract,
  domainFactoryLockingBytecodeHex,
  auctionLockingBytecodeHex,
  auctionConflictResolverLockingBytecodeHex,
  auctionNameEnforcerLockingBytecodeHex,
  domainOwnershipGuardLockingBytecodeHex,
  domainLockingBytecodeHex,
  bidLockingBytecodeHex,
  aliceAddress
} from './setup.js';

export const main = async () => {
  provider.addUtxo(aliceAddress, {...randomUtxo()});

  // Send dust to the whitelisted contracts

  provider.addUtxo(auctionContract.address, {...randomUtxo()});
  provider.addUtxo(auctionConflictResolverContract.address, {...randomUtxo()});
  provider.addUtxo(auctionNameEnforcerContract.address, {...randomUtxo()});
  provider.addUtxo(domainFactoryContract.address, {...randomUtxo()});
  provider.addUtxo(domainOwnershipGuardContract.address, {...randomUtxo()});
  provider.addUtxo(domainContract.address, {...randomUtxo()});
  provider.addUtxo(bidContract.address, {...randomUtxo()});

  // Mint the NFTs that have locking bytecode in their NFT commitment

  provider.addUtxo(registryContract.address, {
    token: {
      category: domainCategory,
      amount: BigInt(0),
      nft: {
        commitment: auctionLockingBytecodeHex,
        capability: 'none'
      }
    },
    ...randomUtxo()
  });  

  provider.addUtxo(registryContract.address, {
    token: {
      category: domainCategory,
      amount: BigInt(0),
      nft: {
        commitment: auctionConflictResolverLockingBytecodeHex,
        capability: 'none'
      }
    },
    ...randomUtxo()
  });

  provider.addUtxo(registryContract.address, {
    token: {
      category: domainCategory,
      amount: BigInt(0),
      nft: {
        commitment: auctionNameEnforcerLockingBytecodeHex,
        capability: 'none'
      }
    },
    ...randomUtxo()
  });

  provider.addUtxo(registryContract.address, {
    token: {
      category: domainCategory,
      amount: BigInt(0),
      nft: {
        commitment: domainFactoryLockingBytecodeHex,
        capability: 'none'
      }
    },
    ...randomUtxo()
  });

  provider.addUtxo(registryContract.address, {
    token: {
      category: domainCategory,
      amount: BigInt(0),
      nft: {
        commitment: domainOwnershipGuardLockingBytecodeHex,
        capability: 'none'
      }
    },
    ...randomUtxo()
  });

  provider.addUtxo(registryContract.address, {
    token: {
      category: domainCategory,
      amount: BigInt(0),
      nft: {
        commitment: bidLockingBytecodeHex,
        capability: 'none'
      }
    },
    ...randomUtxo()
  });

  provider.addUtxo(registryContract.address, {
    token: {
      category: domainCategory,
      amount: BigInt(0),
      nft: {
        commitment: domainLockingBytecodeHex,
        capability: 'none'
      }
    },
    ...randomUtxo()
  });

  // Create the counterNFT and the minting NFT for the registry contract
  provider.addUtxo(registryContract.address, {
    token: {
      category: domainCategory,
      amount: BigInt(9223372036854775807),
      nft: {
        commitment: intToBytesToHex({value: 0, length: 8}),
        capability: 'minting'
      }
    },
    ...randomUtxo()
  });

  provider.addUtxo(registryContract.address, {
    token: {
      category: domainCategory,
      nft: {
        capability: 'minting'
      }
    },
    ...randomUtxo()
  });
}