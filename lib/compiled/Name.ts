export default {
	'contractName': 'Name',
	'constructorInputs': [
		{
			'name': 'inactivityExpiryTime',
			'type': 'int',
		},
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
	'bytecode': 'OP_4 OP_PICK OP_0 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_INPUTINDEX OP_OUTPUTTOKENCOMMITMENT OP_EQUALVERIFY OP_5 OP_ROLL OP_1 OP_NUMEQUAL OP_IF OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DUP OP_4 OP_PICK OP_6 OP_PICK OP_CAT OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_2 OP_PICK OP_EQUALVERIFY OP_2DROP OP_ELSE OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_ENDIF OP_2DROP OP_2DROP OP_DROP OP_1 OP_ELSE OP_4 OP_PICK OP_1 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_4 OP_ROLL OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_1 OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_NIP OP_3 OP_ROLL OP_SIZE OP_NIP OP_SPLIT OP_DROP OP_4 OP_PICK OP_SPLIT OP_DROP OP_4 OP_PICK OP_1SUB OP_SPLIT OP_NIP OP_BIN2NUM OP_DUP 2d OP_NUMNOTEQUAL OP_VERIFY OP_DUP 61 7b OP_WITHIN OP_NOT OP_VERIFY OP_DUP 41 5b OP_WITHIN OP_NOT OP_VERIFY 30 3a OP_WITHIN OP_NOT OP_VERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_2DROP OP_2DROP OP_1 OP_ELSE OP_4 OP_PICK OP_2 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_4 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_0 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCOMMITMENT OP_1 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCATEGORY OP_4 OP_ROLL OP_EQUALVERIFY OP_1 OP_UTXOTOKENCOMMITMENT OP_BIN2NUM OP_3 OP_UTXOTOKENCOMMITMENT OP_BIN2NUM OP_LESSTHAN OP_VERIFY OP_2DROP OP_2DROP OP_1 OP_ELSE OP_4 OP_ROLL OP_3 OP_NUMEQUALVERIFY OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_1 OP_NUMEQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_0 OP_EQUAL OP_IF OP_1 OP_INPUTSEQUENCENUMBER OP_OVER OP_NUMEQUALVERIFY OP_ELSE OP_2 OP_UTXOTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DROP OP_0 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_ENDIF OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_1 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_4 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_4 OP_ROLL OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL OP_NIP OP_NIP OP_NIP OP_ENDIF OP_ENDIF OP_ENDIF',
	'source': 'pragma cashscript 0.11.3;\n\n/**\n * @param inactivityExpiryTime The time period after which the name is considered inactive.\n * @param name The name of the name.\n * @param tld The TLD of the name.\n * @param nameCategory The category of the name.\n */\ncontract Name(\n  int inactivityExpiryTime,\n  bytes name,\n  bytes tld,\n  bytes nameCategory\n  ) {\n  \n  /**\n   * This function can be used to perform a variety of actions.\n   *\n   * For example:\n   * - It can be used to prove the the ownership of the name by other contracts.\n   * - This function allows the owner to perform any actions in conjunction with other contracts.\n   * - This function can be used to add records and invalidate multiple records in a single transaction.\n   *\n   * Records are created using OP_RETURN outputs. To add a record, include the record data directly in the OP_RETURN output.\n   * To invalidate a record, prefix "RMV" followed by the hash of the record content in the OP_RETURN output. This will signal\n   * the library/indexers to exclude the record from the valid records.\n   * \n   * @inputs\n   * - Inputx: Internal/External Auth NFT\n   * - Inputx+1 (optional): Name ownership NFT from the owner\n   * \n   * @outputs\n   * - Outputx: Internal/External Auth NFT returned to this contract\n   * - Outputx+1 (optional): Name NFT returned\n   * \n   */\n  function useAuth(int authID) {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2);\n\n    // The activeInputIndex can be anything as long as the utxo properties are preserved and comes back to the\n    // contract without alteration.\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n    require(tx.inputs[this.activeInputIndex].tokenCategory == nameCategory);\n    require(tx.outputs[this.activeInputIndex].tokenCategory == nameCategory);\n    require(tx.inputs[this.activeInputIndex].nftCommitment == tx.outputs[this.activeInputIndex].nftCommitment);\n\n    if(authID == 1) {\n      // The next input from the InternalAuthNFT must be the ownershipNFT.\n      require(tx.inputs[this.activeInputIndex + 1].tokenCategory == nameCategory);\n      bytes registrationId, bytes nameFromOwnerNFT = tx.inputs[this.activeInputIndex + 1].nftCommitment.split(8);\n      require(nameFromOwnerNFT == name + tld);\n      require(tx.inputs[this.activeInputIndex].nftCommitment == registrationId);\n    } else {\n      // One known use of ExternalAuthNFT in the `NameOwnershipGuard` contract. ExternalAuthNFT is\n      // used to prove that an owner exists.\n      require(tx.inputs[this.activeInputIndex].nftCommitment == 0x);\n    }\n  }\n\n  /**\n   * If an invalid name is registered, this function allows anyone to burn the NFTs\n   * @inputs\n   * - Input0: External Auth NFT from self\n   * - Input1: Internal Auth NFT from self\n   * - Input2: BCH input from anyone\n   * \n   * @outputs  \n   * - Output0: BCH change output\n   */\n  function penaliseInvalidName(int characterNumber) {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2);\n\n    require(tx.inputs.length == 3);\n    require(tx.outputs.length == 1);\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode);\n\n    require(tx.inputs[0].tokenCategory == nameCategory);\n    require(tx.inputs[1].tokenCategory == nameCategory);\n\n    // External Auth NFT\n    require(tx.inputs[0].nftCommitment == 0x);\n\n    // Internal Auth NFT\n    // First 8 bytes are the registrationID and the rest is the name.\n    bytes fullName = tx.inputs[1].nftCommitment.split(8)[1];\n    bytes nameFromNFT = fullName.split(tld.length)[0];\n\n    bytes characterSplitBytes = nameFromNFT.split(characterNumber)[0];\n    characterNumber = characterNumber - 1;\n    bytes character = characterSplitBytes.split(characterNumber)[1];\n    int charVal = int(character);\n\n    // Character is not a hyphen.\n    require(charVal != 45); \n    // Character is not from a-z.\n    require(!within(charVal, 97, 123));\n    // Character is not from A-Z.\n    require(!within(charVal, 65, 91));\n    // Character is not from 0-9.\n    require(!within(charVal, 48, 58));\n\n    // Pure BCH, ensures burn\n    require(tx.outputs[2].tokenCategory == 0x);\n  }\n\n  /**\n   * If the incentive system fails, i.e `NameOwnershipGuard` or `AuctionConflictResolver` fails to prevent a\n   * a owner conflict. When this happens there will be > 1 owner for this name.\n   * The owner with the lowest registrationID must be the only owner for this name.\n   * To help enforce this rule, this function will allow anyone to burn both the Auth NFTs of the NEW owner.\n   *\n   * @inputs\n   * - Input0: Valid External Auth NFT from self\n   * - Input1: Valid Internal Auth NFT from self\n   * - Input2: Invalid External Auth NFT from self\n   * - Input3: Invalid Internal Auth NFT from self\n   * - Input4: BCH input from anyone\n   * \n   * @outputs  \n   * - Output0: Valid External Auth NFT back to self\n   * - Output1: Valid Internal Auth NFT back to self\n   * - Output3: BCH change output\n   */\n  function resolveOwnerConflict(){\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2);\n\n    require(tx.inputs.length == 5);\n    require(tx.outputs.length == 3);\n\n    // Pure BCH input and output to fund the transaction\n    require(tx.inputs[4].tokenCategory == 0x);\n    require(tx.outputs[2].tokenCategory == 0x);\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[2].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[3].lockingBytecode == selfLockingBytecode);\n\n    require(tx.outputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.outputs[1].lockingBytecode == selfLockingBytecode);\n\n    // External Auth NFTs\n    require(tx.inputs[0].nftCommitment == 0x);\n    require(tx.inputs[2].nftCommitment == 0x);\n\n    // Commitments of Valid Auth NFts back to self\n    require(tx.outputs[0].nftCommitment == 0x);\n    require(tx.outputs[1].nftCommitment == tx.inputs[1].nftCommitment);\n\n    // Ensure that all the token inputs and outputs have nameCategory\n    require(tx.inputs[0].tokenCategory == nameCategory);\n    require(tx.inputs[1].tokenCategory == nameCategory);\n    require(tx.inputs[2].tokenCategory == nameCategory);\n    require(tx.inputs[3].tokenCategory == nameCategory);\n\n    require(tx.outputs[0].tokenCategory == nameCategory);\n    require(tx.outputs[1].tokenCategory == nameCategory);\n\n    // Compare the registrationID\n    require(int(tx.inputs[1].nftCommitment) < int(tx.inputs[3].nftCommitment));\n  }\n\n  /**\n   * Allows the name owner or anyone to burn the InternalAuthNFT and externalAuthNFT making this name available\n   * for auction.\n   * \n   * - Owner can burn the AuthNFTs anytime.\n   * - External party can burn the AuthNFTs when the internalAuth NFT has not been used for more than `inactivityExpiryTime`.\n   *\n   * @inputs\n   * - Input0: External Auth NFT\n   * - Input1: Internal Auth NFT\n   * - Input2: Pure BCH or Name ownership NFT from the owner\n   *\n   * @outputs \n   * - Output0: BCH change\n   *\n   */\n  function burn() {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    // Need version 2 enforcement for relative timelocks.\n    require(tx.version == 2);\n\n    require(tx.inputs.length == 3);\n    require(tx.outputs.length == 1);\n\n    // If an external party is attempting to burn the authNFTs\n    if (tx.inputs[2].tokenCategory == 0x) {\n      // If pure BCH input, then allow anyone to burn given the time limit has passed.\n      require(tx.inputs[1].sequenceNumber == inactivityExpiryTime);\n    } else {\n      // If name ownership NFT input, then allow the owner to burn anytime.\n      require(tx.inputs[2].tokenCategory == nameCategory);\n      // Make sure that the registrationID in the nameOwnershipNFT and the internalAuthNFT are the same.\n      require(tx.inputs[2].nftCommitment.split(8)[0] == tx.inputs[0].nftCommitment);\n    }\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode);\n\n    // ExternalAuthNFT\n    require(tx.inputs[0].nftCommitment == 0x);\n    // Both InternalAuthNFT and externalAuthNFT are immutable and have the same tokenCategory\n    require(tx.inputs[0].tokenCategory == tx.inputs[1].tokenCategory);\n    require(tx.inputs[0].tokenCategory == nameCategory);\n    require(tx.inputs[1].tokenCategory == nameCategory);\n\n    // Return the BCH as change.\n    require(tx.outputs[0].tokenCategory == 0x);\n  }\n}\n',
	'debug': {
		'bytecode': '5479009c63c2529dc0c7c0cd88c0ce547988c0d1547988c0cfc0d288557a519c63c08bce547988c08bcf587f76547956797e88c0cf5279886d67c0cf0088686d6d7551675479519c63c2529dc3539dc4519dc0c700c7788851c78800ce54798851ce547a8800cf008851cf587f77537a82777f7554797f7554798c7f778176012d9e69760161017ba59169760141015ba591690130013aa5916952d100886d6d51675479529c63c2529dc3559dc4539d54ce008852d10088c0c700c7788851c7788852c7788853c7788800cd788851cd8800cf008852cf008800d2008851d251cf8800ce54798851ce54798852ce54798853ce54798800d154798851d1547a8851cf8153cf819f696d6d5167547a539dc2529dc3539dc4519d52ce00876351cb789d6752ce54798852cf587f7500cf8868c0c700c7788851c78800cf008800ce51ce8800ce54798851ce547a8800d10087777777686868',
		'sourceMap': '37:2:59:3;;;;;39:12:39:22;:26::27;:4::29:1;43:22:43:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;44:22:44:43:0;:12::58:1;:62::74:0;;:4::76:1;45:23:45:44:0;:12::59:1;:63::75:0;;:4::77:1;46:22:46:43:0;:12::58:1;:73::94:0;:62::109:1;:4::111;48:7:48:13:0;;:17::18;:7:::1;:20:54:5:0;50:24:50:45;:::49:1;:14::64;:68::80:0;;:6::82:1;51:63:51:84:0;:::88:1;:53::103;:110::111:0;:53::112:1;52:14:52:30:0;:34::38;;:41::44;;:34:::1;:6::46;53:24:53:45:0;:14::60:1;:64::78:0;;:6::80:1;48:20:54:5;54:11:58::0;57:24:57:45;:14::60:1;:64::66:0;:6::68:1;54:11:58:5;37:2:59:3;;;;;71::109::0;;;;;73:12:73:22;:26::27;:4::29:1;75:12:75:28:0;:32::33;:4::35:1;76:12:76:29:0;:33::34;:4::36:1;78:42:78:63:0;:32::80:1;79:22:79:23:0;:12::40:1;:44::63:0;:4::65:1;80:22:80:23:0;:12::40:1;:4::65;82:22:82:23:0;:12::38:1;:42::54:0;;:4::56:1;83:22:83:23:0;:12::38:1;:42::54:0;;:4::56:1;86:22:86:23:0;:12::38:1;:42::44:0;:4::46:1;90:31:90:32:0;:21::47:1;:54::55:0;:21::56:1;:::59;91:39:91:42:0;;:::49:1;;:24::50;:::53;93:50:93:65:0;;:32::66:1;:::69;94:22:94:37:0;;:::41:1;95::95:64;:::67;96:18:96:32;99:12:99:19:0;:23::25;:12:::1;:4::27;101:20:101::0;:29::31;:33::36;:13::37:1;:12;:4::39;103:20:103:27:0;:29::31;:33::35;:13::36:1;:12;:4::38;105:29:105:31:0;:33::35;:13::36:1;:12;:4::38;108:23:108:24:0;:12::39:1;:43::45:0;:4::47:1;71:2:109:3;;;;129::168::0;;;;;131:12:131:22;:26::27;:4::29:1;133:12:133:28:0;:32::33;:4::35:1;134:12:134:29:0;:33::34;:4::36:1;137:22:137:23:0;:12::38:1;:42::44:0;:4::46:1;138:23:138:24:0;:12::39:1;:43::45:0;:4::47:1;140:42:140:63:0;:32::80:1;141:22:141:23:0;:12::40:1;:44::63:0;:4::65:1;142:22:142:23:0;:12::40:1;:44::63:0;:4::65:1;143:22:143:23:0;:12::40:1;:44::63:0;:4::65:1;144:22:144:23:0;:12::40:1;:44::63:0;:4::65:1;146:23:146:24:0;:12::41:1;:45::64:0;:4::66:1;147:23:147:24:0;:12::41:1;:4::66;150:22:150:23:0;:12::38:1;:42::44:0;:4::46:1;151:22:151:23:0;:12::38:1;:42::44:0;:4::46:1;154:23:154:24:0;:12::39:1;:43::45:0;:4::47:1;155:23:155:24:0;:12::39:1;:53::54:0;:43::69:1;:4::71;158:22:158:23:0;:12::38:1;:42::54:0;;:4::56:1;159:22:159:23:0;:12::38:1;:42::54:0;;:4::56:1;160:22:160:23:0;:12::38:1;:42::54:0;;:4::56:1;161:22:161:23:0;:12::38:1;:42::54:0;;:4::56:1;163:23:163:24:0;:12::39:1;:43::55:0;;:4::57:1;164:23:164:24:0;:12::39:1;:43::55:0;;:4::57:1;167:26:167:27:0;:16::42:1;:12::43;:60::61:0;:50::76:1;:46::77;:12;:4::79;129:2:168:3;;;;186::218::0;;;;189:12:189:22;:26::27;:4::29:1;191:12:191:28:0;:32::33;:4::35:1;192:12:192:29:0;:33::34;:4::36:1;195:18:195:19:0;:8::34:1;:38::40:0;:8:::1;:42:198:5:0;197:24:197:25;:14::41:1;:45::65:0;:6::67:1;198:11:203:5:0;200:24:200:25;:14::40:1;:44::56:0;;:6::58:1;202:24:202:25:0;:14::40:1;:47::48:0;:14::49:1;:::52;:66::67:0;:56::82:1;:6::84;198:11:203:5;205:42:205:63:0;:32::80:1;206:22:206:23:0;:12::40:1;:44::63:0;:4::65:1;207:22:207:23:0;:12::40:1;:4::65;210:22:210:23:0;:12::38:1;:42::44:0;:4::46:1;212:22:212:23:0;:12::38:1;:52::53:0;:42::68:1;:4::70;213:22:213:23:0;:12::38:1;:42::54:0;;:4::56:1;214:22:214:23:0;:12::38:1;:42::54:0;;:4::56:1;217:23:217:24:0;:12::39:1;:43::45:0;:4::47:1;186:2:218:3;;;9:0:219:1;;',
		'logs': [],
		'requires': [
			{
				'ip': 11,
				'line': 39,
			},
			{
				'ip': 16,
				'line': 43,
			},
			{
				'ip': 21,
				'line': 44,
			},
			{
				'ip': 26,
				'line': 45,
			},
			{
				'ip': 31,
				'line': 46,
			},
			{
				'ip': 42,
				'line': 50,
			},
			{
				'ip': 54,
				'line': 52,
			},
			{
				'ip': 59,
				'line': 53,
			},
			{
				'ip': 65,
				'line': 57,
			},
			{
				'ip': 79,
				'line': 73,
			},
			{
				'ip': 82,
				'line': 75,
			},
			{
				'ip': 85,
				'line': 76,
			},
			{
				'ip': 91,
				'line': 79,
			},
			{
				'ip': 94,
				'line': 80,
			},
			{
				'ip': 99,
				'line': 82,
			},
			{
				'ip': 104,
				'line': 83,
			},
			{
				'ip': 108,
				'line': 86,
			},
			{
				'ip': 133,
				'line': 99,
			},
			{
				'ip': 139,
				'line': 101,
			},
			{
				'ip': 145,
				'line': 103,
			},
			{
				'ip': 150,
				'line': 105,
			},
			{
				'ip': 154,
				'line': 108,
			},
			{
				'ip': 166,
				'line': 131,
			},
			{
				'ip': 169,
				'line': 133,
			},
			{
				'ip': 172,
				'line': 134,
			},
			{
				'ip': 176,
				'line': 137,
			},
			{
				'ip': 180,
				'line': 138,
			},
			{
				'ip': 186,
				'line': 141,
			},
			{
				'ip': 190,
				'line': 142,
			},
			{
				'ip': 194,
				'line': 143,
			},
			{
				'ip': 198,
				'line': 144,
			},
			{
				'ip': 202,
				'line': 146,
			},
			{
				'ip': 205,
				'line': 147,
			},
			{
				'ip': 209,
				'line': 150,
			},
			{
				'ip': 213,
				'line': 151,
			},
			{
				'ip': 217,
				'line': 154,
			},
			{
				'ip': 222,
				'line': 155,
			},
			{
				'ip': 227,
				'line': 158,
			},
			{
				'ip': 232,
				'line': 159,
			},
			{
				'ip': 237,
				'line': 160,
			},
			{
				'ip': 242,
				'line': 161,
			},
			{
				'ip': 247,
				'line': 163,
			},
			{
				'ip': 252,
				'line': 164,
			},
			{
				'ip': 260,
				'line': 167,
			},
			{
				'ip': 271,
				'line': 189,
			},
			{
				'ip': 274,
				'line': 191,
			},
			{
				'ip': 277,
				'line': 192,
			},
			{
				'ip': 286,
				'line': 197,
			},
			{
				'ip': 292,
				'line': 200,
			},
			{
				'ip': 300,
				'line': 202,
			},
			{
				'ip': 307,
				'line': 206,
			},
			{
				'ip': 310,
				'line': 207,
			},
			{
				'ip': 314,
				'line': 210,
			},
			{
				'ip': 319,
				'line': 212,
			},
			{
				'ip': 324,
				'line': 213,
			},
			{
				'ip': 329,
				'line': 214,
			},
			{
				'ip': 334,
				'line': 217,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-07-30T20:12:59.953Z',
};
