export default {
	'contractName': 'DomainFactory',
	'constructorInputs': [
		{
			'name': 'domainContractBytecode',
			'type': 'bytes',
		},
		{
			'name': 'minWaitTime',
			'type': 'int',
		},
		{
			'name': 'maxPlatformFeePercentage',
			'type': 'int',
		},
	],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_8 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOVALUE OP_INPUTINDEX OP_OUTPUTVALUE OP_NUMEQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_5 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_2 OP_OUTPUTTOKENCOMMITMENT OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY OP_2 OP_OUTPUTVALUE OP_2 OP_UTXOVALUE OP_NUMEQUALVERIFY OP_3 OP_INPUTSEQUENCENUMBER OP_3 OP_ROLL OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_DUP OP_SIZE OP_NIP 20 OP_4 OP_ROLL OP_CAT OP_SWAP OP_CAT OP_OVER OP_CAT OP_3 OP_ROLL OP_CAT OP_HASH256 aa20 OP_SWAP OP_CAT 87 OP_CAT OP_3 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_3 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENAMOUNT OP_8 OP_NUM2BIN OP_REVERSEBYTES OP_4 OP_OUTPUTTOKENCOMMITMENT OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_5 OP_OUTPUTTOKENCOMMITMENT OP_SWAP OP_ROT OP_CAT OP_EQUALVERIFY OP_5 OP_OUTPUTBYTECODE 76a914 OP_ROT OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_5 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_4 OP_UTXOBYTECODE OP_5 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_4 OP_UTXOBYTECODE OP_6 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_4 OP_UTXOVALUE OP_6 OP_OUTPUTVALUE OP_NUMEQUALVERIFY OP_4 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_6 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_7 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_7 OP_OUTPUTVALUE OP_3 OP_UTXOVALUE 64 OP_DIV OP_ROT OP_MUL OP_LESSTHANOREQUAL',
	'source': "pragma cashscript 0.11.2;\n\n/**\n * @param domainContractBytecode - Partial bytecode of the domain contract\n * @param minWaitTime - Minimum wait time to consider an auction ended\n * @param maxPlatformFeePercentage - Maximum platform fee percentage\n */\ncontract DomainFactory(\n  bytes domainContractBytecode,\n  int minWaitTime,\n  int maxPlatformFeePercentage\n) {\n  /**\n   * This function finalizes a domain registration auction by:\n   * - Verifying the auction has ended and the winner's bid is valid\n   * - Issuing an immutable externalAuthNFT to the Domain Contract\n   * - Issuing an immutable internalAuthNFT to the Domain Contract\n   * - Issuing an immutable domain NFT to the auction winner\n   * - Distributing auction fees between the platform and miners\n   * - Burning the auctionNFT\n   * - Pure BCH input from bidder is used to prevent miners from taking away the funds from any or all transactions in the future.\n   *   Out of many possible ways, this method will be suitable to easily implement by applications.\n   *\n   *\n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: DomainMintingNFT from the Registry Contract\n   * - Input3: auctionNFT from the Registry Contract\n   * - Input4: Pure BCH from bidder\n   *\n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change\n   * - Output2: DomainMintingNFT back to the Registry contract\n   * - Output3: External Auth NFT to the domain contract\n   * - Output4: Internal Auth NFT to the domain contract\n   * - Output5: Domain NFT to the auction winner\n   * - Output6: Pure BCH back to the bidder\n   * - Output7: Platform fee\n   *\n   */\n  function call(){\n    require(tx.inputs.length == 5);\n    require(tx.outputs.length == 8);\n\n    // This contract can only be used at input1 and it should return to itself.\n    require(this.activeInputIndex == 1);\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n    // Ensure that the domainCategory in not minted here.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x);\n    // Strict value checks to ensure the platform and miner get fee.\n    require(tx.inputs[this.activeInputIndex].value == tx.outputs[this.activeInputIndex].value);\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode);\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode);\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode);\n\n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    require(tx.outputs[3].tokenCategory == registryInputCategory);\n    require(tx.outputs[4].tokenCategory == registryInputCategory);\n    require(tx.outputs[5].tokenCategory == registryInputCategory);\n\n    // DomainMintingNFT should be minting and of the 'domainCategory' i.e registryInputCategory\n    bytes domainMintingCategory, bytes domainMintingCapability = tx.inputs[2].tokenCategory.split(32);\n    require(domainMintingCategory == registryInputCategory);\n    require(domainMintingCapability == 0x02); // Mutable\n    // DomainMintingNFT should keep the same category and capability\n    require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory);\n\n    // AuctionNFT should be mutable and of the 'domainCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.inputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory);\n    require(auctionCapability == 0x01); // Mutable\n\n    // Enforce strict restrictions on DomainMintingNFT\n    require(tx.inputs[2].nftCommitment == tx.outputs[2].nftCommitment);\n    // DomainMintingNFT has no nftCommitment\n    require(tx.outputs[2].nftCommitment == 0x);\n    // DomainMintingNFT has no tokenAmount\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount);\n    require(tx.outputs[2].tokenAmount == 0);\n\n    // Strict value check\n    require(tx.outputs[2].value == tx.inputs[2].value);\n\n    // Enforcing the relative timelock, the auctionNFT must be atleast `minWaitTime` old\n    // to be considered ended.\n    require(tx.inputs[3].sequenceNumber == minWaitTime);\n\n    // Extract the PKH and name from the auctionNFT\n    bytes20 bidderPKH, bytes name = tx.inputs[3].nftCommitment.split(20);\n    \n    // Get the name length to generate the complete bytecode of the domain contract\n    int nameLength = name.length;\n    // category + name + bytecode.\n    // Note: `inactivityExpiryTime` in the domain is already added to the domainContractBytecode in the constructor.\n    bytes domainBytecode = 0x20 + registryInputCategory + bytes(nameLength) + name + domainContractBytecode;\n    bytes32 scriptHash = hash256(domainBytecode);\n    bytes35 domainLockingBytecode = new LockingBytecodeP2SH32(scriptHash);\n    \n    // ExternalAuthNFT goes to the domain contract\n    require(tx.outputs[3].lockingBytecode == domainLockingBytecode);\n    // InternalAuthNFT goes to the domain contract\n    require(tx.outputs[4].lockingBytecode == domainLockingBytecode);\n    \n    // ExternalAuthNFT does not have any commitment\n    require(tx.outputs[3].nftCommitment == 0x);\n    // Strict value check\n    require(tx.outputs[3].value == 1000);\n\n    // InternalAuthNFT has registrationID as the commitment so it can be used to authenticate\n    // along with the ownershipNFT\n    bytes8 registrationId = bytes8(tx.inputs[3].tokenAmount).reverse();\n    require(tx.outputs[4].nftCommitment == registrationId);\n    // Strict value check\n    require(tx.outputs[4].value == 1000);\n\n    // Send the domain ownership NFT to the bidder\n    require(tx.outputs[5].nftCommitment == registrationId + name);\n    require(tx.outputs[5].lockingBytecode == new LockingBytecodeP2PKH(bidderPKH));\n    require(tx.outputs[5].value == 1000);\n\n    // Ensure that the bidder receiving the domain ownership NFT is also receiving the pure BCH back\n    require(tx.inputs[4].lockingBytecode == tx.outputs[5].lockingBytecode);\n    require(tx.inputs[4].lockingBytecode == tx.outputs[6].lockingBytecode);\n    // Ensure that the value of input from bidder is the same and goes back to the bidder\n    require(tx.inputs[4].value == tx.outputs[6].value);\n\n    // Ensure that input and output to the bidder does not have any tokenCategory\n    require(tx.inputs[4].tokenCategory == 0x);\n    require(tx.outputs[6].tokenCategory == 0x);\n\n    // tokenAmount from the auctionNFT goes to the authorizedThreadNFT to be accumulated later\n    // and merged back with the CounterNFT using the `Accumulator` Contract\n    require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[3].tokenAmount);\n\n    // Output can be added by anyone (Mainly platforms)\n    require(tx.outputs[7].tokenCategory == 0x);\n    // Enforce that the other piece of the fee goes to the miners.\n    require(tx.outputs[7].value <= (tx.inputs[3].value / 100) * maxPlatformFeePercentage);\n  }\n\n}",
	'debug': {
		'bytecode': 'c3559dc4589dc0519dc0c7c0cd88c0d10088c0c6c0cc9d00c752c7788853c7788852cd8800ce53d1788854d1788855d1788852ce01207f7c527988528852ce52d18853ce01207f7c527988518852cf52d28852d2008852d352d09d52d3009d52cc52c69d53cb537a9d53cf01147f7682770120547a7e7c7e787e537a7eaa02aa207c7e01877e53cd788854cd8853d2008853cc02e8039d53d05880bc54d2788854cc02e8039d55d27c7b7e8855cd0376a9147b7e0288ac7e8855cc02e8039d54c755cd8854c756cd8854c656cc9d54ce008856d1008800d300d053d0939d57d1008857cc53c60164967b95a1',
		'sourceMap': '44:12:44:28;:32::33;:4::35:1;45:12:45:29:0;:33::34;:4::36:1;48:12:48:33:0;:37::38;:4::40:1;49:22:49:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;51:23:51:44:0;:12::59:1;:63::65:0;:4::67:1;53:22:53:43:0;:12::50:1;:65::86:0;:54::93:1;:4::95;59:51:59:52:0;:41::69:1;60:22:60:23:0;:12::40:1;:44::72:0;:4::74:1;61:22:61:23:0;:12::40:1;:44::72:0;:4::74:1;62:23:62:24:0;:12::41:1;:4::75;65:44:65:45:0;:34::60:1;66:23:66:24:0;:12::39:1;:43::64:0;:4::66:1;67:23:67:24:0;:12::39:1;:43::64:0;:4::66:1;68:23:68:24:0;:12::39:1;:43::64:0;:4::66:1;71:75:71:76:0;:65::91:1;:98::100:0;:65::101:1;72:12:72:33:0;:37::58;;:4::60:1;73:39:73:43:0;:4::45:1;75:22:75:23:0;:12::38:1;:53::54:0;:42::69:1;:4::71;78:63:78:64:0;:53::79:1;:86::88:0;:53::89:1;79:12:79:27:0;:31::52;;:4::54:1;80:33:80:37:0;:4::39:1;83:22:83:23:0;:12::38:1;:53::54:0;:42::69:1;:4::71;85:23:85:24:0;:12::39:1;:43::45:0;:4::47:1;87:23:87:24:0;:12::37:1;:51::52:0;:41::65:1;:4::67;88:23:88:24:0;:12::37:1;:41::42:0;:4::44:1;91:23:91:24:0;:12::31:1;:45::46:0;:35::53:1;:4::55;95:22:95:23:0;:12::39:1;:43::54:0;;:4::56:1;98:46:98:47:0;:36::62:1;:69::71:0;:36::72:1;101:21:101:25:0;:::32:1;;104:27:104:31:0;:34::55;;:27:::1;:64::74:0;:27::75:1;:78::82:0;:27:::1;:85::107:0;;:27:::1;105:25:105:48;106:36:106:73:0;:62::72;:36::73:1;;;109:23:109:24:0;:12::41:1;:45::66:0;:4::68:1;111:23:111:24:0;:12::41:1;:4::68;114:23:114:24:0;:12::39:1;:43::45:0;:4::47:1;116:23:116:24:0;:12::31:1;:35::39:0;:4::41:1;120:45:120:46:0;:35::59:1;:28::60;;:::70;121:23:121:24:0;:12::39:1;:43::57:0;:4::59:1;123:23:123:24:0;:12::31:1;:35::39:0;:4::41:1;126:23:126:24:0;:12::39:1;:43::57:0;:60::64;:43:::1;:4::66;127:23:127:24:0;:12::41:1;:45::80:0;:70::79;:45::80:1;;;:4::82;128:23:128:24:0;:12::31:1;:35::39:0;:4::41:1;131:22:131:23:0;:12::40:1;:55::56:0;:44::73:1;:4::75;132:22:132:23:0;:12::40:1;:55::56:0;:44::73:1;:4::75;134:22:134:23:0;:12::30:1;:45::46:0;:34::53:1;:4::55;137:22:137:23:0;:12::38:1;:42::44:0;:4::46:1;138:23:138:24:0;:12::39:1;:43::45:0;:4::47:1;142:23:142:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::94;145:23:145:24:0;:12::39:1;:43::45:0;:4::47:1;147:23:147:24:0;:12::31:1;:46::47:0;:36::54:1;:57::60:0;:36:::1;:64::88:0;:35:::1;:4::90',
		'logs': [],
		'requires': [
			{
				'ip': 5,
				'line': 44,
			},
			{
				'ip': 8,
				'line': 45,
			},
			{
				'ip': 11,
				'line': 48,
			},
			{
				'ip': 16,
				'line': 49,
			},
			{
				'ip': 20,
				'line': 51,
			},
			{
				'ip': 25,
				'line': 53,
			},
			{
				'ip': 31,
				'line': 60,
			},
			{
				'ip': 35,
				'line': 61,
			},
			{
				'ip': 38,
				'line': 62,
			},
			{
				'ip': 44,
				'line': 66,
			},
			{
				'ip': 48,
				'line': 67,
			},
			{
				'ip': 52,
				'line': 68,
			},
			{
				'ip': 60,
				'line': 72,
			},
			{
				'ip': 62,
				'line': 73,
			},
			{
				'ip': 67,
				'line': 75,
			},
			{
				'ip': 75,
				'line': 79,
			},
			{
				'ip': 77,
				'line': 80,
			},
			{
				'ip': 82,
				'line': 83,
			},
			{
				'ip': 86,
				'line': 85,
			},
			{
				'ip': 91,
				'line': 87,
			},
			{
				'ip': 95,
				'line': 88,
			},
			{
				'ip': 100,
				'line': 91,
			},
			{
				'ip': 105,
				'line': 95,
			},
			{
				'ip': 133,
				'line': 109,
			},
			{
				'ip': 136,
				'line': 111,
			},
			{
				'ip': 140,
				'line': 114,
			},
			{
				'ip': 144,
				'line': 116,
			},
			{
				'ip': 153,
				'line': 121,
			},
			{
				'ip': 157,
				'line': 123,
			},
			{
				'ip': 163,
				'line': 126,
			},
			{
				'ip': 171,
				'line': 127,
			},
			{
				'ip': 175,
				'line': 128,
			},
			{
				'ip': 180,
				'line': 131,
			},
			{
				'ip': 185,
				'line': 132,
			},
			{
				'ip': 190,
				'line': 134,
			},
			{
				'ip': 194,
				'line': 137,
			},
			{
				'ip': 198,
				'line': 138,
			},
			{
				'ip': 206,
				'line': 142,
			},
			{
				'ip': 210,
				'line': 145,
			},
			{
				'ip': 220,
				'line': 147,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.2',
	},
	'updatedAt': '2025-07-15T19:31:08.923Z',
};
