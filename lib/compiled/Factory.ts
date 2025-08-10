export default {
	'contractName': 'Factory',
	'constructorInputs': [
		{
			'name': 'nameContractBytecode',
			'type': 'bytes',
		},
		{
			'name': 'creatorIncentivePKH',
			'type': 'bytes20',
		},
	],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_4 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_7 OP_LESSTHANOREQUAL OP_VERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_INPUTINDEX OP_UTXOVALUE OP_INPUTINDEX OP_OUTPUTVALUE OP_NUMEQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_5 OP_OUTPUTTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY OP_2 OP_OUTPUTTOKENCATEGORY OP_EQUALVERIFY OP_3 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_2 OP_PICK OP_EQUALVERIFY OP_1 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_NUMEQUALVERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_0 OP_NUMEQUALVERIFY OP_2 OP_OUTPUTVALUE OP_2 OP_UTXOVALUE OP_NUMEQUALVERIFY OP_3 OP_INPUTSEQUENCENUMBER 020040 OP_NUMEQUALVERIFY OP_3 OP_UTXOTOKENCOMMITMENT 14 OP_SPLIT OP_DUP OP_SIZE OP_NIP 2e626368 20 OP_5 OP_ROLL OP_CAT OP_OVER OP_SIZE OP_NIP OP_CAT OP_SWAP OP_CAT OP_SWAP OP_CAT OP_OVER OP_CAT OP_3 OP_ROLL OP_CAT OP_HASH256 aa20 OP_SWAP OP_CAT 87 OP_CAT OP_3 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_4 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_EQUALVERIFY OP_3 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_4 OP_OUTPUTTOKENCOMMITMENT OP_BIN2NUM OP_3 OP_UTXOTOKENAMOUNT OP_NUMEQUALVERIFY OP_4 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_5 OP_OUTPUTTOKENCOMMITMENT OP_4 OP_OUTPUTTOKENCOMMITMENT OP_ROT OP_CAT OP_EQUALVERIFY OP_5 OP_OUTPUTBYTECODE 76a914 OP_ROT OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_5 OP_OUTPUTVALUE e803 OP_NUMEQUALVERIFY OP_0 OP_OUTPUTTOKENAMOUNT OP_0 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_3 OP_UTXOVALUE 8813 OP_SUB a08601 OP_3 OP_UTXOTOKENAMOUNT OP_SUB OP_MUL a08601 OP_DIV OP_DUP 204e OP_GREATERTHAN OP_IF OP_6 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_6 OP_OUTPUTVALUE OP_OVER OP_NUMEQUALVERIFY OP_6 OP_OUTPUTBYTECODE 76a914 OP_3 OP_PICK OP_CAT 88ac OP_CAT OP_EQUALVERIFY OP_ENDIF OP_2DROP OP_1',
	'source': "pragma cashscript 0.11.4;\n\n/**\n * @param nameContractBytecode - Partial bytecode of the name contract\n * @param creatorIncentivePKH - PKH of the creator incentive\n */\ncontract Factory(\n  bytes nameContractBytecode,\n  bytes20 creatorIncentivePKH,\n) {\n  /**\n   * This function finalizes a name registration auction by:\n   * - Verifying the auction has ended and the winner's bid is valid\n   * - Issuing an immutable externalAuthNFT to the Name Contract\n   * - Issuing an immutable internalAuthNFT to the Name Contract\n   * - Issuing an immutable name NFT to the auction winner\n   * - Distributing auction fees between the platform and miners\n   * - Burning the auctionNFT\n   *\n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: NameMintingNFT from the Registry Contract\n   * - Input3: auctionNFT from the Registry Contract\n   *\n   * @outputs\n   * - Output0: Registry Contract's authorizedThreadNFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change\n   * - Output2: NameMintingNFT back to the Registry contract\n   * - Output3: External Auth NFT to the name contract\n   * - Output4: Internal Auth NFT to the name contract\n   * - Output5: Name NFT to the auction winner\n   * - Output6: Platform fee [Reduces and the not included]\n   *\n   */\n  function call(){\n    require(tx.inputs.length == 4, \"Transaction: must have exactly 4 inputs\");\n    require(tx.outputs.length <= 7, \"Transaction: must have at most 7 outputs\");\n\n    // This contract can only be used at input1 and it should return to itself.\n    require(this.activeInputIndex == 1, \"Input 1: factory contract UTXO must be at this index\");\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode, \"Input 1: locking bytecode must match output 1\");\n    // Ensure that no tokenCategory is minted here.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x, \"Output 1: must not have any token category (pure BCH only)\");\n    // Strict value checks to ensure the platform and miner get fee.\n    require(tx.inputs[this.activeInputIndex].value == tx.outputs[this.activeInputIndex].value, \"Input 1: satoshi value must match output 1\");\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: name minting NFT locking bytecode does not match registry input's locking bytecode\");\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode, \"Input 3: auction NFT locking bytecode does not match registry input's locking bytecode\");\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, \"Output 2: name minting NFT locking bytecode does not match registry input's locking bytecode\");\n\n    // All the token categories in the transaction should be the same.\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    require(tx.outputs[3].tokenCategory == registryInputCategory, \"Output 3: external auth NFT token category prefix must match registry\");\n    require(tx.outputs[4].tokenCategory == registryInputCategory, \"Output 4: internal auth NFT token category prefix must match registry\");\n    require(tx.outputs[5].tokenCategory == registryInputCategory, \"Output 5: name ownership NFT token category prefix must match registry\");\n\n    // NameMintingNFT should be minting and of the 'nameCategory' i.e registryInputCategory\n    bytes nameMintingCategory, bytes nameMintingCapability = tx.inputs[2].tokenCategory.split(32);\n    require(nameMintingCategory == registryInputCategory, \"Input 2: name minting NFT token category prefix must match registry\");\n    // Minting\n    require(nameMintingCapability == 0x02, \"Input 2: name minting NFT capability must be minting (0x02)\");\n    // NameMintingNFT should keep the same category and capability\n    require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory, \"Output 2: name minting NFT token category must match input 2\");\n\n    // AuctionNFT should be mutable and of the 'nameCategory' i.e registryInputCategory\n    bytes auctionCategory, bytes auctionCapability = tx.inputs[3].tokenCategory.split(32);\n    require(auctionCategory == registryInputCategory, \"Input 3: auction NFT token category prefix must match registry\");\n    // Mutable\n    require(auctionCapability == 0x01, \"Input 3: auction NFT capability must be mutable (0x01)\");\n\n    // NameMintingNFT has no nftCommitment\n    require(tx.outputs[2].nftCommitment == 0x, \"Output 2: name minting NFT must have empty commitment\");\n    require(tx.inputs[2].nftCommitment == 0x, \"Input 2: name minting NFT must have empty commitment\");\n\n    // NameMintingNFT has no tokenAmount\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount, \"Output 2: name minting NFT token amount must match input 2\");\n    require(tx.outputs[2].tokenAmount == 0, \"Output 2: name minting NFT token amount must be 0\");\n\n    // Strict value check\n    require(tx.outputs[2].value == tx.inputs[2].value, \"Output 2: name minting NFT satoshi value must match input 2\");\n\n    // Enforcing the relative timelock, the auctionNFT must be atleast 4194306 old\n    // to be considered ended.\n    // 4194306 is sequence number in time, 2*512 seconds\n\n    // TODO: Make this 3 hours\n    require(tx.inputs[3].sequenceNumber == 4194306, \"Input 3: auction NFT sequence number must equal 4194306\");\n\n    // Extract the PKH and name from the auctionNFT\n    bytes20 bidderPKH, bytes name = tx.inputs[3].nftCommitment.split(20);\n    \n    // Get the name length to generate the complete bytecode of the name contract\n    int nameLength = name.length;\n    // category + name + bytecode.\n    // Note: `inactivityExpiryTime` in the name is already added to the nameContractBytecode in the constructor.\n    bytes constant tld = bytes('.bch');\n    bytes nameBytecode = 0x20 + registryInputCategory + bytes(tld.length) + tld + bytes(nameLength) + name + nameContractBytecode;\n    bytes32 scriptHash = hash256(nameBytecode);\n    bytes35 nameLockingBytecode = new LockingBytecodeP2SH32(scriptHash);\n    \n    // ExternalAuthNFT goes to the name contract\n    require(tx.outputs[3].lockingBytecode == nameLockingBytecode, \"Output 3: external auth NFT locking bytecode must match name contract\");\n    // InternalAuthNFT goes to the name contract\n    require(tx.outputs[4].lockingBytecode == nameLockingBytecode, \"Output 4: internal auth NFT locking bytecode must match name contract\");\n    \n    // ExternalAuthNFT does not have any commitment\n    require(tx.outputs[3].nftCommitment == 0x, \"Output 3: external auth NFT must have empty commitment\");\n    // Strict value check\n    require(tx.outputs[3].value == 1000, \"Output 3: external auth NFT satoshi value must be 1000\");\n\n    // InternalAuthNFT has registrationID as the commitment so it can be used to authenticate\n    // along with the ownershipNFT\n    int registrationId = int(tx.outputs[4].nftCommitment);\n    require(tx.inputs[3].tokenAmount == registrationId, \"Output 4: internal auth NFT commitment must match registration ID\");\n    // Strict value check\n    require(tx.outputs[4].value == 1000, \"Output 4: internal auth NFT satoshi value must be 1000\");\n\n    // Send the name ownership NFT to the bidder\n    require(tx.outputs[5].nftCommitment == tx.outputs[4].nftCommitment + name, \"Output 5: name ownership NFT commitment must match registration ID + name\");\n    require(tx.outputs[5].lockingBytecode == new LockingBytecodeP2PKH(bidderPKH), \"Output 5: name ownership NFT locking bytecode must match bidder PKH\");\n    require(tx.outputs[5].value == 1000, \"Output 5: name ownership NFT satoshi value must be 1000\");\n\n    // tokenAmount from the auctionNFT goes to the authorizedThreadNFT to be accumulated later\n    // and merged back with the CounterNFT using the `Accumulator` Contract\n    require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[3].tokenAmount, \"Output 0: token amount must equal input 0 + input 3 amounts (accumulation)\");\n\n    // Dual Decay mechanism, creator incentive decays linearly with the step.\n\n    // Initial minimal fee is 5000; 1000 * 3 (nft outputs) + 2000 Miner Fee\n    int minimalDeduction = tx.inputs[3].value - 5000;\n    int creatorIncentive = (minimalDeduction * (1e5 - tx.inputs[3].tokenAmount) / 1e5);\n\n    // If incentive is > 20000 satoshis, then it goes to the creator, else it goes to the miners.\n    if(creatorIncentive > 20000) {\n      require(tx.outputs[6].tokenCategory == 0x, \"Output 6: creator incentive must be pure BCH (no token category)\");\n      // Enforce that the other piece of the fee goes to the miners.\n      require(tx.outputs[6].value == creatorIncentive, \"Output 6: creator incentive satoshi value must match calculated incentive\");\n      require(tx.outputs[6].lockingBytecode == new LockingBytecodeP2PKH(creatorIncentivePKH), \"Output 6: creator incentive locking bytecode must match creator PKH\");\n    }\n  }\n\n}",
	'debug': {
		'bytecode': 'c3549dc457a169c0519dc0c7c0cd88c0d10088c0c6c0cc9d00c752c7788853c7788852cd8800ce53d1788854d1788855d1788852ce01207f7c527988528852ce52d18853ce01207f7c527988518852d2008852cf008852d352d09d52d3009d52cc52c69d53cb030200409d53cf01147f768277042e6263680120557a7e7882777e7c7e7c7e787e537a7eaa02aa207c7e01877e53cd788854cd8853d2008853cc02e8039d54d28153d09d54cc02e8039d55d254d27b7e8855cd0376a9147b7e0288ac7e8855cc02e8039d00d300d053d0939d53c60288139403a0860153d0949503a08601967602204ea06356d1008856cc789d56cd0376a91453797e0288ac7e88686d51',
		'sourceMap': '37:12:37:28;:32::33;:4::78:1;38:12:38:29:0;:33::34;:12:::1;:4::80;41:12:41:33:0;:37::38;:4::96:1;42:22:42:43:0;:12::60:1;:75::96:0;:64::113:1;:4::164;44:23:44:44:0;:12::59:1;:63::65:0;:4::129:1;46:22:46:43:0;:12::50:1;:65::86:0;:54::93:1;:4::141;52:51:52:52:0;:41::69:1;53:22:53:23:0;:12::40:1;:44::72:0;:4::169:1;54:22:54:23:0;:12::40:1;:44::72:0;:4::164:1;55:23:55:24:0;:12::41:1;:4::171;58:44:58:45:0;:34::60:1;59:23:59:24:0;:12::39:1;:43::64:0;:4::139:1;60:23:60:24:0;:12::39:1;:43::64:0;:4::139:1;61:23:61:24:0;:12::39:1;:43::64:0;:4::140:1;64:71:64:72:0;:61::87:1;:94::96:0;:61::97:1;65:12:65:31:0;:35::56;;:4::129:1;67:37:67:41:0;:4::106:1;69:22:69:23:0;:12::38:1;:53::54:0;:42::69:1;:4::135;72:63:72:64:0;:53::79:1;:86::88:0;:53::89:1;73:12:73:27:0;:31::52;;:4::120:1;75:33:75:37:0;:4::97:1;78:23:78:24:0;:12::39:1;:43::45:0;:4::104:1;79:22:79:23:0;:12::38:1;:42::44:0;:4::102:1;82:23:82:24:0;:12::37:1;:51::52:0;:41::65:1;:4::129;83:23:83:24:0;:12::37:1;:41::42:0;:4::97:1;86:23:86:24:0;:12::31:1;:45::46:0;:35::53:1;:4::118;93:22:93:23:0;:12::39:1;:43::50:0;:4::111:1;96:46:96:47:0;:36::62:1;:69::71:0;:36::72:1;99:21:99:25:0;:::32:1;;102:31:102:37:0;103:25:103:29;:32::53;;:25:::1;:62::65:0;:::72:1;;:25::73;:76::79:0;:25:::1;:88::98:0;:25::99:1;:102::106:0;:25:::1;:109::129:0;;:25:::1;104::104:46;105:34:105:71:0;:60::70;:34::71:1;;;108:23:108:24:0;:12::41:1;:45::64:0;:4::139:1;110:23:110:24:0;:12::41:1;:4::139;113:23:113:24:0;:12::39:1;:43::45:0;:4::105:1;115:23:115:24:0;:12::31:1;:35::39:0;:4::99:1;119:40:119:41:0;:29::56:1;:25::57;120:22:120:23:0;:12::36:1;:4::125;122:23:122:24:0;:12::31:1;:35::39:0;:4::99:1;125:23:125:24:0;:12::39:1;:54::55:0;:43::70:1;:73::77:0;:43:::1;:4::156;126:23:126:24:0;:12::41:1;:45::80:0;:70::79;:45::80:1;;;:4::153;127:23:127:24:0;:12::31:1;:35::39:0;:4::100:1;131:23:131:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::172;136:37:136:38:0;:27::45:1;:48::52:0;:27:::1;137:48:137:51:0;:64::65;:54::78:1;:48;:28::79;:82::85:0;:28:::1;140:7:140:23:0;:26::31;:7:::1;:33:145:5:0;141:25:141:26;:14::41:1;:45::47:0;:6::117:1;143:25:143:26:0;:14::33:1;:37::53:0;:6::132:1;144:25:144:26:0;:14::43:1;:47::92:0;:72::91;;:47::92:1;;;:6::165;140:33:145:5;36:2:146:3;',
		'logs': [],
		'requires': [
			{
				'ip': 4,
				'line': 37,
				'message': 'Transaction: must have exactly 4 inputs',
			},
			{
				'ip': 8,
				'line': 38,
				'message': 'Transaction: must have at most 7 outputs',
			},
			{
				'ip': 11,
				'line': 41,
				'message': 'Input 1: factory contract UTXO must be at this index',
			},
			{
				'ip': 16,
				'line': 42,
				'message': 'Input 1: locking bytecode must match output 1',
			},
			{
				'ip': 20,
				'line': 44,
				'message': 'Output 1: must not have any token category (pure BCH only)',
			},
			{
				'ip': 25,
				'line': 46,
				'message': 'Input 1: satoshi value must match output 1',
			},
			{
				'ip': 31,
				'line': 53,
				'message': "Input 2: name minting NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 35,
				'line': 54,
				'message': "Input 3: auction NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 38,
				'line': 55,
				'message': "Output 2: name minting NFT locking bytecode does not match registry input's locking bytecode",
			},
			{
				'ip': 44,
				'line': 59,
				'message': 'Output 3: external auth NFT token category prefix must match registry',
			},
			{
				'ip': 48,
				'line': 60,
				'message': 'Output 4: internal auth NFT token category prefix must match registry',
			},
			{
				'ip': 52,
				'line': 61,
				'message': 'Output 5: name ownership NFT token category prefix must match registry',
			},
			{
				'ip': 60,
				'line': 65,
				'message': 'Input 2: name minting NFT token category prefix must match registry',
			},
			{
				'ip': 62,
				'line': 67,
				'message': 'Input 2: name minting NFT capability must be minting (0x02)',
			},
			{
				'ip': 67,
				'line': 69,
				'message': 'Output 2: name minting NFT token category must match input 2',
			},
			{
				'ip': 75,
				'line': 73,
				'message': 'Input 3: auction NFT token category prefix must match registry',
			},
			{
				'ip': 77,
				'line': 75,
				'message': 'Input 3: auction NFT capability must be mutable (0x01)',
			},
			{
				'ip': 81,
				'line': 78,
				'message': 'Output 2: name minting NFT must have empty commitment',
			},
			{
				'ip': 85,
				'line': 79,
				'message': 'Input 2: name minting NFT must have empty commitment',
			},
			{
				'ip': 90,
				'line': 82,
				'message': 'Output 2: name minting NFT token amount must match input 2',
			},
			{
				'ip': 94,
				'line': 83,
				'message': 'Output 2: name minting NFT token amount must be 0',
			},
			{
				'ip': 99,
				'line': 86,
				'message': 'Output 2: name minting NFT satoshi value must match input 2',
			},
			{
				'ip': 103,
				'line': 93,
				'message': 'Input 3: auction NFT sequence number must equal 4194306',
			},
			{
				'ip': 138,
				'line': 108,
				'message': 'Output 3: external auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 141,
				'line': 110,
				'message': 'Output 4: internal auth NFT locking bytecode must match name contract',
			},
			{
				'ip': 145,
				'line': 113,
				'message': 'Output 3: external auth NFT must have empty commitment',
			},
			{
				'ip': 149,
				'line': 115,
				'message': 'Output 3: external auth NFT satoshi value must be 1000',
			},
			{
				'ip': 155,
				'line': 120,
				'message': 'Output 4: internal auth NFT commitment must match registration ID',
			},
			{
				'ip': 159,
				'line': 122,
				'message': 'Output 4: internal auth NFT satoshi value must be 1000',
			},
			{
				'ip': 166,
				'line': 125,
				'message': 'Output 5: name ownership NFT commitment must match registration ID + name',
			},
			{
				'ip': 174,
				'line': 126,
				'message': 'Output 5: name ownership NFT locking bytecode must match bidder PKH',
			},
			{
				'ip': 178,
				'line': 127,
				'message': 'Output 5: name ownership NFT satoshi value must be 1000',
			},
			{
				'ip': 186,
				'line': 131,
				'message': 'Output 0: token amount must equal input 0 + input 3 amounts (accumulation)',
			},
			{
				'ip': 205,
				'line': 141,
				'message': 'Output 6: creator incentive must be pure BCH (no token category)',
			},
			{
				'ip': 209,
				'line': 143,
				'message': 'Output 6: creator incentive satoshi value must match calculated incentive',
			},
			{
				'ip': 218,
				'line': 144,
				'message': 'Output 6: creator incentive locking bytecode must match creator PKH',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.4',
	},
	'updatedAt': '2025-08-10T17:47:19.846Z',
};
