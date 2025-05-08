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
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_SIZE OP_NIP 19 OP_NUMEQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_3 OP_UTXOBYTECODE OP_3 OP_SPLIT OP_NIP 14 OP_SPLIT OP_DROP OP_2 OP_OUTPUTTOKENCOMMITMENT OP_SWAP OP_ROT OP_CAT OP_EQUALVERIFY OP_2 OP_UTXOTOKENAMOUNT OP_2 OP_OUTPUTTOKENAMOUNT OP_NUMEQUALVERIFY OP_2 OP_OUTPUTVALUE 64 OP_MUL OP_2 OP_UTXOVALUE 64 OP_4 OP_ROLL OP_ADD OP_MUL OP_GREATERTHANOREQUAL OP_VERIFY OP_3 OP_OUTPUTBYTECODE 76a914 OP_ROT OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_3 OP_OUTPUTVALUE OP_2 OP_UTXOVALUE OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_NUMEQUAL OP_IF OP_4 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_ENDIF OP_1',
	'source': "pragma cashscript ^0.11.0;\n\n/**\n * @param minBidIncreasePercentage The minimum percentage increase required for a new bid over the previous bid.\n */\ncontract Bid(int minBidIncreasePercentage) {\n  /**\n   * Places a new bid on an active domain registration auction.\n   * \n   * The function allows placing a new bid with:\n   * - A minimum `minBidIncreasePercentage` increase over the previous bid.\n   * - The previous bidder receives their bid amount back in the same transaction.\n   * - A successful bid updates the auctionNFT by updating the PKH in the nftCommitment and satoshiValue.\n   *   capability:   Mutable\n   *   category:     registryInputCategory\n   *   tokenAmount:  Represents the registrationId\n   *   satoshiValue: Represents the bid amount\n   *   commitment:   new Bidder's PKH (20 bytes) + name (bytes)\n   *\n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract.\n   * - Input2: auctionNFT from the Registry contract.\n   * - Input3: Funding UTXO from the new bidder.\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Updated auctionNFT back to the Registry contract.\n   * - Output3: Previous bid amount to the previous bidder.\n   * - Output4: Optional change in BCH to the new bidder.\n   */\n  function call() {\n    require(tx.inputs.length == 4);\n    require(tx.outputs.length <= 5);\n    \n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1);\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode);\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode);    \n\n    // AuctionNFT should keep the same category and capability.\n    require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory);\n\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    // The second part of the pair changes with each new bid, hence it's marked as mutable.\n    // Enforcing the structure of the pair results in predictable behavior.\n    bytes auctionCategory, bytes auctionCapability = tx.outputs[2].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory);\n    require(auctionCapability == 0x01); // Mutable\n\n    // Ensure that the funding happens from a P2PKH UTXO.\n    require(tx.inputs[3].lockingBytecode.length == 25);\n\n    bytes20 previousPKH, bytes name = tx.inputs[2].nftCommitment.split(20);\n    // Extract the PKH from the lockingBytecode of the Funding UTXO.\n    // <pkh> + name > 20 bytes\n    bytes pkh = tx.inputs[3].lockingBytecode.split(3)[1].split(20)[0];\n    \n    // AuctionNFT should have updated PKH in it's commitment.\n    require(tx.outputs[2].nftCommitment == pkh + name);\n\n    // Since tokenAmount is registrationID, make sure that it's not changing.\n    require(tx.inputs[2].tokenAmount == tx.outputs[2].tokenAmount);\n\n    // Ensure that the bid amount is greater than or equal to the previous bid amount + minBidIncreasePercentage.\n    require(tx.outputs[2].value * 100 >= tx.inputs[2].value * (100 + minBidIncreasePercentage));\n\n    // Locking bytecode of the previous bidder.\n    require(tx.outputs[3].lockingBytecode == new LockingBytecodeP2PKH(previousPKH));\n    // The amount being sent back to the previous bidder.\n    require(tx.outputs[3].value == tx.inputs[2].value);\n\n    if (tx.outputs.length == 5) {\n      // If any change, then it must be pure BCH.\n      require(tx.outputs[4].tokenCategory == 0x);\n    }\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc455a169c0519dc0c7c0cd8800c752c7788852cd8852ce52d18800ce52d101207f7c7b88518853c7827701199d52cf01147f53c7537f7701147f7552d27c7b7e8852d052d39d52cc01649552c60164547a9395a26953cd0376a9147b7e0288ac7e8853cc52c69dc4559c6354d100886851',
		'sourceMap': '34:12:34:28;:32::33;:4::35:1;35:12:35:29:0;:33::34;:12:::1;:4::36;38:12:38:33:0;:37::38;:4::40:1;39:22:39:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;45:51:45:52:0;:41::69:1;46:22:46:23:0;:12::40:1;:44::72:0;:4::74:1;47:23:47:24:0;:12::41:1;:4::75;50:22:50:23:0;:12::38:1;:53::54:0;:42::69:1;:4::71;52:44:52:45:0;:34::60:1;55:64:55:65:0;:53::80:1;:87::89:0;:53::90:1;56:12:56:27:0;:31::52;:4::54:1;57:33:57:37:0;:4::39:1;60:22:60:23:0;:12::40:1;:::47;;:51::53:0;:4::55:1;62:48:62:49:0;:38::64:1;:71::73:0;:38::74:1;65:26:65:27:0;:16::44:1;:51::52:0;:16::53:1;:::56;:63::65:0;:16::66:1;:::69;68:23:68:24:0;:12::39:1;:43::46:0;:49::53;:43:::1;:4::55;71:22:71:23:0;:12::36:1;:51::52:0;:40::65:1;:4::67;74:23:74:24:0;:12::31:1;:34::37:0;:12:::1;:51::52:0;:41::59:1;:63::66:0;:69::93;;:63:::1;:41::94;:12;:4::96;77:23:77:24:0;:12::41:1;:45::82:0;:70::81;:45::82:1;;;:4::84;79:23:79:24:0;:12::31:1;:45::46:0;:35::53:1;:4::55;81:8:81:25:0;:29::30;:8:::1;:32:84:5:0;83:25:83:26;:14::41:1;:45::47:0;:6::49:1;81:32:84:5;33:2:85:3',
		'logs': [],
		'requires': [
			{
				'ip': 3,
				'line': 34,
			},
			{
				'ip': 7,
				'line': 35,
			},
			{
				'ip': 10,
				'line': 38,
			},
			{
				'ip': 15,
				'line': 39,
			},
			{
				'ip': 21,
				'line': 46,
			},
			{
				'ip': 24,
				'line': 47,
			},
			{
				'ip': 29,
				'line': 50,
			},
			{
				'ip': 38,
				'line': 56,
			},
			{
				'ip': 40,
				'line': 57,
			},
			{
				'ip': 46,
				'line': 60,
			},
			{
				'ip': 64,
				'line': 68,
			},
			{
				'ip': 69,
				'line': 71,
			},
			{
				'ip': 82,
				'line': 74,
			},
			{
				'ip': 90,
				'line': 77,
			},
			{
				'ip': 95,
				'line': 79,
			},
			{
				'ip': 103,
				'line': 83,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.0-next.4',
	},
	'updatedAt': '2025-05-08T10:59:05.124Z',
};
