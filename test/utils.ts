import { cashAddressToLockingBytecode,
	encodeLockingBytecodeP2sh32,
	lockingBytecodeToCashAddress,
	hash256,
	hexToBin,
	binToHex,
	numberToBinUint16BE } from '@bitauth/libauth';
import { type Output, Network, Transaction } from 'cashscript';

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


export const getAuctionPrice = (registrationId: number, minStartingBid: number): number =>
{
	const decayPoints = minStartingBid * registrationId * 3;
	const currentPricePoints = minStartingBid * 1e6;
	const currentAuctionPrice = (currentPricePoints - decayPoints) / 1e6;

	return Math.max(currentAuctionPrice, 20000);
};

export const intToBytesToHex = ({ value, length }: { value: number; length: number }): string =>
{
	const bin = numberToBinUint16BE(value);
	const bytes = new Uint8Array(bin.buffer, bin.byteOffset, bin.byteLength);
	if(bytes.length > length)
	{
		throw new Error(`Value ${value} exceeds the specified length of ${length} bytes`);
	}
	const result = new Uint8Array(length);
	result.set(bytes, length - bytes.length);

	return binToHex(result);
};

export const hexToInt = (hex: string): number =>
{
	const bytes = hexToBin(hex);
	let intValue = 0;
	for(let i = 0; i < bytes.length; i++)
	{
		intValue = (intValue << 8) | bytes[i];
	}

	return intValue;
};

export const pushDataHex = (data: string): string =>
{
	const hexData = Buffer.from(data, 'utf8').toString('hex');
	const length = hexData.length / 2;

	if(length <= 75)
	{
		return length.toString(16).padStart(2, '0') + hexData;
	}
	else if(length <= 255)
	{
		return '4c' + length.toString(16).padStart(2, '0') + hexData;
	}
	else if(length <= 65535)
	{
		return '4d' + length.toString(16).padStart(4, '0') + hexData;
	}
	else
	{
		return '4e' + length.toString(16).padStart(8, '0') + hexData;
	}
};

export const findOwnershipNFTUTXO = (utxos: any[], category: string): any =>
{
	const utxo = utxos.find((u: any) =>
		u.token?.nft?.capability === 'none' && u.token?.category === category,
	);
	if(!utxo) throw new Error('Could not find ownership NFT UTXO');

	return utxo;
};

export const findPureUTXO = (utxos: any[]): any =>
{
	const utxo = utxos.reduce((max: any, u: any) =>
		(!u.token && u.satoshis > (max?.satoshis || 0)) ? u : max,
	null,
	);
	if(!utxo) throw new Error('Could not find user UTXO without token');

	return utxo;
};

export const lockScriptToAddress = (lockScript: string): string =>
{
	// Convert the lock script to a cashaddress (with bitcoincash: prefix).
	const result = lockingBytecodeToCashAddress({ bytecode: hexToBin(lockScript), prefix: 'bitcoincash' });
	// A successful conversion will result in a string, unsuccessful will return AddressContents

	console.log('result: ', result);

	// @ts-ignore
	if(typeof result.address !== 'string')
	{
		throw(new Error(`Provided lock script ${lockScript} cannot be converted to address ${JSON.stringify(result)}`));
	}

	// @ts-ignore
	return result.address;
};

export const buildLockScriptP2SH32 = (scriptBytecodeHex: string): string =>
{
	// Hash the lockscript for p2sh32 (using hash256)
	const scriptHashBin = hash256(hexToBin(scriptBytecodeHex));

	// Get the lockscript
	const lockScriptBin = encodeLockingBytecodeP2sh32(scriptHashBin);

	// Convert back to the library's convention of hex
	const lockScriptHex = binToHex(lockScriptBin);

	return lockScriptHex;
};


export const addressToLockScript = (address: string): string =>
{
	const result = cashAddressToLockingBytecode(address);

	// The `cashAddressToLockingBytecode()` call returns an error string OR the correct bytecode
	// so we check if it errors, in which case we throw the error, otherwise return the result
	if(typeof result === 'string') throw(new Error(result));

	const lockScript = binToHex(result.bytecode);

	return lockScript;
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

export const getRegistrationIdCommitment = (newRegistrationId: number): string =>
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
