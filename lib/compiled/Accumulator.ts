export default {
	'contractName': 'Accumulator',
	'constructorInputs': [],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY OP_3 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_UTXOTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_3 OP_UTXOTOKENCOMMITMENT OP_SIZE OP_NIP 23 OP_NUMEQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUAL OP_NOT OP_VERIFY OP_2 OP_UTXOTOKENAMOUNT OP_0 OP_GREATERTHAN OP_VERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_4 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_4 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL',
	'source': "pragma cashscript 0.11.3;\n\ncontract Accumulator() {\n  /**\n   * Once enough auctions have happened, there will come a time when the counterNFT's tokenAmount is not enough.\n   * Since the amount would be accumulating in the thread NFTs, this function can be used to transfer them back to the\n   * Counter NFT to keep the system functioning smoothly.\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: Minting CounterNFT + tokenAmount from Registry Contract\n   * - Input3: authorizedThreadNFT with tokenAmount from Registry Contract\n   * - Input4: Pure BCH\n   * \n   * @outputs\n   * - Output0: Registry Contract's thread NFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Minting CounterNFT back to the Registry contract + tokenAmount\n   * - Output3: authorizedThreadNFT without tokenAmount back to the Registry contract\n   * - Output4: Change BCH\n   */\n  function call(){\n    require(tx.inputs.length == 5, \"Transaction: must have exactly 5 inputs\");\n    require(tx.outputs.length == 5, \"Transaction: must have exactly 5 outputs\");\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1, \"Input 1: accumulator contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n    // Restriction on output category is important as minting NFT is used in this transaction.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x, \"Output 1: must not have any token category (pure BCH only)\");\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    \n    // Enforce input 2 and 3 are from the registry\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: locking bytecode does not match registry input's locking bytecode\");\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode, \"Input 3: locking bytecode does not match registry input's locking bytecode\");\n\n    // Enforce output 2 and 3 are returning to the registry\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, \"Output 2: locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[3].lockingBytecode == registryInputLockingBytecode, \"Output 3: locking bytecode does not match registry input's locking bytecode\");\n\n    // Enforce NFT transfer preserves token categories\n    require(tx.outputs[2].tokenCategory == tx.inputs[2].tokenCategory, \"Output 2: token category does not match input 2\");\n    require(tx.outputs[3].tokenCategory == tx.inputs[3].tokenCategory, \"Output 3: token category does not match input 3\");\n\n    // authorizedThreadNFTs are immutable — must match registry input category\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    require(tx.inputs[3].tokenCategory == registryInputCategory, \"Input 3: token category does not match registry (immutable NFT check)\");\n    \n    // Split counter token category and capability\n    bytes counterCategory, bytes counterCapability = tx.inputs[2].tokenCategory.split(32);\n    require(counterCategory == registryInputCategory, \"Input 2: token category prefix does not match registry\");\n     // Minting\n    require(counterCapability == 0x02, \"Input 2: counter capability must be minting capability (0x02)\");\n\n    // Locking bytecode of the authorized contract is 35 bytes long.\n    require(tx.inputs[3].nftCommitment.length == 35, \"Input 3: NFT commitment length must be 35 bytes (authorized contract locking bytecode)\");\n\n    // Since the nftCommitment of counterNFT is registrationID so it must not be null\n    // as the NameMintingNFT has no nftCommitment nor tokenAmount\n    require(tx.inputs[2].nftCommitment != 0x, \"Input 2: counter NFT must have a non-empty commitment (registration ID)\");\n    // Ensure that the counter minting NFT is used.\n    require(tx.inputs[2].tokenAmount > 0, \"Input 2: counter NFT must have token amount greater than 0\");\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount + tx.inputs[3].tokenAmount, \"Output 2: token amount must equal input 2 + input 3 amounts (accumulation)\");\n\n    // Pure BCH input and output.\n    require(tx.inputs[4].tokenCategory == 0x, \"Input 4: must be pure BCH (no token category)\");\n    require(tx.outputs[4].tokenCategory == 0x, \"Output 4: must be pure BCH (no token category)\");\n  }\n}",
	'debug': {
		'bytecode': 'c3559dc4559dc0519dc0c7c0cd88c0d1008800c752c7788853c7788852cd788853cd8852d152ce8853d153ce8800ce53ce788852ce01207f7c7b88528853cf827701239d52cf0087916952d000a06952d352d053d0939d54ce008854d10087',
		'sourceMap': '24:12:24:28;:32::33;:4::78:1;25:12:25:29:0;:33::34;:4::80:1;28:12:28:33:0;:37::38;:4::100:1;29:22:29:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;31:23:31:44:0;:12::59:1;:63::65:0;:4::129:1;37:51:37:52:0;:41::69:1;40:22:40:23:0;:12::40:1;:44::72:0;:4::152:1;41:22:41:23:0;:12::40:1;:44::72:0;:4::152:1;44:23:44:24:0;:12::41:1;:45::73:0;:4::154:1;45:23:45:24:0;:12::41:1;:4::154;48:23:48:24:0;:12::39:1;:53::54:0;:43::69:1;:4::122;49:23:49:24:0;:12::39:1;:53::54:0;:43::69:1;:4::122;52:44:52:45:0;:34::60:1;53:22:53:23:0;:12::38:1;:42::63:0;:4::138:1;56:63:56:64:0;:53::79:1;:86::88:0;:53::89:1;57:12:57:27:0;:31::52;:4::112:1;59:33:59:37:0;:4::104:1;62:22:62:23:0;:12::38:1;:::45;;:49::51:0;:4::143:1;66:22:66:23:0;:12::38:1;:42::44:0;:12:::1;;:4::121;68:22:68:23:0;:12::36:1;:39::40:0;:12:::1;:4::104;69:23:69:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::172;72:22:72:23:0;:12::38:1;:42::44:0;:4::95:1;73:23:73:24:0;:12::39:1;:43::45:0;:4::97:1',
		'logs': [],
		'requires': [
			{
				'ip': 2,
				'line': 24,
				'message': 'Transaction: must have exactly 5 inputs',
			},
			{
				'ip': 5,
				'line': 25,
				'message': 'Transaction: must have exactly 5 outputs',
			},
			{
				'ip': 8,
				'line': 28,
				'message': 'Input 1: accumulator contract UTXO must be at this index',
			},
			{
				'ip': 13,
				'line': 29,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 17,
				'line': 31,
				'message': 'Output 1: must not have any token category (pure BCH only)',
			},
			{
				'ip': 23,
				'line': 40,
				'message': "Input 2: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 27,
				'line': 41,
				'message': "Input 3: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 31,
				'line': 44,
				'message': "Output 2: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 34,
				'line': 45,
				'message': "Output 3: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 39,
				'line': 48,
				'message': 'Output 2: token category does not match input 2',
			},
			{
				'ip': 44,
				'line': 49,
				'message': 'Output 3: token category does not match input 3',
			},
			{
				'ip': 50,
				'line': 53,
				'message': 'Input 3: token category does not match registry (immutable NFT check)',
			},
			{
				'ip': 57,
				'line': 57,
				'message': 'Input 2: token category prefix does not match registry',
			},
			{
				'ip': 59,
				'line': 59,
				'message': 'Input 2: counter capability must be minting capability (0x02)',
			},
			{
				'ip': 65,
				'line': 62,
				'message': 'Input 3: NFT commitment length must be 35 bytes (authorized contract locking bytecode)',
			},
			{
				'ip': 71,
				'line': 66,
				'message': 'Input 2: counter NFT must have a non-empty commitment (registration ID)',
			},
			{
				'ip': 76,
				'line': 68,
				'message': 'Input 2: counter NFT must have token amount greater than 0',
			},
			{
				'ip': 84,
				'line': 69,
				'message': 'Output 2: token amount must equal input 2 + input 3 amounts (accumulation)',
			},
			{
				'ip': 88,
				'line': 72,
				'message': 'Input 4: must be pure BCH (no token category)',
			},
			{
				'ip': 93,
				'line': 73,
				'message': 'Output 4: must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-08-03T13:50:39.052Z',
};
