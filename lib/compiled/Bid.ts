export default {
	'contractName': 'Bid',
	'constructorInputs': [],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_SIZE OP_NIP 19 OP_NUMEQUALVERIFY OP_3 OP_UTXOBYTECODE OP_3 OP_SPLIT OP_SWAP 76a914 OP_EQUALVERIFY 14 OP_SPLIT 88ac OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_2 OP_OUTPUTTOKENCOMMITMENT OP_3 OP_ROLL OP_ROT OP_CAT OP_EQUALVERIFY OP_2 OP_UTXOTOKENAMOUNT OP_2 OP_OUTPUTTOKENAMOUNT OP_NUMEQUALVERIFY OP_2 OP_OUTPUTVALUE 64 OP_MUL OP_2 OP_UTXOVALUE 69 OP_MUL OP_GREATERTHANOREQUAL OP_VERIFY OP_3 OP_OUTPUTBYTECODE 76a914 OP_ROT OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_3 OP_OUTPUTVALUE OP_2 OP_UTXOVALUE OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_NUMEQUAL OP_IF OP_4 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_ENDIF OP_1',
	'source': "pragma cashscript 0.11.5;\n\n\ncontract Bid() {\n  /**\n   * Places a new bid on an active name registration auction.\n   * \n   * The function allows placing a new bid with:\n   * - A minimum 5% increase over the previous bid.\n   * - The previous bidder receives their bid amount back in the same transaction.\n   * - A successful bid updates the auctionNFT by updating the PKH in the nftCommitment and satoshiValue.\n   *   capability:   Mutable\n   *   category:     registryInputCategory\n   *   tokenAmount:  Represents the registrationId\n   *   satoshiValue: Represents the bid amount\n   *   commitment:   new Bidder's PKH (20 bytes) + name (bytes)\n   *\n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract.\n   * - Input2: auctionNFT from the Registry contract.\n   * - Input3: Funding UTXO from the new bidder.\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Updated auctionNFT back to the Registry contract.\n   * - Output3: Previous bid amount to the previous bidder.\n   * - Output4: Optional change in BCH to the new bidder.\n   */\n  function call() {\n    require(tx.inputs.length == 4, \"Transaction: must have exactly 4 inputs\");\n    require(tx.outputs.length <= 5, \"Transaction: must have at most 5 outputs\");\n    \n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1, \"Input 1: bid contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n    // Ensure that no tokenCategory is minted here.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x, \"Output 1: must not have any token category (pure BCH only)\");\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: auction NFT locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, \"Output 2: auction NFT locking bytecode does not match registry input's locking bytecode\");    \n\n    // AuctionNFT should keep the same category and capability.\n    require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory, \"Output 2: auction NFT token category must match input 2\");\n\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    // The second part of the pair changes with each new bid, hence it's marked as mutable.\n    // Enforcing the structure of the pair results in predictable behavior.\n    bytes auctionCategory, bytes auctionCapability = tx.outputs[2].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory, \"Output 2: auction NFT token category prefix must match registry\");\n    require(auctionCapability == 0x01, \"Output 2: auction NFT capability must be mutable (0x01)\");\n\n    // Ensure that the funding happens from a P2PKH UTXO, need to do a payout to present bidder and the information is stored in commitment.\n    require(tx.inputs[3].lockingBytecode.length == 25, \"Input 3: locking bytecode must be 25 bytes (P2PKH)\");\n    bytes pkhLockingBytecodeHead, bytes pkhLockingBytecodeBody = tx.inputs[3].lockingBytecode.split(3);\n    // OP_DUP OP_HASH160 Push 20-byte\n    require(pkhLockingBytecodeHead == 0x76a914, \"Input 3: locking bytecode must start with OP_DUP OP_HASH160 (0x76a914)\");\n    bytes pkh, bytes pkhLockingBytecodeTail = pkhLockingBytecodeBody.split(20);\n    // OP_EQUALVERIFY OP_CHECKSIG\n    require(pkhLockingBytecodeTail == 0x88ac, \"Input 3: locking bytecode must end with OP_EQUALVERIFY OP_CHECKSIG (0x88ac)\");\n\n    bytes20 previousPKH, bytes name = tx.inputs[2].nftCommitment.split(20);\n\n    // AuctionNFT should have updated PKH in it's commitment.\n    require(tx.outputs[2].nftCommitment == pkh + name, \"Output 2: auction NFT commitment must match new bidder PKH + name\");\n\n    // Since tokenAmount is registrationID, make sure that it's not changing.\n    require(tx.inputs[2].tokenAmount == tx.outputs[2].tokenAmount, \"Output 2: auction NFT token amount must match input 2\");\n\n    // Ensure that the bid amount is greater than or equal to the previous bid amount + 5%.\n    require(tx.outputs[2].value * 100 >= tx.inputs[2].value * 105, \"Output 2: bid amount must be at least 5 percentage higher\");\n\n    // Locking bytecode of the previous bidder.\n    require(tx.outputs[3].lockingBytecode == new LockingBytecodeP2PKH(previousPKH), \"Output 3: previous bidder locking bytecode must match previous PKH\");\n    // The amount being sent back to the previous bidder.\n    require(tx.outputs[3].value == tx.inputs[2].value, \"Output 3: previous bidder refund amount must match previous bid amount\");\n    // Funding UTXO/ Bid UTXO\n    require(tx.inputs[3].tokenCategory == 0x, \"Input 3: funding UTXO must be pure BCH\");\n\n    if (tx.outputs.length == 5) {\n      // If any change, then it must be pure BCH.\n      require(tx.outputs[4].tokenCategory == 0x, \"Output 4: change must be pure BCH (no token category)\");\n    }\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc455a169c0519dc0c7c0cd88c0d1008800c752c7788852cd8852ce52d18800ce52d101207f7c7b88518853c7827701199d53c7537f7c0376a9148801147f0288ac8852cf01147f52d2537a7b7e8852d052d39d52cc01649552c6016995a26953cd0376a9147b7e0288ac7e8853cc52c69d53ce0088c4559c6354d100886851',
		'sourceMap': '32:12:32:28;:32::33;:4::78:1;33:12:33:29:0;:33::34;:12:::1;:4::80;36:12:36:33:0;:37::38;:4::92:1;37:22:37:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;39:23:39:44:0;:12::59:1;:63::65:0;:4::129:1;45:51:45:52:0;:41::69:1;46:22:46:23:0;:12::40:1;:44::72:0;:4::164:1;47:23:47:24:0;:12::41:1;:4::166;50:22:50:23:0;:12::38:1;:53::54:0;:42::69:1;:4::130;52:44:52:45:0;:34::60:1;55:64:55:65:0;:53::80:1;:87::89:0;:53::90:1;56:12:56:27:0;:31::52;:4::121:1;57:33:57:37:0;:4::98:1;60:22:60:23:0;:12::40:1;:::47;;:51::53:0;:4::109:1;61:75:61:76:0;:65::93:1;:100::101:0;:65::102:1;63:12:63:34:0;:38::46;:4::122:1;64:75:64:77:0;:46::78:1;66:38:66:44:0;:4::125:1;68:48:68:49:0;:38::64:1;:71::73:0;:38::74:1;71:23:71:24:0;:12::39:1;:43::46:0;;:49::53;:43:::1;:4::124;74:22:74:23:0;:12::36:1;:51::52:0;:40::65:1;:4::124;77:23:77:24:0;:12::31:1;:34::37:0;:12:::1;:51::52:0;:41::59:1;:62::65:0;:41:::1;:12;:4::128;80:23:80:24:0;:12::41:1;:45::82:0;:70::81;:45::82:1;;;:4::154;82:23:82:24:0;:12::31:1;:45::46:0;:35::53:1;:4::129;84:22:84:23:0;:12::38:1;:42::44:0;:4::88:1;86:8:86:25:0;:29::30;:8:::1;:32:89:5:0;88:25:88:26;:14::41:1;:45::47:0;:6::106:1;86:32:89:5;31:2:90:3',
		'logs': [],
		'requires': [
			{
				'ip': 2,
				'line': 32,
				'message': 'Transaction: must have exactly 4 inputs',
			},
			{
				'ip': 6,
				'line': 33,
				'message': 'Transaction: must have at most 5 outputs',
			},
			{
				'ip': 9,
				'line': 36,
				'message': 'Input 1: bid contract UTXO must be at this index',
			},
			{
				'ip': 14,
				'line': 37,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 18,
				'line': 39,
				'message': 'Output 1: must not have any token category (pure BCH only)',
			},
			{
				'ip': 24,
				'line': 46,
				'message': "Input 2: auction NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 27,
				'line': 47,
				'message': "Output 2: auction NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 32,
				'line': 50,
				'message': 'Output 2: auction NFT token category must match input 2',
			},
			{
				'ip': 41,
				'line': 56,
				'message': 'Output 2: auction NFT token category prefix must match registry',
			},
			{
				'ip': 43,
				'line': 57,
				'message': 'Output 2: auction NFT capability must be mutable (0x01)',
			},
			{
				'ip': 49,
				'line': 60,
				'message': 'Input 3: locking bytecode must be 25 bytes (P2PKH)',
			},
			{
				'ip': 56,
				'line': 63,
				'message': 'Input 3: locking bytecode must start with OP_DUP OP_HASH160 (0x76a914)',
			},
			{
				'ip': 60,
				'line': 66,
				'message': 'Input 3: locking bytecode must end with OP_EQUALVERIFY OP_CHECKSIG (0x88ac)',
			},
			{
				'ip': 71,
				'line': 71,
				'message': 'Output 2: auction NFT commitment must match new bidder PKH + name',
			},
			{
				'ip': 76,
				'line': 74,
				'message': 'Output 2: auction NFT token amount must match input 2',
			},
			{
				'ip': 86,
				'line': 77,
				'message': 'Output 2: bid amount must be at least 5 percentage higher',
			},
			{
				'ip': 94,
				'line': 80,
				'message': 'Output 3: previous bidder locking bytecode must match previous PKH',
			},
			{
				'ip': 99,
				'line': 82,
				'message': 'Output 3: previous bidder refund amount must match previous bid amount',
			},
			{
				'ip': 103,
				'line': 84,
				'message': 'Input 3: funding UTXO must be pure BCH',
			},
			{
				'ip': 111,
				'line': 88,
				'message': 'Output 4: change must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.5',
	},
	'updatedAt': '2025-09-01T12:48:17.038Z',
};
