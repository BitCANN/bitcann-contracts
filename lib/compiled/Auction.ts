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
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_BIN2NUM OP_2 OP_OUTPUTTOKENCOMMITMENT OP_BIN2NUM OP_DUP OP_ROT OP_1ADD OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_2 OP_PICK OP_SUB OP_NUMEQUALVERIFY OP_3 OP_OUTPUTTOKENAMOUNT OP_OVER OP_NUMEQUALVERIFY OP_OVER OP_SWAP OP_MUL OP_3 OP_MUL OP_SWAP 40420f OP_MUL OP_SWAP OP_SUB 40420f OP_DIV OP_DUP 204e OP_MAX OP_3 OP_OUTPUTVALUE OP_LESSTHANOREQUAL OP_VERIFY OP_3 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_SIZE OP_NIP 19 OP_NUMEQUALVERIFY OP_3 OP_UTXOBYTECODE OP_3 OP_SPLIT OP_SWAP 76a914 OP_EQUALVERIFY 14 OP_SPLIT 88ac OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCOMMITMENT OP_SWAP OP_3 OP_PICK OP_CAT OP_EQUALVERIFY OP_SWAP OP_SIZE OP_NIP OP_16 OP_LESSTHANOREQUAL OP_VERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_NUMEQUAL OP_IF OP_4 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_ENDIF OP_DROP OP_1',
	'source': "pragma cashscript 0.11.3;\n\n/**\n * @param minStartingBid The minimum starting bid for the auction.\n */\ncontract Auction(int minStartingBid) {\n  /**\n   * Starts a new name registration auction.\n   * @param name The name being registered.\n   * \n   * The function creates a new auction with:\n   * - Starting bid >= `minStartingBid` BCH.\n   * - A successful registration initiation results in an auctionNFT representing the auction state:\n   *   - capability: (Mutable)\n   *   - category: registryInputCategory\n   *   - tokenAmount: (Represents the registrationId)\n   *   - satoshiValue: (Represents the bid amount)\n   *   - commitment: bidder's PKH (20 bytes) + name (bytes)\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract.\n   * - Input2: Minting CounterNFT from Registry contract (Increases the registrationId by 1 in the output).\n   * - Input3: Funding UTXO.\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Minting CounterNFT going back to the Registry contract.\n   * - Output3: auctionNFT to the Registry contract.\n   * - Output4: Optional change in BCH.\n   */\n  function call(bytes name) {\n    require(tx.inputs.length == 4, \"Invalid number of inputs\");\n    require(tx.outputs.length <= 5, \"Invalid number of outputs\");\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1, \"Active input index is not 1\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Locking bytecode mismatch\");\n    // Ensure that the nameCategory in not minted here.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x, \"Token added to the output\");\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Locking bytecode mismatch\");\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, \"Locking bytecode mismatch\");\n    require(tx.outputs[3].lockingBytecode == registryInputLockingBytecode, \"Locking bytecode mismatch\");\n\n    // Registration ID increases by 1 with each transaction.\n    int prevRegistrationId = int(tx.inputs[2].nftCommitment);\n    int nextRegistrationId = int(tx.outputs[2].nftCommitment);\n    require(nextRegistrationId == prevRegistrationId + 1, \"Registration ID does not increase by 1\");\n\n    // Reduce the tokenAmount in the counterNFT as some amount is going to auctionNFT\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount - nextRegistrationId, \"Token amount in CounterNFT does not decrease\");\n    // tokenAmount in the auctionNFT is the registrationId.\n    require(tx.outputs[3].tokenAmount == nextRegistrationId, \"Token amount in AuctionNFT does not match\");\n\n    // Dual Decay mechanism, auction price decays linearly with the step.\n    // To facilitate higher precisions and since decimals do not exist in VM, we multiply\n    // it by 1e6 (1000000) and name the values as points.\n\n    // 1. Decay points (0.0003% per step)\n    int decayPoints = minStartingBid * nextRegistrationId * 3;\n    // 2. Get auction price points\n    int currentPricePoints = minStartingBid * 1e6;\n    // 3. Subtract price points by decay points to get the current auction price.\n    int currentAuctionPrice = (currentPricePoints - decayPoints) / 1e6;\n\n    // Set the minimum auction price to 20000 satoshis.\n    currentAuctionPrice = max(currentAuctionPrice, 20000);\n\n    // Every auction begins with a min base value of at least currentAuctionPrice satoshis.\n    require(tx.outputs[3].value >= currentAuctionPrice, \"Auction price is less than the minimum\");\n    // Funding UTXO/ Bid UTXO\n    require(tx.inputs[3].tokenCategory == 0x, \"Token category is not BCH\");\n\n    // Ensure that the funding happens from a P2PKH UTXO because there will be no way to know the locking bytecode as \n    // name can be of any length.\n    require(tx.inputs[3].lockingBytecode.length == 25, \"Locking bytecode length is not 25\");\n\n    bytes pkhLockingBytecodeHead, bytes pkhLockingBytecodeBody = tx.inputs[3].lockingBytecode.split(3);\n    // OP_DUP OP_HASH160 Push 20-byte\n    require(pkhLockingBytecodeHead == 0x76a914, \"Locking bytecode head is not 0x76a914\");\n    bytes pkh, bytes pkhLockingBytecodeTail = pkhLockingBytecodeBody.split(20);\n    // OP_EQUALVERIFY OP_CHECKSIG\n    require(pkhLockingBytecodeTail == 0x88ac, \"Locking bytecode tail is not 0x88ac\");\n    require(tx.outputs[3].nftCommitment == pkh + name, \"NFT commitment does not match\");\n\n    // Ensure that the name is not too long, as of 2025 upgrade, the nftcommitment is 40 bytes.\n    // 20 bytes pkh + 16 bytes name + 4 bytes TLD\n    require(name.length <= 16, \"Name is too long\");\n\n    // CounterNFT should keep the same category and capability.\n    require(tx.outputs[2].tokenCategory == tx.inputs[2].tokenCategory, \"Token category mismatch\");\n    \n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    \n    // CounterNFT should be minting and of the 'nameCategory' i.e registryInputCategory\n    bytes counterCategory, bytes counterCapability = tx.outputs[2].tokenCategory.split(32);\n    require(counterCategory == registryInputCategory, \"Counter category mismatch\");\n    // Minting\n    require(counterCapability == 0x02, \"Counter capability is not minting capability\");\n\n    // AuctionNFT should be mutable and of the 'nameCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.outputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory, \"Auction category mismatch\");\n    // Mutable\n    require(auctionCapability == 0x01, \"Auction capability is not mutable\");\n\n    if (tx.outputs.length == 5) {\n      // If any change, then it must be pure BCH.\n      require(tx.outputs[4].tokenCategory == 0x, \"Change is not pure BCH\");\n    }\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc455a169c0519dc0c7c0cd88c0d1008800c752c7788852cd788853cd8852cf8152d281767b8b9d52d352d05279949d53d3789d787c9553957c0340420f957c940340420f967602204ea453cca16953ce008853c7827701199d53c7537f7c0376a9148801147f0288ac8853d27c53797e887c827760a16952d152ce8800ce52d101207f7c527988528853d101207f7c7b885188c4559c6354d10088687551',
		'sourceMap': '34:12:34:28;:32::33;:4::63:1;35:12:35:29:0;:33::34;:12:::1;:4::65;38:12:38:33:0;:37::38;:4::71:1;39:22:39:43:0;:12::60:1;:75::96:0;:64::113:1;:4::144;41:23:41:44:0;:12::59:1;:63::65:0;:4::96:1;47:51:47:52:0;:41::69:1;48:22:48:23:0;:12::40:1;:44::72:0;:4::103:1;49:23:49:24:0;:12::41:1;:45::73:0;:4::104:1;50:23:50:24:0;:12::41:1;:4::104;53:43:53:44:0;:33::59:1;:29::60;54:44:54:45:0;:33::60:1;:29::61;55:12:55:30:0;:34::52;:::56:1;:4::100;58:23:58:24:0;:12::37:1;:51::52:0;:41::65:1;:68::86:0;;:41:::1;:4::136;60:23:60:24:0;:12::37:1;:41::59:0;:4::106:1;67:22:67:36:0;:39::57;:22:::1;:60::61:0;:22:::1;69:29:69:43:0;:46::49;:29:::1;71:52:71:63:0;:31:::1;:67::70:0;:30:::1;74::74:49:0;:51::56;:26::57:1;77:23:77:24:0;:12::31:1;:::54;:4::98;79:22:79:23:0;:12::38:1;:42::44:0;:4::75:1;83:22:83:23:0;:12::40:1;:::47;;:51::53:0;:4::92:1;85:75:85:76:0;:65::93:1;:100::101:0;:65::102:1;87:12:87:34:0;:38::46;:4::89:1;88:75:88:77:0;:46::78:1;90:38:90:44:0;:4::85:1;91:23:91:24:0;:12::39:1;:43::46:0;:49::53;;:43:::1;:4::88;95:12:95:16:0;:::23:1;;:27::29:0;:12:::1;:4::51;98:23:98:24:0;:12::39:1;:53::54:0;:43::69:1;:4::98;101:44:101:45:0;:34::60:1;104:64:104:65:0;:53::80:1;:87::89:0;:53::90:1;105:12:105:27:0;:31::52;;:4::83:1;107:33:107:37:0;:4::87:1;110:64:110:65:0;:53::80:1;:87::89:0;:53::90:1;111:12:111:27:0;:31::52;:4::83:1;113:33:113:37:0;:4::76:1;115:8:115:25:0;:29::30;:8:::1;:32:118:5:0;117:25:117:26;:14::41:1;:45::47:0;:6::75:1;115:32:118:5;33:2:119:3;',
		'logs': [],
		'requires': [
			{
				'ip': 3,
				'line': 34,
				'message': 'Invalid number of inputs',
			},
			{
				'ip': 7,
				'line': 35,
				'message': 'Invalid number of outputs',
			},
			{
				'ip': 10,
				'line': 38,
				'message': 'Active input index is not 1',
			},
			{
				'ip': 15,
				'line': 39,
				'message': 'Locking bytecode mismatch',
			},
			{
				'ip': 19,
				'line': 41,
				'message': 'Token added to the output',
			},
			{
				'ip': 25,
				'line': 48,
				'message': 'Locking bytecode mismatch',
			},
			{
				'ip': 29,
				'line': 49,
				'message': 'Locking bytecode mismatch',
			},
			{
				'ip': 32,
				'line': 50,
				'message': 'Locking bytecode mismatch',
			},
			{
				'ip': 42,
				'line': 55,
				'message': 'Registration ID does not increase by 1',
			},
			{
				'ip': 50,
				'line': 58,
				'message': 'Token amount in CounterNFT does not decrease',
			},
			{
				'ip': 54,
				'line': 60,
				'message': 'Token amount in AuctionNFT does not match',
			},
			{
				'ip': 73,
				'line': 77,
				'message': 'Auction price is less than the minimum',
			},
			{
				'ip': 77,
				'line': 79,
				'message': 'Token category is not BCH',
			},
			{
				'ip': 83,
				'line': 83,
				'message': 'Locking bytecode length is not 25',
			},
			{
				'ip': 90,
				'line': 87,
				'message': 'Locking bytecode head is not 0x76a914',
			},
			{
				'ip': 94,
				'line': 90,
				'message': 'Locking bytecode tail is not 0x88ac',
			},
			{
				'ip': 101,
				'line': 91,
				'message': 'NFT commitment does not match',
			},
			{
				'ip': 107,
				'line': 95,
				'message': 'Name is too long',
			},
			{
				'ip': 112,
				'line': 98,
				'message': 'Token category mismatch',
			},
			{
				'ip': 122,
				'line': 105,
				'message': 'Counter category mismatch',
			},
			{
				'ip': 124,
				'line': 107,
				'message': 'Counter capability is not minting capability',
			},
			{
				'ip': 131,
				'line': 111,
				'message': 'Auction category mismatch',
			},
			{
				'ip': 133,
				'line': 113,
				'message': 'Auction capability is not mutable',
			},
			{
				'ip': 141,
				'line': 117,
				'message': 'Change is not pure BCH',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-07-29T23:10:39.044Z',
};
