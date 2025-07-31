import { hash160 } from '@cashscript/utils';
import {
	deriveHdPrivateNodeFromSeed,
	deriveHdPath,
	secp256k1,
	encodeCashAddress,
	deriveSeedFromBip39Mnemonic,
	binToHex,
	hexToBin,
} from '@bitauth/libauth';
import { SignatureTemplate, randomNFT } from 'cashscript';

export const nameTokenCategory = randomNFT().category;
export const reversedNameTokenCategory = binToHex(hexToBin(nameTokenCategory).reverse());

export const invalidNameTokenCategory = randomNFT().category;
export const reversedInvalidNameTokenCategory = binToHex(hexToBin(invalidNameTokenCategory).reverse());

export const mockOptions =
{
	category: nameTokenCategory,
	// minStartingBid: 10000,
	minStartingBid: 1000000,
	minBidIncreasePercentage: 5,
	inactivityExpiryTime: 1,
	minWaitTime: 1,
	maxPlatformFeePercentage: 50,
	tld: '.bch',
};
// @ts-ignore
const seed = deriveSeedFromBip39Mnemonic('bitcann test seed');
const rootNode = deriveHdPrivateNodeFromSeed(seed, { assumeValidity: true, throwErrors: true });
const baseDerivationPath = "m/44'/145'/0'/0";

// Derive Alice's private key, public key, public key hash and address
const aliceNode = deriveHdPath(rootNode, `${baseDerivationPath}/0`);

export const alicePub = secp256k1.derivePublicKeyCompressed(aliceNode.privateKey);
export const alicePriv = aliceNode.privateKey;
// @ts-ignore
export const alicePkh = hash160(alicePub);
export const aliceAddress = encodeCashAddress({ prefix: 'bchtest', type: 'p2pkh', payload: alicePkh, throwErrors: true }).address;
export const aliceTokenAddress = encodeCashAddress({ prefix: 'bchtest', type: 'p2pkhWithTokens', payload: alicePkh, throwErrors: true }).address;
export const aliceTemplate = new SignatureTemplate(alicePriv);