export default {
	'contractName': 'Factory',
	'constructorInputs': [
		{
			'name': 'nameContractBytecode',
			'type': 'bytes',
		},
		{
			'name': 'minWaitTime',
			'type': 'int',
		},
		{
			'name': 'creatorIncentivePKH',
			'type': 'bytes20',
		},
		{
			'name': 'tld',
			'type': 'bytes',
		},
	],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_7 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOVALUE OP_INPUTINDEX OP_OUTPUTVALUE OP_NUMEQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_5 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY OP_2 OP_OUTPUTVALUE OP_2 OP_UTXOVALUE OP_NUMEQUALVERIFY OP_3 OP_INPUTSEQUENCENUMBER OP_3 OP_ROLL OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_DUP OP_SIZE OP_NIP 20 OP_4 OP_ROLL OP_CAT OP_SWAP OP_6 OP_PICK OP_SIZE OP_NIP OP_ADD OP_CAT OP_OVER OP_CAT OP_5 OP_ROLL OP_CAT OP_3 OP_ROLL OP_CAT OP_HASH256 aa20 OP_SWAP OP_CAT 87 OP_CAT OP_3 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_3 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENAMOUNT OP_8 OP_NUM2BIN OP_4 OP_OUTPUTTOKENCOMMITMENT OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_5 OP_OUTPUTTOKENCOMMITMENT OP_SWAP OP_ROT OP_CAT OP_EQUALVERIFY OP_5 OP_OUTPUTBYTECODE 76a914 OP_ROT OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_5 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT a08601 OP_MUL OP_SWAP OP_SUB a08601 OP_DIV OP_DUP 204e OP_GREATERTHAN OP_IF OP_6 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_6 OP_OUTPUTVALUE OP_OVER OP_NUMEQUALVERIFY OP_6 OP_OUTPUTBYTECODE 76a914 OP_3 OP_PICK OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_ENDIF OP_2DROP OP_1',
	'source': "pragma cashscript 0.11.3;\n\n/**\n * @param nameContractBytecode - Partial bytecode of the name contract\n * @param minWaitTime - Minimum wait time to consider an auction ended\n * @param creatorIncentivePKH - PKH of the creator incentive\n * @param tld - TLD of the name\n */\ncontract Factory(\n  bytes nameContractBytecode,\n  int minWaitTime,\n  bytes20 creatorIncentivePKH,\n  bytes tld\n) {\n  /**\n   * This function finalizes a name registration auction by:\n   * - Verifying the auction has ended and the winner's bid is valid\n   * - Issuing an immutable externalAuthNFT to the Name Contract\n   * - Issuing an immutable internalAuthNFT to the Name Contract\n   * - Issuing an immutable name NFT to the auction winner\n   * - Distributing auction fees between the platform and miners\n   * - Burning the auctionNFT\n   *\n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: NameMintingNFT from the Registry Contract\n   * - Input3: auctionNFT from the Registry Contract\n   *\n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change\n   * - Output2: NameMintingNFT back to the Registry contract\n   * - Output3: External Auth NFT to the name contract\n   * - Output4: Internal Auth NFT to the name contract\n   * - Output5: Name NFT to the auction winner\n   * - Output6: Platform fee [Reduces and the not included]\n   *\n   */\n  function call(){\n    require(tx.inputs.length == 4, \"Transaction: must have exactly 4 inputs\");\n    require(tx.outputs.length <= 7, \"Transaction: must have at most 7 outputs\");\n\n    // This contract can only be used at input1 and it should return to itself.\n    require(this.activeInputIndex == 1, \"Input 1: factory contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n    // Ensure that the nameCategory in not minted here.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x, \"Output 1: must not have any token category (pure BCH only)\");\n    // Strict value checks to ensure the platform and miner get fee.\n    require(tx.inputs[this.activeInputIndex].value == tx.outputs[this.activeInputIndex].value, \"Input 1: satoshi value must match output 1\");\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: name minting NFT locking bytecode does not match registry input's locking bytecode\");\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode, \"Input 3: auction NFT locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, \"Output 2: name minting NFT locking bytecode does not match registry input's locking bytecode\");\n\n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    require(tx.outputs[3].tokenCategory == registryInputCategory, \"Output 3: external auth NFT token category prefix must match registry\");\n    require(tx.outputs[4].tokenCategory == registryInputCategory, \"Output 4: internal auth NFT token category prefix must match registry\");\n    require(tx.outputs[5].tokenCategory == registryInputCategory, \"Output 5: name ownership NFT token category prefix must match registry\");\n\n    // NameMintingNFT should be minting and of the 'nameCategory' i.e registryInputCategory\n    bytes nameMintingCategory, bytes nameMintingCapability = tx.inputs[2].tokenCategory.split(32);\n    require(nameMintingCategory == registryInputCategory, \"Input 2: name minting NFT token category prefix must match registry\");\n    // Minting\n    require(nameMintingCapability == 0x02, \"Input 2: name minting NFT capability must be minting (0x02)\");\n    // NameMintingNFT should keep the same category and capability\n    require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory, \"Output 2: name minting NFT token category must match input 2\");\n\n    // AuctionNFT should be mutable and of the 'nameCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.inputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory, \"Input 3: auction NFT token category prefix must match registry\");\n    // Mutable\n    require(auctionCapability == 0x01, \"Input 3: auction NFT capability must be mutable (0x01)\");\n\n    // NameMintingNFT has no nftCommitment\n    require(tx.outputs[2].nftCommitment == 0x, \"Output 2: name minting NFT must have empty commitment\");\n    require(tx.inputs[2].nftCommitment == 0x, \"Input 2: name minting NFT must have empty commitment\");\n\n    // NameMintingNFT has no tokenAmount\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount, \"Output 2: name minting NFT token amount must match input 2\");\n    require(tx.outputs[2].tokenAmount == 0, \"Output 2: name minting NFT token amount must be 0\");\n\n    // Strict value check\n    require(tx.outputs[2].value == tx.inputs[2].value, \"Output 2: name minting NFT satoshi value must match input 2\");\n\n    // Enforcing the relative timelock, the auctionNFT must be atleast `minWaitTime` old\n    // to be considered ended.\n    require(tx.inputs[3].sequenceNumber == minWaitTime, \"Input 3: auction NFT sequence number must equal minimum wait time\");\n\n    // Extract the PKH and name from the auctionNFT\n    bytes20 bidderPKH, bytes name = tx.inputs[3].nftCommitment.split(20);\n    \n    // Get the name length to generate the complete bytecode of the name contract\n    int nameLength = name.length;\n    // category + name + bytecode.\n    // Note: `inactivityExpiryTime` in the name is already added to the nameContractBytecode in the constructor.\n    bytes nameBytecode = 0x20 + registryInputCategory + bytes(nameLength + tld.length) + name + tld + nameContractBytecode;\n    bytes32 scriptHash = hash256(nameBytecode);\n    bytes35 nameLockingBytecode = new LockingBytecodeP2SH32(scriptHash);\n    \n    // ExternalAuthNFT goes to the name contract\n    require(tx.outputs[3].lockingBytecode == nameLockingBytecode, \"Output 3: external auth NFT locking bytecode must match name contract\");\n    // InternalAuthNFT goes to the name contract\n    require(tx.outputs[4].lockingBytecode == nameLockingBytecode, \"Output 4: internal auth NFT locking bytecode must match name contract\");\n    \n    // ExternalAuthNFT does not have any commitment\n    require(tx.outputs[3].nftCommitment == 0x, \"Output 3: external auth NFT must have empty commitment\");\n    // Strict value check\n    require(tx.outputs[3].value == 1000, \"Output 3: external auth NFT satoshi value must be 1000\");\n\n    // InternalAuthNFT has registrationID as the commitment so it can be used to authenticate\n    // along with the ownershipNFT\n    bytes8 registrationId = bytes8(tx.inputs[3].tokenAmount);\n    require(tx.outputs[4].nftCommitment == registrationId, \"Output 4: internal auth NFT commitment must match registration ID\");\n    // Strict value check\n    require(tx.outputs[4].value == 1000, \"Output 4: internal auth NFT satoshi value must be 1000\");\n\n    // Send the name ownership NFT to the bidder\n    require(tx.outputs[5].nftCommitment == registrationId + name, \"Output 5: name ownership NFT commitment must match registration ID + name\");\n    require(tx.outputs[5].lockingBytecode == new LockingBytecodeP2PKH(bidderPKH), \"Output 5: name ownership NFT locking bytecode must match bidder PKH\");\n    require(tx.outputs[5].value == 1000, \"Output 5: name ownership NFT satoshi value must be 1000\");\n\n    // tokenAmount from the auctionNFT goes to the authorizedThreadNFT to be accumulated later\n    // and merged back with the CounterNFT using the `Accumulator` Contract\n    require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[3].tokenAmount, \"Output 0: token amount must equal input 0 + input 3 amounts (accumulation)\");\n\n    // Dual Decay mechanism, creator incentive decays linearly with the step.\n    // 1. Decay points (0.001% per step)\n    int decayPoints = tx.inputs[3].tokenAmount;\n    // 2. Get creator incentive points\n    int creatorIncentivePoints = tx.inputs[3].tokenAmount * 1e5;\n    // 3. Subtract creator incentive points by decay points to get the current creator incentive.\n    int creatorIncentive = (creatorIncentivePoints - decayPoints) / 1e5;\n\n    // If incentive is > 20000 satoshis, then it goes to the creator, else it goes to the miners.\n    if(creatorIncentive > 20000) {\n      require(tx.outputs[6].tokenCategory == 0x, \"Output 6: creator incentive must be pure BCH (no token category)\");\n      // Enforce that the other piece of the fee goes to the miners.\n      require(tx.outputs[6].value == creatorIncentive, \"Output 6: creator incentive satoshi value must match calculated incentive\");\n      require(tx.outputs[6].lockingBytecode == new LockingBytecodeP2PKH(creatorIncentivePKH), \"Output 6: creator incentive locking bytecode must match creator PKH\");\n    }\n  }\n\n}",
	'debug': {
		'bytecode': 'c3549dc457a169c0519dc0c7c0cd88c0d10088c0c6c0cc9d00c752c7788853c7788852cd8800ce53d1788854d1788855d1788852ce01207f7c527988528852ce52d18853ce01207f7c527988518852d2008852cf008852d352d09d52d3009d52cc52c69d53cb537a9d53cf01147f7682770120547a7e7c56798277937e787e557a7e537a7eaa02aa207c7e01877e53cd788854cd8853d2008853cc02e8039d53d0588054d2788854cc02e8039d55d27c7b7e8855cd0376a9147b7e0288ac7e8855cc02e8039d00d300d053d0939d53d053d003a08601957c9403a08601967602204ea06356d1008856cc789d56cd0376a91453797e0288ac7e88686d51',
		'sourceMap': '41:12:41:28;:32::33;:4::78:1;42:12:42:29:0;:33::34;:12:::1;:4::80;45:12:45:33:0;:37::38;:4::96:1;46:22:46:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;48:23:48:44:0;:12::59:1;:63::65:0;:4::129:1;50:22:50:43:0;:12::50:1;:65::86:0;:54::93:1;:4::141;56:51:56:52:0;:41::69:1;57:22:57:23:0;:12::40:1;:44::72:0;:4::169:1;58:22:58:23:0;:12::40:1;:44::72:0;:4::164:1;59:23:59:24:0;:12::41:1;:4::171;62:44:62:45:0;:34::60:1;63:23:63:24:0;:12::39:1;:43::64:0;:4::139:1;64:23:64:24:0;:12::39:1;:43::64:0;:4::139:1;65:23:65:24:0;:12::39:1;:43::64:0;:4::140:1;68:71:68:72:0;:61::87:1;:94::96:0;:61::97:1;69:12:69:31:0;:35::56;;:4::129:1;71:37:71:41:0;:4::106:1;73:22:73:23:0;:12::38:1;:53::54:0;:42::69:1;:4::135;76:63:76:64:0;:53::79:1;:86::88:0;:53::89:1;77:12:77:27:0;:31::52;;:4::120:1;79:33:79:37:0;:4::97:1;82:23:82:24:0;:12::39:1;:43::45:0;:4::104:1;83:22:83:23:0;:12::38:1;:42::44:0;:4::102:1;86:23:86:24:0;:12::37:1;:51::52:0;:41::65:1;:4::129;87:23:87:24:0;:12::37:1;:41::42:0;:4::97:1;90:23:90:24:0;:12::31:1;:45::46:0;:35::53:1;:4::118;94:22:94:23:0;:12::39:1;:43::54:0;;:4::125:1;97:46:97:47:0;:36::62:1;:69::71:0;:36::72:1;100:21:100:25:0;:::32:1;;103:25:103:29:0;:32::53;;:25:::1;:62::72:0;:75::78;;:::85:1;;:62;:25::86;:89::93:0;:25:::1;:96::99:0;;:25:::1;:102::122:0;;:25:::1;104::104:46;105:34:105:71:0;:60::70;:34::71:1;;;108:23:108:24:0;:12::41:1;:45::64:0;:4::139:1;110:23:110:24:0;:12::41:1;:4::139;113:23:113:24:0;:12::39:1;:43::45:0;:4::105:1;115:23:115:24:0;:12::31:1;:35::39:0;:4::99:1;119:45:119:46:0;:35::59:1;:28::60;;120:23:120:24:0;:12::39:1;:43::57:0;:4::128:1;122:23:122:24:0;:12::31:1;:35::39:0;:4::99:1;125:23:125:24:0;:12::39:1;:43::57:0;:60::64;:43:::1;:4::143;126:23:126:24:0;:12::41:1;:45::80:0;:70::79;:45::80:1;;;:4::153;127:23:127:24:0;:12::31:1;:35::39:0;:4::100:1;131:23:131:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::172;135:32:135:33:0;:22::46:1;137:43:137:44:0;:33::57:1;:60::63:0;:33:::1;139:53:139:64:0;:28:::1;:68::71:0;:27:::1;142:7:142:23:0;:26::31;:7:::1;:33:147:5:0;143:25:143:26;:14::41:1;:45::47:0;:6::117:1;145:25:145:26:0;:14::33:1;:37::53:0;:6::132:1;146:25:146:26:0;:14::43:1;:47::92:0;:72::91;;:47::92:1;;;:6::165;142:33:147:5;40:2:148:3;',
		'logs': [],
		'requires': [
			{
				'ip': 6,
				'line': 41,
				'message': 'Transaction: must have exactly 4 inputs',
			},
			{
				'ip': 10,
				'line': 42,
				'message': 'Transaction: must have at most 7 outputs',
			},
			{
				'ip': 13,
				'line': 45,
				'message': 'Input 1: factory contract UTXO must be at this index',
			},
			{
				'ip': 18,
				'line': 46,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 22,
				'line': 48,
				'message': 'Output 1: must not have any token category (pure BCH only)',
			},
			{
				'ip': 27,
				'line': 50,
				'message': 'Input 1: satoshi value must match output 1',
			},
			{
				'ip': 33,
				'line': 57,
				'message': "Input 2: name minting NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 37,
				'line': 58,
				'message': "Input 3: auction NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 40,
				'line': 59,
				'message': "Output 2: name minting NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 46,
				'line': 63,
				'message': 'Output 3: external auth NFT token category prefix must match registry',
			},
			{
				'ip': 50,
				'line': 64,
				'message': 'Output 4: internal auth NFT token category prefix must match registry',
			},
			{
				'ip': 54,
				'line': 65,
				'message': 'Output 5: name ownership NFT token category prefix must match registry',
			},
			{
				'ip': 62,
				'line': 69,
				'message': 'Input 2: name minting NFT token category prefix must match registry',
			},
			{
				'ip': 64,
				'line': 71,
				'message': 'Input 2: name minting NFT capability must be minting (0x02)',
			},
			{
				'ip': 69,
				'line': 73,
				'message': 'Output 2: name minting NFT token category must match input 2',
			},
			{
				'ip': 77,
				'line': 77,
				'message': 'Input 3: auction NFT token category prefix must match registry',
			},
			{
				'ip': 79,
				'line': 79,
				'message': 'Input 3: auction NFT capability must be mutable (0x01)',
			},
			{
				'ip': 83,
				'line': 82,
				'message': 'Output 2: name minting NFT must have empty commitment',
			},
			{
				'ip': 87,
				'line': 83,
				'message': 'Input 2: name minting NFT must have empty commitment',
			},
			{
				'ip': 92,
				'line': 86,
				'message': 'Output 2: name minting NFT token amount must match input 2',
			},
			{
				'ip': 96,
				'line': 87,
				'message': 'Output 2: name minting NFT token amount must be 0',
			},
			{
				'ip': 101,
				'line': 90,
				'message': 'Output 2: name minting NFT satoshi value must match input 2',
			},
			{
				'ip': 106,
				'line': 94,
				'message': 'Input 3: auction NFT sequence number must equal minimum wait time',
			},
			{
				'ip': 142,
				'line': 108,
				'message': 'Output 3: external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 145,
				'line': 110,
				'message': 'Output 4: internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 149,
				'line': 113,
				'message': 'Output 3: external auth NFT must have empty commitment',
			},
			{
				'ip': 153,
				'line': 115,
				'message': 'Output 3: external auth NFT satoshi value must be 1000',
			},
			{
				'ip': 161,
				'line': 120,
				'message': 'Output 4: internal auth NFT commitment must match registration ID',
			},
			{
				'ip': 165,
				'line': 122,
				'message': 'Output 4: internal auth NFT satoshi value must be 1000',
			},
			{
				'ip': 171,
				'line': 125,
				'message': 'Output 5: name ownership NFT commitment must match registration ID + name',
			},
			{
				'ip': 179,
				'line': 126,
				'message': 'Output 5: name ownership NFT locking bytecode must match bidder PKH',
			},
			{
				'ip': 183,
				'line': 127,
				'message': 'Output 5: name ownership NFT satoshi value must be 1000',
			},
			{
				'ip': 191,
				'line': 131,
				'message': 'Output 0: token amount must equal input 0 + input 3 amounts (accumulation)',
			},
			{
				'ip': 209,
				'line': 143,
				'message': 'Output 6: creator incentive must be pure BCH (no token category)',
			},
			{
				'ip': 213,
				'line': 145,
				'message': 'Output 6: creator incentive satoshi value must match calculated incentive',
			},
			{
				'ip': 222,
				'line': 146,
				'message': 'Output 6: creator incentive locking bytecode must match creator PKH',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-08-06T02:48:16.286Z',
};
