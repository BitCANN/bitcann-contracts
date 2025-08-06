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
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_BIN2NUM OP_2 OP_OUTPUTTOKENCOMMITMENT OP_BIN2NUM OP_DUP OP_ROT OP_1ADD OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_2 OP_PICK OP_SUB OP_NUMEQUALVERIFY OP_3 OP_OUTPUTTOKENAMOUNT OP_OVER OP_NUMEQUALVERIFY 1027 OP_DUP OP_ROT OP_MUL OP_3 OP_MUL OP_SWAP 40420f OP_MUL OP_SWAP OP_SUB 40420f OP_DIV OP_DUP 204e OP_MAX OP_3 OP_OUTPUTVALUE OP_LESSTHANOREQUAL OP_VERIFY OP_3 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_SIZE OP_NIP 19 OP_NUMEQUALVERIFY OP_3 OP_UTXOBYTECODE OP_3 OP_SPLIT OP_SWAP 76a914 OP_EQUALVERIFY 14 OP_SPLIT 88ac OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCOMMITMENT OP_SWAP OP_3 OP_PICK OP_CAT OP_EQUALVERIFY OP_SWAP OP_SIZE OP_NIP OP_16 OP_LESSTHANOREQUAL OP_VERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_NUMEQUAL OP_IF OP_4 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_ENDIF OP_DROP OP_1',
	'source': "pragma cashscript 0.11.3;\n\ncontract Auction() {\n  /**\n   * Starts a new name registration auction.\n   * @param name The name being registered.\n   * \n   * The function creates a new auction with:\n   * - Starting bid >= `minStartingBid` BCH.\n   * - A successful registration initiation results in an auctionNFT representing the auction state:\n   *   - capability: (Mutable)\n   *   - category: registryInputCategory\n   *   - tokenAmount: (Represents the registrationId)\n   *   - satoshiValue: (Represents the bid amount)\n   *   - commitment: bidder's PKH (20 bytes) + name (bytes)\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract.\n   * - Input2: Minting CounterNFT from Registry contract (Increases the registrationId by 1 in the output).\n   * - Input3: Funding UTXO.\n   * \n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Minting CounterNFT going back to the Registry contract.\n   * - Output3: auctionNFT to the Registry contract.\n   * - Output4: Optional change in BCH.\n   */\n  function call(bytes name) {\n    require(tx.inputs.length == 4, \"Transaction: must have exactly 4 inputs\");\n    require(tx.outputs.length <= 5, \"Transaction: must have at most 5 outputs\");\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1, \"Input 1: auction contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n    // Ensure that the nameCategory in not minted here.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x, \"Output 1: must not have any token category (pure BCH only)\");\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, \"Output 2: locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[3].lockingBytecode == registryInputLockingBytecode, \"Output 3: locking bytecode does not match registry input's locking bytecode\");\n\n    // Registration ID increases by 1 with each transaction.\n    int prevRegistrationId = int(tx.inputs[2].nftCommitment);\n    int nextRegistrationId = int(tx.outputs[2].nftCommitment);\n    require(nextRegistrationId == prevRegistrationId + 1, \"Output 2: registration ID must increase by 1\");\n\n    // Reduce the tokenAmount in the counterNFT as some amount is going to auctionNFT\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount - nextRegistrationId, \"Output 2: counter NFT token amount must decrease by registration ID\");\n    // tokenAmount in the auctionNFT is the registrationId.\n    require(tx.outputs[3].tokenAmount == nextRegistrationId, \"Output 3: auction NFT token amount must equal registration ID\");\n\n    // Dual Decay mechanism, auction price decays linearly with the step.\n    // To facilitate higher precisions and since decimals do not exist in VM, we multiply\n    // it by 1e6 (1000000) and name the values as points.\n\n    int constant minStartingBid = 10000;\n    // 1. Decay points (0.0003% per step)\n    int decayPoints = minStartingBid * nextRegistrationId * 3;\n    // 2. Get auction price points\n    int currentPricePoints = minStartingBid * 1e6;\n    // 3. Subtract price points by decay points to get the current auction price.\n    int currentAuctionPrice = (currentPricePoints - decayPoints) / 1e6;\n\n    // Set the minimum auction price to 20000 satoshis.\n    currentAuctionPrice = max(currentAuctionPrice, 20000);\n\n    // Every auction begins with a min base value of at least currentAuctionPrice satoshis.\n    require(tx.outputs[3].value >= currentAuctionPrice, \"Output 3: auction price must be at least minimum calculated price\");\n    // Funding UTXO/ Bid UTXO\n    require(tx.inputs[3].tokenCategory == 0x, \"Input 3: funding UTXO must be pure BCH\");\n\n    // Ensure that the funding happens from a P2PKH UTXO because there will be no way to know the locking bytecode as \n    // name can be of any length.\n    require(tx.inputs[3].lockingBytecode.length == 25, \"Input 3: locking bytecode must be 25 bytes (P2PKH)\");\n\n    bytes pkhLockingBytecodeHead, bytes pkhLockingBytecodeBody = tx.inputs[3].lockingBytecode.split(3);\n    // OP_DUP OP_HASH160 Push 20-byte\n    require(pkhLockingBytecodeHead == 0x76a914, \"Input 3: locking bytecode must start with OP_DUP OP_HASH160 (0x76a914)\");\n    bytes pkh, bytes pkhLockingBytecodeTail = pkhLockingBytecodeBody.split(20);\n    // OP_EQUALVERIFY OP_CHECKSIG\n    require(pkhLockingBytecodeTail == 0x88ac, \"Input 3: locking bytecode must end with OP_EQUALVERIFY OP_CHECKSIG (0x88ac)\");\n    require(tx.outputs[3].nftCommitment == pkh + name, \"Output 3: NFT commitment must match bidder PKH + name\");\n\n    // Ensure that the name is not too long, as of 2025 upgrade, the nftcommitment is 40 bytes.\n    // 20 bytes pkh + 16 bytes name + 4 bytes TLD\n    require(name.length <= 16, \"Name: length must be at most 16 characters\");\n\n    // CounterNFT should keep the same category and capability.\n    require(tx.outputs[2].tokenCategory == tx.inputs[2].tokenCategory, \"Output 2: counter NFT token category must match input 2\");\n    \n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    \n    // CounterNFT should be minting and of the 'nameCategory' i.e registryInputCategory\n    bytes counterCategory, bytes counterCapability = tx.outputs[2].tokenCategory.split(32);\n    require(counterCategory == registryInputCategory, \"Output 2: counter NFT token category prefix must match registry\");\n    // Minting\n    require(counterCapability == 0x02, \"Output 2: counter NFT capability must be minting (0x02)\");\n\n    // AuctionNFT should be mutable and of the 'nameCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.outputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory, \"Output 3: auction NFT token category prefix must match registry\");\n    // Mutable\n    require(auctionCapability == 0x01, \"Output 3: auction NFT capability must be mutable (0x01)\");\n\n    if (tx.outputs.length == 5) {\n      // If any change, then it must be pure BCH.\n      require(tx.outputs[4].tokenCategory == 0x, \"Output 4: change must be pure BCH (no token category)\");\n    }\n  }\n}",
	'debug': {
		'bytecode': 'c3549dc455a169c0519dc0c7c0cd88c0d1008800c752c7788852cd788853cd8852cf8152d281767b8b9d52d352d05279949d53d3789d021027767b9553957c0340420f957c940340420f967602204ea453cca16953ce008853c7827701199d53c7537f7c0376a9148801147f0288ac8853d27c53797e887c827760a16952d152ce8800ce52d101207f7c527988528853d101207f7c7b885188c4559c6354d10088687551',
		'sourceMap': '31:12:31:28;:32::33;:4::78:1;32:12:32:29:0;:33::34;:12:::1;:4::80;35:12:35:33:0;:37::38;:4::96:1;36:22:36:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;38:23:38:44:0;:12::59:1;:63::65:0;:4::129:1;44:51:44:52:0;:41::69:1;45:22:45:23:0;:12::40:1;:44::72:0;:4::152:1;46:23:46:24:0;:12::41:1;:45::73:0;:4::154:1;47:23:47:24:0;:12::41:1;:4::154;50:43:50:44:0;:33::59:1;:29::60;51:44:51:45:0;:33::60:1;:29::61;52:12:52:30:0;:34::52;:::56:1;:4::106;55:23:55:24:0;:12::37:1;:51::52:0;:41::65:1;:68::86:0;;:41:::1;:4::159;57:23:57:24:0;:12::37:1;:41::59:0;:4::126:1;63:34:63:39:0;65:22:65:36;:39::57;:22:::1;:60::61:0;:22:::1;67:29:67:43:0;:46::49;:29:::1;69:52:69:63:0;:31:::1;:67::70:0;:30:::1;72::72:49:0;:51::56;:26::57:1;75:23:75:24:0;:12::31:1;:::54;:4::125;77:22:77:23:0;:12::38:1;:42::44:0;:4::88:1;81:22:81:23:0;:12::40:1;:::47;;:51::53:0;:4::109:1;83:75:83:76:0;:65::93:1;:100::101:0;:65::102:1;85:12:85:34:0;:38::46;:4::122:1;86:75:86:77:0;:46::78:1;88:38:88:44:0;:4::125:1;89:23:89:24:0;:12::39:1;:43::46:0;:49::53;;:43:::1;:4::112;93:12:93:16:0;:::23:1;;:27::29:0;:12:::1;:4::77;96:23:96:24:0;:12::39:1;:53::54:0;:43::69:1;:4::130;99:44:99:45:0;:34::60:1;102:64:102:65:0;:53::80:1;:87::89:0;:53::90:1;103:12:103:27:0;:31::52;;:4::121:1;105:33:105:37:0;:4::98:1;108:64:108:65:0;:53::80:1;:87::89:0;:53::90:1;109:12:109:27:0;:31::52;:4::121:1;111:33:111:37:0;:4::98:1;113:8:113:25:0;:29::30;:8:::1;:32:116:5:0;115:25:115:26;:14::41:1;:45::47:0;:6::106:1;113:32:116:5;30:2:117:3;',
		'logs': [],
		'requires': [
			{
				'ip': 2,
				'line': 31,
				'message': 'Transaction: must have exactly 4 inputs',
			},
			{
				'ip': 6,
				'line': 32,
				'message': 'Transaction: must have at most 5 outputs',
			},
			{
				'ip': 9,
				'line': 35,
				'message': 'Input 1: auction contract UTXO must be at this index',
			},
			{
				'ip': 14,
				'line': 36,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 18,
				'line': 38,
				'message': 'Output 1: must not have any token category (pure BCH only)',
			},
			{
				'ip': 24,
				'line': 45,
				'message': "Input 2: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 28,
				'line': 46,
				'message': "Output 2: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 31,
				'line': 47,
				'message': "Output 3: locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 41,
				'line': 52,
				'message': 'Output 2: registration ID must increase by 1',
			},
			{
				'ip': 49,
				'line': 55,
				'message': 'Output 2: counter NFT token amount must decrease by registration ID',
			},
			{
				'ip': 53,
				'line': 57,
				'message': 'Output 3: auction NFT token amount must equal registration ID',
			},
			{
				'ip': 73,
				'line': 75,
				'message': 'Output 3: auction price must be at least minimum calculated price',
			},
			{
				'ip': 77,
				'line': 77,
				'message': 'Input 3: funding UTXO must be pure BCH',
			},
			{
				'ip': 83,
				'line': 81,
				'message': 'Input 3: locking bytecode must be 25 bytes (P2PKH)',
			},
			{
				'ip': 90,
				'line': 85,
				'message': 'Input 3: locking bytecode must start with OP_DUP OP_HASH160 (0x76a914)',
			},
			{
				'ip': 94,
				'line': 88,
				'message': 'Input 3: locking bytecode must end with OP_EQUALVERIFY OP_CHECKSIG (0x88ac)',
			},
			{
				'ip': 101,
				'line': 89,
				'message': 'Output 3: NFT commitment must match bidder PKH + name',
			},
			{
				'ip': 107,
				'line': 93,
				'message': 'Name: length must be at most 16 characters',
			},
			{
				'ip': 112,
				'line': 96,
				'message': 'Output 2: counter NFT token category must match input 2',
			},
			{
				'ip': 122,
				'line': 103,
				'message': 'Output 2: counter NFT token category prefix must match registry',
			},
			{
				'ip': 124,
				'line': 105,
				'message': 'Output 2: counter NFT capability must be minting (0x02)',
			},
			{
				'ip': 131,
				'line': 109,
				'message': 'Output 3: auction NFT token category prefix must match registry',
			},
			{
				'ip': 133,
				'line': 111,
				'message': 'Output 3: auction NFT capability must be mutable (0x01)',
			},
			{
				'ip': 141,
				'line': 115,
				'message': 'Output 4: change must be pure BCH (no token category)',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-08-06T03:04:34.839Z',
};
