export default {
	'contractName': 'Accumulator',
	'constructorInputs': [],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXINPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_TXOUTPUTCOUNT OP_5 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_1 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_INPUTINDEX OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_INPUTINDEX OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_0 OP_UTXOBYTECODE OP_2 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_2 OP_OUTPUTBYTECODE OP_OVER OP_EQUALVERIFY OP_3 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_2 OP_OUTPUTTOKENCATEGORY OP_2 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_3 OP_OUTPUTTOKENCATEGORY OP_3 OP_UTXOTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_3 OP_UTXOTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_2 OP_UTXOTOKENCATEGORY 20 OP_SPLIT OP_SWAP OP_ROT OP_EQUALVERIFY OP_2 OP_EQUALVERIFY OP_3 OP_UTXOTOKENCOMMITMENT OP_SIZE OP_NIP 23 OP_NUMEQUALVERIFY OP_2 OP_UTXOTOKENCOMMITMENT OP_0 OP_EQUAL OP_NOT OP_VERIFY OP_2 OP_UTXOTOKENAMOUNT OP_0 OP_GREATERTHAN OP_VERIFY OP_2 OP_OUTPUTTOKENAMOUNT OP_2 OP_UTXOTOKENAMOUNT OP_3 OP_UTXOTOKENAMOUNT OP_ADD OP_NUMEQUALVERIFY OP_4 OP_UTXOTOKENCATEGORY OP_0 OP_EQUALVERIFY OP_4 OP_OUTPUTTOKENCATEGORY OP_0 OP_EQUAL',
	'source': "pragma cashscript 0.11.3;\n\ncontract Accumulator() {\n  /**\n   * Once enough auctions have happened, there will come a time when the counterNFT's tokenAmount is not enough.\n   * Since the amount would be accumulating in the thread NFTs, this function can be used to transfer them back to the\n   * Counter NFT to keep the system functioning smoothly.\n   * \n   * @inputs\n   * - Input0: Registry Contract's authorizedThreadNFT i.e immutable NFT with commitment that has the lockingBytecode of this contract\n   * - Input1: Any input from this contract\n   * - Input2: Minting CounterNFT + tokenAmount from Registry Contract\n   * - Input3: authorizedThreadNFT with tokenAmount from Registry Contract\n   * - Input4: Pure BCH\n   * \n   * @outputs\n   * - Output0: Registry Contract's thread NFT back to the Registry contract.\n   * - Output1: Input1 back to this contract without any change.\n   * - Output2: Minting CounterNFT back to the Registry contract + tokenAmount\n   * - Output3: authorizedThreadNFT without tokenAmount back to the Registry contract\n   * - Output4: Change BCH\n   */\n  function call(){\n    require(tx.inputs.length == 5);\n    require(tx.outputs.length == 5);\n\n    // This contract can only be used at input1 and it should return the input1 back to itself.\n    require(this.activeInputIndex == 1);\n    require(tx.inputs[this.activeInputIndex].lockingBytecode == tx.outputs[this.activeInputIndex].lockingBytecode);\n    // Restriction on output category is important as minting NFT is used in this transaction.\n    require(tx.outputs[this.activeInputIndex].tokenCategory == 0x);\n\n    // This contract can only be used with the 'lockingbytecode' used in the 0th input.\n    // Note: This contract can be used with any contract that fulfills these conditions, and that is fine\n    // because those contracts will not be manipulating the utxos of the Registry contract. Instead, they will\n    // be manipulating their own utxos.\n    bytes registryInputLockingBytecode = tx.inputs[0].lockingBytecode;\n    require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode);\n    require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode);\n\n    require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode);\n    require(tx.outputs[3].lockingBytecode == registryInputLockingBytecode);\n\n    require(tx.outputs[2].tokenCategory == tx.inputs[2].tokenCategory);\n    require(tx.outputs[3].tokenCategory == tx.inputs[3].tokenCategory);\n\n    bytes registryInputCategory = tx.inputs[0].tokenCategory;\n    \n    // authorizedThreadNFTs are immutable\n    require(tx.inputs[3].tokenCategory == registryInputCategory);\n    \n    bytes counterCategory, bytes counterCapability = tx.inputs[2].tokenCategory.split(32);\n    require(counterCategory == registryInputCategory);\n     // Minting\n    require(counterCapability == 0x02);\n\n    // Locking bytecode of the authorized contract is 35 bytes long.\n    require(tx.inputs[3].nftCommitment.length == 35);\n\n    // Since the nftCommitment of counterNFT is registrationID so it must not be null\n    // as the NameMintingNFT has no nftCommitment nor tokenAmount\n    require(tx.inputs[2].nftCommitment != 0x);\n    require(tx.inputs[2].tokenAmount > 0); // Ensure that the counter minting NFT is used.\n    require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount + tx.inputs[3].tokenAmount);\n\n    // Pure BCH input and output.\n    require(tx.inputs[4].tokenCategory == 0x);\n    require(tx.outputs[4].tokenCategory == 0x);\n  }\n}",
	'debug': {
		'bytecode': 'c3559dc4559dc0519dc0c7c0cd88c0d1008800c752c7788853c7788852cd788853cd8852d152ce8853d153ce8800ce53ce788852ce01207f7c7b88528853cf827701239d52cf0087916952d000a06952d352d053d0939d54ce008854d10087',
		'sourceMap': '24:12:24:28;:32::33;:4::35:1;25:12:25:29:0;:33::34;:4::36:1;28:12:28:33:0;:37::38;:4::40:1;29:22:29:43:0;:12::60:1;:75::96:0;:64::113:1;:4::115;31:23:31:44:0;:12::59:1;:63::65:0;:4::67:1;37:51:37:52:0;:41::69:1;38:22:38:23:0;:12::40:1;:44::72:0;:4::74:1;39:22:39:23:0;:12::40:1;:44::72:0;:4::74:1;41:23:41:24:0;:12::41:1;:45::73:0;:4::75:1;42:23:42:24:0;:12::41:1;:4::75;44:23:44:24:0;:12::39:1;:53::54:0;:43::69:1;:4::71;45:23:45:24:0;:12::39:1;:53::54:0;:43::69:1;:4::71;47:44:47:45:0;:34::60:1;50:22:50:23:0;:12::38:1;:42::63:0;:4::65:1;52:63:52:64:0;:53::79:1;:86::88:0;:53::89:1;53:12:53:27:0;:31::52;:4::54:1;55:33:55:37:0;:4::39:1;58:22:58:23:0;:12::38:1;:::45;;:49::51:0;:4::53:1;62:22:62:23:0;:12::38:1;:42::44:0;:12:::1;;:4::46;63:22:63:23:0;:12::36:1;:39::40:0;:12:::1;:4::42;64:23:64:24:0;:12::37:1;:51::52:0;:41::65:1;:78::79:0;:68::92:1;:41;:4::94;67:22:67:23:0;:12::38:1;:42::44:0;:4::46:1;68:23:68:24:0;:12::39:1;:43::45:0;:4::47:1',
		'logs': [],
		'requires': [
			{
				'ip': 2,
				'line': 24,
			},
			{
				'ip': 5,
				'line': 25,
			},
			{
				'ip': 8,
				'line': 28,
			},
			{
				'ip': 13,
				'line': 29,
			},
			{
				'ip': 17,
				'line': 31,
			},
			{
				'ip': 23,
				'line': 38,
			},
			{
				'ip': 27,
				'line': 39,
			},
			{
				'ip': 31,
				'line': 41,
			},
			{
				'ip': 34,
				'line': 42,
			},
			{
				'ip': 39,
				'line': 44,
			},
			{
				'ip': 44,
				'line': 45,
			},
			{
				'ip': 50,
				'line': 50,
			},
			{
				'ip': 57,
				'line': 53,
			},
			{
				'ip': 59,
				'line': 55,
			},
			{
				'ip': 65,
				'line': 58,
			},
			{
				'ip': 71,
				'line': 62,
			},
			{
				'ip': 76,
				'line': 63,
			},
			{
				'ip': 84,
				'line': 64,
			},
			{
				'ip': 88,
				'line': 67,
			},
			{
				'ip': 93,
				'line': 68,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.3',
	},
	'updatedAt': '2025-08-01T20:44:08.525Z',
};
