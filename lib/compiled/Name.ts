export default {
	'contractName': 'Name',
	'constructorInputs': [
		{
			'name': 'inactivityExpiryTime',
			'type': 'int',
		},
		{
			'name': 'fullName',
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
			'inputs': [],
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
	'bytecode': 'OP_3 OP_PICK OP_0 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_INPUTINDEX OP_OUTPUTTOKENCOMMITMENT OP_EQUALVERIFY OP_4 OP_ROLL OP_1 OP_NUMEQUAL OP_IF OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DUP OP_4 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_2 OP_PICK OP_EQUALVERIFY OP_2DROP OP_ELSE OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_ENDIF OP_2DROP OP_2DROP OP_1 OP_ELSE OP_3 OP_PICK OP_1 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_2DROP OP_2DROP OP_1 OP_ELSE OP_3 OP_PICK OP_2 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_4 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_0 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCOMMITMENT OP_1 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_1 OP_UTXOTOKENCOMMITMENT OP_REVERSEBYTES OP_BIN2NUM OP_3 OP_UTXOTOKENCOMMITMENT OP_REVERSEBYTES OP_BIN2NUM OP_LESSTHAN OP_NIP OP_NIP OP_NIP OP_ELSE OP_3 OP_ROLL OP_3 OP_NUMEQUALVERIFY OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_1 OP_NUMEQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_0 OP_EQUAL OP_IF OP_1 OP_INPUTSEQUENCENUMBER OP_OVER OP_NUMEQUALVERIFY OP_ELSE OP_2 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DROP OP_0 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_ENDIF OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_1 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL OP_NIP OP_NIP OP_ENDIF OP_ENDIF OP_ENDIF',
	'source': 'pragma cashscript 0.11.3;\n\n/**\n * @param inactivityExpiryTime The time period after which the name is considered inactive.\n * @param fullName The full name of the name including the TLD. <name>.<tld>\n * @param nameCategory The category of the name.\n */\ncontract Name(\n  int inactivityExpiryTime,\n  bytes fullName,\n  bytes nameCategory\n  ) {\n  \n  /**\n   * This function can be used to perform a variety of actions.\n   *\n   * For example:\n   * - It can be used to prove the the ownership of the name by other contracts.\n   * - This function allows the owner to perform any actions in conjunction with other contracts.\n   * - This function can be used to add records and invalidate multiple records in a single transaction.\n   *\n   * Records are created using OP_RETURN outputs. To add a record, include the record data directly in the OP_RETURN output.\n   * To invalidate a record, prefix "RMV" followed by the hash of the record content in the OP_RETURN output. This will signal\n   * the library/indexers to exclude the record from the valid records.\n   * \n   * @inputs\n   * - Inputx: Internal/External Auth NFT\n   * - Inputx+1 (optional): Name ownership NFT from the owner\n   * \n   * @outputs\n   * - Outputx: Internal/External Auth NFT returned to this contract\n   * - Outputx+1 (optional): Name NFT returned\n   * \n   */\n  function useAuth(int authID) {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2);\n\n    // The activeInputIndex can be anything as long as the utxo properties are preserved and comes back to the\n    // contract without alteration.\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n    require(tx.inputs[this.activeInputIndex].tokenCategory == nameCategory);\n    require(tx.outputs[this.activeInputIndex].tokenCategory == nameCategory);\n    require(tx.inputs[this.activeInputIndex].nftCommitment == tx.outputs[this.activeInputIndex].nftCommitment);\n\n    if(authID == 1) {\n      // The next input from the InternalAuthNFT must be the ownershipNFT.\n      require(tx.inputs[this.activeInputIndex + 1].tokenCategory == nameCategory);\n      bytes registrationId, bytes nameFromOwnerNFT = tx.inputs[this.activeInputIndex + 1].nftCommitment.split(8);\n      require(nameFromOwnerNFT == fullName);\n      require(tx.inputs[this.activeInputIndex].nftCommitment == registrationId);\n    } else {\n      // One known use of ExternalAuthNFT in the `NameOwnershipGuard` contract. ExternalAuthNFT is\n      // used to prove that an owner exists.\n      require(tx.inputs[this.activeInputIndex].nftCommitment == 0x);\n    }\n  }\n\n  function penaliseInvalidName() {\n    // Allow anyone to call only when the name registered is invalid, and the incentive system was not able to prevent it.\n    \n    require(tx.version == 2);\n  }\n\n  /**\n   * If the incentive system fails, i.e `NameOwnershipGuard` or `AuctionConflictResolver` fails to prevent a\n   * a owner conflict. When this happens there will be > 1 owner for this name.\n   * The owner with the lowest registrationID must be the only owner for this name.\n   * To help enforce this rule, this function will allow anyone to burn both the Auth NFTs of the NEW owner.\n   *\n   * @inputs\n   * - Input0: Valid External Auth NFT from self\n   * - Input1: Valid Internal Auth NFT from self\n   * - Input2: Invalid External Auth NFT from self\n   * - Input3: Invalid Internal Auth NFT from self\n   * - Input4: BCH input from anyone\n   * \n   * @outputs  \n   * - Output0: Valid External Auth NFT back to self\n   * - Output1: Valid Internal Auth NFT back to self\n   * - Output3: BCH change output\n   */\n  function resolveOwnerConflict(){\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2);\n\n    require(tx.inputs.length == 5);\n    require(tx.outputs.length == 3);\n\n    // Pure BCH input and output to fund the transaction\n    require(tx.inputs[4].tokenCategory == 0x);\n    require(tx.outputs[2].tokenCategory == 0x);\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[2].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[3].lockingBytecode == selfLockingBytecode);\n\n    require(tx.outputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.outputs[1].lockingBytecode == selfLockingBytecode);\n\n    // External Auth NFTs\n    require(tx.inputs[0].nftCommitment == 0x);\n    require(tx.inputs[2].nftCommitment == 0x);\n\n    // Commitments of Valid Auth NFts back to self\n    require(tx.outputs[0].nftCommitment == 0x);\n    require(tx.outputs[1].nftCommitment == tx.inputs[1].nftCommitment);\n\n    // Ensure that all the token inputs and outputs have nameCategory\n    require(tx.inputs[0].tokenCategory == nameCategory);\n    require(tx.inputs[1].tokenCategory == nameCategory);\n    require(tx.inputs[2].tokenCategory == nameCategory);\n    require(tx.inputs[3].tokenCategory == nameCategory);\n\n    require(tx.outputs[0].tokenCategory == nameCategory);\n    require(tx.outputs[1].tokenCategory == nameCategory);\n\n    // Compare the registrationID\n    require(int(tx.inputs[1].nftCommitment.reverse()) < int(tx.inputs[3].nftCommitment.reverse()));\n  }\n\n  /**\n   * Allows the name owner or anyone to burn the InternalAuthNFT and externalAuthNFT making this name available\n   * for auction.\n   * \n   * - Owner can burn the AuthNFTs anytime.\n   * - External party can burn the AuthNFTs when the internalAuth NFT has not been used for more than `inactivityExpiryTime`.\n   *\n   * @inputs\n   * - Input0: External Auth NFT\n   * - Input1: Internal Auth NFT\n   * - Input2: Pure BCH or Name ownership NFT from the owner\n   *\n   * @outputs \n   * - Output0: BCH change\n   *\n   */\n  function burn() {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    // Need version 2 enforcement for relative timelocks.\n    require(tx.version == 2);\n\n    require(tx.inputs.length == 3);\n    require(tx.outputs.length == 1);\n\n    // If an external party is attempting to burn the authNFTs\n    if (tx.inputs[2].tokenCategory == 0x) {\n      // If pure BCH input, then allow anyone to burn given the time limit has passed.\n      require(tx.inputs[1].sequenceNumber == inactivityExpiryTime);\n    } else {\n      // If name ownership NFT input, then allow the owner to burn anytime.\n      require(tx.inputs[2].tokenCategory == nameCategory);\n      // Make sure that the registrationID in the nameOwnershipNFT and the internalAuthNFT are the same.\n      require(tx.inputs[2].nftCommitment.split(8)[0] == tx.inputs[0].nftCommitment);\n    }\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode);\n\n    // ExternalAuthNFT\n    require(tx.inputs[0].nftCommitment == 0x);\n    // Both InternalAuthNFT and externalAuthNFT are immutable and have the same tokenCategory\n    require(tx.inputs[0].tokenCategory == tx.inputs[1].tokenCategory);\n    require(tx.inputs[0].tokenCategory == nameCategory);\n    require(tx.inputs[1].tokenCategory == nameCategory);\n\n    // Return the BCH as change.\n    require(tx.outputs[0].tokenCategory == 0x);\n  }\n}\n',
	'debug': {
		'bytecode': '5379009c63c2529dc0c7c0cd88c0ce537988c0d1537988c0cfc0d288547a519c63c08bce537988c08bcf587f76547988c0cf5279886d67c0cf0088686d6d51675379519c63c2529d6d6d51675379529c63c2529dc3559dc4539d54ce008852d10088c0c700c7788851c7788852c7788853c7788800cd788851cd8800cf008852cf008800d2008851d251cf8800ce53798851ce53798852ce53798853ce53798800d153798851d1537a8851cfbc8153cfbc819f77777767537a539dc2529dc3539dc4519d52ce00876351cb789d6752ce53798852cf587f7500cf8868c0c700c7788851c78800cf008800ce51ce8800ce53798851ce537a8800d100877777686868',
		'sourceMap': '35:2:57:3;;;;;37:12:37:22;:26::27;:4::29:1;41:22:41:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;42:22:42:43:0;:12::58:1;:62::74:0;;:4::76:1;43:23:43:44:0;:12::59:1;:63::75:0;;:4::77:1;44:22:44:43:0;:12::58:1;:73::94:0;:62::109:1;:4::111;46:7:46:13:0;;:17::18;:7:::1;:20:52:5:0;48:24:48:45;:::49:1;:14::64;:68::80:0;;:6::82:1;49:63:49:84:0;:::88:1;:53::103;:110::111:0;:53::112:1;50:14:50:30:0;:34::42;;:6::44:1;51:24:51:45:0;:14::60:1;:64::78:0;;:6::80:1;46:20:52:5;52:11:56::0;55:24:55:45;:14::60:1;:64::66:0;:6::68:1;52:11:56:5;35:2:57:3;;;;59::63::0;;;;;62:12:62:22;:26::27;:4::29:1;59:2:63:3;;;;83::122::0;;;;;85:12:85:22;:26::27;:4::29:1;87:12:87:28:0;:32::33;:4::35:1;88:12:88:29:0;:33::34;:4::36:1;91:22:91:23:0;:12::38:1;:42::44:0;:4::46:1;92:23:92:24:0;:12::39:1;:43::45:0;:4::47:1;94:42:94:63:0;:32::80:1;95:22:95:23:0;:12::40:1;:44::63:0;:4::65:1;96:22:96:23:0;:12::40:1;:44::63:0;:4::65:1;97:22:97:23:0;:12::40:1;:44::63:0;:4::65:1;98:22:98:23:0;:12::40:1;:44::63:0;:4::65:1;100:23:100:24:0;:12::41:1;:45::64:0;:4::66:1;101:23:101:24:0;:12::41:1;:4::66;104:22:104:23:0;:12::38:1;:42::44:0;:4::46:1;105:22:105:23:0;:12::38:1;:42::44:0;:4::46:1;108:23:108:24:0;:12::39:1;:43::45:0;:4::47:1;109:23:109:24:0;:12::39:1;:53::54:0;:43::69:1;:4::71;112:22:112:23:0;:12::38:1;:42::54:0;;:4::56:1;113:22:113:23:0;:12::38:1;:42::54:0;;:4::56:1;114:22:114:23:0;:12::38:1;:42::54:0;;:4::56:1;115:22:115:23:0;:12::38:1;:42::54:0;;:4::56:1;117:23:117:24:0;:12::39:1;:43::55:0;;:4::57:1;118:23:118:24:0;:12::39:1;:43::55:0;;:4::57:1;121:26:121:27:0;:16::42:1;:::52;:12::53;:70::71:0;:60::86:1;:::96;:56::97;:4::99;83:2:122:3;;;;140::172::0;;;;143:12:143:22;:26::27;:4::29:1;145:12:145:28:0;:32::33;:4::35:1;146:12:146:29:0;:33::34;:4::36:1;149:18:149:19:0;:8::34:1;:38::40:0;:8:::1;:42:152:5:0;151:24:151:25;:14::41:1;:45::65:0;:6::67:1;152:11:157:5:0;154:24:154:25;:14::40:1;:44::56:0;;:6::58:1;156:24:156:25:0;:14::40:1;:47::48:0;:14::49:1;:::52;:66::67:0;:56::82:1;:6::84;152:11:157:5;159:42:159:63:0;:32::80:1;160:22:160:23:0;:12::40:1;:44::63:0;:4::65:1;161:22:161:23:0;:12::40:1;:4::65;164:22:164:23:0;:12::38:1;:42::44:0;:4::46:1;166:22:166:23:0;:12::38:1;:52::53:0;:42::68:1;:4::70;167:22:167:23:0;:12::38:1;:42::54:0;;:4::56:1;168:22:168:23:0;:12::38:1;:42::54:0;;:4::56:1;171:23:171:24:0;:12::39:1;:43::45:0;:4::47:1;140:2:172:3;;8:0:173:1;;',
		'logs': [],
		'requires': [
			{
				'ip': 10,
				'line': 37,
			},
			{
				'ip': 15,
				'line': 41,
			},
			{
				'ip': 20,
				'line': 42,
			},
			{
				'ip': 25,
				'line': 43,
			},
			{
				'ip': 30,
				'line': 44,
			},
			{
				'ip': 41,
				'line': 48,
			},
			{
				'ip': 50,
				'line': 50,
			},
			{
				'ip': 55,
				'line': 51,
			},
			{
				'ip': 61,
				'line': 55,
			},
			{
				'ip': 74,
				'line': 62,
			},
			{
				'ip': 86,
				'line': 85,
			},
			{
				'ip': 89,
				'line': 87,
			},
			{
				'ip': 92,
				'line': 88,
			},
			{
				'ip': 96,
				'line': 91,
			},
			{
				'ip': 100,
				'line': 92,
			},
			{
				'ip': 106,
				'line': 95,
			},
			{
				'ip': 110,
				'line': 96,
			},
			{
				'ip': 114,
				'line': 97,
			},
			{
				'ip': 118,
				'line': 98,
			},
			{
				'ip': 122,
				'line': 100,
			},
			{
				'ip': 125,
				'line': 101,
			},
			{
				'ip': 129,
				'line': 104,
			},
			{
				'ip': 133,
				'line': 105,
			},
			{
				'ip': 137,
				'line': 108,
			},
			{
				'ip': 142,
				'line': 109,
			},
			{
				'ip': 147,
				'line': 112,
			},
			{
				'ip': 152,
				'line': 113,
			},
			{
				'ip': 157,
				'line': 114,
			},
			{
				'ip': 162,
				'line': 115,
			},
			{
				'ip': 167,
				'line': 117,
			},
			{
				'ip': 172,
				'line': 118,
			},
			{
				'ip': 182,
				'line': 121,
			},
			{
				'ip': 192,
				'line': 143,
			},
			{
				'ip': 195,
				'line': 145,
			},
			{
				'ip': 198,
				'line': 146,
			},
			{
				'ip': 207,
				'line': 151,
			},
			{
				'ip': 213,
				'line': 154,
			},
			{
				'ip': 221,
				'line': 156,
			},
			{
				'ip': 228,
				'line': 160,
			},
			{
				'ip': 231,
				'line': 161,
			},
			{
				'ip': 235,
				'line': 164,
			},
			{
				'ip': 240,
				'line': 166,
			},
			{
				'ip': 245,
				'line': 167,
			},
			{
				'ip': 250,
				'line': 168,
			},
			{
				'ip': 255,
				'line': 171,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-07-27T14:39:11.060Z',
};
