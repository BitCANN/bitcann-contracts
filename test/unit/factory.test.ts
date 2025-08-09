import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, alicePkh, aliceTokenAddress, nameTokenCategory, reversedNameTokenCategory, invalidNameTokenCategory, mockOptions, bobAddress, bobPkh, bobTokenAddress } from '../common.js';
import { getCreatorIncentive, getDomainPartialBytecode, padVmNumber } from '../utils.js';
import artifacts from '../artifacts.js';

describe('Factory', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });
	const testContract = new Contract(artifacts, [], { provider });

	const name = 'test';
	const nameHex = Buffer.from(name).toString('hex');

	// Get the domain partial bytecode for the Factory contract
	const domainPartialBytecode = getDomainPartialBytecode(nameTokenCategory, {
		provider,
		addressType: 'p2sh32',
	});

	const factoryContract = new Contract(BitCANNArtifacts.Factory, [ domainPartialBytecode, alicePkh ], { provider });

	const tldHex = Buffer.from(mockOptions.tld).toString('hex');
	const nameContract = new Contract(BitCANNArtifacts.Name, [ nameHex, tldHex, reversedNameTokenCategory ], { provider });

	let threadNFTUTXO: Utxo;
	let factoryUTXO: Utxo;
	let nameMintingNFTUTXO: Utxo;
	let auctionNFTUTXO: Utxo;
	let transaction: TransactionBuilder;
	let registrationId: number;

	beforeAll(() =>
	{
		// Get the factory contract locking bytecode
		const factoryLockingBytecode = cashAddressToLockingBytecode(factoryContract.address);
		if(typeof factoryLockingBytecode === 'string')
		{
			throw new Error(`Failed to get locking bytecode: ${factoryLockingBytecode}`);
		}

		registrationId = 1;

		// Create thread NFT UTXO
		threadNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: binToHex(factoryLockingBytecode.bytecode),
					capability: 'none',
				},
			},
		};

		// Create factory contract UTXO
		factoryUTXO = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
		};

		// Create name minting NFT UTXO - use the same category as registry input
		nameMintingNFTUTXO = {
			...randomUtxo(),
			token: {
				// Use the same category prefix as registry input
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: '',
					capability: 'minting',
				},
			},
		};

		// Create auction NFT UTXO
		auctionNFTUTXO = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		// Add UTXOs to provider
		provider.addUtxo(registryContract.address, threadNFTUTXO);
		provider.addUtxo(factoryContract.address, factoryUTXO);
		provider.addUtxo(registryContract.address, nameMintingNFTUTXO);
		provider.addUtxo(registryContract.address, auctionNFTUTXO);
	});

	it('should fail with invalid number of inputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 5 inputs instead of 4
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Transaction: must have exactly 4 inputs');
	});

	it('should fail with invalid number of outputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 8 outputs instead of 7 max
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: BigInt(1000),
			})
			.addOutput({
				to: aliceAddress,
				amount: BigInt(1000),
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Transaction: must have at most 7 outputs');
	});

	it('should fail when contract is not used at input index 1', async () =>
	{
		// Construct the transaction using the TransactionBuilder with contract at input 0 instead of 1
		transaction = new TransactionBuilder({ provider })
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 1: factory contract UTXO must be at this index');
	});

	it('should fail when factory output has token category', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 1: must not have any token category (pure BCH only)');
	});

	it('should fail when factory output value does not match input', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis + 1000n,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 1: satoshi value must match output 1');
	});

	it('should fail when name minting NFT locking bytecode does not match registry', async () =>
	{
		// Create name minting NFT with different locking bytecode
		const differentNameMintingNFTUTXO: Utxo = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: '',
					capability: 'minting',
				},
			},
		};

		provider.addUtxo(testContract.address, differentNameMintingNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(differentNameMintingNFTUTXO, testContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: differentNameMintingNFTUTXO.satoshis,
				token: {
					category: differentNameMintingNFTUTXO.token!.category,
					amount: differentNameMintingNFTUTXO.token!.amount,
					nft: {
						capability: differentNameMintingNFTUTXO.token!.nft!.capability,
						commitment: differentNameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: name minting NFT locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail when auction NFT locking bytecode does not match registry', async () =>
	{
		// Create auction NFT with different locking bytecode
		const differentAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(testContract.address, differentAuctionNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(differentAuctionNFTUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + differentAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: auction NFT locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail when name minting NFT output locking bytecode does not match registry', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: testContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: name minting NFT locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail when external auth NFT token category does not match registry', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 3: external auth NFT token category prefix must match registry');
	});

	it('should fail when internal auth NFT token category does not match registry', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 4: internal auth NFT token category prefix must match registry');
	});

	it('should fail when name ownership NFT token category does not match registry', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 5: name ownership NFT token category prefix must match registry');
	});

	it('should fail when name minting NFT token category does not match registry', async () =>
	{
		// Create name minting NFT with invalid category
		const invalidNameMintingNFTUTXO: Utxo = {
			...randomUtxo(),
			token: {
				category: invalidNameTokenCategory + '02',
				amount: BigInt(0),
				nft: {
					commitment: '',
					capability: 'minting',
				},
			},
		};

		provider.addUtxo(registryContract.address, invalidNameMintingNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(invalidNameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: invalidNameMintingNFTUTXO.satoshis,
				token: {
					category: invalidNameMintingNFTUTXO.token!.category,
					amount: invalidNameMintingNFTUTXO.token!.amount,
					nft: {
						capability: invalidNameMintingNFTUTXO.token!.nft!.capability,
						commitment: invalidNameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: name minting NFT token category prefix must match registry');
	});

	it('should fail when name minting NFT capability is not minting', async () =>
	{
		// Create name minting NFT with invalid capability
		const invalidCapabilityNameMintingNFTUTXO: Utxo = {
			...randomUtxo(),
			token: {
				// mutable instead of minting
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: '',
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, invalidCapabilityNameMintingNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(invalidCapabilityNameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: invalidCapabilityNameMintingNFTUTXO.satoshis,
				token: {
					category: invalidCapabilityNameMintingNFTUTXO.token!.category,
					amount: invalidCapabilityNameMintingNFTUTXO.token!.amount,
					nft: {
						capability: invalidCapabilityNameMintingNFTUTXO.token!.nft!.capability,
						commitment: invalidCapabilityNameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: name minting NFT capability must be minting (0x02)');
	});

	it('should fail when name minting NFT output token category does not match input', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: invalidNameTokenCategory + '02',
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: name minting NFT token category must match input 2');
	});

	it('should fail when auction NFT token category does not match registry', async () =>
	{
		// Create auction NFT with invalid category
		const invalidAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: invalidNameTokenCategory + '01',
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, invalidAuctionNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(invalidAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + invalidAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: auction NFT token category prefix must match registry');
	});

	it('should fail when auction NFT capability is not mutable', async () =>
	{
		// Create auction NFT with invalid capability
		const invalidCapabilityAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				// none instead of mutable
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'none',
				},
			},
		};

		provider.addUtxo(registryContract.address, invalidCapabilityAuctionNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(invalidCapabilityAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + invalidCapabilityAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: auction NFT capability must be mutable (0x01)');
	});

	it('should fail when name minting NFT output commitment does not match input', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: Buffer.from('different').toString('hex'),
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: name minting NFT must have empty commitment');
	});

	it('should fail when name minting NFT output has non-empty commitment', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: Buffer.from('notempty').toString('hex'),
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: name minting NFT must have empty commitment');
	});

	it('should fail when name minting NFT output token amount does not match input', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					// different from input
					amount: BigInt(1),
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: name minting NFT token amount must match input 2');
	});

	it('should fail when name minting NFT output token amount is not zero', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount + 1n,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});


		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: name minting NFT token amount must match input 2');
	});

	it('should fail when name minting NFT output value does not match input', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount - 1n,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis - 1n,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});


		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: name minting NFT satoshi value must match input 2');
	});

	it('should fail when thread NFT output token amount does not accumulate correctly', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount - 1n,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});


		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 0: token amount must equal input 0 + input 3 amounts (accumulation)');
	});

	it('should fail when external auth NFT has non-empty commitment', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 3: external auth NFT must have empty commitment');
	});

	it('should fail when external auth NFT value is not 1000', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1100),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 3: external auth NFT satoshi value must be 1000');
	});

	it('should fail when internal auth NFT commitment does not match registration ID', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(2), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 4: internal auth NFT commitment must match registration ID');
	});

	it('should fail when internal auth NFT value is not 1000', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1100),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 4: internal auth NFT satoshi value must be 1000');
	});

	it('should fail when name ownership NFT commitment does not match registration ID + name', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(2), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 5: name ownership NFT commitment must match registration ID + name');
	});

	it('should fail when name ownership NFT value is not 1000', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1100),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 5: name ownership NFT satoshi value must be 1000');
	});

	it('should fail when external auth NFT locking bytecode does not match name contract', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: testContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: bobTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 3: external auth NFT locking bytecode must match name contract');
	});

	it('should fail when internal auth NFT locking bytecode does not match name contract', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: testContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: bobTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 4: internal auth NFT locking bytecode must match name contract');
	});

	it('should fail when name ownership NFT locking bytecode does not match bidder PKH', async () =>
	{

		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: bobTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 5: name ownership NFT locking bytecode must match bidder PKH');
	});

	it('should fail when creator incentive is provided but token category is not pure BCH', async () =>
	{
		// Create auction NFT with high token amount to trigger creator incentive
		const highValueAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, highValueAuctionNFTUTXO);
		const expectedCreatorIncentive = getCreatorIncentive(highValueAuctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(highValueAuctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + highValueAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: expectedCreatorIncentive,
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 6: creator incentive must be pure BCH (no token category)');
	});

	it('should fail when creator incentive value does not match calculated incentive', async () =>
	{
		// Create auction NFT with high token amount to trigger creator incentive
		const highValueAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, highValueAuctionNFTUTXO);
		const expectedCreatorIncentive = getCreatorIncentive(highValueAuctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(highValueAuctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + highValueAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive - BigInt(5),
			});
		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 6: creator incentive satoshi value must match calculated incentive');
	});

	it('should fail when creator incentive locking bytecode does not match creator PKH', async () =>
	{
		// Create auction NFT with high token amount (triggers creator incentive)
		const highValueAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(100000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, highValueAuctionNFTUTXO);
		const expectedCreatorIncentive = getCreatorIncentive(highValueAuctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(highValueAuctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + highValueAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: bobAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 6: creator incentive locking bytecode must match creator PKH');
	});

	it('should successfully finalize auction when all conditions are met', async () =>
	{
		const expectedCreatorIncentive = getCreatorIncentive(auctionNFTUTXO.satoshis, BigInt(registrationId));

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.address,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex,
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});

		const txPromise = transaction.send();

		// This should succeed
		await expect(txPromise).resolves.toBeDefined();
	});

	it('should successfully finalize auction with creator incentive when conditions are met', async () =>
	{
		let auctionPrice = BigInt(700000);
		const rID = BigInt(196858);
		// Create auction NFT with high token amount to trigger creator incentive
		const highValueAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: auctionPrice }),
			token: {
				category: nameTokenCategory,
				amount: rID,
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, highValueAuctionNFTUTXO);
		const expectedCreatorIncentive = getCreatorIncentive(auctionPrice, rID);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(factoryUTXO, factoryContract.unlock.call())
			.addInput(nameMintingNFTUTXO, registryContract.unlock.call())
			.addInput(highValueAuctionNFTUTXO, registryContract.unlock.call(), { sequence: mockOptions.minWaitTime })
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + highValueAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: factoryContract.tokenAddress,
				amount: factoryUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: nameMintingNFTUTXO.satoshis,
				token: {
					category: nameMintingNFTUTXO.token!.category,
					amount: nameMintingNFTUTXO.token!.amount,
					nft: {
						capability: nameMintingNFTUTXO.token!.nft!.capability,
						commitment: nameMintingNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: nameContract.tokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(rID, 8),
						capability: 'none',
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(rID, 8) + nameHex,
						capability: 'none',
					},
				},
			});

		if(expectedCreatorIncentive > BigInt(20000))
		{
			transaction.addOutput({
				to: aliceAddress,
				amount: expectedCreatorIncentive,
			});
		}


		const txPromise = transaction.send();

		// This should succeed
		await expect(txPromise).resolves.toBeDefined();
	});
});