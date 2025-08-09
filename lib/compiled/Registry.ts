export default {
	'contractName': 'Registry',
	'constructorInputs': [
		{
			'name': 'nameCategory',
			'type': 'bytes',
		},
	],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_TXVERSION OP_2 OP_NUMEQUALVERIFY OP_INPUTINDEX OP_UTXOBYTECODE OP_0 OP_UTXOBYTECODE OP_OVER OP_EQUALVERIFY OP_0 OP_OUTPUTBYTECODE OP_EQUALVERIFY OP_0 OP_UTXOTOKENCATEGORY OP_OVER OP_EQUALVERIFY OP_0 OP_OUTPUTTOKENCATEGORY OP_EQUALVERIFY OP_0 OP_OUTPUTVALUE OP_0 OP_UTXOVALUE OP_NUMEQUALVERIFY OP_0 OP_OUTPUTTOKENCOMMITMENT OP_0 OP_UTXOTOKENCOMMITMENT OP_EQUALVERIFY OP_1 OP_UTXOBYTECODE OP_0 OP_UTXOTOKENCOMMITMENT OP_EQUAL',
	'source': 'pragma cashscript 0.11.4;\n\n/**\n  * @param nameCategory - The category of the name NFTs that are authorized to be registered. [In reverse order]\n  *\n  * The Registry has two minting NFTs:\n  * 1. CounterMintingNFT, has tokenAmount and nftCommitment.\n  * 2. NameMintingNFT, does not have any tokenAmount or nftCommitment.\n */\ncontract Registry(bytes nameCategory) {\n  /**\n   * The Registry contract serves as both a source and storage for authorized NFTs.\n   * It holds: RegistrationNFTs, AuctionNFTs, and AuthorizedThreadNFTs\n   *\n   * AuthorizedThreadNFTs are NFTs with immutable capability that share the same category as nameCategory.\n   * These NFTs contain the lockingBytecode of authorized contracts.\n   * Multiple copies of these NFTs enable parallel processing through multiple threads.\n   * \n   * The contract can only be called in conjunction with one of the authorized contracts.\n   *\n   * Imagine that the authorised contracts are just function composition,\n   * those contracts are being used for the code in them and to reduce the transaction size.\n   * This design reduces the transaction size to a minimum while using every OP_CODE required\n   * for a given action. To use the code in these authorized contracts, a random UTXO is used and\n   * sent back to itself to be used again in future.\n   *\n   * All the utxos, except for the NameNFTs (InternalAuth, ExternalAuth and NameOwnershipNFT),\n   * stay with the Registry contract.\n   * \n   * @note Authorized contracts and their thread counts:\n   * - Auction:                       [1 thread] (Single-threaded registration)\n   * - Bid:                           [~x threads]\n   * - NameFactory:                 [~x threads]\n   * - AuctionNameEnforcer:           [~x threads]\n   * - NameOwnershipGuard:          [~x threads]\n   * - AuctionConflictResolver:       [~x threads]\n   * - Accumulator:                   [~x threads]\n   * \n   * @inputs\n   * - Input0: AuthorizedThreadNFT from self\n   * - Input1: Any UTXO from Authorized contract\n   * \n   * @outputs\n   * - Output0: AuthorizedThreadNFT back to self\n   * - Output1: Output back to Authorized contract to be reused again\n   */\n  function call() {\n    // 1. Since the registry contract is static, version check is required to prevent from any vulnerabilities\n    // caused due to future versions.\n    // 2. BitCANN uses relative timelocks, need to enforce version 2.\n    require(tx.version == 2, "Registry: transaction version must be 2 (relative timelocks required)");\n\n    // Registry Contract\n\n    bytes selfLockingBytecode = tx.inputs[this.activeInputIndex].lockingBytecode;\n    // authorizedThreadNFT must stay with the Registry Contract.\n    require(tx.inputs[0].lockingBytecode == selfLockingBytecode, "Input 0: locking bytecode must match registry contract");\n    require(tx.outputs[0].lockingBytecode == selfLockingBytecode, "Output 0: locking bytecode must match registry contract");\n\n    // Immutable NFTs of nameCategory in Registry Contract will always be authorizedThreadNFTs\n    // Mutable NFTs of nameCategory in Registry Contract will always be auctionNFTs\n    // Minting NFTs of nameCategory in Registry Contract will always be counterMintingNFT or NameMintingNFT\n    require(tx.inputs[0].tokenCategory == nameCategory, "Input 0: token category must match name category");\n    require(tx.outputs[0].tokenCategory == nameCategory, "Output 0: token category must match name category");\n    // Keeping the value same to not influence any satoshi movement in authorized contracts\n    require(tx.outputs[0].value == tx.inputs[0].value, "Output 0: satoshi value must match input 0");\n    // The commitment that has the lockingbytecode of the authorized contract should never change.\n    // It is possible that in other contracts a minting NFT of the nameCategory is used, in that case\n    // it becomes possible to change the nft commitment of 0th output.\n    require(tx.outputs[0].nftCommitment == tx.inputs[0].nftCommitment, "Output 0: NFT commitment must match input 0");\n    // Not checking the tokenAmount as it changes.\n\n    // Authorized Contract\n\n    // Expect the NFT commitment that contains the lockingBytecode of the authorized contract.\n    require(tx.inputs[1].lockingBytecode == tx.inputs[0].nftCommitment, "Input 1: locking bytecode must match authorized contract from input 0 NFT commitment");\n    // With these prerequisites met, we just need to make sure that all the contracts that are deployed are written\n    // and initialized properly, and they expect this structure and handle the inputs and outputs as expected.\n  }\n}\n',
	'debug': {
		'bytecode': 'c2529dc0c700c7788800cd8800ce788800d18800cc00c69d00d200cf8851c700cf87',
		'sourceMap': '51:12:51:22;:26::27;:4::102:1;55:42:55:63:0;:32::80:1;57:22:57:23:0;:12::40:1;:44::63:0;:4::123:1;58:23:58:24:0;:12::41:1;:4::125;63:22:63:23:0;:12::38:1;:42::54:0;:4::108:1;64:23:64:24:0;:12::39:1;:4::110;66:23:66:24:0;:12::31:1;:45::46:0;:35::53:1;:4::101;70:23:70:24:0;:12::39:1;:53::54:0;:43::69:1;:4::118;76:22:76:23:0;:12::40:1;:54::55:0;:44::70:1;:4::160',
		'logs': [],
		'requires': [
			{
				'ip': 3,
				'line': 51,
				'message': 'Registry: transaction version must be 2 (relative timelocks required)',
			},
			{
				'ip': 9,
				'line': 57,
				'message': 'Input 0: locking bytecode must match registry contract',
			},
			{
				'ip': 12,
				'line': 58,
				'message': 'Output 0: locking bytecode must match registry contract',
			},
			{
				'ip': 16,
				'line': 63,
				'message': 'Input 0: token category must match name category',
			},
			{
				'ip': 19,
				'line': 64,
				'message': 'Output 0: token category must match name category',
			},
			{
				'ip': 24,
				'line': 66,
				'message': 'Output 0: satoshi value must match input 0',
			},
			{
				'ip': 29,
				'line': 70,
				'message': 'Output 0: NFT commitment must match input 0',
			},
			{
				'ip': 35,
				'line': 76,
				'message': 'Input 1: locking bytecode must match authorized contract from input 0 NFT commitment',
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.4',
	},
	'updatedAt': '2025-08-09T18:36:53.933Z',
};
