export default {
	'contractName': 'Auction',
	'constructorInputs': [
		{
			'name': 'minStartingBid',
			'type': 'int',
		},
	],
	'abi': [
		{
			'name': 'call',
			'inputs': [
				{
					'name': 'name',
					'type': 'bytes',
				},
			],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_6 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_REVERSEBYTES OP_BIN2NUM OP_2 OP_OUTPUTTOKENCOMMITMENT OP_REVERSEBYTES OP_BIN2NUM OP_DUP OP_ROT OP_1ADD OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_2 OP_PICK OP_SUB OP_NUMEQUALVERIFY OP_3 OP_OUTPUTTOKENAMOUNT OP_NUMEQUALVERIFY OP_3 OP_OUTPUTVALUE OP_LESSTHANOREQUAL OP_VERIFY OP_3 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_SIZE OP_NIP 19 OP_NUMEQUALVERIFY OP_3 OP_UTXOBYTECODE OP_3 OP_SPLIT OP_NIP 14 OP_SPLIT OP_DROP OP_3 OP_OUTPUTTOKENCOMMITMENT OP_SWAP OP_2 OP_PICK OP_CAT OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_4 OP_OUTPUTBYTECODE 6a OP_ROT OP_SIZE OP_DUP 4b OP_GREATERTHAN OP_IF 4c OP_SWAP OP_CAT OP_ENDIF OP_SWAP OP_CAT OP_CAT OP_EQUALVERIFY OP_TXOUTPUTCOUNT OP_6 OP_NUMEQUAL OP_IF OP_5 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_ENDIF OP_1',
	'source': "pragma cashscript ^0.11.0;\n\n/**\n * @param minStartingBid The minimum starting bid for the auction.\n */\ncontract Auction(int minStartingBid) {\n  /**\n   * Starts a new domain registration auction.\n   * @param name The name being registered.\n   * \n   * The function creates a new auction with:\n   * - Starting bid >= `minStartingBid` BCH.\n   * - A successful registration initiation results in an auctionNFT representing the auction state:\n   *   - capability: (Mutable)\n   *   - category: registryInputCategory\n   *   - tokenAmount: (Represents the registrationId)\n   *   - satoshiValue: (Represents the bid amount)\n   *   - commitment: bidder's PKH (20 bytes) + name (bytes)\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract.\n   * - Input2: Minting CounterNFT from Registry contract (Increases the registrationId by 1 in the output).\n   * - Input3: Funding UTXO.\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Minting CounterNFT going back to the Registry contract.\n   * - Output3: auctionNFT to the Registry contract.\n   * - Output4: OP_RETURN output containing the name.\n   * - Output5: Optional change in BCH.\n   */\n  function call(bytes name) {\n    require(tx.inputs.length == 4);\n    require(tx.outputs.length <= 6);\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1);\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n    // Ensure that the domainCategory in not minted here.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x);\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode);\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode);\n    require(tx.outputs[3].lockingBytecode == registryInputLockingBytecode);\n\n    // Registration ID increases by 1 with each transaction.\n    int prevRegistrationId = int(tx.inputs[2].nftCommitment.reverse());\n    int nextRegistrationId = int(tx.outputs[2].nftCommitment.reverse());\n    require(nextRegistrationId == prevRegistrationId + 1);\n\n    // Reduce the tokenAmount in the counterNFT as some amount is going to auctionNFT\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount - nextRegistrationId);\n    // tokenAmount in the auctionNFT is the registrationId.\n    require(tx.outputs[3].tokenAmount == nextRegistrationId);\n\n    // Every auction begins with a min base value of at least minStartingBid satoshis.\n    require(tx.outputs[3].value >= minStartingBid);\n    // Funding UTXO/ Bid UTXO\n    require(tx.inputs[3].tokenCategory == 0x);\n\n    // Ensure that the funding happens from a P2PKH UTXO.\n    require(tx.inputs[3].lockingBytecode.length == 25);\n\n    // Extract the PKH from the lockingBytecode of the Funding UTXO.\n    // <pkh> + name > 20 bytes\n    bytes pkh = tx.inputs[3].lockingBytecode.split(3)[1].split(20)[0];\n    require(tx.outputs[3].nftCommitment == pkh + name);\n\n    // CounterNFT should keep the same category and capability.\n    require(tx.outputs[2].tokenCategory == tx.inputs[2].tokenCategory);\n    \n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    \n    // CounterNFT should be minting and of the 'domainCategory' i.e registryInputCategory\n    bytes counterCategory, bytes counterCapability = tx.outputs[2].tokenCategory.split(32);\n    require(counterCategory == registryInputCategory);\n    require(counterCapability == 0x02); // Minting\n\n    // AuctionNFT should be mutable and of the 'domainCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.outputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory);\n    require(auctionCapability == 0x01); // Mutable\n\n    // Enforce an OP_RETURN output that contains the name.\n    require(tx.outputs[4].lockingBytecode == new LockingBytecodeNullData([name]));\n\n    if (tx.outputs.length == 6) {\n      // If any change, then it must be pure BCH.\n      require(tx.outputs[5].tokenCategory == 0x);\n    }\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc456a169c0519dc0c7c0cd88c0d1008800c752c7788852cd788853cd8852cfbc8152d2bc81767b8b9d52d352d05279949d53d39d53cca16953ce008853c7827701199d53c7537f7701147f7553d27c52797e8852d152ce8800ce52d101207f7c527988528853d101207f7c7b88518854cd016a7b8276014ba063014c7c7e687c7e7e88c4569c6355d100886851',
		'sourceMap': '35:12:35:28;:32::33;:4::35:1;36:12:36:29:0;:33::34;:12:::1;:4::36;39:12:39:33:0;:37::38;:4::40:1;40:22:40:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;42:23:42:44:0;:12::59:1;:63::65:0;:4::67:1;48:51:48:52:0;:41::69:1;49:22:49:23:0;:12::40:1;:44::72:0;:4::74:1;50:23:50:24:0;:12::41:1;:45::73:0;:4::75:1;51:23:51:24:0;:12::41:1;:4::75;54:43:54:44:0;:33::59:1;:::69;:29::70;55:44:55:45:0;:33::60:1;:::70;:29::71;56:12:56:30:0;:34::52;:::56:1;:4::58;59:23:59:24:0;:12::37:1;:51::52:0;:41::65:1;:68::86:0;;:41:::1;:4::88;61:23:61:24:0;:12::37:1;:4::61;64:23:64:24:0;:12::31:1;:::49;:4::51;66:22:66:23:0;:12::38:1;:42::44:0;:4::46:1;69:22:69:23:0;:12::40:1;:::47;;:51::53:0;:4::55:1;73:26:73:27:0;:16::44:1;:51::52:0;:16::53:1;:::56;:63::65:0;:16::66:1;:::69;74:23:74:24:0;:12::39:1;:43::46:0;:49::53;;:43:::1;:4::55;77:23:77:24:0;:12::39:1;:53::54:0;:43::69:1;:4::71;80:44:80:45:0;:34::60:1;83:64:83:65:0;:53::80:1;:87::89:0;:53::90:1;84:12:84:27:0;:31::52;;:4::54:1;85:33:85:37:0;:4::39:1;88:64:88:65:0;:53::80:1;:87::89:0;:53::90:1;89:12:89:27:0;:31::52;:4::54:1;90:33:90:37:0;:4::39:1;93:23:93:24:0;:12::41:1;:45::80:0;:74::78;::::1;;;;;;;;;;;;:4::82;95:8:95:25:0;:29::30;:8:::1;:32:98:5:0;97:25:97:26;:14::41:1;:45::47:0;:6::49:1;95:32:98:5;34:2:99:3',
		'logs': [],
		'requires': [
			{
				'ip': 3,
				'line': 35,
			},
			{
				'ip': 7,
				'line': 36,
			},
			{
				'ip': 10,
				'line': 39,
			},
			{
				'ip': 15,
				'line': 40,
			},
			{
				'ip': 19,
				'line': 42,
			},
			{
				'ip': 25,
				'line': 49,
			},
			{
				'ip': 29,
				'line': 50,
			},
			{
				'ip': 32,
				'line': 51,
			},
			{
				'ip': 44,
				'line': 56,
			},
			{
				'ip': 52,
				'line': 59,
			},
			{
				'ip': 55,
				'line': 61,
			},
			{
				'ip': 59,
				'line': 64,
			},
			{
				'ip': 63,
				'line': 66,
			},
			{
				'ip': 69,
				'line': 69,
			},
			{
				'ip': 84,
				'line': 74,
			},
			{
				'ip': 89,
				'line': 77,
			},
			{
				'ip': 99,
				'line': 84,
			},
			{
				'ip': 101,
				'line': 85,
			},
			{
				'ip': 108,
				'line': 89,
			},
			{
				'ip': 110,
				'line': 90,
			},
			{
				'ip': 127,
				'line': 93,
			},
			{
				'ip': 135,
				'line': 97,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.0-next.4',
	},
	'updatedAt': '2025-07-14T20:50:25.950Z',
};
