export default {
	'contractName': 'Bid',
	'constructorInputs': [
		{
			'name': 'minBidIncreasePercentage',
			'type': 'int',
		},
	],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_SIZE OP_NIP 19 OP_NUMEQUALVERIFY OP_3 OP_UTXOBYTECODE OP_3 OP_SPLIT OP_SWAP 76a914 OP_EQUALVERIFY 14 OP_SPLIT 88ac OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_2 OP_OUTPUTTOKENCOMMITMENT OP_3 OP_ROLL OP_ROT OP_CAT OP_EQUALVERIFY OP_2 OP_UTXOTOKENAMOUNT OP_2 OP_OUTPUTTOKENAMOUNT OP_NUMEQUALVERIFY OP_2 OP_OUTPUTVALUE 64 OP_MUL OP_2 OP_UTXOVALUE 64 OP_4 OP_ROLL OP_ADD OP_MUL OP_GREATERTHANOREQUAL OP_VERIFY OP_3 OP_OUTPUTBYTECODE 76a914 OP_ROT OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_3 OP_OUTPUTVALUE OP_2 OP_UTXOVALUE OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_NUMEQUAL OP_IF OP_4 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_ENDIF OP_1',
	'source': "pragma cashscript 0.11.3;\n\n/**\n * @param minBidIncreasePercentage The minimum percentage increase required for a new bid over the previous bid.\n */\ncontract Bid(int minBidIncreasePercentage) {\n  /**\n   * Places a new bid on an active name registration auction.\n   * \n   * The function allows placing a new bid with:\n   * - A minimum `minBidIncreasePercentage` increase over the previous bid.\n   * - The previous bidder receives their bid amount back in the same transaction.\n   * - A successful bid updates the auctionNFT by updating the PKH in the nftCommitment and satoshiValue.\n   *   capability:   Mutable\n   *   category:     registryInputCategory\n   *   tokenAmount:  Represents the registrationId\n   *   satoshiValue: Represents the bid amount\n   *   commitment:   new Bidder's PKH (20 bytes) + name (bytes)\n   *\n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract.\n   * - Input2: auctionNFT from the Registry contract.\n   * - Input3: Funding UTXO from the new bidder.\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Updated auctionNFT back to the Registry contract.\n   * - Output3: Previous bid amount to the previous bidder.\n   * - Output4: Optional change in BCH to the new bidder.\n   */\n  function call() {\n    require(tx.inputs.length == 4, \"Transaction: must have exactly 4 inputs\");\n    require(tx.outputs.length <= 5, \"Transaction: must have at most 5 outputs\");\n    \n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1, \"Input 1: bid contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: auction NFT locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, \"Output 2: auction NFT locking bytecode does not match registry input's locking bytecode\");    \n\n    // AuctionNFT should keep the same category and capability.\n    require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory, \"Output 2: auction NFT token category must match input 2\");\n\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    // The second part of the pair changes with each new bid, hence it's marked as mutable.\n    // Enforcing the structure of the pair results in predictable behavior.\n    bytes auctionCategory, bytes auctionCapability = tx.outputs[2].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory, \"Output 2: auction NFT token category prefix must match registry\");\n    require(auctionCapability == 0x01, \"Output 2: auction NFT capability must be mutable (0x01)\"); // Mutable\n\n    // Ensure that the funding happens from a P2PKH UTXO because there will be no way to know the locking bytecode as \n    // name can be of any length.\n    require(tx.inputs[3].lockingBytecode.length == 25, \"Input 3: locking bytecode must be 25 bytes (P2PKH)\");\n    bytes pkhLockingBytecodeHead, bytes pkhLockingBytecodeBody = tx.inputs[3].lockingBytecode.split(3);\n    // OP_DUP OP_HASH160 Push 20-byte\n    require(pkhLockingBytecodeHead == 0x76a914, \"Input 3: locking bytecode must start with OP_DUP OP_HASH160 (0x76a914)\");\n    bytes pkh, bytes pkhLockingBytecodeTail = pkhLockingBytecodeBody.split(20);\n    // OP_EQUALVERIFY OP_CHECKSIG\n    require(pkhLockingBytecodeTail == 0x88ac, \"Input 3: locking bytecode must end with OP_EQUALVERIFY OP_CHECKSIG (0x88ac)\");\n\n    bytes20 previousPKH, bytes name = tx.inputs[2].nftCommitment.split(20);\n\n    // AuctionNFT should have updated PKH in it's commitment.\n    require(tx.outputs[2].nftCommitment == pkh + name, \"Output 2: auction NFT commitment must match new bidder PKH + name\");\n\n    // Since tokenAmount is registrationID, make sure that it's not changing.\n    require(tx.inputs[2].tokenAmount == tx.outputs[2].tokenAmount, \"Output 2: auction NFT token amount must match input 2\");\n\n    // Ensure that the bid amount is greater than or equal to the previous bid amount + minBidIncreasePercentage.\n    require(tx.outputs[2].value * 100 >= tx.inputs[2].value * (100 + minBidIncreasePercentage), \"Output 2: bid amount must be at least minimum increase percentage\");\n\n    // Locking bytecode of the previous bidder.\n    require(tx.outputs[3].lockingBytecode == new LockingBytecodeP2PKH(previousPKH), \"Output 3: previous bidder locking bytecode must match previous PKH\");\n    // The amount being sent back to the previous bidder.\n    require(tx.outputs[3].value == tx.inputs[2].value, \"Output 3: previous bidder refund amount must match previous bid amount\");\n\n    if (tx.outputs.length == 5) {\n      // If any change, then it must be pure BCH.\n      require(tx.outputs[4].tokenCategory == 0x, \"Output 4: change must be pure BCH (no token category)\");\n    }\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc455a169c0519dc0c7c0cd8800c752c7788852cd8852ce52d18800ce52d101207f7c7b88518853c7827701199d53c7537f7c0376a9148801147f0288ac8852cf01147f52d2537a7b7e8852d052d39d52cc01649552c60164547a9395a26953cd0376a9147b7e0288ac7e8853cc52c69dc4559c6354d100886851',
		'sourceMap': '34:12:34:28;:32::33;:4::78:1;35:12:35:29:0;:33::34;:12:::1;:4::80;38:12:38:33:0;:37::38;:4::92:1;39:22:39:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;45:51:45:52:0;:41::69:1;46:22:46:23:0;:12::40:1;:44::72:0;:4::164:1;47:23:47:24:0;:12::41:1;:4::166;50:22:50:23:0;:12::38:1;:53::54:0;:42::69:1;:4::130;52:44:52:45:0;:34::60:1;55:64:55:65:0;:53::80:1;:87::89:0;:53::90:1;56:12:56:27:0;:31::52;:4::121:1;57:33:57:37:0;:4::98:1;61:22:61:23:0;:12::40:1;:::47;;:51::53:0;:4::109:1;62:75:62:76:0;:65::93:1;:100::101:0;:65::102:1;64:12:64:34:0;:38::46;:4::122:1;65:75:65:77:0;:46::78:1;67:38:67:44:0;:4::125:1;69:48:69:49:0;:38::64:1;:71::73:0;:38::74:1;72:23:72:24:0;:12::39:1;:43::46:0;;:49::53;:43:::1;:4::124;75:22:75:23:0;:12::36:1;:51::52:0;:40::65:1;:4::124;78:23:78:24:0;:12::31:1;:34::37:0;:12:::1;:51::52:0;:41::59:1;:63::66:0;:69::93;;:63:::1;:41::94;:12;:4::165;81:23:81:24:0;:12::41:1;:45::82:0;:70::81;:45::82:1;;;:4::154;83:23:83:24:0;:12::31:1;:45::46:0;:35::53:1;:4::129;85:8:85:25:0;:29::30;:8:::1;:32:88:5:0;87:25:87:26;:14::41:1;:45::47:0;:6::106:1;85:32:88:5;33:2:89:3',
		'logs': [],
		'requires': [
			{
				'ip': 3,
				'line': 34,
				'message': 'Transaction: must have exactly 4 inputs',
			},
			{
				'ip': 7,
				'line': 35,
				'message': 'Transaction: must have at most 5 outputs',
			},
			{
				'ip': 10,
				'line': 38,
				'message': 'Input 1: bid contract UTXO must be at this index',
			},
			{
				'ip': 15,
				'line': 39,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 21,
				'line': 46,
				'message': "Input 2: auction NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 24,
				'line': 47,
				'message': "Output 2: auction NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 29,
				'line': 50,
				'message': 'Output 2: auction NFT token category must match input 2',
			},
			{
				'ip': 38,
				'line': 56,
				'message': 'Output 2: auction NFT token category prefix must match registry',
			},
			{
				'ip': 40,
				'line': 57,
				'message': 'Output 2: auction NFT capability must be mutable (0x01)',
			},
			{
				'ip': 46,
				'line': 61,
				'message': 'Input 3: locking bytecode must be 25 bytes (P2PKH)',
			},
			{
				'ip': 53,
				'line': 64,
				'message': 'Input 3: locking bytecode must start with OP_DUP OP_HASH160 (0x76a914)',
			},
			{
				'ip': 57,
				'line': 67,
				'message': 'Input 3: locking bytecode must end with OP_EQUALVERIFY OP_CHECKSIG (0x88ac)',
			},
			{
				'ip': 68,
				'line': 72,
				'message': 'Output 2: auction NFT commitment must match new bidder PKH + name',
			},
			{
				'ip': 73,
				'line': 75,
				'message': 'Output 2: auction NFT token amount must match input 2',
			},
			{
				'ip': 86,
				'line': 78,
				'message': 'Output 2: bid amount must be at least minimum increase percentage',
			},
			{
				'ip': 94,
				'line': 81,
				'message': 'Output 3: previous bidder locking bytecode must match previous PKH',
			},
			{
				'ip': 99,
				'line': 83,
				'message': 'Output 3: previous bidder refund amount must match previous bid amount',
			},
			{
				'ip': 107,
				'line': 87,
				'message': 'Output 4: change must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-08-03T15:40:25.698Z',
};
