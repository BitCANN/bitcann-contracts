export default {
	'contractName': 'OwnershipGuard',
	'constructorInputs': [
		{
			'name': 'nameContractBytecode',
			'type': 'bytes',
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
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_3 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_2 OP_OUTPUTTOKENCOMMITMENT OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_3 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_NIP OP_DUP OP_SIZE OP_NIP 20 OP_3 OP_ROLL OP_CAT OP_SWAP OP_4 OP_PICK OP_SIZE OP_NIP OP_ADD OP_CAT OP_SWAP OP_CAT OP_ROT OP_CAT OP_SWAP OP_CAT OP_HASH256 aa20 OP_SWAP OP_CAT 87 OP_CAT OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL',
	'source': "pragma cashscript 0.11.3;\n\n/**\n * @param nameContractBytecode The the partial bytecode of the name contract that has an Owner.\n * @param tld - TLD of the name\n */\ncontract OwnershipGuard(bytes nameContractBytecode, bytes tld) {\n  /**\n   * If the name being auctioned already has an `externalAuthNFT` with the same category, then the auction is invalid.\n   * Because it means that an owner still exists. If it is known that the name has been abandoned for > `inactivityExpiryTime`\n   * then one must use the `burn` method of the name.cash to burn the internalAuthNFT and externalAuthNFT making the \n   * name to be available for auction.\n   *\n   * Penalizes invalid name registrations by allowing anyone to burn the auctionNFT and claim the funds as a reward.\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: External Auth NFT from the Name Contract\n   * - Input3: auctionNFT from Registry Contract\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change\n   * - Output2: External Auth NFT back to the Name Contract\n   * - Output3: BCH change/reward to caller\n   */\n  function call(){\n    require(tx.inputs.length == 4, \"Transaction: must have exactly 4 inputs\");\n    require(tx.outputs.length == 4, \"Transaction: must have exactly 4 outputs\");\n    \n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1, \"Input 1: ownership guard contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode, \"Input 3: auction NFT locking bytecode does not match registry input's locking bytecode\");\n\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    require(tx.inputs[2].tokenCategory == registryInputCategory, \"Input 2: external auth NFT token category prefix must match registry\");\n    require(tx.outputs[2].tokenCategory == registryInputCategory, \"Output 2: external auth NFT token category prefix must match registry\");\n\n    // AuctionNFT should be mutable and of the 'nameCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.inputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory, \"Input 3: auction NFT token category prefix must match registry\");\n    // Mutable\n    require(auctionCapability == 0x01, \"Input 3: auction NFT capability must be mutable (0x01)\");\n\n    // nftCommiment of the externalAuthNFT must stay the same\n    require(tx.inputs[2].nftCommitment == tx.outputs[2].nftCommitment, \"Output 2: external auth NFT commitment must match input 2\");\n    // Ensure that the externalAuth NFT is used and not the internalAuth NFT.\n    require(tx.inputs[2].nftCommitment == 0x, \"Input 2: external auth NFT must have empty commitment\");\n\n    // Get the name of the name from the auctionNFT\n    bytes name = tx.inputs[3].nftCommitment.split(20)[1];\n    // Get the name length to generate the complete bytecode of the name contract\n    int nameLength = name.length;\n    // category + name + bytecode.\n    // Note: `inactivityExpiryTime` in the name is already added to the nameContractBytecode in the constructor.\n    bytes nameBytecode = 0x20 + registryInputCategory + bytes(nameLength + tld.length) + name + tld + nameContractBytecode;\n    bytes32 scriptHash = hash256(nameBytecode);\n    bytes35 nameLockingBytecode = new LockingBytecodeP2SH32(scriptHash);\n\n    // Ensure that the externalAuthNFT is coming from the correct Name Contract\n    require(tx.inputs[2].lockingBytecode == nameLockingBytecode, \"Input 2: external auth NFT locking bytecode must match name contract\");\n    require(tx.outputs[2].lockingBytecode == nameLockingBytecode, \"Output 2: external auth NFT locking bytecode must match name contract\");\n\n    // tokenAmount from the auctionNFT goes to the authorizedThreadNFT to be accumulated later\n    // and merged back with the CounterNFT using the `Accumulator` Contract\n    require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[3].tokenAmount, \"Output 0: token amount must equal input 0 + input 3 amounts (accumulation)\");\n\n    // Reward Output\n    require(tx.outputs[3].tokenCategory == 0x, \"Output 3: reward must be pure BCH (no token category)\");\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc4549dc0519dc0c7c0cd8800c753c78800ce52ce788852d1788853ce01207f7c527988518852cf52d28852cf008853cf01147f777682770120537a7e7c54798277937e7c7e7b7e7c7eaa02aa207c7e01877e52c7788852cd8800d300d053d0939d53d10087',
		'sourceMap': '29:12:29:28;:32::33;:4::78:1;30:12:30:29:0;:33::34;:4::80:1;33:12:33:33:0;:37::38;:4::104:1;34:22:34:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;40:51:40:52:0;:41::69:1;41:22:41:23:0;:12::40:1;:4::164;43:44:43:45:0;:34::60:1;44:22:44:23:0;:12::38:1;:42::63:0;:4::137:1;45:23:45:24:0;:12::39:1;:43::64:0;:4::139:1;48:63:48:64:0;:53::79:1;:86::88:0;:53::89:1;49:12:49:27:0;:31::52;;:4::120:1;51:33:51:37:0;:4::97:1;54:22:54:23:0;:12::38:1;:53::54:0;:42::69:1;:4::132;56:22:56:23:0;:12::38:1;:42::44:0;:4::103:1;59:27:59:28:0;:17::43:1;:50::52:0;:17::53:1;:::56;61:21:61:25:0;:::32:1;;64:25:64:29:0;:32::53;;:25:::1;:62::72:0;:75::78;;:::85:1;;:62;:25::86;:89::93:0;:25:::1;:96::99:0;:25:::1;:102::122:0;:25:::1;65::65:46;66:34:66:71:0;:60::70;:34::71:1;;;69:22:69:23:0;:12::40:1;:44::63:0;:4::137:1;70:23:70:24:0;:12::41:1;:4::139;74:23:74:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::172;77:23:77:24:0;:12::39:1;:43::45:0;:4::104:1',
		'logs': [],
		'requires': [
			{
				'ip': 4,
				'line': 29,
				'message': 'Transaction: must have exactly 4 inputs',
			},
			{
				'ip': 7,
				'line': 30,
				'message': 'Transaction: must have exactly 4 outputs',
			},
			{
				'ip': 10,
				'line': 33,
				'message': 'Input 1: ownership guard contract UTXO must be at this index',
			},
			{
				'ip': 15,
				'line': 34,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 20,
				'line': 41,
				'message': "Input 3: auction NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 26,
				'line': 44,
				'message': 'Input 2: external auth NFT token category prefix must match registry',
			},
			{
				'ip': 30,
				'line': 45,
				'message': 'Output 2: external auth NFT token category prefix must match registry',
			},
			{
				'ip': 38,
				'line': 49,
				'message': 'Input 3: auction NFT token category prefix must match registry',
			},
			{
				'ip': 40,
				'line': 51,
				'message': 'Input 3: auction NFT capability must be mutable (0x01)',
			},
			{
				'ip': 45,
				'line': 54,
				'message': 'Output 2: external auth NFT commitment must match input 2',
			},
			{
				'ip': 49,
				'line': 56,
				'message': 'Input 2: external auth NFT must have empty commitment',
			},
			{
				'ip': 84,
				'line': 69,
				'message': 'Input 2: external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 87,
				'line': 70,
				'message': 'Output 2: external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 95,
				'line': 74,
				'message': 'Output 0: token amount must equal input 0 + input 3 amounts (accumulation)',
			},
			{
				'ip': 100,
				'line': 77,
				'message': 'Output 3: reward must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-08-06T02:48:17.022Z',
};
