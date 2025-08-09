export default {
	'contractName': 'Name',
	'constructorInputs': [
		{
			'name': 'name',
			'type': 'bytes',
		},
		{
			'name': 'tld',
			'type': 'bytes',
		},
		{
			'name': 'nameCategory',
			'type': 'bytes',
		},
	],
	'abi': [
		{
			'name': 'useAuth',
			'inputs': [
				{
					'name': 'authID',
					'type': 'int',
				},
			],
		},
		{
			'name': 'penaliseInvalidName',
			'inputs': [
				{
					'name': 'characterNumber',
					'type': 'int',
				},
			],
		},
		{
			'name': 'resolveOwnerConflict',
			'inputs': [],
		},
		{
			'name': 'burn',
			'inputs': [],
		},
	],
	'bytecode': 'OP_3 OP_PICK OP_0 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_INPUTINDEX OP_OUTPUTTOKENCOMMITMENT OP_EQUALVERIFY OP_4 OP_ROLL OP_1 OP_NUMEQUAL OP_IF OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_1ADD OP_OUTPUTTOKENCATEGORY OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DUP OP_3 OP_PICK OP_5 OP_PICK OP_CAT OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_2 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_1ADD OP_OUTPUTTOKENCOMMITMENT OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_2DROP OP_ELSE OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_ENDIF OP_2DROP OP_2DROP OP_1 OP_ELSE OP_3 OP_PICK OP_1 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_1 OP_UTXOTOKENCOMMITMENT OP_SIZE OP_NIP OP_ROT OP_SIZE OP_NIP OP_SUB OP_1 OP_UTXOTOKENCOMMITMENT OP_SWAP OP_SPLIT OP_DROP OP_8 OP_SPLIT OP_NIP OP_3 OP_PICK OP_SPLIT OP_DROP OP_3 OP_PICK OP_1SUB OP_SPLIT OP_NIP OP_BIN2NUM OP_DUP 2d OP_NUMNOTEQUAL OP_VERIFY OP_DUP 61 7b OP_WITHIN OP_NOT OP_VERIFY OP_DUP 41 5b OP_WITHIN OP_NOT OP_VERIFY 30 3a OP_WITHIN OP_NOT OP_VERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL OP_NIP OP_NIP OP_NIP OP_ELSE OP_3 OP_PICK OP_2 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_4 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_0 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCOMMITMENT OP_1 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_1 OP_UTXOTOKENCOMMITMENT OP_BIN2NUM OP_3 OP_UTXOTOKENCOMMITMENT OP_BIN2NUM OP_LESSTHAN OP_NIP OP_NIP OP_NIP OP_ELSE OP_3 OP_ROLL OP_3 OP_NUMEQUALVERIFY OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_1 OP_NUMEQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_0 OP_EQUAL OP_IF OP_1 OP_INPUTSEQUENCENUMBER 010040 OP_NUMEQUALVERIFY OP_ELSE OP_2 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DROP OP_0 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_ENDIF OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_1 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL OP_NIP OP_NIP OP_ENDIF OP_ENDIF OP_ENDIF',
	'source': 'pragma cashscript 0.11.4;\n\n/**\n * @param name The name of the name.\n * @param tld The TLD of the name.\n * @param nameCategory The category of the name.\n */\ncontract Name(\n  bytes name,\n  bytes tld,\n  bytes nameCategory\n  ) {\n  \n  /**\n   * This function can be used to perform a variety of actions.\n   *\n   * For example:\n   * - It can be used to prove the the ownership of the name by other contracts.\n   * - This function allows the owner to perform any actions in conjunction with other contracts.\n   * - This function can be used to add records and invalidate multiple records in a single transaction.\n   *\n   * Records are created using OP_RETURN outputs. To add a record, include the record data directly in the OP_RETURN output.\n   * To invalidate a record, include the hash of the record content in the OP_RETURN output. This will signal\n   * the library/indexers to exclude the record from the valid records.\n   * \n   * @inputs\n   * - Inputx: Internal/External Auth NFT\n   * - Inputx+1 (optional): Name ownership NFT from the owner\n   * \n   * @outputs\n   * - Outputx: Internal/External Auth NFT returned to this contract\n   * - Outputx+1 (optional): Name NFT returned\n   * \n   */\n  function useAuth(int authID) {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2, "Transaction: Version must be 2 (relative timelocks required)");\n\n    // The activeInputIndex can be anything as long as the utxo properties are preserved and comes back to the\n    // contract without alteration.\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, "Auth input: locking bytecode must match active output");\n    require(tx.inputs[this.activeInputIndex].tokenCategory == nameCategory, "Auth input: token category must match name category");\n    require(tx.outputs[this.activeInputIndex].tokenCategory == nameCategory, "Auth output: token category must match name category");\n    require(tx.inputs[this.activeInputIndex].nftCommitment == tx.outputs[this.activeInputIndex].nftCommitment, "Auth input: NFT commitment must match active output");\n\n    if(authID == 1) {\n      // The next input from the InternalAuthNFT must be the ownershipNFT.\n      require(tx.inputs[this.activeInputIndex + 1].tokenCategory == nameCategory, "Ownership input: ownership NFT token category must match name category");\n      require(tx.outputs[this.activeInputIndex + 1].tokenCategory == tx.inputs[this.activeInputIndex + 1].tokenCategory, "Ownership output: token category must match active input");\n\n      bytes registrationId, bytes nameFromOwnerNFT = tx.inputs[this.activeInputIndex + 1].nftCommitment.split(8);\n      require(nameFromOwnerNFT == name + tld, "Ownership input: ownership NFT name must match contract name + TLD");\n      require(tx.inputs[this.activeInputIndex].nftCommitment == registrationId, "Auth input: internal auth NFT commitment must match ownership NFT registration ID");\n      require(tx.outputs[this.activeInputIndex + 1].nftCommitment == tx.inputs[this.activeInputIndex + 1].nftCommitment, "Ownership output: NFT commitment must match active input");\n\n      // Note only the commitment and category are enforced on the next output index and not the locking bytecode.\n    } else {\n      // One known use of ExternalAuthNFT in the `OwnershipGuard` contract. ExternalAuthNFT is\n      // used to prove that an owner exists.\n      require(tx.inputs[this.activeInputIndex].nftCommitment == 0x, "Auth input: external auth NFT must have empty commitment");\n    }\n  }\n\n  /**\n   * If an invalid name is registered, this function allows anyone to burn the NFTs\n   * @inputs\n   * - Input0: External Auth NFT from self\n   * - Input1: Internal Auth NFT from self\n   * - Input2: BCH input from anyone\n   * \n   * @outputs  \n   * - Output0: BCH change output\n   */\n  function penaliseInvalidName(int characterNumber) {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2, "Transaction: Version must be 2 (relative timelocks required)");\n\n    require(tx.inputs.length == 3, "Transaction: must have exactly 3 inputs");\n    require(tx.outputs.length == 1, "Transaction: must have exactly 1 output");\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode, "Input 0: external auth NFT locking bytecode must match name contract");\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode, "Input 1: internal auth NFT locking bytecode must match name contract");\n\n    require(tx.inputs[0].tokenCategory == nameCategory, "Input 0: external auth NFT token category must match name category");\n    require(tx.inputs[1].tokenCategory == nameCategory, "Input 1: internal auth NFT token category must match name category");\n\n    // External Auth NFT\n    require(tx.inputs[0].nftCommitment == 0x, "Input 0: external auth NFT must have empty commitment");\n\n    // Internal Auth NFT\n    // First 8 bytes are the registrationID and the rest is the name.\n    int sliceEndIndex = tx.inputs[1].nftCommitment.length - tld.length;\n    bytes nameFromNFT = tx.inputs[1].nftCommitment.slice(8, sliceEndIndex);\n\n    bytes characterSplitBytes = nameFromNFT.split(characterNumber)[0];\n    characterNumber = characterNumber - 1;\n    bytes character = characterSplitBytes.split(characterNumber)[1];\n    int charVal = int(character);\n\n    // Character is not a hyphen.\n    require(charVal != 45, "Character is a hyphen"); \n    // Character is not from a-z.\n    require(!within(charVal, 97, 123), "Character is lowercase letter");\n    // Character is not from A-Z.\n    require(!within(charVal, 65, 91), "Character is uppercase letter");\n    // Character is not from 0-9.\n    require(!within(charVal, 48, 58), "Character is digit");\n\n    // Pure BCH, ensures burn\n    require(tx.outputs[0].tokenCategory == 0x, "Output 0: change must be pure BCH (no token category)");\n  }\n\n  /**\n   * If the incentive system fails, i.e `OwnershipGuard` or `AuctionConflictResolver` fails to prevent a\n   * a owner conflict. When this happens there will be > 1 owner for this name.\n   * The owner with the lowest registrationID must be the only owner for this name.\n   * To help enforce this rule, this function will allow anyone to burn both the Auth NFTs of the NEW owner.\n   *\n   * @inputs\n   * - Input0: Valid External Auth NFT from self\n   * - Input1: Valid Internal Auth NFT from self\n   * - Input2: Invalid External Auth NFT from self\n   * - Input3: Invalid Internal Auth NFT from self\n   * - Input4: BCH input from anyone\n   * \n   * @outputs  \n   * - Output0: Valid External Auth NFT back to self\n   * - Output1: Valid Internal Auth NFT back to self\n   * - Output3: BCH change output\n   */\n  function resolveOwnerConflict(){\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2, "Transaction: Version must be 2 (relative timelocks required)");\n\n    require(tx.inputs.length == 5, "Transaction: must have exactly 5 inputs");\n    require(tx.outputs.length == 3, "Transaction: must have exactly 3 outputs");\n\n    // Pure BCH input and output to fund the transaction\n    require(tx.inputs[4].tokenCategory == 0x, "Input 4: funding input must be pure BCH (no token category)");\n    require(tx.outputs[2].tokenCategory == 0x, "Output 2: change must be pure BCH (no token category)");\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode, "Input 0: valid external auth NFT locking bytecode must match name contract");\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode, "Input 1: valid internal auth NFT locking bytecode must match name contract");\n    require(tx.inputs[2].lockingBytecode == selfLockingBytecode, "Input 2: invalid external auth NFT locking bytecode must match name contract");\n    require(tx.inputs[3].lockingBytecode == selfLockingBytecode, "Input 3: invalid internal auth NFT locking bytecode must match name contract");\n\n    require(tx.outputs[0].lockingBytecode == selfLockingBytecode, "Output 0: valid external auth NFT locking bytecode must match name contract");\n    require(tx.outputs[1].lockingBytecode == selfLockingBytecode, "Output 1: valid internal auth NFT locking bytecode must match name contract");\n\n    // External Auth NFTs\n    require(tx.inputs[0].nftCommitment == 0x, "Input 0: valid external auth NFT must have empty commitment");\n    require(tx.inputs[2].nftCommitment == 0x, "Input 2: invalid external auth NFT must have empty commitment");\n\n    // Commitments of Valid Auth NFts back to self\n    require(tx.outputs[0].nftCommitment == 0x, "Output 0: valid external auth NFT must have empty commitment");\n    require(tx.outputs[1].nftCommitment == tx.inputs[1].nftCommitment, "Output 1: valid internal auth NFT commitment must match input 1");\n\n    // Ensure that all the token inputs and outputs have nameCategory\n    require(tx.inputs[0].tokenCategory == nameCategory, "Input 0: valid external auth NFT token category must match name category");\n    require(tx.inputs[1].tokenCategory == nameCategory, "Input 1: valid internal auth NFT token category must match name category");\n    require(tx.inputs[2].tokenCategory == nameCategory, "Input 2: invalid external auth NFT token category must match name category");\n    require(tx.inputs[3].tokenCategory == nameCategory, "Input 3: invalid internal auth NFT token category must match name category");\n\n    require(tx.outputs[0].tokenCategory == nameCategory, "Output 0: valid external auth NFT token category must match name category");\n    require(tx.outputs[1].tokenCategory == nameCategory, "Output 1: valid internal auth NFT token category must match name category");\n\n    // Compare the registrationID\n    require(int(tx.inputs[1].nftCommitment) < int(tx.inputs[3].nftCommitment), "Input 1: valid internal auth NFT registration ID must be lower than input 3");\n  }\n\n  /**\n   * Allows the name owner or anyone to burn the InternalAuthNFT and externalAuthNFT making this name available\n   * for auction.\n   * \n   * - Owner can burn the AuthNFTs anytime.\n   * - External party can burn the AuthNFTs when the internalAuth NFT has not been used for more than `inactivityExpiryTime`.\n   *\n   * @inputs\n   * - Input0: External Auth NFT\n   * - Input1: Internal Auth NFT\n   * - Input2: Pure BCH or Name ownership NFT from the owner\n   *\n   * @outputs \n   * - Output0: BCH change\n   *\n   */\n  function burn() {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    // Need version 2 enforcement for relative timelocks.\n    require(tx.version == 2, "Transaction: Version must be 2 (relative timelocks required)");\n\n    require(tx.inputs.length == 3, "Transaction: must have exactly 3 inputs");\n    require(tx.outputs.length == 1, "Transaction: must have exactly 1 output");\n\n    // If an external party is attempting to burn the authNFTs\n    if (tx.inputs[2].tokenCategory == 0x) {\n      // If pure BCH input, then allow anyone to burn given the time limit has passed.\n      // 4194305 is sequence number in time, 1*512 seconds\n\n      // TODO: Make this 2 years\n      require(tx.inputs[1].sequenceNumber == 4194305, "Input 1: internal auth NFT sequence number must equal inactivity expiry time");\n    } else {\n      // If name ownership NFT input, then allow the owner to burn anytime.\n      require(tx.inputs[2].tokenCategory == nameCategory, "Input 2: name ownership NFT token category must match name category");\n      // Make sure that the registrationID in the nameOwnershipNFT and the internalAuthNFT are the same.\n      require(tx.inputs[2].nftCommitment.split(8)[0] == tx.inputs[0].nftCommitment, "Input 2: name ownership NFT registration ID must match input 0 commitment");\n    }\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode, "Input 0: external auth NFT locking bytecode must match name contract");\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode, "Input 1: internal auth NFT locking bytecode must match name contract");\n\n    // ExternalAuthNFT\n    require(tx.inputs[0].nftCommitment == 0x, "Input 0: external auth NFT must have empty commitment");\n    // Both InternalAuthNFT and externalAuthNFT are immutable and have the same tokenCategory\n    require(tx.inputs[0].tokenCategory == tx.inputs[1].tokenCategory, "Input 0: external auth NFT token category must match input 1");\n    require(tx.inputs[0].tokenCategory == nameCategory, "Input 0: external auth NFT token category must match name category");\n    require(tx.inputs[1].tokenCategory == nameCategory, "Input 1: internal auth NFT token category must match name category");\n\n    // Return the BCH as change.\n    require(tx.outputs[0].tokenCategory == 0x, "Output 0: change must be pure BCH (no token category)");\n  }\n}\n',
	'debug': {
		'bytecode': '5379009c63c2529dc0c7c0cd88c0ce537988c0d1537988c0cfc0d288547a519c63c08bce537988c08bd1c08bce88c08bcf587f76537955797e88c0cf527988c08bd2c08bcf886d67c0cf0088686d6d51675379519c63c2529dc3539dc4519dc0c700c7788851c78800ce53798851ce537a8800cf008851cf82777b82779451cf7c7f75587f7753797f7553798c7f778176012d9e69760161017ba59169760141015ba591690130013aa5916900d10087777777675379529c63c2529dc3559dc4539d54ce008852d10088c0c700c7788851c7788852c7788853c7788800cd788851cd8800cf008852cf008800d2008851d251cf8800ce53798851ce53798852ce53798853ce53798800d153798851d1537a8851cf8153cf819f77777767537a539dc2529dc3539dc4519d52ce00876351cb030100409d6752ce53798852cf587f7500cf8868c0c700c7788851c78800cf008800ce51ce8800ce53798851ce537a8800d100877777686868',
		'sourceMap': '35:2:62:3;;;;;37:12:37:22;:26::27;:4::93:1;41:22:41:43:0;:12::60:1;:75::96:0;:64::113:1;:4::172;42:22:42:43:0;:12::58:1;:62::74:0;;:4::131:1;43:23:43:44:0;:12::59:1;:63::75:0;;:4::133:1;44:22:44:43:0;:12::58:1;:73::94:0;:62::109:1;:4::166;46:7:46:13:0;;:17::18;:7:::1;:20:57:5:0;48:24:48:45;:::49:1;:14::64;:68::80:0;;:6::156:1;49:25:49:46:0;:::50:1;:14::65;:79::100:0;:::104:1;:69::119;:6::181;51:63:51:84:0;:::88:1;:53::103;:110::111:0;:53::112:1;52:14:52:30:0;:34::38;;:41::44;;:34:::1;:6::116;53:24:53:45:0;:14::60:1;:64::78:0;;:6::165:1;54:25:54:46:0;:::50:1;:14::65;:79::100:0;:::104:1;:69::119;:6::181;46:20:57:5;57:11:61::0;60:24:60:45;:14::60:1;:64::66:0;:6::128:1;57:11:61:5;35:2:62:3;;;;74::112::0;;;;;76:12:76:22;:26::27;:4::93:1;78:12:78:28:0;:32::33;:4::78:1;79:12:79:29:0;:33::34;:4::79:1;81:42:81:63:0;:32::80:1;82:22:82:23:0;:12::40:1;:44::63:0;:4::137:1;83:22:83:23:0;:12::40:1;:4::137;85:22:85:23:0;:12::38:1;:42::54:0;;:4::126:1;86:22:86:23:0;:12::38:1;:42::54:0;;:4::126:1;89:22:89:23:0;:12::38:1;:42::44:0;:4::103:1;93:34:93:35:0;:24::50:1;:::57;;:60::63:0;:::70:1;;:24;94:34:94:35:0;:24::50:1;:60::73:0;:24::74:1;;:57::58:0;:24::74:1;;96:50:96:65:0;;:32::66:1;:::69;97:22:97:37:0;;:::41:1;98::98:64;:::67;99:18:99:32;102:12:102:19:0;:23::25;:12:::1;:4::52;104:20:104:27:0;:29::31;:33::36;:13::37:1;:12;:4::72;106:20:106:27:0;:29::31;:33::35;:13::36:1;:12;:4::71;108:29:108:31:0;:33::35;:13::36:1;:12;:4::60;111:23:111:24:0;:12::39:1;:43::45:0;:4::104:1;74:2:112:3;;;;132::171::0;;;;;134:12:134:22;:26::27;:4::93:1;136:12:136:28:0;:32::33;:4::78:1;137:12:137:29:0;:33::34;:4::80:1;140:22:140:23:0;:12::38:1;:42::44:0;:4::109:1;141:23:141:24:0;:12::39:1;:43::45:0;:4::104:1;143:42:143:63:0;:32::80:1;144:22:144:23:0;:12::40:1;:44::63:0;:4::143:1;145:22:145:23:0;:12::40:1;:44::63:0;:4::143:1;146:22:146:23:0;:12::40:1;:44::63:0;:4::145:1;147:22:147:23:0;:12::40:1;:44::63:0;:4::145:1;149:23:149:24:0;:12::41:1;:45::64:0;:4::145:1;150:23:150:24:0;:12::41:1;:4::145;153:22:153:23:0;:12::38:1;:42::44:0;:4::109:1;154:22:154:23:0;:12::38:1;:42::44:0;:4::111:1;157:23:157:24:0;:12::39:1;:43::45:0;:4::111:1;158:23:158:24:0;:12::39:1;:53::54:0;:43::69:1;:4::138;161:22:161:23:0;:12::38:1;:42::54:0;;:4::132:1;162:22:162:23:0;:12::38:1;:42::54:0;;:4::132:1;163:22:163:23:0;:12::38:1;:42::54:0;;:4::134:1;164:22:164:23:0;:12::38:1;:42::54:0;;:4::134:1;166:23:166:24:0;:12::39:1;:43::55:0;;:4::134:1;167:23:167:24:0;:12::39:1;:43::55:0;;:4::134:1;170:26:170:27:0;:16::42:1;:12::43;:60::61:0;:50::76:1;:46::77;:4::158;132:2:171:3;;;;189::224::0;;;;192:12:192:22;:26::27;:4::93:1;194:12:194:28:0;:32::33;:4::78:1;195:12:195:29:0;:33::34;:4::79:1;198:18:198:19:0;:8::34:1;:38::40:0;:8:::1;:42:204:5:0;203:24:203:25;:14::41:1;:45::52:0;:6::134:1;204:11:209:5:0;206:24:206:25;:14::40:1;:44::56:0;;:6::129:1;208:24:208:25:0;:14::40:1;:47::48:0;:14::49:1;:::52;:66::67:0;:56::82:1;:6::161;204:11:209:5;211:42:211:63:0;:32::80:1;212:22:212:23:0;:12::40:1;:44::63:0;:4::137:1;213:22:213:23:0;:12::40:1;:4::137;216:22:216:23:0;:12::38:1;:42::44:0;:4::103:1;218:22:218:23:0;:12::38:1;:52::53:0;:42::68:1;:4::134;219:22:219:23:0;:12::38:1;:42::54:0;;:4::126:1;220:22:220:23:0;:12::38:1;:42::54:0;;:4::126:1;223:23:223:24:0;:12::39:1;:43::45:0;:4::104:1;189:2:224:3;;8:0:225:1;;',
		'logs': [],
		'requires': [
			{
				'ip': 10,
				'line': 37,
				'message': 'Transaction: Version must be 2 (relative timelocks required)',
			},
			{
				'ip': 15,
				'line': 41,
				'message': 'Auth input: locking bytecode must match active output',
			},
			{
				'ip': 20,
				'line': 42,
				'message': 'Auth input: token category must match name category',
			},
			{
				'ip': 25,
				'line': 43,
				'message': 'Auth output: token category must match name category',
			},
			{
				'ip': 30,
				'line': 44,
				'message': 'Auth input: NFT commitment must match active output',
			},
			{
				'ip': 41,
				'line': 48,
				'message': 'Ownership input: ownership NFT token category must match name category',
			},
			{
				'ip': 48,
				'line': 49,
				'message': 'Ownership output: token category must match active input',
			},
			{
				'ip': 60,
				'line': 52,
				'message': 'Ownership input: ownership NFT name must match contract name + TLD',
			},
			{
				'ip': 65,
				'line': 53,
				'message': 'Auth input: internal auth NFT commitment must match ownership NFT registration ID',
			},
			{
				'ip': 72,
				'line': 54,
				'message': 'Ownership output: NFT commitment must match active input',
			},
			{
				'ip': 78,
				'line': 60,
				'message': 'Auth input: external auth NFT must have empty commitment',
			},
			{
				'ip': 91,
				'line': 76,
				'message': 'Transaction: Version must be 2 (relative timelocks required)',
			},
			{
				'ip': 94,
				'line': 78,
				'message': 'Transaction: must have exactly 3 inputs',
			},
			{
				'ip': 97,
				'line': 79,
				'message': 'Transaction: must have exactly 1 output',
			},
			{
				'ip': 103,
				'line': 82,
				'message': 'Input 0: external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 106,
				'line': 83,
				'message': 'Input 1: internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 111,
				'line': 85,
				'message': 'Input 0: external auth NFT token category must match name category',
			},
			{
				'ip': 116,
				'line': 86,
				'message': 'Input 1: internal auth NFT token category must match name category',
			},
			{
				'ip': 120,
				'line': 89,
				'message': 'Input 0: external auth NFT must have empty commitment',
			},
			{
				'ip': 150,
				'line': 102,
				'message': 'Character is a hyphen',
			},
			{
				'ip': 156,
				'line': 104,
				'message': 'Character is lowercase letter',
			},
			{
				'ip': 162,
				'line': 106,
				'message': 'Character is uppercase letter',
			},
			{
				'ip': 167,
				'line': 108,
				'message': 'Character is digit',
			},
			{
				'ip': 172,
				'line': 111,
				'message': 'Output 0: change must be pure BCH (no token category)',
			},
			{
				'ip': 183,
				'line': 134,
				'message': 'Transaction: Version must be 2 (relative timelocks required)',
			},
			{
				'ip': 186,
				'line': 136,
				'message': 'Transaction: must have exactly 5 inputs',
			},
			{
				'ip': 189,
				'line': 137,
				'message': 'Transaction: must have exactly 3 outputs',
			},
			{
				'ip': 193,
				'line': 140,
				'message': 'Input 4: funding input must be pure BCH (no token category)',
			},
			{
				'ip': 197,
				'line': 141,
				'message': 'Output 2: change must be pure BCH (no token category)',
			},
			{
				'ip': 203,
				'line': 144,
				'message': 'Input 0: valid external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 207,
				'line': 145,
				'message': 'Input 1: valid internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 211,
				'line': 146,
				'message': 'Input 2: invalid external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 215,
				'line': 147,
				'message': 'Input 3: invalid internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 219,
				'line': 149,
				'message': 'Output 0: valid external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 222,
				'line': 150,
				'message': 'Output 1: valid internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 226,
				'line': 153,
				'message': 'Input 0: valid external auth NFT must have empty commitment',
			},
			{
				'ip': 230,
				'line': 154,
				'message': 'Input 2: invalid external auth NFT must have empty commitment',
			},
			{
				'ip': 234,
				'line': 157,
				'message': 'Output 0: valid external auth NFT must have empty commitment',
			},
			{
				'ip': 239,
				'line': 158,
				'message': 'Output 1: valid internal auth NFT commitment must match input 1',
			},
			{
				'ip': 244,
				'line': 161,
				'message': 'Input 0: valid external auth NFT token category must match name category',
			},
			{
				'ip': 249,
				'line': 162,
				'message': 'Input 1: valid internal auth NFT token category must match name category',
			},
			{
				'ip': 254,
				'line': 163,
				'message': 'Input 2: invalid external auth NFT token category must match name category',
			},
			{
				'ip': 259,
				'line': 164,
				'message': 'Input 3: invalid internal auth NFT token category must match name category',
			},
			{
				'ip': 264,
				'line': 166,
				'message': 'Output 0: valid external auth NFT token category must match name category',
			},
			{
				'ip': 269,
				'line': 167,
				'message': 'Output 1: valid internal auth NFT token category must match name category',
			},
			{
				'ip': 277,
				'line': 170,
				'message': 'Input 1: valid internal auth NFT registration ID must be lower than input 3',
			},
			{
				'ip': 287,
				'line': 192,
				'message': 'Transaction: Version must be 2 (relative timelocks required)',
			},
			{
				'ip': 290,
				'line': 194,
				'message': 'Transaction: must have exactly 3 inputs',
			},
			{
				'ip': 293,
				'line': 195,
				'message': 'Transaction: must have exactly 1 output',
			},
			{
				'ip': 302,
				'line': 203,
				'message': 'Input 1: internal auth NFT sequence number must equal inactivity expiry time',
			},
			{
				'ip': 308,
				'line': 206,
				'message': 'Input 2: name ownership NFT token category must match name category',
			},
			{
				'ip': 316,
				'line': 208,
				'message': 'Input 2: name ownership NFT registration ID must match input 0 commitment',
			},
			{
				'ip': 323,
				'line': 212,
				'message': 'Input 0: external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 326,
				'line': 213,
				'message': 'Input 1: internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 330,
				'line': 216,
				'message': 'Input 0: external auth NFT must have empty commitment',
			},
			{
				'ip': 335,
				'line': 218,
				'message': 'Input 0: external auth NFT token category must match input 1',
			},
			{
				'ip': 340,
				'line': 219,
				'message': 'Input 0: external auth NFT token category must match name category',
			},
			{
				'ip': 345,
				'line': 220,
				'message': 'Input 1: internal auth NFT token category must match name category',
			},
			{
				'ip': 350,
				'line': 223,
				'message': 'Output 0: change must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.4',
	},
	'updatedAt': '2025-08-09T22:39:26.021Z',
};
