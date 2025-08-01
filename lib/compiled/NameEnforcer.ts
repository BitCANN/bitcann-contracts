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
	'source': "pragma cashscript 0.11.3;\n\ncontract NameEnforcer() {\n  /**\n   * Proves that a name contains invalid characters, burns the auctionNFT, and takes away the funds as a reward.\n   * During the entire auction, this can be called at any time by anyone.\n   * \n   * Rules:\n   * 1. The name must consist of only these characters:\n   *    - Letters (a-z or A-Z)\n   *    - Numbers (0-9)\n   *    - Hyphens (-)\n   *\n   * @param characterNumber - Number of the character in the name that is invalid (starting from 1)\n   *\n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract.\n   * - Input2: auctionNFT from Registry Contract.\n   *\n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Reward to caller.\n   *\n   */\n  function call(int characterNumber) {\n    require(tx.inputs.length == 3);\n    require(tx.outputs.length == 3);\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1);\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n\n    // Lock this contract to only be used with the registry type contract.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode);\n\n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n\n    // AuctionNFT should be mutable and of the 'nameCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.inputs[2].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory);\n    require(auctionCapability == 0x01); // Mutable\n\n    bytes name = tx.inputs[2].nftCommitment.split(20)[1];\n    bytes characterSplitBytes = name.split(characterNumber)[0];\n    characterNumber = characterNumber - 1;\n    bytes character = characterSplitBytes.split(characterNumber)[1];\n    int charVal = int(character);\n\n    // Character is not a hyphen.\n    require(charVal != 45); \n    // Character is not from a-z.\n    require(!within(charVal, 97, 123));\n    // Character is not from A-Z.\n    require(!within(charVal, 65, 91));\n    // Character is not from 0-9.\n    require(!within(charVal, 48, 58));\n\n    // tokenAmount from the invalid auctionNFT goes to the authorizedThreadNFT to be accumulated later\n    // and merged back with the CounterNFT using the `Accumulator` Contract\n    require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[2].tokenAmount);\n\n    // Pure BCH.\n    require(tx.outputs[2].tokenCategory == 0x);\n  }\n}",
	'debug': {
		'bytecode': 'c3539dc4539dc0519dc0c7c0cd8800c752c78800ce52ce01207f7c7b88518852cf01147f77787f75788c7f778176012d9e69760161017ba59169760141015ba591690130013aa5916900d300d052d0939d52d1008777',
		'sourceMap': '28:12:28:28;:32::33;:4::35:1;29:12:29:29:0;:33::34;:4::36:1;32:12:32:33:0;:37::38;:4::40:1;33:22:33:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;36:51:36:52:0;:41::69:1;37:22:37:23:0;:12::40:1;:4::74;40:44:40:45:0;:34::60:1;43:63:43:64:0;:53::79:1;:86::88:0;:53::89:1;44:12:44:27:0;:31::52;:4::54:1;45:33:45:37:0;:4::39:1;47:27:47:28:0;:17::43:1;:50::52:0;:17::53:1;:::56;48:43:48:58:0;:32::59:1;:::62;49:22:49:37:0;:::41:1;50::50:64;:::67;51:18:51:32;54:12:54:19:0;:23::25;:12:::1;:4::27;56:20:56::0;:29::31;:33::36;:13::37:1;:12;:4::39;58:20:58:27:0;:29::31;:33::35;:13::36:1;:12;:4::38;60:29:60:31:0;:33::35;:13::36:1;:12;:4::38;64:23:64:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::94;67:23:67:24:0;:12::39:1;:43::45:0;:4::47:1;27:2:68:3',
		'logs': [],
		'requires': [
			{
				'ip': 2,
				'line': 28,
			},
			{
				'ip': 5,
				'line': 29,
			},
			{
				'ip': 8,
				'line': 32,
			},
			{
				'ip': 13,
				'line': 33,
			},
			{
				'ip': 18,
				'line': 37,
			},
			{
				'ip': 27,
				'line': 44,
			},
			{
				'ip': 29,
				'line': 45,
			},
			{
				'ip': 46,
				'line': 54,
			},
			{
				'ip': 52,
				'line': 56,
			},
			{
				'ip': 58,
				'line': 58,
			},
			{
				'ip': 63,
				'line': 60,
			},
			{
				'ip': 71,
				'line': 64,
			},
			{
				'ip': 76,
				'line': 67,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-08-01T20:44:07.245Z',
};
