export default {
	'contractName': 'Accumulator',
	'constructorInputs': [],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY OP_3 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_2 OP_EQUALVERIFY OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUAL OP_NOT OP_VERIFY OP_3 OP_UTXOTOKENCOMMITMENT OP_SIZE OP_NIP 23 OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENCOMMITMENT OP_2 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCOMMITMENT OP_3 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_2 OP_UTXOTOKENAMOUNT OP_0 OP_GREATERTHAN OP_VERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_4 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_4 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL',
	'source': "pragma cashscript 0.11.4;\n\ncontract Accumulator() {\n  /**\n   * Once enough auctions have happened, counterNFT's tokenAmount will not be enough to create another auction as the\n   * amount would be accumulating in the thread NFTs. This function will be used to transfer them back to the\n   * Counter NFT to keep the system functioning smoothly.\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: Minting CounterNFT + tokenAmount from Registry Contract\n   * - Input3: authorizedThreadNFT + tokenAmount from Registry Contract\n   * - Input4: Funding UTXO.\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Minting CounterNFT + tokenAmount back to the Registry contract\n   * - Output3: authorizedThreadNFT back to the Registry contract (without tokenAmount)\n   * - Output4: Change BCH\n   */\n  function call(){\n    // Info: Ignored checks:\n    // - No transaction version enforcement. The contract at 0th index, i.e the Registry Contract has enforced the transaction version,\n    // since all the main utxos live with the registry contract, there is no need to enforce it here as well.\n    // - No output value checks: Any unnecessary bch value in the utxos can be extracted by the change output.\n\n    require(tx.inputs.length == 5, \"Transaction: must have exactly 5 inputs\");\n    require(tx.outputs.length == 5, \"Transaction: must have exactly 5 outputs\");\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1, \"Input 1: accumulator contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n    // Restriction on output category is important as minting NFT is used in this transaction.\n    // No need to check input category as it will be automatically burned in this transaction.\n    // Not allowing any category leaks by restricting the output category to pure BCH.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x, \"Output 1: must not have any token category (pure BCH only)\");\n\n    // This contract can be used with any contract that fulfills these conditions, this contract acts as a\n    // code injection mechanism for the Registry contract.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    \n    // Enforce input 2 and 3 to be from the registry\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: locking bytecode does not match registry input's locking bytecode\");\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode, \"Input 3: locking bytecode does not match registry input's locking bytecode\");\n\n    // Enforce output 2 and 3 are returning to the registry\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, \"Output 2: locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[3].lockingBytecode == registryInputLockingBytecode, \"Output 3: locking bytecode does not match registry input's locking bytecode\");\n\n    // Enforce NFT transfer preserves token categories\n    require(tx.outputs[2].tokenCategory == tx.inputs[2].tokenCategory, \"Output 2: token category does not match input 2\");\n    require(tx.outputs[3].tokenCategory == tx.inputs[3].tokenCategory, \"Output 3: token category does not match input 3\");\n\n    // Grab the tokenCategory from the Registry Contract's input\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    // Split counter token category and capability\n    bytes counterCategory, bytes counterCapability = tx.inputs[2].tokenCategory.split(32);\n    require(counterCapability == 0x02, \"Input 2: counter capability must be minting capability (0x02)\");\n\n    require(counterCategory == registryInputCategory, \"Input 2: token category prefix does not match registry\");\n    require(tx.inputs[3].tokenCategory == registryInputCategory, \"Input 3: token category does not match registry\");\n\n    // nftCommitment of counter nft is registrationID so it must not be null\n    require(tx.inputs[2].nftCommitment != 0x, \"Input 2: counter nft must have a non-empty commitment (registration ID)\");\n    // nftCommitment of the authorized contract is 35 bytes long.\n    require(tx.inputs[3].nftCommitment.length == 35, \"Input 3: nft commitment length must be 35 bytes (authorized contract locking bytecode)\");\n\n    // Minting nft is used in the transaction, ensure that the nft commitment is preserved.\n    require(tx.outputs[2].nftCommitment == tx.inputs[2].nftCommitment, \"Output 2: nft commitment does not match input 2\");\n    require(tx.outputs[3].nftCommitment == tx.inputs[3].nftCommitment, \"Output 3: nft commitment does not match input 3\");\n\n    // Ensure that the counter minting nft is used.\n    require(tx.inputs[2].tokenAmount > 0, \"Input 2: counter nft must have token amount greater than 0\");\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount + tx.inputs[3].tokenAmount, \"Output 2: token amount must equal input 2 + input 3 amounts (accumulation)\");\n\n    // Pure BCH input and output.\n    require(tx.inputs[4].tokenCategory == 0x, \"Input 4: must be pure BCH (no token category)\");\n    require(tx.outputs[4].tokenCategory == 0x, \"Output 4: must be pure BCH (no token category)\");\n  }\n}",
	'debug': {
		'bytecode': 'c3559dc4559dc0519dc0c7c0cd88c0d1008800c752c7788853c7788852cd788853cd8852d152ce8853d153ce8800ce52ce01207f5288788853ce8852cf0087916953cf827701239d52d252cf8853d253cf8852d000a06952d352d053d0939d54ce008854d10087',
		'sourceMap': '29:12:29:28;:32::33;:4::78:1;30:12:30:29:0;:33::34;:4::80:1;33:12:33:33:0;:37::38;:4::100:1;34:22:34:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;38:23:38:44:0;:12::59:1;:63::65:0;:4::129:1;42:51:42:52:0;:41::69:1;45:22:45:23:0;:12::40:1;:44::72:0;:4::152:1;46:22:46:23:0;:12::40:1;:44::72:0;:4::152:1;49:23:49:24:0;:12::41:1;:45::73:0;:4::154:1;50:23:50:24:0;:12::41:1;:4::154;53:23:53:24:0;:12::39:1;:53::54:0;:43::69:1;:4::122;54:23:54:24:0;:12::39:1;:53::54:0;:43::69:1;:4::122;57:44:57:45:0;:34::60:1;59:63:59:64:0;:53::79:1;:86::88:0;:53::89:1;60:33:60:37:0;:4::104:1;62:31:62:52:0;:4::112:1;63:22:63:23:0;:12::38:1;:4::116;66:22:66:23:0;:12::38:1;:42::44:0;:12:::1;;:4::121;68:22:68:23:0;:12::38:1;:::45;;:49::51:0;:4::143:1;71:23:71:24:0;:12::39:1;:53::54:0;:43::69:1;:4::122;72:23:72:24:0;:12::39:1;:53::54:0;:43::69:1;:4::122;75:22:75:23:0;:12::36:1;:39::40:0;:12:::1;:4::104;76:23:76:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::172;79:22:79:23:0;:12::38:1;:42::44:0;:4::95:1;80:23:80:24:0;:12::39:1;:43::45:0;:4::97:1',
		'logs': [],
		'requires': [
			{
				'ip': 2,
				'line': 29,
				'message': 'Transaction: must have exactly 5 inputs',
			},
			{
				'ip': 5,
				'line': 30,
				'message': 'Transaction: must have exactly 5 outputs',
			},
			{
				'ip': 8,
				'line': 33,
				'message': 'Input 1: accumulator contract UTXO must be at this index',
			},
			{
				'ip': 13,
				'line': 34,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 17,
				'line': 38,
				'message': 'Output 1: must not have any token category (pure BCH only)',
			},
			{
				'ip': 23,
				'line': 45,
				'message': "Input 2: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 27,
				'line': 46,
				'message': "Input 3: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 31,
				'line': 49,
				'message': "Output 2: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 34,
				'line': 50,
				'message': "Output 3: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 39,
				'line': 53,
				'message': 'Output 2: token category does not match input 2',
			},
			{
				'ip': 44,
				'line': 54,
				'message': 'Output 3: token category does not match input 3',
			},
			{
				'ip': 52,
				'line': 60,
				'message': 'Input 2: counter capability must be minting capability (0x02)',
			},
			{
				'ip': 54,
				'line': 62,
				'message': 'Input 2: token category prefix does not match registry',
			},
			{
				'ip': 57,
				'line': 63,
				'message': 'Input 3: token category does not match registry',
			},
			{
				'ip': 63,
				'line': 66,
				'message': 'Input 2: counter nft must have a non-empty commitment (registration ID)',
			},
			{
				'ip': 69,
				'line': 68,
				'message': 'Input 3: nft commitment length must be 35 bytes (authorized contract locking bytecode)',
			},
			{
				'ip': 74,
				'line': 71,
				'message': 'Output 2: nft commitment does not match input 2',
			},
			{
				'ip': 79,
				'line': 72,
				'message': 'Output 3: nft commitment does not match input 3',
			},
			{
				'ip': 84,
				'line': 75,
				'message': 'Input 2: counter nft must have token amount greater than 0',
			},
			{
				'ip': 92,
				'line': 76,
				'message': 'Output 2: token amount must equal input 2 + input 3 amounts (accumulation)',
			},
			{
				'ip': 96,
				'line': 79,
				'message': 'Input 4: must be pure BCH (no token category)',
			},
			{
				'ip': 101,
				'line': 80,
				'message': 'Output 4: must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.4',
	},
	'updatedAt': '2025-08-26T15:53:46.873Z',
};
