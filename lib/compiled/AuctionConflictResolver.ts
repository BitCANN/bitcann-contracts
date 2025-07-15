export default {
	'contractName': 'AuctionConflictResolver',
	'constructorInputs': [],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_3 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_NIP OP_3 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_NIP OP_EQUALVERIFY OP_2 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_LESSTHAN OP_VERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL',
	'source': "pragma cashscript 0.11.2;\n\ncontract AuctionConflictResolver() {\n  /**\n   * Resolves a conflict between two competing registration auctions for the same name.\n   * \n   * RULE:\n   * - If any new auction is created when an auction already exists, then the new auction is open for penalization.\n   *\n   * Anyone can provide proof of an active auction's existence and take away the funds from the \"new\" invalid auction\n   * as a form of reward for keeping the system secure and predictable.\n   * Therefore, it's the responsibility of the application to check for any running auctions for the same name.\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract.\n   * - Input2: Valid auctionNFT from Registry Contract.\n   * - Input3: Invalid auctionNFT from Registry Contract.\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Valid auctionNFT back to Registry Contract.\n   * - Output3: BCH change/reward to caller.\n   */\n  function call() {\n    require(tx.inputs.length == 4);\n    require(tx.outputs.length == 4);\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1);\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode);\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode);\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode);\n\n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n\n    // auctionNFT should be mutable\n    bytes auctionCategory, bytes auctionCapability = tx.inputs[2].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory);\n    require(auctionCapability == 0x01); // Mutable\n\n    // Invalid and valid auctionNFTs both should have the same category and capability.\n    require(tx.inputs[2].tokenCategory == tx.inputs[3].tokenCategory);\n    // Both auctionNFTs should also have the same 'name'\n    require(tx.inputs[2].nftCommitment.split(20)[1] == tx.inputs[3].nftCommitment.split(20)[1]);\n    // The valid auctionNFT will have a lower registrationID\n    require(tx.inputs[2].tokenAmount < tx.inputs[3].tokenAmount);\n\n    // tokenAmount from the invalid auctionNFT goes to the authorizedThreadNFT to be accumulated later\n    // and merged back with the CounterNFT using the `Accumulator` Contract\n    require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[3].tokenAmount);\n\n    // Attach any output to take away the funds as reward\n    require(tx.outputs[3].tokenCategory == 0x);\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc4549dc0519dc0c7c0cd8800c752c7788853c7788852cd8800ce52ce01207f7c7b88518852ce53ce8852cf01147f7753cf01147f778852d053d09f6900d300d053d0939d53d10087',
		'sourceMap': '27:12:27:28;:32::33;:4::35:1;28:12:28:29:0;:33::34;:4::36:1;31:12:31:33:0;:37::38;:4::40:1;32:22:32:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;38:51:38:52:0;:41::69:1;39:22:39:23:0;:12::40:1;:44::72:0;:4::74:1;40:22:40:23:0;:12::40:1;:44::72:0;:4::74:1;41:23:41:24:0;:12::41:1;:4::75;44:44:44:45:0;:34::60:1;47:63:47:64:0;:53::79:1;:86::88:0;:53::89:1;48:12:48:27:0;:31::52;:4::54:1;49:33:49:37:0;:4::39:1;52:22:52:23:0;:12::38:1;:52::53:0;:42::68:1;:4::70;54:22:54:23:0;:12::38:1;:45::47:0;:12::48:1;:::51;:65::66:0;:55::81:1;:88::90:0;:55::91:1;:::94;:4::96;56:22:56:23:0;:12::36:1;:49::50:0;:39::63:1;:12;:4::65;60:23:60:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::94;63:23:63:24:0;:12::39:1;:43::45:0;:4::47:1',
		'logs': [],
		'requires': [
			{
				'ip': 2,
				'line': 27,
			},
			{
				'ip': 5,
				'line': 28,
			},
			{
				'ip': 8,
				'line': 31,
			},
			{
				'ip': 13,
				'line': 32,
			},
			{
				'ip': 19,
				'line': 39,
			},
			{
				'ip': 23,
				'line': 40,
			},
			{
				'ip': 26,
				'line': 41,
			},
			{
				'ip': 35,
				'line': 48,
			},
			{
				'ip': 37,
				'line': 49,
			},
			{
				'ip': 42,
				'line': 52,
			},
			{
				'ip': 53,
				'line': 54,
			},
			{
				'ip': 59,
				'line': 56,
			},
			{
				'ip': 67,
				'line': 60,
			},
			{
				'ip': 72,
				'line': 63,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.2',
	},
	'updatedAt': '2025-07-15T19:14:32.803Z',
};
