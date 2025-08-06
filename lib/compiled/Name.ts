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
	'bytecode': 'OP_3 OP_PICK OP_0 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_INPUTINDEX OP_OUTPUTTOKENCOMMITMENT OP_EQUALVERIFY OP_4 OP_ROLL OP_1 OP_NUMEQUAL OP_IF OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DUP OP_3 OP_PICK OP_5 OP_PICK OP_CAT OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_2 OP_PICK OP_EQUALVERIFY OP_2DROP OP_ELSE OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_ENDIF OP_2DROP OP_2DROP OP_1 OP_ELSE OP_3 OP_PICK OP_1 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_1 OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_NIP OP_ROT OP_SIZE OP_NIP OP_SPLIT OP_DROP OP_3 OP_PICK OP_SPLIT OP_DROP OP_3 OP_PICK OP_1SUB OP_SPLIT OP_NIP OP_BIN2NUM OP_DUP 2d OP_NUMNOTEQUAL OP_VERIFY OP_DUP 61 7b OP_WITHIN OP_NOT OP_VERIFY OP_DUP 41 5b OP_WITHIN OP_NOT OP_VERIFY 30 3a OP_WITHIN OP_NOT OP_VERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL OP_NIP OP_NIP OP_NIP OP_ELSE OP_3 OP_PICK OP_2 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_4 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_0 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCOMMITMENT OP_1 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_1 OP_UTXOTOKENCOMMITMENT OP_BIN2NUM OP_3 OP_UTXOTOKENCOMMITMENT OP_BIN2NUM OP_LESSTHAN OP_NIP OP_NIP OP_NIP OP_ELSE OP_3 OP_ROLL OP_3 OP_NUMEQUALVERIFY OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_1 OP_NUMEQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_0 OP_EQUAL OP_IF OP_1 OP_INPUTSEQUENCENUMBER 010040 OP_NUMEQUALVERIFY OP_ELSE OP_2 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DROP OP_0 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_ENDIF OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_1 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL OP_NIP OP_NIP OP_ENDIF OP_ENDIF OP_ENDIF',
	'source': 'pragma cashscript 0.11.3;\n\n/**\n * @param name The name of the name.\n * @param tld The TLD of the name.\n * @param nameCategory The category of the name.\n */\ncontract Name(\n  bytes name,\n  bytes tld,\n  bytes nameCategory\n  ) {\n  \n  /**\n   * This function can be used to perform a variety of actions.\n   *\n   * For example:\n   * - It can be used to prove the the ownership of the name by other contracts.\n   * - This function allows the owner to perform any actions in conjunction with other contracts.\n   * - This function can be used to add records and invalidate multiple records in a single transaction.\n   *\n   * Records are created using OP_RETURN outputs. To add a record, include the record data directly in the OP_RETURN output.\n   * To invalidate a record, prefix "RMV" followed by the hash of the record content in the OP_RETURN output. This will signal\n   * the library/indexers to exclude the record from the valid records.\n   * \n   * @inputs\n   * - Inputx: Internal/External Auth NFT\n   * - Inputx+1 (optional): Name ownership NFT from the owner\n   * \n   * @outputs\n   * - Outputx: Internal/External Auth NFT returned to this contract\n   * - Outputx+1 (optional): Name NFT returned\n   * \n   */\n  function useAuth(int authID) {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2, "Name: transaction version must be 2 (relative timelocks required)");\n\n    // The activeInputIndex can be anything as long as the utxo properties are preserved and comes back to the\n    // contract without alteration.\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, "Active input: locking bytecode must match active output");\n    require(tx.inputs[this.activeInputIndex].tokenCategory == nameCategory, "Active input: token category must match name category");\n    require(tx.outputs[this.activeInputIndex].tokenCategory == nameCategory, "Active output: token category must match name category");\n    require(tx.inputs[this.activeInputIndex].nftCommitment == tx.outputs[this.activeInputIndex].nftCommitment, "Active input: NFT commitment must match active output");\n\n    if(authID == 1) {\n      // The next input from the InternalAuthNFT must be the ownershipNFT.\n      require(tx.inputs[this.activeInputIndex + 1].tokenCategory == nameCategory, "Next input: ownership NFT token category must match name category");\n      bytes registrationId, bytes nameFromOwnerNFT = tx.inputs[this.activeInputIndex + 1].nftCommitment.split(8);\n      require(nameFromOwnerNFT == name + tld, "Next input: ownership NFT name must match contract name + TLD");\n      require(tx.inputs[this.activeInputIndex].nftCommitment == registrationId, "Active input: internal auth NFT commitment must match ownership NFT registration ID");\n    } else {\n      // One known use of ExternalAuthNFT in the `NameOwnershipGuard` contract. ExternalAuthNFT is\n      // used to prove that an owner exists.\n      require(tx.inputs[this.activeInputIndex].nftCommitment == 0x, "Active input: external auth NFT must have empty commitment");\n    }\n  }\n\n  /**\n   * If an invalid name is registered, this function allows anyone to burn the NFTs\n   * @inputs\n   * - Input0: External Auth NFT from self\n   * - Input1: Internal Auth NFT from self\n   * - Input2: BCH input from anyone\n   * \n   * @outputs  \n   * - Output0: BCH change output\n   */\n  function penaliseInvalidName(int characterNumber) {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2, "Name: transaction version must be 2 (relative timelocks required)");\n\n    require(tx.inputs.length == 3, "Transaction: must have exactly 3 inputs");\n    require(tx.outputs.length == 1, "Transaction: must have exactly 1 output");\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode, "Input 0: external auth NFT locking bytecode must match name contract");\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode, "Input 1: internal auth NFT locking bytecode must match name contract");\n\n    require(tx.inputs[0].tokenCategory == nameCategory, "Input 0: external auth NFT token category must match name category");\n    require(tx.inputs[1].tokenCategory == nameCategory, "Input 1: internal auth NFT token category must match name category");\n\n    // External Auth NFT\n    require(tx.inputs[0].nftCommitment == 0x, "Input 0: external auth NFT must have empty commitment");\n\n    // Internal Auth NFT\n    // First 8 bytes are the registrationID and the rest is the name.\n    bytes fullName = tx.inputs[1].nftCommitment.split(8)[1];\n    bytes nameFromNFT = fullName.split(tld.length)[0];\n\n    bytes characterSplitBytes = nameFromNFT.split(characterNumber)[0];\n    characterNumber = characterNumber - 1;\n    bytes character = characterSplitBytes.split(characterNumber)[1];\n    int charVal = int(character);\n\n    // Character is not a hyphen.\n    require(charVal != 45, "Character is a hyphen"); \n    // Character is not from a-z.\n    require(!within(charVal, 97, 123), "Character is lowercase letter");\n    // Character is not from A-Z.\n    require(!within(charVal, 65, 91), "Character is uppercase letter");\n    // Character is not from 0-9.\n    require(!within(charVal, 48, 58), "Character is digit");\n\n    // Pure BCH, ensures burn\n    require(tx.outputs[0].tokenCategory == 0x, "Output 0: change must be pure BCH (no token category)");\n  }\n\n  /**\n   * If the incentive system fails, i.e `NameOwnershipGuard` or `AuctionConflictResolver` fails to prevent a\n   * a owner conflict. When this happens there will be > 1 owner for this name.\n   * The owner with the lowest registrationID must be the only owner for this name.\n   * To help enforce this rule, this function will allow anyone to burn both the Auth NFTs of the NEW owner.\n   *\n   * @inputs\n   * - Input0: Valid External Auth NFT from self\n   * - Input1: Valid Internal Auth NFT from self\n   * - Input2: Invalid External Auth NFT from self\n   * - Input3: Invalid Internal Auth NFT from self\n   * - Input4: BCH input from anyone\n   * \n   * @outputs  \n   * - Output0: Valid External Auth NFT back to self\n   * - Output1: Valid Internal Auth NFT back to self\n   * - Output3: BCH change output\n   */\n  function resolveOwnerConflict(){\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2, "Name: transaction version must be 2 (relative timelocks required)");\n\n    require(tx.inputs.length == 5, "Transaction: must have exactly 5 inputs");\n    require(tx.outputs.length == 3, "Transaction: must have exactly 3 outputs");\n\n    // Pure BCH input and output to fund the transaction\n    require(tx.inputs[4].tokenCategory == 0x, "Input 4: funding input must be pure BCH (no token category)");\n    require(tx.outputs[2].tokenCategory == 0x, "Output 2: change must be pure BCH (no token category)");\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode, "Input 0: valid external auth NFT locking bytecode must match name contract");\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode, "Input 1: valid internal auth NFT locking bytecode must match name contract");\n    require(tx.inputs[2].lockingBytecode == selfLockingBytecode, "Input 2: invalid external auth NFT locking bytecode must match name contract");\n    require(tx.inputs[3].lockingBytecode == selfLockingBytecode, "Input 3: invalid internal auth NFT locking bytecode must match name contract");\n\n    require(tx.outputs[0].lockingBytecode == selfLockingBytecode, "Output 0: valid external auth NFT locking bytecode must match name contract");\n    require(tx.outputs[1].lockingBytecode == selfLockingBytecode, "Output 1: valid internal auth NFT locking bytecode must match name contract");\n\n    // External Auth NFTs\n    require(tx.inputs[0].nftCommitment == 0x, "Input 0: valid external auth NFT must have empty commitment");\n    require(tx.inputs[2].nftCommitment == 0x, "Input 2: invalid external auth NFT must have empty commitment");\n\n    // Commitments of Valid Auth NFts back to self\n    require(tx.outputs[0].nftCommitment == 0x, "Output 0: valid external auth NFT must have empty commitment");\n    require(tx.outputs[1].nftCommitment == tx.inputs[1].nftCommitment, "Output 1: valid internal auth NFT commitment must match input 1");\n\n    // Ensure that all the token inputs and outputs have nameCategory\n    require(tx.inputs[0].tokenCategory == nameCategory, "Input 0: valid external auth NFT token category must match name category");\n    require(tx.inputs[1].tokenCategory == nameCategory, "Input 1: valid internal auth NFT token category must match name category");\n    require(tx.inputs[2].tokenCategory == nameCategory, "Input 2: invalid external auth NFT token category must match name category");\n    require(tx.inputs[3].tokenCategory == nameCategory, "Input 3: invalid internal auth NFT token category must match name category");\n\n    require(tx.outputs[0].tokenCategory == nameCategory, "Output 0: valid external auth NFT token category must match name category");\n    require(tx.outputs[1].tokenCategory == nameCategory, "Output 1: valid internal auth NFT token category must match name category");\n\n    // Compare the registrationID\n    require(int(tx.inputs[1].nftCommitment) < int(tx.inputs[3].nftCommitment), "Input 1: valid internal auth NFT registration ID must be lower than input 3");\n  }\n\n  /**\n   * Allows the name owner or anyone to burn the InternalAuthNFT and externalAuthNFT making this name available\n   * for auction.\n   * \n   * - Owner can burn the AuthNFTs anytime.\n   * - External party can burn the AuthNFTs when the internalAuth NFT has not been used for more than `inactivityExpiryTime`.\n   *\n   * @inputs\n   * - Input0: External Auth NFT\n   * - Input1: Internal Auth NFT\n   * - Input2: Pure BCH or Name ownership NFT from the owner\n   *\n   * @outputs \n   * - Output0: BCH change\n   *\n   */\n  function burn() {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    // Need version 2 enforcement for relative timelocks.\n    require(tx.version == 2, "Name: transaction version must be 2 (relative timelocks required)");\n\n    require(tx.inputs.length == 3, "Transaction: must have exactly 3 inputs");\n    require(tx.outputs.length == 1, "Transaction: must have exactly 1 output");\n\n    // If an external party is attempting to burn the authNFTs\n    if (tx.inputs[2].tokenCategory == 0x) {\n      // If pure BCH input, then allow anyone to burn given the time limit has passed.\n      // 4194305 is sequence number in time, 1*512 seconds\n\n      // TODO: Make this 2 years\n      require(tx.inputs[1].sequenceNumber == 4194305, "Input 1: internal auth NFT sequence number must equal inactivity expiry time");\n    } else {\n      // If name ownership NFT input, then allow the owner to burn anytime.\n      require(tx.inputs[2].tokenCategory == nameCategory, "Input 2: name ownership NFT token category must match name category");\n      // Make sure that the registrationID in the nameOwnershipNFT and the internalAuthNFT are the same.\n      require(tx.inputs[2].nftCommitment.split(8)[0] == tx.inputs[0].nftCommitment, "Input 2: name ownership NFT registration ID must match input 0 commitment");\n    }\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode, "Input 0: external auth NFT locking bytecode must match name contract");\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode, "Input 1: internal auth NFT locking bytecode must match name contract");\n\n    // ExternalAuthNFT\n    require(tx.inputs[0].nftCommitment == 0x, "Input 0: external auth NFT must have empty commitment");\n    // Both InternalAuthNFT and externalAuthNFT are immutable and have the same tokenCategory\n    require(tx.inputs[0].tokenCategory == tx.inputs[1].tokenCategory, "Input 0: external auth NFT token category must match input 1");\n    require(tx.inputs[0].tokenCategory == nameCategory, "Input 0: external auth NFT token category must match name category");\n    require(tx.inputs[1].tokenCategory == nameCategory, "Input 1: internal auth NFT token category must match name category");\n\n    // Return the BCH as change.\n    require(tx.outputs[0].tokenCategory == 0x, "Output 0: change must be pure BCH (no token category)");\n  }\n}\n',
	'debug': {
		'bytecode': '5379009c63c2529dc0c7c0cd88c0ce537988c0d1537988c0cfc0d288547a519c63c08bce537988c08bcf587f76537955797e88c0cf5279886d67c0cf0088686d6d51675379519c63c2529dc3539dc4519dc0c700c7788851c78800ce53798851ce537a8800cf008851cf587f777b82777f7553797f7553798c7f778176012d9e69760161017ba59169760141015ba591690130013aa5916900d10087777777675379529c63c2529dc3559dc4539d54ce008852d10088c0c700c7788851c7788852c7788853c7788800cd788851cd8800cf008852cf008800d2008851d251cf8800ce53798851ce53798852ce53798853ce53798800d153798851d1537a8851cf8153cf819f77777767537a539dc2529dc3539dc4519d52ce00876351cb030100409d6752ce53798852cf587f7500cf8868c0c700c7788851c78800cf008800ce51ce8800ce53798851ce537a8800d100877777686868',
		'sourceMap': '35:2:57:3;;;;;37:12:37:22;:26::27;:4::98:1;41:22:41:43:0;:12::60:1;:75::96:0;:64::113:1;:4::174;42:22:42:43:0;:12::58:1;:62::74:0;;:4::133:1;43:23:43:44:0;:12::59:1;:63::75:0;;:4::135:1;44:22:44:43:0;:12::58:1;:73::94:0;:62::109:1;:4::168;46:7:46:13:0;;:17::18;:7:::1;:20:52:5:0;48:24:48:45;:::49:1;:14::64;:68::80:0;;:6::151:1;49:63:49:84:0;:::88:1;:53::103;:110::111:0;:53::112:1;50:14:50:30:0;:34::38;;:41::44;;:34:::1;:6::111;51:24:51:45:0;:14::60:1;:64::78:0;;:6::167:1;46:20:52:5;52:11:56::0;55:24:55:45;:14::60:1;:64::66:0;:6::130:1;52:11:56:5;35:2:57:3;;;;69::107::0;;;;;71:12:71:22;:26::27;:4::98:1;73:12:73:28:0;:32::33;:4::78:1;74:12:74:29:0;:33::34;:4::79:1;76:42:76:63:0;:32::80:1;77:22:77:23:0;:12::40:1;:44::63:0;:4::137:1;78:22:78:23:0;:12::40:1;:4::137;80:22:80:23:0;:12::38:1;:42::54:0;;:4::126:1;81:22:81:23:0;:12::38:1;:42::54:0;;:4::126:1;84:22:84:23:0;:12::38:1;:42::44:0;:4::103:1;88:31:88:32:0;:21::47:1;:54::55:0;:21::56:1;:::59;89:39:89:42:0;:::49:1;;:24::50;:::53;91:50:91:65:0;;:32::66:1;:::69;92:22:92:37:0;;:::41:1;93::93:64;:::67;94:18:94:32;97:12:97:19:0;:23::25;:12:::1;:4::52;99:20:99:27:0;:29::31;:33::36;:13::37:1;:12;:4::72;101:20:101:27:0;:29::31;:33::35;:13::36:1;:12;:4::71;103:29:103:31:0;:33::35;:13::36:1;:12;:4::60;106:23:106:24:0;:12::39:1;:43::45:0;:4::104:1;69:2:107:3;;;;127::166::0;;;;;129:12:129:22;:26::27;:4::98:1;131:12:131:28:0;:32::33;:4::78:1;132:12:132:29:0;:33::34;:4::80:1;135:22:135:23:0;:12::38:1;:42::44:0;:4::109:1;136:23:136:24:0;:12::39:1;:43::45:0;:4::104:1;138:42:138:63:0;:32::80:1;139:22:139:23:0;:12::40:1;:44::63:0;:4::143:1;140:22:140:23:0;:12::40:1;:44::63:0;:4::143:1;141:22:141:23:0;:12::40:1;:44::63:0;:4::145:1;142:22:142:23:0;:12::40:1;:44::63:0;:4::145:1;144:23:144:24:0;:12::41:1;:45::64:0;:4::145:1;145:23:145:24:0;:12::41:1;:4::145;148:22:148:23:0;:12::38:1;:42::44:0;:4::109:1;149:22:149:23:0;:12::38:1;:42::44:0;:4::111:1;152:23:152:24:0;:12::39:1;:43::45:0;:4::111:1;153:23:153:24:0;:12::39:1;:53::54:0;:43::69:1;:4::138;156:22:156:23:0;:12::38:1;:42::54:0;;:4::132:1;157:22:157:23:0;:12::38:1;:42::54:0;;:4::132:1;158:22:158:23:0;:12::38:1;:42::54:0;;:4::134:1;159:22:159:23:0;:12::38:1;:42::54:0;;:4::134:1;161:23:161:24:0;:12::39:1;:43::55:0;;:4::134:1;162:23:162:24:0;:12::39:1;:43::55:0;;:4::134:1;165:26:165:27:0;:16::42:1;:12::43;:60::61:0;:50::76:1;:46::77;:4::158;127:2:166:3;;;;184::219::0;;;;187:12:187:22;:26::27;:4::98:1;189:12:189:28:0;:32::33;:4::78:1;190:12:190:29:0;:33::34;:4::79:1;193:18:193:19:0;:8::34:1;:38::40:0;:8:::1;:42:199:5:0;198:24:198:25;:14::41:1;:45::52:0;:6::134:1;199:11:204:5:0;201:24:201:25;:14::40:1;:44::56:0;;:6::129:1;203:24:203:25:0;:14::40:1;:47::48:0;:14::49:1;:::52;:66::67:0;:56::82:1;:6::161;199:11:204:5;206:42:206:63:0;:32::80:1;207:22:207:23:0;:12::40:1;:44::63:0;:4::137:1;208:22:208:23:0;:12::40:1;:4::137;211:22:211:23:0;:12::38:1;:42::44:0;:4::103:1;213:22:213:23:0;:12::38:1;:52::53:0;:42::68:1;:4::134;214:22:214:23:0;:12::38:1;:42::54:0;;:4::126:1;215:22:215:23:0;:12::38:1;:42::54:0;;:4::126:1;218:23:218:24:0;:12::39:1;:43::45:0;:4::104:1;184:2:219:3;;8:0:220:1;;',
		'logs': [],
		'requires': [
			{
				'ip': 10,
				'line': 37,
				'message': 'Name: transaction version must be 2 (relative timelocks required)',
			},
			{
				'ip': 15,
				'line': 41,
				'message': 'Active input: locking bytecode must match active output',
			},
			{
				'ip': 20,
				'line': 42,
				'message': 'Active input: token category must match name category',
			},
			{
				'ip': 25,
				'line': 43,
				'message': 'Active output: token category must match name category',
			},
			{
				'ip': 30,
				'line': 44,
				'message': 'Active input: NFT commitment must match active output',
			},
			{
				'ip': 41,
				'line': 48,
				'message': 'Next input: ownership NFT token category must match name category',
			},
			{
				'ip': 53,
				'line': 50,
				'message': 'Next input: ownership NFT name must match contract name + TLD',
			},
			{
				'ip': 58,
				'line': 51,
				'message': 'Active input: internal auth NFT commitment must match ownership NFT registration ID',
			},
			{
				'ip': 64,
				'line': 55,
				'message': 'Active input: external auth NFT must have empty commitment',
			},
			{
				'ip': 77,
				'line': 71,
				'message': 'Name: transaction version must be 2 (relative timelocks required)',
			},
			{
				'ip': 80,
				'line': 73,
				'message': 'Transaction: must have exactly 3 inputs',
			},
			{
				'ip': 83,
				'line': 74,
				'message': 'Transaction: must have exactly 1 output',
			},
			{
				'ip': 89,
				'line': 77,
				'message': 'Input 0: external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 92,
				'line': 78,
				'message': 'Input 1: internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 97,
				'line': 80,
				'message': 'Input 0: external auth NFT token category must match name category',
			},
			{
				'ip': 102,
				'line': 81,
				'message': 'Input 1: internal auth NFT token category must match name category',
			},
			{
				'ip': 106,
				'line': 84,
				'message': 'Input 0: external auth NFT must have empty commitment',
			},
			{
				'ip': 130,
				'line': 97,
				'message': 'Character is a hyphen',
			},
			{
				'ip': 136,
				'line': 99,
				'message': 'Character is lowercase letter',
			},
			{
				'ip': 142,
				'line': 101,
				'message': 'Character is uppercase letter',
			},
			{
				'ip': 147,
				'line': 103,
				'message': 'Character is digit',
			},
			{
				'ip': 152,
				'line': 106,
				'message': 'Output 0: change must be pure BCH (no token category)',
			},
			{
				'ip': 163,
				'line': 129,
				'message': 'Name: transaction version must be 2 (relative timelocks required)',
			},
			{
				'ip': 166,
				'line': 131,
				'message': 'Transaction: must have exactly 5 inputs',
			},
			{
				'ip': 169,
				'line': 132,
				'message': 'Transaction: must have exactly 3 outputs',
			},
			{
				'ip': 173,
				'line': 135,
				'message': 'Input 4: funding input must be pure BCH (no token category)',
			},
			{
				'ip': 177,
				'line': 136,
				'message': 'Output 2: change must be pure BCH (no token category)',
			},
			{
				'ip': 183,
				'line': 139,
				'message': 'Input 0: valid external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 187,
				'line': 140,
				'message': 'Input 1: valid internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 191,
				'line': 141,
				'message': 'Input 2: invalid external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 195,
				'line': 142,
				'message': 'Input 3: invalid internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 199,
				'line': 144,
				'message': 'Output 0: valid external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 202,
				'line': 145,
				'message': 'Output 1: valid internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 206,
				'line': 148,
				'message': 'Input 0: valid external auth NFT must have empty commitment',
			},
			{
				'ip': 210,
				'line': 149,
				'message': 'Input 2: invalid external auth NFT must have empty commitment',
			},
			{
				'ip': 214,
				'line': 152,
				'message': 'Output 0: valid external auth NFT must have empty commitment',
			},
			{
				'ip': 219,
				'line': 153,
				'message': 'Output 1: valid internal auth NFT commitment must match input 1',
			},
			{
				'ip': 224,
				'line': 156,
				'message': 'Input 0: valid external auth NFT token category must match name category',
			},
			{
				'ip': 229,
				'line': 157,
				'message': 'Input 1: valid internal auth NFT token category must match name category',
			},
			{
				'ip': 234,
				'line': 158,
				'message': 'Input 2: invalid external auth NFT token category must match name category',
			},
			{
				'ip': 239,
				'line': 159,
				'message': 'Input 3: invalid internal auth NFT token category must match name category',
			},
			{
				'ip': 244,
				'line': 161,
				'message': 'Output 0: valid external auth NFT token category must match name category',
			},
			{
				'ip': 249,
				'line': 162,
				'message': 'Output 1: valid internal auth NFT token category must match name category',
			},
			{
				'ip': 257,
				'line': 165,
				'message': 'Input 1: valid internal auth NFT registration ID must be lower than input 3',
			},
			{
				'ip': 267,
				'line': 187,
				'message': 'Name: transaction version must be 2 (relative timelocks required)',
			},
			{
				'ip': 270,
				'line': 189,
				'message': 'Transaction: must have exactly 3 inputs',
			},
			{
				'ip': 273,
				'line': 190,
				'message': 'Transaction: must have exactly 1 output',
			},
			{
				'ip': 282,
				'line': 198,
				'message': 'Input 1: internal auth NFT sequence number must equal inactivity expiry time',
			},
			{
				'ip': 288,
				'line': 201,
				'message': 'Input 2: name ownership NFT token category must match name category',
			},
			{
				'ip': 296,
				'line': 203,
				'message': 'Input 2: name ownership NFT registration ID must match input 0 commitment',
			},
			{
				'ip': 303,
				'line': 207,
				'message': 'Input 0: external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 306,
				'line': 208,
				'message': 'Input 1: internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 310,
				'line': 211,
				'message': 'Input 0: external auth NFT must have empty commitment',
			},
			{
				'ip': 315,
				'line': 213,
				'message': 'Input 0: external auth NFT token category must match input 1',
			},
			{
				'ip': 320,
				'line': 214,
				'message': 'Input 0: external auth NFT token category must match name category',
			},
			{
				'ip': 325,
				'line': 215,
				'message': 'Input 1: internal auth NFT token category must match name category',
			},
			{
				'ip': 330,
				'line': 218,
				'message': 'Output 0: change must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-08-06T03:04:35.176Z',
};
