import {
  cashAddressToLockingBytecode,
  encodeLockingBytecodeP2sh32,
  lockingBytecodeToCashAddress,
  hash256,
  hexToBin,
  binToHex
} from '@bitauth/libauth';

export function pushDataHex(data) {
  const hexData = Buffer.from(data, 'utf8').toString('hex');
  const length = hexData.length / 2;
  
  if (length <= 75) {
      return length.toString(16).padStart(2, '0') + hexData;
  } else if (length <= 255) {
      return '4c' + length.toString(16).padStart(2, '0') + hexData;
  } else if (length <= 65535) {
      return '4d' + length.toString(16).padStart(4, '0') + hexData;
  } else {
      return '4e' + length.toString(16).padStart(8, '0') + hexData;
  }
}

export const findPureUTXO = (utxos) => {
  const utxo = utxos.reduce((max, utxo) => 
    (!utxo.token && utxo.satoshis > (max?.satoshis || 0)) ? utxo : max, 
    null
  );
  if (!utxo) throw new Error('Could not find user UTXO without token');

  return utxo
}

export const lockScriptToAddress = function(lockScript){
	// Convert the lock script to a cashaddress (with bitcoincash: prefix).
	const result = lockingBytecodeToCashAddress({bytecode: hexToBin(lockScript), prefix: 'bitcoincash'});
	// A successful conversion will result in a string, unsuccessful will return AddressContents

  console.log('result: ', result)

	if(typeof result.address !== 'string')
	{
		throw(new Error(`Provided lock script ${lockScript} cannot be converted to address ${JSON.stringify(result)}`));
	}

	return result.address;
};

export const buildLockScriptP2SH32 = function(scriptBytecodeHex){
	// Hash the lockscript for p2sh32 (using hash256)
	const scriptHashBin = hash256(hexToBin(scriptBytecodeHex));

	// Get the lockscript
	const lockScriptBin = encodeLockingBytecodeP2sh32(scriptHashBin);

	// Convert back to the library's convention of hex
	const lockScriptHex = binToHex(lockScriptBin);

	return lockScriptHex;
};


export const addressToLockScript = function(address)
{
	const result = cashAddressToLockingBytecode(address);

	// The `cashAddressToLockingBytecode()` call returns an error string OR the correct bytecode
	// so we check if it errors, in which case we throw the error, otherwise return the result
	if(typeof result === 'string') throw(new Error(result));

	const lockScript = binToHex(result.bytecode);

	return lockScript;
};
