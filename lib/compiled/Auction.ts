export default {
	'contractName': 'Auction',
	'constructorInputs': [],
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
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_BIN2NUM OP_2 OP_OUTPUTTOKENCOMMITMENT OP_BIN2NUM OP_OVER OP_1ADD OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_2 OP_PICK OP_SUB OP_NUMEQUALVERIFY OP_3 OP_OUTPUTTOKENAMOUNT OP_OVER OP_NUMEQUALVERIFY 1027 OP_DUP OP_ROT OP_MUL OP_3 OP_MUL OP_SWAP 40420f OP_MUL OP_SWAP OP_SUB 40420f OP_DIV OP_DUP 7017 OP_MAX OP_3 OP_OUTPUTVALUE OP_LESSTHANOREQUAL OP_VERIFY OP_3 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_SIZE OP_NIP 19 OP_NUMEQUALVERIFY OP_3 OP_UTXOBYTECODE OP_3 OP_SPLIT OP_SWAP 76a914 OP_EQUALVERIFY 14 OP_SPLIT 88ac OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCOMMITMENT OP_SWAP OP_3 OP_PICK OP_CAT OP_EQUALVERIFY OP_SWAP OP_SIZE OP_NIP OP_16 OP_LESSTHANOREQUAL OP_VERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_NUMEQUAL OP_IF OP_4 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_ENDIF OP_DROP OP_1',
	'source': "pragma cashscript 0.11.5;\n\ncontract Auction() {\n  /**\n   * Starts a new name registration auction.\n   * @param name The name being registered.\n   * \n   * The function creates a new auction with:\n   * - Starting bid >= 1000000 satoshis.\n   * - A successful registration initiation results in an auctionNFT representing the auction state:\n   *   - capability: Mutable\n   *   - category: NameCategory\n   *   - tokenAmount: RegistrationID\n   *   - satoshiValue: BidAmount\n   *   - commitment: Bidder's PKH (20 bytes) + Name (16 bytes)\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: Minting CounterNFT from Registry contract (Increases the registrationId by 1 in the output)\n   * - Input3: Funding UTXO\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract\n   * - Output1: Input1 back to this contract\n   * - Output2: Minting CounterNFT going back to the Registry contract\n   * - Output3: AuctionNFT to the Registry contract\n   * - Output4: Optional change in BCH\n   */\n  function call(bytes name) {\n    // Info: Ignored checks:\n    // - No transaction version enforcement. The contract at 0th index, i.e the Registry Contract has enforced the transaction version,\n    // since all the main utxos live with the registry contract, there is no need to enforce it here as well.\n    // - Min output value checks: Any unnecessary bch value in the utxos can be extracted by the change output.\n\n    require(tx.inputs.length == 4, \"Transaction: must have exactly 4 inputs\");\n    require(tx.outputs.length <= 5, \"Transaction: must have at most 5 outputs\");\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1, \"Input 1: auction contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n    // Ensure that no tokenCategory is minted here.\n    // No need to check input category as it will be automatically burned in this transaction.\n    // Not allowing any category leaks by restricting the output category to pure BCH.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x, \"Output 1: must not have any token category (pure BCH only)\");\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, \"Output 2: locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[3].lockingBytecode == registryInputLockingBytecode, \"Output 3: locking bytecode does not match registry input's locking bytecode\");\n\n    // Registration ID increases by 1 with each transaction.\n    int currentRegistrationId = int(tx.inputs[2].nftCommitment);\n    int nextRegistrationId = int(tx.outputs[2].nftCommitment);\n    require(nextRegistrationId == currentRegistrationId + 1, \"Output 2: registration ID must increase by 1\");\n\n    // Reduce the tokenAmount in the counterNFT as some amount is going to auctionNFT\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount - currentRegistrationId, \"Output 2: counter NFT token amount must decrease by currentRegistrationId\");\n    // tokenAmount in the auctionNFT is the registrationId.\n    require(tx.outputs[3].tokenAmount == currentRegistrationId, \"Output 3: auction NFT token amount must equal currentRegistrationId\");\n\n    // Dual Decay mechanism, auction price decays linearly with the step.\n    // To facilitate higher precisions and since decimals do not exist in VM, we multiply\n    // it by 1e6 (1000000) and call the units as 'points'.\n\n    // TODO: Make this 1000000 (0.01 BCH)\n    int constant minStartingBid = 10000;\n    // 1. Decay points (0.0003% per step)\n    int decayPoints = minStartingBid * currentRegistrationId * 3;\n    // 2. Get auction price points\n    int currentPricePoints = minStartingBid * 1e6;\n    // 3. Subtract price points by decay points to get the current auction price.\n    int currentAuctionPrice = (currentPricePoints - decayPoints) / 1e6;\n\n    // TODO: Make this 20000\n    // Set the minimum auction price to 6000 satoshis.\n    currentAuctionPrice = max(currentAuctionPrice, 6000);\n\n    // Every auction begins with a min base value of at least currentAuctionPrice satoshis.\n    require(tx.outputs[3].value >= currentAuctionPrice, \"Output 3: auction price must be at least minimum calculated price\");\n    // Funding UTXO/ Bid UTXO\n    require(tx.inputs[3].tokenCategory == 0x, \"Input 3: funding UTXO must be pure BCH\");\n\n    // Ensure that the funding happens from a P2PKH UTXO because there will be no way to know the locking bytecode as \n    // name can be of any length.\n    require(tx.inputs[3].lockingBytecode.length == 25, \"Input 3: locking bytecode must be 25 bytes (P2PKH)\");\n\n    bytes pkhLockingBytecodeHead, bytes pkhLockingBytecodeBody = tx.inputs[3].lockingBytecode.split(3);\n    // OP_DUP OP_HASH160 Push 20-byte\n    require(pkhLockingBytecodeHead == 0x76a914, \"Input 3: locking bytecode must start with OP_DUP OP_HASH160 (0x76a914)\");\n    bytes pkh, bytes pkhLockingBytecodeTail = pkhLockingBytecodeBody.split(20);\n    // OP_EQUALVERIFY OP_CHECKSIG\n    require(pkhLockingBytecodeTail == 0x88ac, \"Input 3: locking bytecode must end with OP_EQUALVERIFY OP_CHECKSIG (0x88ac)\");\n    require(tx.outputs[3].nftCommitment == pkh + name, \"Output 3: NFT commitment must match bidder PKH + name\");\n\n    // Ensure that the name is not too long, as of 2025 upgrade, the nftcommitment is 40 bytes.\n    // 20 bytes pkh + 16 bytes name + 4 bytes TLD\n    require(name.length <= 16, \"Name: length must be at most 16 characters\");\n\n    // CounterNFT should keep the same category and capability.\n    require(tx.outputs[2].tokenCategory == tx.inputs[2].tokenCategory, \"Output 2: counter NFT token category must match input 2\");\n    \n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    \n    // CounterNFT should be minting and of the 'nameCategory' i.e registryInputCategory\n    bytes counterCategory, bytes counterCapability = tx.outputs[2].tokenCategory.split(32);\n    require(counterCategory == registryInputCategory, \"Output 2: counter NFT token category prefix must match registry\");\n    require(counterCapability == 0x02, \"Output 2: counter NFT capability must be minting (0x02)\");\n\n    // AuctionNFT should be mutable and of the 'nameCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.outputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory, \"Output 3: auction NFT token category prefix must match registry\");\n    // Mutable\n    require(auctionCapability == 0x01, \"Output 3: auction NFT capability must be mutable (0x01)\");\n\n    if (tx.outputs.length == 5) {\n      // If any change, then it must be pure BCH.\n      require(tx.outputs[4].tokenCategory == 0x, \"Output 4: change must be pure BCH (no token category)\");\n    }\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc455a169c0519dc0c7c0cd88c0d1008800c752c7788852cd788853cd8852cf8152d281788b9d52d352d05279949d53d3789d021027767b9553957c0340420f957c940340420f9676027017a453cca16953ce008853c7827701199d53c7537f7c0376a9148801147f0288ac8853d27c53797e887c827760a16952d152ce8800ce52d101207f7c527988528853d101207f7c7b885188c4559c6354d10088687551',
		'sourceMap': '36:12:36:28;:32::33;:4::78:1;37:12:37:29:0;:33::34;:12:::1;:4::80;40:12:40:33:0;:37::38;:4::96:1;41:22:41:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;45:23:45:44:0;:12::59:1;:63::65:0;:4::129:1;51:51:51:52:0;:41::69:1;52:22:52:23:0;:12::40:1;:44::72:0;:4::152:1;53:23:53:24:0;:12::41:1;:45::73:0;:4::154:1;54:23:54:24:0;:12::41:1;:4::154;57:46:57:47:0;:36::62:1;:32::63;58:44:58:45:0;:33::60:1;:29::61;59:34:59:55:0;:::59:1;:4::109;62:23:62:24:0;:12::37:1;:51::52:0;:41::65:1;:68::89:0;;:41:::1;:4::168;64:23:64:24:0;:12::37:1;:41::62:0;:4::135:1;71:34:71:39:0;73:22:73:36;:39::60;:22:::1;:63::64:0;:22:::1;75:29:75:43:0;:46::49;:29:::1;77:52:77:63:0;:31:::1;:67::70:0;:30:::1;81::81:49:0;:51::55;:26::56:1;84:23:84:24:0;:12::31:1;:::54;:4::125;86:22:86:23:0;:12::38:1;:42::44:0;:4::88:1;90:22:90:23:0;:12::40:1;:::47;;:51::53:0;:4::109:1;92:75:92:76:0;:65::93:1;:100::101:0;:65::102:1;94:12:94:34:0;:38::46;:4::122:1;95:75:95:77:0;:46::78:1;97:38:97:44:0;:4::125:1;98:23:98:24:0;:12::39:1;:43::46:0;:49::53;;:43:::1;:4::112;102:12:102:16:0;:::23:1;;:27::29:0;:12:::1;:4::77;105:23:105:24:0;:12::39:1;:53::54:0;:43::69:1;:4::130;108:44:108:45:0;:34::60:1;111:64:111:65:0;:53::80:1;:87::89:0;:53::90:1;112:12:112:27:0;:31::52;;:4::121:1;113:33:113:37:0;:4::98:1;116:64:116:65:0;:53::80:1;:87::89:0;:53::90:1;117:12:117:27:0;:31::52;:4::121:1;119:33:119:37:0;:4::98:1;121:8:121:25:0;:29::30;:8:::1;:32:124:5:0;123:25:123:26;:14::41:1;:45::47:0;:6::106:1;121:32:124:5;30:2:125:3;',
		'logs': [],
		'requires': [
			{
				'ip': 2,
				'line': 36,
				'message': 'Transaction: must have exactly 4 inputs',
			},
			{
				'ip': 6,
				'line': 37,
				'message': 'Transaction: must have at most 5 outputs',
			},
			{
				'ip': 9,
				'line': 40,
				'message': 'Input 1: auction contract UTXO must be at this index',
			},
			{
				'ip': 14,
				'line': 41,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 18,
				'line': 45,
				'message': 'Output 1: must not have any token category (pure BCH only)',
			},
			{
				'ip': 24,
				'line': 52,
				'message': "Input 2: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 28,
				'line': 53,
				'message': "Output 2: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 31,
				'line': 54,
				'message': "Output 3: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 40,
				'line': 59,
				'message': 'Output 2: registration ID must increase by 1',
			},
			{
				'ip': 48,
				'line': 62,
				'message': 'Output 2: counter NFT token amount must decrease by currentRegistrationId',
			},
			{
				'ip': 52,
				'line': 64,
				'message': 'Output 3: auction NFT token amount must equal currentRegistrationId',
			},
			{
				'ip': 72,
				'line': 84,
				'message': 'Output 3: auction price must be at least minimum calculated price',
			},
			{
				'ip': 76,
				'line': 86,
				'message': 'Input 3: funding UTXO must be pure BCH',
			},
			{
				'ip': 82,
				'line': 90,
				'message': 'Input 3: locking bytecode must be 25 bytes (P2PKH)',
			},
			{
				'ip': 89,
				'line': 94,
				'message': 'Input 3: locking bytecode must start with OP_DUP OP_HASH160 (0x76a914)',
			},
			{
				'ip': 93,
				'line': 97,
				'message': 'Input 3: locking bytecode must end with OP_EQUALVERIFY OP_CHECKSIG (0x88ac)',
			},
			{
				'ip': 100,
				'line': 98,
				'message': 'Output 3: NFT commitment must match bidder PKH + name',
			},
			{
				'ip': 106,
				'line': 102,
				'message': 'Name: length must be at most 16 characters',
			},
			{
				'ip': 111,
				'line': 105,
				'message': 'Output 2: counter NFT token category must match input 2',
			},
			{
				'ip': 121,
				'line': 112,
				'message': 'Output 2: counter NFT token category prefix must match registry',
			},
			{
				'ip': 123,
				'line': 113,
				'message': 'Output 2: counter NFT capability must be minting (0x02)',
			},
			{
				'ip': 130,
				'line': 117,
				'message': 'Output 3: auction NFT token category prefix must match registry',
			},
			{
				'ip': 132,
				'line': 119,
				'message': 'Output 3: auction NFT capability must be mutable (0x01)',
			},
			{
				'ip': 140,
				'line': 123,
				'message': 'Output 4: change must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.5',
	},
	'updatedAt': '2025-09-01T06:20:00.103Z',
};
