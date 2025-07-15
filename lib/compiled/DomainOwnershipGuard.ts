export default {
	'contractName': 'DomainOwnershipGuard',
	'constructorInputs': [
		{
			'name': 'domainContractBytecode',
			'type': 'bytes',
		},
	],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_3 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_2 OP_OUTPUTTOKENCOMMITMENT OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_3 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_NIP OP_DUP OP_SIZE OP_NIP 20 OP_3 OP_ROLL OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_HASH256 aa20 OP_SWAP OP_CAT 87 OP_CAT OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL',
	'source': "pragma cashscript 0.11.2;\n\n/**\n * @param domainContractBytecode The the partial bytecode of the domain contract that has an Owner..\n */\ncontract DomainOwnershipGuard(bytes domainContractBytecode) {\n  /**\n   * If the domain being auctioned already has an `externalAuthNFT` with the same category, then the auction is invalid.\n   * Because it means that an owner still exists. If it is known that the domain has been abandoned for > `inactivityExpiryTime`\n   * then one must use the `burn` method of the domain.cash to burn the internalAuthNFT and externalAuthNFT making the \n   * domain to be available for auction.\n   *\n   * Penalizes invalid domain registrations by allowing anyone to burn the auctionNFT and claim the funds as a reward.\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: External Auth NFT from the Domain Contract\n   * - Input3: auctionNFT from Registry Contract\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change\n   * - Output2: External Auth NFT back to the Domain Contract\n   * - Output3: BCH change/reward to caller\n   */\n  function call(){\n    require(tx.inputs.length == 4);\n    require(tx.outputs.length == 4);\n    \n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1);\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode);\n\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    require(tx.inputs[2].tokenCategory == registryInputCategory);\n    require(tx.outputs[2].tokenCategory == registryInputCategory);\n\n    // AuctionNFT should be mutable and of the 'domainCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.inputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory);\n    require(auctionCapability == 0x01); // Mutable\n\n    // nftCommiment of the externalAuthNFT must stay the same\n    require(tx.inputs[2].nftCommitment == tx.outputs[2].nftCommitment);\n    // Ensure that the externalAuth NFT is used and not the internalAuth NFT.\n    require(tx.inputs[2].nftCommitment == 0x);\n\n    // Get the name of the domain from the auctionNFT\n    bytes name = tx.inputs[3].nftCommitment.split(20)[1];\n    // Get the name length to generate the complete bytecode of the domain contract\n    int nameLength = name.length;\n    // category + name + bytecode.\n    // Note: `inactivityExpiryTime` in the domain is already added to the domainContractBytecode in the constructor.\n    bytes domainBytecode = 0x20 + registryInputCategory + bytes(nameLength) + name + domainContractBytecode;\n    bytes32 scriptHash = hash256(domainBytecode);\n    bytes35 domainLockingBytecode = new LockingBytecodeP2SH32(scriptHash);\n\n    // Ensure that the externalAuthNFT is coming from the correct Domain Contract\n    require(tx.inputs[2].lockingBytecode == domainLockingBytecode);\n    require(tx.outputs[2].lockingBytecode == domainLockingBytecode);\n\n    // tokenAmount from the auctionNFT goes to the authorizedThreadNFT to be accumulated later\n    // and merged back with the CounterNFT using the `Accumulator` Contract\n    require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[3].tokenAmount);\n\n    // Reward Output\n    require(tx.outputs[3].tokenCategory == 0x);\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc4549dc0519dc0c7c0cd8800c753c78800ce52ce788852d1788853ce01207f7c527988518852cf52d28852cf008853cf01147f777682770120537a7e7c7e7c7e7c7eaa02aa207c7e01877e52c7788852cd8800d300d053d0939d53d10087',
		'sourceMap': '28:12:28:28;:32::33;:4::35:1;29:12:29:29:0;:33::34;:4::36:1;32:12:32:33:0;:37::38;:4::40:1;33:22:33:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;39:51:39:52:0;:41::69:1;40:22:40:23:0;:12::40:1;:4::74;42:44:42:45:0;:34::60:1;43:22:43:23:0;:12::38:1;:42::63:0;:4::65:1;44:23:44:24:0;:12::39:1;:43::64:0;:4::66:1;47:63:47:64:0;:53::79:1;:86::88:0;:53::89:1;48:12:48:27:0;:31::52;;:4::54:1;49:33:49:37:0;:4::39:1;52:22:52:23:0;:12::38:1;:53::54:0;:42::69:1;:4::71;54:22:54:23:0;:12::38:1;:42::44:0;:4::46:1;57:27:57:28:0;:17::43:1;:50::52:0;:17::53:1;:::56;59:21:59:25:0;:::32:1;;62:27:62:31:0;:34::55;;:27:::1;:64::74:0;:27::75:1;:78::82:0;:27:::1;:85::107:0;:27:::1;63:25:63:48;64:36:64:73:0;:62::72;:36::73:1;;;67:22:67:23:0;:12::40:1;:44::65:0;:4::67:1;68:23:68:24:0;:12::41:1;:4::68;72:23:72:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::94;75:23:75:24:0;:12::39:1;:43::45:0;:4::47:1',
		'logs': [],
		'requires': [
			{
				'ip': 3,
				'line': 28,
			},
			{
				'ip': 6,
				'line': 29,
			},
			{
				'ip': 9,
				'line': 32,
			},
			{
				'ip': 14,
				'line': 33,
			},
			{
				'ip': 19,
				'line': 40,
			},
			{
				'ip': 25,
				'line': 43,
			},
			{
				'ip': 29,
				'line': 44,
			},
			{
				'ip': 37,
				'line': 48,
			},
			{
				'ip': 39,
				'line': 49,
			},
			{
				'ip': 44,
				'line': 52,
			},
			{
				'ip': 48,
				'line': 54,
			},
			{
				'ip': 76,
				'line': 67,
			},
			{
				'ip': 79,
				'line': 68,
			},
			{
				'ip': 87,
				'line': 72,
			},
			{
				'ip': 92,
				'line': 75,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.2',
	},
	'updatedAt': '2025-07-15T19:31:09.531Z',
};
