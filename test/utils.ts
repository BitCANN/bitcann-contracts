import { lockingBytecodeToCashAddress, hexToBin, binToHex, bigIntToVmNumber, padMinimallyEncodedVmNumber } from '@bitauth/libauth';
import { type Output, type AddressType, type NetworkProvider, Contract, Network, Transaction } from 'cashscript';
import { BitCANNArtifacts } from '../lib/index.js';

export interface LibauthTokenDetails
{
	amount: bigint;
	category: Uint8Array;
	nft?: {
		capability: 'none' | 'mutable' | 'minting';
		commitment: Uint8Array;
	};
}

export interface LibauthOutput
{
	lockingBytecode: Uint8Array;
	valueSatoshis: bigint;
	token?: LibauthTokenDetails;
}

export const padVmNumber = (num: bigint, length: number): string =>
{
	return binToHex(padMinimallyEncodedVmNumber(bigIntToVmNumber(num), length).slice(0, length));
};

export const getCreatorIncentive = (auctionPrice: bigint, registrationId: bigint): bigint =>
{
	const minimalDeduction = auctionPrice - BigInt(5000);
	const creatorIncentive = (minimalDeduction * (BigInt(1e5) - registrationId) / BigInt(1e5));

	return creatorIncentive;
};

export const getAuctionPrice = (registrationId: bigint, minStartingBid: bigint): bigint =>
{
	const decayPoints = BigInt(minStartingBid) * registrationId * 3n;
	const currentPricePoints = minStartingBid * 1000000n;
	const currentAuctionPrice = (currentPricePoints - decayPoints) / 1000000n;

	return BigInt(Math.max(Number(currentAuctionPrice), 20000));
};

export const libauthOutputToCashScriptOutput = (output: LibauthOutput): Output =>
{
	return {
		to: output.lockingBytecode,
		amount: output.valueSatoshis,
		token: output.token && {
			...output.token,
			category: binToHex(output.token.category),
			nft: output.token.nft && {
				...output.token.nft,
				commitment: binToHex(output.token.nft.commitment),
			},
		},
	};
};

export const getNetworkPrefix = (network: string): 'bitcoincash' | 'bchtest' | 'bchreg' =>
{
	switch(network)
	{
		case Network.MAINNET:
			return 'bitcoincash';
		case Network.TESTNET4:
		case Network.TESTNET3:
		case Network.CHIPNET:
		case Network.MOCKNET:
			return 'bchtest';
		case Network.REGTEST:
			return 'bchreg';
		default:
			return 'bitcoincash';
	}
};

export const getTxOutputs = (tx: Transaction, network: Network = Network.MOCKNET): Output[] =>
{
	return tx.outputs.map((o) =>
	{
		const OP_RETURN = '6a';
		// @ts-ignore
		const scriptHex = binToHex(o.lockingBytecode);

		if(scriptHex.startsWith(OP_RETURN))
		{
			return { to: hexToBin(scriptHex), amount: 0n };
		}

		const prefix = getNetworkPrefix(network);
		// @ts-ignore
		const cashscriptOutput = libauthOutputToCashScriptOutput(o);
		const hasTokens = Boolean(cashscriptOutput.token);
		const result = lockingBytecodeToCashAddress({ bytecode: hexToBin(scriptHex), prefix, tokenSupport: hasTokens });
		if(typeof result === 'string') throw new Error(result);

		return {
			to: result.address,
			// @ts-ignore
			amount: o.valueSatoshis,
			token: cashscriptOutput.token,
		};
	});
};

export const getRegistrationIdCommitment = (newRegistrationId: bigint): string =>
{
	const regIdHex = newRegistrationId.toString(16).padStart(16, '0');
	const regIdBytes = [];
	for(let i = 0; i < regIdHex.length; i += 2)
	{
		regIdBytes.push(regIdHex.slice(i, i + 2));
	}
	const newRegistrationIdCommitment = regIdBytes.reverse().join('');

	return newRegistrationIdCommitment;
};

/**
 * Retrieves the partial bytecode of the Name contract.
 *
 * @param {string} category - The category identifier for the name.
 * @param {Object} options - The options for constructing the Name contract.
 * @param {NetworkProvider} options.provider - The network provider.
 * @param {AddressType} options.addressType - The address type.
 * @returns {string} The partial bytecode of the Name contract.
 */
export const getDomainPartialBytecode = (category: string, options: { provider: NetworkProvider; addressType: AddressType }): string =>
{
	// Reverse the category bytes for use in contract parameters.
	const reversedCategory = binToHex(hexToBin(category).reverse());

	// Placeholder name used for constructing a partial domain contract bytecode.
	const placeholderName = 'test';
	const placeholderNameHex = Array.from(placeholderName).map(char => char.charCodeAt(0).toString(16)
		.padStart(2, '0'))
		.join('');

	const placeTLD = '.bch';
	const placeTLDHex = Array.from(placeTLD).map(char => char.charCodeAt(0).toString(16)
		.padStart(2, '0'))
		.join('');

	// Construct a placeholder name contract to extract partial bytecode.
	const PlaceholderNameContract = new Contract(BitCANNArtifacts.Name, [ placeholderNameHex, placeTLDHex, reversedCategory ], options);
	const sliceIndex = 2 + 64 + 2 + placeholderName.length * 2 + 2 + placeTLD.length * 2;
	const namePartialBytecode = PlaceholderNameContract.bytecode.slice(sliceIndex, PlaceholderNameContract.bytecode.length);

	return namePartialBytecode;
};