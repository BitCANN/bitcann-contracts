export default {
	'contractName': 'Factory',
	'constructorInputs': [
		{
			'name': 'nameContractBytecode',
			'type': 'bytes',
		},
		{
			'name': 'minWaitTime',
			'type': 'int',
		},
		{
			'name': 'creatorIncentivePKH',
			'type': 'bytes20',
		},
		{
			'name': 'tld',
			'type': 'bytes',
		},
	],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_7 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOVALUE OP_INPUTINDEX OP_OUTPUTVALUE OP_NUMEQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_5 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_2 OP_OUTPUTTOKENCOMMITMENT OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY OP_2 OP_OUTPUTVALUE OP_2 OP_UTXOVALUE OP_NUMEQUALVERIFY OP_3 OP_INPUTSEQUENCENUMBER OP_3 OP_ROLL OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_DUP OP_SIZE OP_NIP 20 OP_4 OP_ROLL OP_CAT OP_SWAP OP_CAT OP_OVER OP_CAT OP_5 OP_ROLL OP_CAT OP_3 OP_ROLL OP_CAT OP_HASH256 aa20 OP_SWAP OP_CAT 87 OP_CAT OP_3 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_3 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENAMOUNT OP_8 OP_NUM2BIN OP_4 OP_OUTPUTTOKENCOMMITMENT OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_5 OP_OUTPUTTOKENCOMMITMENT OP_SWAP OP_ROT OP_CAT OP_EQUALVERIFY OP_5 OP_OUTPUTBYTECODE 76a914 OP_ROT OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_5 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENAMOUNT OP_1 OP_MUL 1027 OP_DIV OP_3 OP_UTXOTOKENAMOUNT OP_1 OP_ROT OP_SUB OP_MUL OP_DUP 204e OP_GREATERTHAN OP_IF OP_6 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_6 OP_OUTPUTVALUE OP_OVER OP_NUMEQUALVERIFY OP_6 OP_OUTPUTBYTECODE 76a914 OP_3 OP_PICK OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_ENDIF OP_2DROP OP_1',
	'source': "pragma cashscript 0.11.3;\n\n/**\n * @param nameContractBytecode - Partial bytecode of the name contract\n * @param minWaitTime - Minimum wait time to consider an auction ended\n * @param creatorIncentivePKH - PKH of the creator incentive\n * @param tld - TLD of the name\n */\ncontract Factory(\n  bytes nameContractBytecode,\n  int minWaitTime,\n  bytes20 creatorIncentivePKH,\n  bytes tld\n) {\n  /**\n   * This function finalizes a name registration auction by:\n   * - Verifying the auction has ended and the winner's bid is valid\n   * - Issuing an immutable externalAuthNFT to the Name Contract\n   * - Issuing an immutable internalAuthNFT to the Name Contract\n   * - Issuing an immutable name NFT to the auction winner\n   * - Distributing auction fees between the platform and miners\n   * - Burning the auctionNFT\n   * - Pure BCH input from bidder is used to prevent miners from taking away the funds from any or all transactions in the future.\n   *   Out of many possible ways, this method will be suitable to easily implement by applications.\n   *\n   *\n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: NameMintingNFT from the Registry Contract\n   * - Input3: auctionNFT from the Registry Contract\n   *\n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change\n   * - Output2: NameMintingNFT back to the Registry contract\n   * - Output3: External Auth NFT to the name contract\n   * - Output4: Internal Auth NFT to the name contract\n   * - Output5: Name NFT to the auction winner\n   * - Output6: Platform fee [Reduces and the not included]\n   *\n   */\n  function call(){\n    require(tx.inputs.length == 4);\n    require(tx.outputs.length <= 7);\n\n    // This contract can only be used at input1 and it should return to itself.\n    require(this.activeInputIndex == 1);\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n    // Ensure that the nameCategory in not minted here.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x);\n    // Strict value checks to ensure the platform and miner get fee.\n    require(tx.inputs[this.activeInputIndex].value == tx.outputs[this.activeInputIndex].value);\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode);\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode);\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode);\n\n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    require(tx.outputs[3].tokenCategory == registryInputCategory);\n    require(tx.outputs[4].tokenCategory == registryInputCategory);\n    require(tx.outputs[5].tokenCategory == registryInputCategory);\n\n    // NameMintingNFT should be minting and of the 'nameCategory' i.e registryInputCategory\n    bytes nameMintingCategory, bytes nameMintingCapability = tx.inputs[2].tokenCategory.split(32);\n    require(nameMintingCategory == registryInputCategory);\n    // Minting\n    require(nameMintingCapability == 0x02);\n    // NameMintingNFT should keep the same category and capability\n    require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory);\n\n    // AuctionNFT should be mutable and of the 'nameCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.inputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory);\n    // Mutable\n    require(auctionCapability == 0x01);\n\n    // Enforce strict restrictions on NameMintingNFT\n    require(tx.inputs[2].nftCommitment == tx.outputs[2].nftCommitment);\n    // NameMintingNFT has no nftCommitment\n    require(tx.outputs[2].nftCommitment == 0x);\n    // NameMintingNFT has no tokenAmount\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount);\n    require(tx.outputs[2].tokenAmount == 0);\n\n    // Strict value check\n    require(tx.outputs[2].value == tx.inputs[2].value);\n\n    // Enforcing the relative timelock, the auctionNFT must be atleast `minWaitTime` old\n    // to be considered ended.\n    require(tx.inputs[3].sequenceNumber == minWaitTime);\n\n    // Extract the PKH and name from the auctionNFT\n    bytes20 bidderPKH, bytes name = tx.inputs[3].nftCommitment.split(20);\n    \n    // Get the name length to generate the complete bytecode of the name contract\n    int nameLength = name.length;\n    // category + name + bytecode.\n    // Note: `inactivityExpiryTime` in the name is already added to the nameContractBytecode in the constructor.\n    bytes nameBytecode = 0x20 + registryInputCategory + bytes(nameLength) + name + tld + nameContractBytecode;\n    bytes32 scriptHash = hash256(nameBytecode);\n    bytes35 nameLockingBytecode = new LockingBytecodeP2SH32(scriptHash);\n    \n    // ExternalAuthNFT goes to the name contract\n    require(tx.outputs[3].lockingBytecode == nameLockingBytecode);\n    // InternalAuthNFT goes to the name contract\n    require(tx.outputs[4].lockingBytecode == nameLockingBytecode);\n    \n    // ExternalAuthNFT does not have any commitment\n    require(tx.outputs[3].nftCommitment == 0x);\n    // Strict value check\n    require(tx.outputs[3].value == 1000);\n\n    // InternalAuthNFT has registrationID as the commitment so it can be used to authenticate\n    // along with the ownershipNFT\n    bytes8 registrationId = bytes8(tx.inputs[3].tokenAmount);\n    require(tx.outputs[4].nftCommitment == registrationId);\n    // Strict value check\n    require(tx.outputs[4].value == 1000);\n\n    // Send the name ownership NFT to the bidder\n    require(tx.outputs[5].nftCommitment == registrationId + name);\n    require(tx.outputs[5].lockingBytecode == new LockingBytecodeP2PKH(bidderPKH));\n    require(tx.outputs[5].value == 1000);\n\n    // tokenAmount from the auctionNFT goes to the authorizedThreadNFT to be accumulated later\n    // and merged back with the CounterNFT using the `Accumulator` Contract\n    require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[3].tokenAmount);\n\n    // Dual Decay mechanism, creator incentive decays linearly with the step.\n    // 1. Decay percentage to the step 0.001%\n    int decayPercentageToTheStep = tx.inputs[3].tokenAmount * 1 / 10000;\n    // 2. Get creator incentive for current step with linear decay\n    int creatorIncentive = tx.inputs[3].tokenAmount * (1 - decayPercentageToTheStep);\n\n    if(creatorIncentive > 20000) {\n      require(tx.outputs[6].tokenCategory == 0x);\n      // Enforce that the other piece of the fee goes to the miners.\n      require(tx.outputs[6].value == creatorIncentive);\n      require(tx.outputs[6].lockingBytecode == new LockingBytecodeP2PKH(creatorIncentivePKH));\n    }\n  }\n\n}",
	'debug': {
		'bytecode': 'c3549dc457a169c0519dc0c7c0cd88c0d10088c0c6c0cc9d00c752c7788853c7788852cd8800ce53d1788854d1788855d1788852ce01207f7c527988528852ce52d18853ce01207f7c527988518852cf52d28852d2008852d352d09d52d3009d52cc52c69d53cb537a9d53cf01147f7682770120547a7e7c7e787e557a7e537a7eaa02aa207c7e01877e53cd788854cd8853d2008853cc02e8039d53d0588054d2788854cc02e8039d55d27c7b7e8855cd0376a9147b7e0288ac7e8855cc02e8039d00d300d053d0939d53d051950210279653d0517b94957602204ea06356d1008856cc789d56cd0376a91453797e0288ac7e88686d51',
		'sourceMap': '44:12:44:28;:32::33;:4::35:1;45:12:45:29:0;:33::34;:12:::1;:4::36;48:12:48:33:0;:37::38;:4::40:1;49:22:49:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;51:23:51:44:0;:12::59:1;:63::65:0;:4::67:1;53:22:53:43:0;:12::50:1;:65::86:0;:54::93:1;:4::95;59:51:59:52:0;:41::69:1;60:22:60:23:0;:12::40:1;:44::72:0;:4::74:1;61:22:61:23:0;:12::40:1;:44::72:0;:4::74:1;62:23:62:24:0;:12::41:1;:4::75;65:44:65:45:0;:34::60:1;66:23:66:24:0;:12::39:1;:43::64:0;:4::66:1;67:23:67:24:0;:12::39:1;:43::64:0;:4::66:1;68:23:68:24:0;:12::39:1;:43::64:0;:4::66:1;71:71:71:72:0;:61::87:1;:94::96:0;:61::97:1;72:12:72:31:0;:35::56;;:4::58:1;74:37:74:41:0;:4::43:1;76:22:76:23:0;:12::38:1;:53::54:0;:42::69:1;:4::71;79:63:79:64:0;:53::79:1;:86::88:0;:53::89:1;80:12:80:27:0;:31::52;;:4::54:1;82:33:82:37:0;:4::39:1;85:22:85:23:0;:12::38:1;:53::54:0;:42::69:1;:4::71;87:23:87:24:0;:12::39:1;:43::45:0;:4::47:1;89:23:89:24:0;:12::37:1;:51::52:0;:41::65:1;:4::67;90:23:90:24:0;:12::37:1;:41::42:0;:4::44:1;93:23:93:24:0;:12::31:1;:45::46:0;:35::53:1;:4::55;97:22:97:23:0;:12::39:1;:43::54:0;;:4::56:1;100:46:100:47:0;:36::62:1;:69::71:0;:36::72:1;103:21:103:25:0;:::32:1;;106:25:106:29:0;:32::53;;:25:::1;:62::72:0;:25::73:1;:76::80:0;:25:::1;:83::86:0;;:25:::1;:89::109:0;;:25:::1;107::107:46;108:34:108:71:0;:60::70;:34::71:1;;;111:23:111:24:0;:12::41:1;:45::64:0;:4::66:1;113:23:113:24:0;:12::41:1;:4::66;116:23:116:24:0;:12::39:1;:43::45:0;:4::47:1;118:23:118:24:0;:12::31:1;:35::39:0;:4::41:1;122:45:122:46:0;:35::59:1;:28::60;;123:23:123:24:0;:12::39:1;:43::57:0;:4::59:1;125:23:125:24:0;:12::31:1;:35::39:0;:4::41:1;128:23:128:24:0;:12::39:1;:43::57:0;:60::64;:43:::1;:4::66;129:23:129:24:0;:12::41:1;:45::80:0;:70::79;:45::80:1;;;:4::82;130:23:130:24:0;:12::31:1;:35::39:0;:4::41:1;134:23:134:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::94;138:45:138:46:0;:35::59:1;:62::63:0;:35:::1;:66::71:0;:35:::1;140:37:140:38:0;:27::51:1;:55::56:0;:59::83;:55:::1;:27::84;142:7:142:23:0;:26::31;:7:::1;:33:147:5:0;143:25:143:26;:14::41:1;:45::47:0;:6::49:1;145:25:145:26:0;:14::33:1;:37::53:0;:6::55:1;146:25:146:26:0;:14::43:1;:47::92:0;:72::91;;:47::92:1;;;:6::94;142:33:147:5;43:2:148:3;',
		'logs': [],
		'requires': [
			{
				'ip': 6,
				'line': 44,
			},
			{
				'ip': 10,
				'line': 45,
			},
			{
				'ip': 13,
				'line': 48,
			},
			{
				'ip': 18,
				'line': 49,
			},
			{
				'ip': 22,
				'line': 51,
			},
			{
				'ip': 27,
				'line': 53,
			},
			{
				'ip': 33,
				'line': 60,
			},
			{
				'ip': 37,
				'line': 61,
			},
			{
				'ip': 40,
				'line': 62,
			},
			{
				'ip': 46,
				'line': 66,
			},
			{
				'ip': 50,
				'line': 67,
			},
			{
				'ip': 54,
				'line': 68,
			},
			{
				'ip': 62,
				'line': 72,
			},
			{
				'ip': 64,
				'line': 74,
			},
			{
				'ip': 69,
				'line': 76,
			},
			{
				'ip': 77,
				'line': 80,
			},
			{
				'ip': 79,
				'line': 82,
			},
			{
				'ip': 84,
				'line': 85,
			},
			{
				'ip': 88,
				'line': 87,
			},
			{
				'ip': 93,
				'line': 89,
			},
			{
				'ip': 97,
				'line': 90,
			},
			{
				'ip': 102,
				'line': 93,
			},
			{
				'ip': 107,
				'line': 97,
			},
			{
				'ip': 138,
				'line': 111,
			},
			{
				'ip': 141,
				'line': 113,
			},
			{
				'ip': 145,
				'line': 116,
			},
			{
				'ip': 149,
				'line': 118,
			},
			{
				'ip': 157,
				'line': 123,
			},
			{
				'ip': 161,
				'line': 125,
			},
			{
				'ip': 167,
				'line': 128,
			},
			{
				'ip': 175,
				'line': 129,
			},
			{
				'ip': 179,
				'line': 130,
			},
			{
				'ip': 187,
				'line': 134,
			},
			{
				'ip': 207,
				'line': 143,
			},
			{
				'ip': 211,
				'line': 145,
			},
			{
				'ip': 220,
				'line': 146,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-07-27T19:02:16.968Z',
};
