import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, aliceTokenAddress, nameTokenCategory, reversedNameTokenCategory } from '../common.js';
import artifacts from '../artifacts.js';

describe('Accumulator', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });

	const accumulatorContract = new Contract(BitCANNArtifacts.Accumulator, [], { provider });
	const testContract = new Contract(artifacts, [], { provider });

	let threadNFTUTXO: Utxo;
	let accumulatorUTXO: Utxo;
	let counterNFTUTXO: Utxo;
	let authorizedThreadNFTUTXO: Utxo;
	let pureBCHUTXO: Utxo;
	let transaction: TransactionBuilder;

	beforeAll(() =>
	{
		// Get the accumulator contract locking bytecode
		const accumulatorLockingBytecode = cashAddressToLockingBytecode(accumulatorContract.address);
		if(typeof accumulatorLockingBytecode === 'string')
		{
			throw new Error(`Failed to get locking bytecode: ${accumulatorLockingBytecode}`);
		}

		// Create thread NFT UTXO
		threadNFTUTXO =
		{
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: binToHex(accumulatorLockingBytecode.bytecode),
					capability: 'none',
				},
			},
		};

		// Create accumulator contract UTXO
		accumulatorUTXO = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
		};

		// Create counter NFT UTXO
		counterNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(10),
				nft: {
					commitment: '0000000000000001',
					capability: 'minting',
				},
			},
		};

		// Create authorized thread NFT UTXO
		authorizedThreadNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(5),
				nft: {
					commitment: binToHex(accumulatorLockingBytecode.bytecode),
					capability: 'none',
				},
			},
		};

		// Create pure BCH UTXO
		pureBCHUTXO = {
			...randomUtxo({ satoshis: BigInt(500000) }),
		};

		// Add UTXOs to provider
		provider.addUtxo(registryContract.address, threadNFTUTXO);
		provider.addUtxo(accumulatorContract.address, accumulatorUTXO);
		provider.addUtxo(registryContract.address, counterNFTUTXO);
		provider.addUtxo(registryContract.address, authorizedThreadNFTUTXO);
		provider.addUtxo(aliceAddress, pureBCHUTXO);
	});

	it('should fail with invalid number of inputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 6 inputs instead of 5
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Transaction: must have exactly 5 inputs');
	});

	it('should fail with invalid number of outputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 6 outputs instead of 5
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: BigInt(1000),
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Transaction: must have exactly 5 outputs');
	});

	it('should fail when accumulator contract is not at input index 1', async () =>
	{
		// Construct the transaction with accumulator contract at wrong index
		// Put it at index 2 instead of index 1, but this will fail at registry validation first
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 1: locking bytecode must match authorized contract from input 0 NFT commitment');
	});

	it('should fail when input 1 locking bytecode does not match output 1', async () =>
	{
		// Create a different contract for output 1
		const differentContract = new Contract(artifacts, [], { provider });

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: differentContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 1: locking bytecode must match output 1');
	});

	it('should fail when output 1 has token category', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 1: must not have any token category (pure BCH only)');
	});

	it('should fail when input 2 locking bytecode does not match registry', async () =>
	{
		// Create a different contract for input 2
		const differentContract = new Contract(artifacts, [], { provider });
		const differentCounterNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(10),
				nft: {
					commitment: '0000000000000001',
					capability: 'minting' as const,
				},
			},
		};
		provider.addUtxo(differentContract.address, differentCounterNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(differentCounterNFTUTXO, differentContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: differentCounterNFTUTXO.satoshis,
				token: {
					category: differentCounterNFTUTXO.token!.category,
					amount: differentCounterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: differentCounterNFTUTXO.token!.nft!.capability,
						commitment: differentCounterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail when input 3 locking bytecode does not match registry', async () =>
	{
		// Create a different contract for input 3
		const differentContract = new Contract(artifacts, [], { provider });
		const accumulatorLockingBytecode = cashAddressToLockingBytecode(accumulatorContract.address);
		if(typeof accumulatorLockingBytecode === 'string')
		{
			throw new Error(`Failed to get locking bytecode: ${accumulatorLockingBytecode}`);
		}
		const differentAuthorizedThreadNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(5),
				nft: {
					commitment: binToHex(accumulatorLockingBytecode.bytecode),
					capability: 'none' as const,
				},
			},
		};
		provider.addUtxo(differentContract.address, differentAuthorizedThreadNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(differentAuthorizedThreadNFTUTXO, differentContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + differentAuthorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: differentAuthorizedThreadNFTUTXO.satoshis,
				token: {
					category: differentAuthorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: differentAuthorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: differentAuthorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail when output 2 locking bytecode does not match registry', async () =>
	{
		// Create a different contract for output 2
		const differentContract = new Contract(artifacts, [], { provider });

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: differentContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail when output 3 locking bytecode does not match registry', async () =>
	{
		// Create a different contract for output 3
		const differentContract = new Contract(artifacts, [], { provider });

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: differentContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 3: locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail when output 2 token category does not match input 2', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				// Different category
				token: {
					category: nameTokenCategory + '03',
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: token category does not match input 2');
	});

	it('should fail when output 3 token category does not match input 3', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				// Different category
				token: {
					category: nameTokenCategory + '01',
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 3: token category does not match input 3');
	});

	it('should fail when input 3 token category does not match registry', async () =>
	{
		// Get the accumulator contract locking bytecode
		const accumulatorLockingBytecode = cashAddressToLockingBytecode(accumulatorContract.address);
		if(typeof accumulatorLockingBytecode === 'string')
		{
			throw new Error(`Failed to get locking bytecode: ${accumulatorLockingBytecode}`);
		}

		// Create authorized thread NFT with different category
		const differentCategoryAuthorizedThreadNFTUTXO = {
			...randomUtxo(),
			token: {
				// Different category
				category: nameTokenCategory + '01',
				amount: BigInt(5),
				nft: {
					commitment: binToHex(accumulatorLockingBytecode.bytecode),
					capability: 'none' as const,
				},
			},
		};
		provider.addUtxo(registryContract.address, differentCategoryAuthorizedThreadNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(differentCategoryAuthorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + differentCategoryAuthorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: differentCategoryAuthorizedThreadNFTUTXO.satoshis,
				token: {
					category: differentCategoryAuthorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: differentCategoryAuthorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: differentCategoryAuthorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: token category does not match registry (immutable NFT check)');
	});

	it('should fail when counter NFT category prefix does not match registry', async () =>
	{
		// Create counter NFT with different category prefix
		const differentCategoryCounterNFTUTXO = {
			...randomUtxo(),
			token: {
				// Different prefix - use a completely different category
				category: '0000000000000000000000000000000000000000000000000000000000000001',
				amount: BigInt(10),
				nft: {
					commitment: '0000000000000001',
					capability: 'minting' as const,
				},
			},
		};
		provider.addUtxo(registryContract.address, differentCategoryCounterNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(differentCategoryCounterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: differentCategoryCounterNFTUTXO.satoshis,
				token: {
					category: differentCategoryCounterNFTUTXO.token!.category,
					amount: differentCategoryCounterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: differentCategoryCounterNFTUTXO.token!.nft!.capability,
						commitment: differentCategoryCounterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: token category prefix does not match registry');
	});

	it('should fail when counter NFT capability is not minting', async () =>
	{
		// Create counter NFT with wrong capability
		const wrongCapabilityCounterNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(10),
				nft: {
					commitment: '0000000000000001',
					capability: 'mutable' as const,
				},
			},
		};
		provider.addUtxo(registryContract.address, wrongCapabilityCounterNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(wrongCapabilityCounterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: wrongCapabilityCounterNFTUTXO.satoshis,
				token: {
					category: wrongCapabilityCounterNFTUTXO.token!.category,
					amount: wrongCapabilityCounterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: wrongCapabilityCounterNFTUTXO.token!.nft!.capability,
						commitment: wrongCapabilityCounterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: counter capability must be minting capability (0x02)');
	});

	it('should fail when input 3 NFT commitment length is not 35 bytes', async () =>
	{
		// Create authorized thread NFT with wrong commitment length
		const wrongCommitmentLengthAuthorizedThreadNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(5),
				nft: {
					commitment: '00',
					capability: 'none' as const,
				},
			},
		};
		provider.addUtxo(registryContract.address, wrongCommitmentLengthAuthorizedThreadNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(wrongCommitmentLengthAuthorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + wrongCommitmentLengthAuthorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: wrongCommitmentLengthAuthorizedThreadNFTUTXO.satoshis,
				token: {
					category: wrongCommitmentLengthAuthorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: wrongCommitmentLengthAuthorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: wrongCommitmentLengthAuthorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: NFT commitment length must be 35 bytes (authorized contract locking bytecode)');
	});

	it('should fail when counter NFT has empty commitment', async () =>
	{
		// Create counter NFT with empty commitment
		const emptyCommitmentCounterNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(10),
				nft: {
					// Empty commitment
					commitment: '',
					capability: 'minting' as const,
				},
			},
		};
		provider.addUtxo(registryContract.address, emptyCommitmentCounterNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(emptyCommitmentCounterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: emptyCommitmentCounterNFTUTXO.satoshis,
				token: {
					category: emptyCommitmentCounterNFTUTXO.token!.category,
					amount: emptyCommitmentCounterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: emptyCommitmentCounterNFTUTXO.token!.nft!.capability,
						commitment: emptyCommitmentCounterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: counter NFT must have a non-empty commitment (registration ID)');
	});

	it('should fail when counter NFT has zero token amount', async () =>
	{
		// Create counter NFT with zero amount
		const zeroAmountCounterNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: '0000000000000001',
					capability: 'minting' as const,
				},
			},
		};
		provider.addUtxo(registryContract.address, zeroAmountCounterNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(zeroAmountCounterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: zeroAmountCounterNFTUTXO.satoshis,
				token: {
					category: zeroAmountCounterNFTUTXO.token!.category,
					amount: zeroAmountCounterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: zeroAmountCounterNFTUTXO.token!.nft!.capability,
						commitment: zeroAmountCounterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: counter NFT must have token amount greater than 0');
	});

	it('should fail when output 2 token amount is not sum of input amounts', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount + BigInt(1),
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: token amount must equal input 2 + input 3 amounts (accumulation)');
	});

	it('should fail when input 4 has token category', async () =>
	{
		// Create input 4 with token category
		const tokenInput4UTXO = {
			...randomUtxo({ satoshis: BigInt(500000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
			},
		};
		provider.addUtxo(aliceAddress, tokenInput4UTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(tokenInput4UTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: tokenInput4UTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 4: must be pure BCH (no token category)');
	});

	it('should fail when output 4 has token category', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: pureBCHUTXO.satoshis,
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 4: must be pure BCH (no token category)');
	});

	it('should succeed with valid transaction', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(accumulatorUTXO, accumulatorContract.unlock.call())
			.addInput(counterNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedThreadNFTUTXO, registryContract.unlock.call())
			.addInput(pureBCHUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: accumulatorContract.tokenAddress,
				amount: accumulatorUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: counterNFTUTXO.satoshis,
				token: {
					category: counterNFTUTXO.token!.category,
					amount: counterNFTUTXO.token!.amount + authorizedThreadNFTUTXO.token!.amount,
					nft: {
						capability: counterNFTUTXO.token!.nft!.capability,
						commitment: counterNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: authorizedThreadNFTUTXO.satoshis,
				token: {
					category: authorizedThreadNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: authorizedThreadNFTUTXO.token!.nft!.capability,
						commitment: authorizedThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: pureBCHUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).resolves.toBeDefined();
	});
});