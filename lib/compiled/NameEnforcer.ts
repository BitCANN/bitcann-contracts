export default {
	'contractName': 'NameEnforcer',
	'constructorInputs': [],
	'abi': [
		{
			'name': 'call',
			'inputs': [
				{
					'name': 'characterNumber',
					'type': 'int',
				},
			],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_3 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_NIP OP_OVER OP_SPLIT OP_DROP OP_OVER OP_1SUB OP_SPLIT OP_NIP OP_BIN2NUM OP_DUP 2d OP_NUMNOTEQUAL OP_VERIFY OP_DUP 61 7b OP_WITHIN OP_NOT OP_VERIFY OP_DUP 41 5b OP_WITHIN OP_NOT OP_VERIFY 30 3a OP_WITHIN OP_NOT OP_VERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_UTXOTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL OP_NIP',
	'source': "pragma cashscript 0.11.3;\n\ncontract NameEnforcer() {\n  /**\n   * Proves that a name contains invalid characters, burns the auctionNFT, and takes away the funds as a reward.\n   * During the entire auction, this can be called at any time by anyone.\n   * \n   * Rules:\n   * 1. The name must consist of only these characters:\n   *    - Letters (a-z or A-Z)\n   *    - Numbers (0-9)\n   *    - Hyphens (-)\n   *\n   * @param characterNumber - Number of the character in the name that is invalid (starting from 1)\n   *\n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract.\n   * - Input2: auctionNFT from Registry Contract.\n   *\n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Reward to caller.\n   *\n   */\n  function call(int characterNumber) {\n    require(tx.inputs.length == 3, \"Transaction: must have exactly 3 inputs\");\n    require(tx.outputs.length == 3, \"Transaction: must have exactly 3 outputs\");\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1, \"Input 1: name enforcer contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n\n    // Lock this contract to only be used with the registry type contract.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: locking bytecode does not match registry input's locking bytecode\");\n\n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n\n    // AuctionNFT should be mutable and of the 'nameCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.inputs[2].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory, \"Input 2: auction token category does not match registry\");\n    // Auction capability should be mutable.\n    require(auctionCapability == 0x01, \"Input 2: auction capability must be mutable (0x01)\");\n\n    bytes name = tx.inputs[2].nftCommitment.split(20)[1];\n    bytes characterSplitBytes = name.split(characterNumber)[0];\n    characterNumber = characterNumber - 1;\n    bytes character = characterSplitBytes.split(characterNumber)[1];\n    int charVal = int(character);\n\n    // Character is not a hyphen.\n    require(charVal != 45, \"Character is a hyphen\"); \n    // Character is not from a-z.\n    require(!within(charVal, 97, 123), \"Character is lowercase letter\");\n    // Character is not from A-Z.\n    require(!within(charVal, 65, 91), \"Character is uppercase letter\");\n    // Character is not from 0-9.\n    require(!within(charVal, 48, 58), \"Character is a digit\");\n\n    // tokenAmount from the invalid auctionNFT goes to the authorizedThreadNFT to be accumulated later\n    // and merged back with the CounterNFT using the `Accumulator` Contract\n    require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[2].tokenAmount, \"Output 0: token amount must equal input 0 + input 2 amounts (accumulation)\");\n\n    // Pure BCH.\n    require(tx.outputs[2].tokenCategory == 0x, \"Output 2: reward must be pure BCH (no token category)\");\n  }\n}",
	'debug': {
		'bytecode': 'c3539dc4539dc0519dc0c7c0cd8800c752c78800ce52ce01207f7c7b88518852cf01147f77787f75788c7f778176012d9e69760161017ba59169760141015ba591690130013aa5916900d300d052d0939d52d1008777',
		'sourceMap': '28:12:28:28;:32::33;:4::78:1;29:12:29:29:0;:33::34;:4::80:1;32:12:32:33:0;:37::38;:4::102:1;33:22:33:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;36:51:36:52:0;:41::69:1;37:22:37:23:0;:12::40:1;:4::152;40:44:40:45:0;:34::60:1;43:63:43:64:0;:53::79:1;:86::88:0;:53::89:1;44:12:44:27:0;:31::52;:4::113:1;46:33:46:37:0;:4::93:1;48:27:48:28:0;:17::43:1;:50::52:0;:17::53:1;:::56;49:43:49:58:0;:32::59:1;:::62;50:22:50:37:0;:::41:1;51::51:64;:::67;52:18:52:32;55:12:55:19:0;:23::25;:12:::1;:4::52;57:20:57:27:0;:29::31;:33::36;:13::37:1;:12;:4::72;59:20:59:27:0;:29::31;:33::35;:13::36:1;:12;:4::71;61:29:61:31:0;:33::35;:13::36:1;:12;:4::62;65:23:65:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::172;68:23:68:24:0;:12::39:1;:43::45:0;:4::104:1;27:2:69:3',
		'logs': [],
		'requires': [
			{
				'ip': 2,
				'line': 28,
				'message': 'Transaction: must have exactly 3 inputs',
			},
			{
				'ip': 5,
				'line': 29,
				'message': 'Transaction: must have exactly 3 outputs',
			},
			{
				'ip': 8,
				'line': 32,
				'message': 'Input 1: name enforcer contract UTXO must be at this index',
			},
			{
				'ip': 13,
				'line': 33,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 18,
				'line': 37,
				'message': "Input 2: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 27,
				'line': 44,
				'message': 'Input 2: auction token category does not match registry',
			},
			{
				'ip': 29,
				'line': 46,
				'message': 'Input 2: auction capability must be mutable (0x01)',
			},
			{
				'ip': 46,
				'line': 55,
				'message': 'Character is a hyphen',
			},
			{
				'ip': 52,
				'line': 57,
				'message': 'Character is lowercase letter',
			},
			{
				'ip': 58,
				'line': 59,
				'message': 'Character is uppercase letter',
			},
			{
				'ip': 63,
				'line': 61,
				'message': 'Character is a digit',
			},
			{
				'ip': 71,
				'line': 65,
				'message': 'Output 0: token amount must equal input 0 + input 2 amounts (accumulation)',
			},
			{
				'ip': 76,
				'line': 68,
				'message': 'Output 2: reward must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-08-06T02:52:31.954Z',
};
