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
import { SignatureTemplate } from 'cashscript';

export const domainTokenCategory = '98570f00cad2991de0ab25f14ffae29a0c61da97ba6d466acbc8476e2e612ada';
export const reversedDomainTokenCategory = binToHex(hexToBin(domainTokenCategory).reverse());

export const mockOptions =
{
	category: domainTokenCategory,
	minStartingBid: 10000,
	minBidIncreasePercentage: 5,
	inactivityExpiryTime: 1,
	minWaitTime: 1,
	maxPlatformFeePercentage: 50,
};
// @ts-ignore
const seed = deriveSeedFromBip39Mnemonic('bitcann test seed');
const rootNode = deriveHdPrivateNodeFromSeed(seed, { assumeValidity: true, throwErrors: true });
const baseDerivationPath = "m/44'/145'/0'/0";

// Derive Alice's private key, public key, public key hash and address
const aliceNode = deriveHdPath(rootNode, `${baseDerivationPath}/0`);
if(typeof aliceNode === 'string') throw new Error();
export const alicePub = secp256k1.derivePublicKeyCompressed(aliceNode.privateKey);
export const alicePriv = aliceNode.privateKey;
// @ts-ignore
export const alicePkh = hash160(alicePub);
export const aliceAddress = encodeCashAddress({ prefix: 'bchtest', type: 'p2pkh', payload: alicePkh, throwErrors: true }).address;
export const aliceTokenAddress = encodeCashAddress({ prefix: 'bchtest', type: 'p2pkhWithTokens', payload: alicePkh, throwErrors: true }).address;
export const aliceTemplate = new SignatureTemplate(alicePriv);