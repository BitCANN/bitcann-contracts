export default {
	'contractName': 'Domain',
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
			'name': 'domainCategory',
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
			'name': 'resolveOwnerConflict',
			'inputs': [],
		},
		{
			'name': 'burn',
			'inputs': [],
		},
	],
	'bytecode': 'OP_3 OP_PICK OP_0 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_INPUTINDEX OP_OUTPUTTOKENCOMMITMENT OP_EQUALVERIFY OP_4 OP_ROLL OP_1 OP_NUMEQUAL OP_IF OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_1ADD OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DUP OP_4 OP_PICK OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_2 OP_PICK OP_EQUALVERIFY OP_2DROP OP_ELSE OP_INPUTINDEX OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_ENDIF OP_2DROP OP_2DROP OP_1 OP_ELSE OP_3 OP_PICK OP_1 OP_NUMEQUAL OP_IF OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_4 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_0 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCOMMITMENT OP_1 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_OUTPUTTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_1 OP_UTXOTOKENCOMMITMENT OP_REVERSEBYTES OP_BIN2NUM OP_3 OP_UTXOTOKENCOMMITMENT OP_REVERSEBYTES OP_BIN2NUM OP_LESSTHAN OP_NIP OP_NIP OP_NIP OP_ELSE OP_3 OP_ROLL OP_2 OP_NUMEQUALVERIFY OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_TXINPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_1 OP_NUMEQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_0 OP_EQUAL OP_IF OP_1 OP_INPUTSEQUENCENUMBER OP_OVER OP_NUMEQUALVERIFY OP_ELSE OP_2 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_8 OP_SPLIT OP_DROP OP_0 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_ENDIF OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_1 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_PICK OP_EQUALVERIFY OP_1 OP_UTXOTOKENCATEGORY OP_3 OP_ROLL OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL OP_NIP OP_NIP OP_ENDIF OP_ENDIF',
	'source': 'pragma cashscript 0.11.2;\n\n/**\n * @param inactivityExpiryTime The time period after which the domain is considered inactive.\n * @param name The name of the domain.\n * @param domainCategory The category of the domain.\n */\ncontract Domain(\n  int inactivityExpiryTime,\n  bytes name,\n  bytes domainCategory\n  ) {\n  \n  /**\n   * This function can be used to perform a variety of actions.\n   *\n   * For example:\n   * - It can be used to prove the the ownership of the domain by other contracts.\n   * - This function allows the owner to perform any actions in conjunction with other contracts.\n   * - This function can be used to add records and invalidate multiple records in a single transaction.\n   *\n   * Records are created using OP_RETURN outputs. To add a record, include the record data directly in the OP_RETURN output.\n   * To invalidate a record, prefix "RMV" followed by the hash of the record content in the OP_RETURN output. This will signal\n   * the library/indexers to exclude the record from the valid records.\n   * \n   * @inputs\n   * - Inputx: Internal/External Auth NFT\n   * - Inputx+1 (optional): Domain ownership NFT from the owner\n   * \n   * @outputs\n   * - Outputx: Internal/External Auth NFT returned to this contract\n   * - Outputx+1 (optional): Domain NFT returned\n   * \n   */\n  function useAuth(int authID) {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2);\n\n    // The activeInputIndex can be anything as long as the utxo properties are preserved and comes back to the\n    // contract without alteration.\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n    require(tx.inputs[this.activeInputIndex].tokenCategory == domainCategory);\n    require(tx.outputs[this.activeInputIndex].tokenCategory == domainCategory);\n    require(tx.inputs[this.activeInputIndex].nftCommitment == tx.outputs[this.activeInputIndex].nftCommitment);\n\n    if(authID == 1) {\n      // The next input from the InternalAuthNFT must be the ownershipNFT.\n      require(tx.inputs[this.activeInputIndex + 1].tokenCategory == domainCategory);\n      bytes registrationId, bytes nameFromOwnerNFT = tx.inputs[this.activeInputIndex + 1].nftCommitment.split(8);\n      require(nameFromOwnerNFT == name);\n      require(tx.inputs[this.activeInputIndex].nftCommitment == registrationId);\n    } else {\n      // One known use of ExternalAuthNFT in the `DomainOwnershipGuard` contract. ExternalAuthNFT is\n      // used to prove that an owner exists.\n      require(tx.inputs[this.activeInputIndex].nftCommitment == 0x);\n    }\n  }\n\n  /**\n   * If the incentive system fails, i.e `DomainOwnershipGuard` or `AuctionConflictResolver` fails to prevent a\n   * a owner conflict. When this happens there will be > 1 owner for this domain.\n   * The owner with the lowest registrationID must be the only owner for this domain.\n   * To help enforce this rule, this function will allow anyone to burn both the Auth NFTs of the NEW owner.\n   *\n   * @inputs\n   * - Input0: Valid External Auth NFT from self\n   * - Input1: Valid Internal Auth NFT from self\n   * - Input2: Invalid External Auth NFT from self\n   * - Input3: Invalid Internal Auth NFT from self\n   * - Input4: BCH input from anyone\n   * \n   * @outputs  \n   * - Output0: Valid External Auth NFT back to self\n   * - Output1: Valid Internal Auth NFT back to self\n   * - Output3: BCH change output\n   */\n  function resolveOwnerConflict(){\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    require(tx.version == 2);\n\n    require(tx.inputs.length == 5);\n    require(tx.outputs.length == 3);\n\n    // Pure BCH input and output to fund the transaction\n    require(tx.inputs[4].tokenCategory == 0x);\n    require(tx.outputs[2].tokenCategory == 0x);\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[2].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[3].lockingBytecode == selfLockingBytecode);\n\n    require(tx.outputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.outputs[1].lockingBytecode == selfLockingBytecode);\n\n    // External Auth NFTs\n    require(tx.inputs[0].nftCommitment == 0x);\n    require(tx.inputs[2].nftCommitment == 0x);\n\n    // Commitments of Valid Auth NFts back to self\n    require(tx.outputs[0].nftCommitment == 0x);\n    require(tx.outputs[1].nftCommitment == tx.inputs[1].nftCommitment);\n\n    // Ensure that all the token inputs and outputs have domainCategory\n    require(tx.inputs[0].tokenCategory == domainCategory);\n    require(tx.inputs[1].tokenCategory == domainCategory);\n    require(tx.inputs[2].tokenCategory == domainCategory);\n    require(tx.inputs[3].tokenCategory == domainCategory);\n\n    require(tx.outputs[0].tokenCategory == domainCategory);\n    require(tx.outputs[1].tokenCategory == domainCategory);\n\n    // Compare the registrationID\n    require(int(tx.inputs[1].nftCommitment.reverse()) < int(tx.inputs[3].nftCommitment.reverse()));\n  }\n\n  /**\n   * Allows the domain owner or anyone to burn the InternalAuthNFT and externalAuthNFT making this domain available\n   * for auction.\n   * \n   * - Owner can burn the AuthNFTs anytime.\n   * - External party can burn the AuthNFTs when the internalAuth NFT has not been used for more than `inactivityExpiryTime`.\n   *\n   * @inputs\n   * - Input0: External Auth NFT\n   * - Input1: Internal Auth NFT\n   * - Input2: Pure BCH or Domain ownership NFT from the owner\n   *\n   * @outputs \n   * - Output0: BCH change\n   *\n   */\n  function burn() {\n    // Need transaction version 2 to prevent any vulnerabilities caused due to future versions.\n    // Need version 2 enforcement for relative timelocks.\n    require(tx.version == 2);\n\n    require(tx.inputs.length == 3);\n    require(tx.outputs.length == 1);\n\n    // If an external party is attempting to burn the authNFTs\n    if (tx.inputs[2].tokenCategory == 0x) {\n      // If pure BCH input, then allow anyone to burn given the time limit has passed.\n      require(tx.inputs[1].sequenceNumber == inactivityExpiryTime);\n    } else {\n      // If domain ownership NFT input, then allow the owner to burn anytime.\n      require(tx.inputs[2].tokenCategory == domainCategory);\n      // Make sure that the registrationID in the domainOwnershipNFT and the internalAuthNFT are the same.\n      require(tx.inputs[2].nftCommitment.split(8)[0] == tx.inputs[0].nftCommitment);\n    }\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode);\n    require(tx.inputs[1].lockingBytecode == selfLockingBytecode);\n\n    // ExternalAuthNFT\n    require(tx.inputs[0].nftCommitment == 0x);\n    // Both InternalAuthNFT and externalAuthNFT are immutable and have the same tokenCategory\n    require(tx.inputs[0].tokenCategory == tx.inputs[1].tokenCategory);\n    require(tx.inputs[0].tokenCategory == domainCategory);\n    require(tx.inputs[1].tokenCategory == domainCategory);\n\n    // Return the BCH as change.\n    require(tx.outputs[0].tokenCategory == 0x);\n  }\n}\n',
	'debug': {
		'bytecode': '5379009c63c2529dc0c7c0cd88c0ce537988c0d1537988c0cfc0d288547a519c63c08bce537988c08bcf587f76547988c0cf5279886d67c0cf0088686d6d51675379519c63c2529dc3559dc4539d54ce008852d10088c0c700c7788851c7788852c7788853c7788800cd788851cd8800cf008852cf008800d2008851d251cf8800ce53798851ce53798852ce53798853ce53798800d153798851d1537a8851cfbc8153cfbc819f77777767537a529dc2529dc3539dc4519d52ce00876351cb789d6752ce53798852cf587f7500cf8868c0c700c7788851c78800cf008800ce51ce8800ce53798851ce537a8800d1008777776868',
		'sourceMap': '35:2:57:3;;;;;37:12:37:22;:26::27;:4::29:1;41:22:41:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;42:22:42:43:0;:12::58:1;:62::76:0;;:4::78:1;43:23:43:44:0;:12::59:1;:63::77:0;;:4::79:1;44:22:44:43:0;:12::58:1;:73::94:0;:62::109:1;:4::111;46:7:46:13:0;;:17::18;:7:::1;:20:52:5:0;48:24:48:45;:::49:1;:14::64;:68::82:0;;:6::84:1;49:63:49::0;:::88:1;:53::103;:110::111:0;:53::112:1;50:14:50:30:0;:34::38;;:6::40:1;51:24:51:45:0;:14::60:1;:64::78:0;;:6::80:1;46:20:52:5;52:11:56::0;55:24:55:45;:14::60:1;:64::66:0;:6::68:1;52:11:56:5;35:2:57:3;;;;77::116::0;;;;;79:12:79:22;:26::27;:4::29:1;81:12:81:28:0;:32::33;:4::35:1;82:12:82:29:0;:33::34;:4::36:1;85:22:85:23:0;:12::38:1;:42::44:0;:4::46:1;86:23:86:24:0;:12::39:1;:43::45:0;:4::47:1;88:42:88:63:0;:32::80:1;89:22:89:23:0;:12::40:1;:44::63:0;:4::65:1;90:22:90:23:0;:12::40:1;:44::63:0;:4::65:1;91:22:91:23:0;:12::40:1;:44::63:0;:4::65:1;92:22:92:23:0;:12::40:1;:44::63:0;:4::65:1;94:23:94:24:0;:12::41:1;:45::64:0;:4::66:1;95:23:95:24:0;:12::41:1;:4::66;98:22:98:23:0;:12::38:1;:42::44:0;:4::46:1;99:22:99:23:0;:12::38:1;:42::44:0;:4::46:1;102:23:102:24:0;:12::39:1;:43::45:0;:4::47:1;103:23:103:24:0;:12::39:1;:53::54:0;:43::69:1;:4::71;106:22:106:23:0;:12::38:1;:42::56:0;;:4::58:1;107:22:107:23:0;:12::38:1;:42::56:0;;:4::58:1;108:22:108:23:0;:12::38:1;:42::56:0;;:4::58:1;109:22:109:23:0;:12::38:1;:42::56:0;;:4::58:1;111:23:111:24:0;:12::39:1;:43::57:0;;:4::59:1;112:23:112:24:0;:12::39:1;:43::57:0;;:4::59:1;115:26:115:27:0;:16::42:1;:::52;:12::53;:70::71:0;:60::86:1;:::96;:56::97;:4::99;77:2:116:3;;;;134::166::0;;;;137:12:137:22;:26::27;:4::29:1;139:12:139:28:0;:32::33;:4::35:1;140:12:140:29:0;:33::34;:4::36:1;143:18:143:19:0;:8::34:1;:38::40:0;:8:::1;:42:146:5:0;145:24:145:25;:14::41:1;:45::65:0;:6::67:1;146:11:151:5:0;148:24:148:25;:14::40:1;:44::58:0;;:6::60:1;150:24:150:25:0;:14::40:1;:47::48:0;:14::49:1;:::52;:66::67:0;:56::82:1;:6::84;146:11:151:5;153:42:153:63:0;:32::80:1;154:22:154:23:0;:12::40:1;:44::63:0;:4::65:1;155:22:155:23:0;:12::40:1;:4::65;158:22:158:23:0;:12::38:1;:42::44:0;:4::46:1;160:22:160:23:0;:12::38:1;:52::53:0;:42::68:1;:4::70;161:22:161:23:0;:12::38:1;:42::56:0;;:4::58:1;162:22:162:23:0;:12::38:1;:42::56:0;;:4::58:1;165:23:165:24:0;:12::39:1;:43::45:0;:4::47:1;134:2:166:3;;8:0:167:1;',
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
				'line': 79,
			},
			{
				'ip': 77,
				'line': 81,
			},
			{
				'ip': 80,
				'line': 82,
			},
			{
				'ip': 84,
				'line': 85,
			},
			{
				'ip': 88,
				'line': 86,
			},
			{
				'ip': 94,
				'line': 89,
			},
			{
				'ip': 98,
				'line': 90,
			},
			{
				'ip': 102,
				'line': 91,
			},
			{
				'ip': 106,
				'line': 92,
			},
			{
				'ip': 110,
				'line': 94,
			},
			{
				'ip': 113,
				'line': 95,
			},
			{
				'ip': 117,
				'line': 98,
			},
			{
				'ip': 121,
				'line': 99,
			},
			{
				'ip': 125,
				'line': 102,
			},
			{
				'ip': 130,
				'line': 103,
			},
			{
				'ip': 135,
				'line': 106,
			},
			{
				'ip': 140,
				'line': 107,
			},
			{
				'ip': 145,
				'line': 108,
			},
			{
				'ip': 150,
				'line': 109,
			},
			{
				'ip': 155,
				'line': 111,
			},
			{
				'ip': 160,
				'line': 112,
			},
			{
				'ip': 170,
				'line': 115,
			},
			{
				'ip': 180,
				'line': 137,
			},
			{
				'ip': 183,
				'line': 139,
			},
			{
				'ip': 186,
				'line': 140,
			},
			{
				'ip': 195,
				'line': 145,
			},
			{
				'ip': 201,
				'line': 148,
			},
			{
				'ip': 209,
				'line': 150,
			},
			{
				'ip': 216,
				'line': 154,
			},
			{
				'ip': 219,
				'line': 155,
			},
			{
				'ip': 223,
				'line': 158,
			},
			{
				'ip': 228,
				'line': 160,
			},
			{
				'ip': 233,
				'line': 161,
			},
			{
				'ip': 238,
				'line': 162,
			},
			{
				'ip': 243,
				'line': 165,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.2',
	},
	'updatedAt': '2025-07-15T19:31:08.262Z',
};
