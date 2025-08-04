import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, alicePkh, aliceTokenAddress, nameTokenCategory, reversedNameTokenCategory, invalidNameTokenCategory } from '../common.js';
import { getTxOutputs } from '../utils.js';
import artifacts from '../artifacts.js';

describe('ConflictResolver', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });
	const conflictResolverContract = new Contract(BitCANNArtifacts.ConflictResolver, [], { provider });
	const testContract = new Contract(artifacts, [], { provider });
	const conflictResolverLockingBytecode = cashAddressToLockingBytecode(conflictResolverContract.address);
	// @ts-ignore
	const conflictResolverLockingBytecodeHex = binToHex(conflictResolverLockingBytecode.bytecode);

	const name = 'test';
	const nameHex = Buffer.from(name).toString('hex');

	let threadNFTUTXO: Utxo;
	let validAuctionNFTUTXO: Utxo;
	let invalidAuctionNFTUTXO: Utxo;
	let authorizedContractUTXO: Utxo;
	let transaction: TransactionBuilder;
	let validRegistrationId: number;
	let invalidRegistrationId: number;

	beforeAll(() =>
	{
		authorizedContractUTXO = {
			...randomUtxo(),
		};

		provider.addUtxo(conflictResolverContract.address, authorizedContractUTXO);

		threadNFTUTXO = {
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: conflictResolverLockingBytecodeHex,
					capability: 'none',
				},
			},
			...randomUtxo(),
		};

		provider.addUtxo(registryContract.address, threadNFTUTXO);

		validRegistrationId = 1;
		invalidRegistrationId = 2;

		// Create valid auctionNFT (lower registration ID)
		validAuctionNFTUTXO = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(validRegistrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		// Create invalid auctionNFT (higher registration ID)
		invalidAuctionNFTUTXO = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(invalidRegistrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, validAuctionNFTUTXO);
		provider.addUtxo(registryContract.address, invalidAuctionNFTUTXO);
	});

	it('should fail with invalid number of inputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 5 inputs instead of 4
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
			.addInput(invalidAuctionNFTUTXO, registryContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
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
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:27 Require statement failed at input 1 in contract ConflictResolver.cash at line 27 with the following message: Transaction: must have exactly 4 inputs.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs.length == 4, "Transaction: must have exactly 4 inputs");');
	});

	it('should fail with invalid number of outputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 5 outputs instead of 4
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
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
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: 1000n,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:28 Require statement failed at input 1 in contract ConflictResolver.cash at line 28 with the following message: Transaction: must have exactly 4 outputs.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs.length == 4, "Transaction: must have exactly 4 outputs");');
	});

	it('should fail when contract is not used at input index 1', async () =>
	{
		// Construct the transaction using the TransactionBuilder with contract at input 0 instead of 1
		transaction = new TransactionBuilder({ provider })
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
			.addInput(invalidAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
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
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:31 Require statement failed at input 0 in contract ConflictResolver.cash at line 31 with the following message: Input 1: conflict resolver contract UTXO must be at this index.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(this.activeInputIndex == 1, "Input 1: conflict resolver contract UTXO must be at this index");');
	});

	it('should fail when using a non registry contract for valid auction', async () =>
	{
		provider.addUtxo(testContract.address, validAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionNFTUTXO, testContract.unlock.call())
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
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:39 Require statement failed at input 1 in contract ConflictResolver.cash at line 39 with the following message: Input 2: valid auction locking bytecode does not match registry input\'s locking bytecode.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, "Input 2: valid auction locking bytecode does not match registry input\'s locking bytecode");');
	});

	it('should fail when using a non registry contract for invalid auction', async () =>
	{
		provider.addUtxo(testContract.address, invalidAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
			.addInput(invalidAuctionNFTUTXO, testContract.unlock.call())
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
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:40 Require statement failed at input 1 in contract ConflictResolver.cash at line 40 with the following message: Input 3: invalid auction locking bytecode does not match registry input\'s locking bytecode.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[3].lockingBytecode == registryInputLockingBytecode, "Input 3: invalid auction locking bytecode does not match registry input\'s locking bytecode");');
	});

	it('should fail due to invalid valid auction category', async () =>
	{
		// Create valid auctionNFT with invalid category
		const customValidAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: invalidNameTokenCategory,
				amount: BigInt(validRegistrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		} as any;

		provider.addUtxo(registryContract.address, customValidAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(customValidAuctionNFTUTXO, registryContract.unlock.call())
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
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: customValidAuctionNFTUTXO.satoshis,
				token: {
					category: customValidAuctionNFTUTXO.token!.category,
					amount: customValidAuctionNFTUTXO.token!.amount,
					nft: {
						capability: customValidAuctionNFTUTXO.token!.nft!.capability,
						commitment: customValidAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:48 Require statement failed at input 1 in contract ConflictResolver.cash at line 48 with the following message: Input 2: valid auction token category prefix must match registry.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(auctionCategory == registryInputCategory, "Input 2: valid auction token category prefix must match registry");');
	});

	it('should fail due to invalid valid auction capability', async () =>
	{
		// Create valid auctionNFT with invalid capability
		const customValidAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(validRegistrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'none',
				},
			},
		};

		provider.addUtxo(registryContract.address, customValidAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(customValidAuctionNFTUTXO, registryContract.unlock.call())
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
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: customValidAuctionNFTUTXO.satoshis,
				token: {
					category: customValidAuctionNFTUTXO.token!.category,
					amount: customValidAuctionNFTUTXO.token!.amount,
					nft: {
						capability: customValidAuctionNFTUTXO.token!.nft!.capability,
						commitment: customValidAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:50 Require statement failed at input 1 in contract ConflictResolver.cash at line 50 with the following message: Input 2: valid auction capability must be mutable (0x01).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(auctionCapability == 0x01, "Input 2: valid auction capability must be mutable (0x01)");');
	});

	it('should fail due to auction token category mismatch', async () =>
	{
		// Create invalid auctionNFT with different category
		const customInvalidAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: invalidNameTokenCategory,
				amount: BigInt(invalidRegistrationId),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		} as any;

		provider.addUtxo(registryContract.address, customInvalidAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
			.addInput(customInvalidAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + customInvalidAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: customInvalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:53 Require statement failed at input 1 in contract ConflictResolver.cash at line 53 with the following message: Input 2 and 3: auction token categories must match.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].tokenCategory == tx.inputs[3].tokenCategory, "Input 2 and 3: auction token categories must match");');
	});

	it('should fail due to auction name mismatch', async () =>
	{
		// Create invalid auctionNFT with different name
		const differentName = 'different';
		const differentNameHex = Buffer.from(differentName).toString('hex');

		const customInvalidAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(invalidRegistrationId),
				nft: {
					commitment: binToHex(alicePkh) + differentNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, customInvalidAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
			.addInput(customInvalidAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + customInvalidAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: customInvalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:55 Require statement failed at input 1 in contract ConflictResolver.cash at line 55 with the following message: Input 2 and 3: auction names must match.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].nftCommitment.split(20)[1] == tx.inputs[3].nftCommitment.split(20)[1], "Input 2 and 3: auction names must match");');
	});

	it('should fail when valid auction registration ID is not lower', async () =>
	{
		// Create valid auctionNFT with higher registration ID (should fail)
		const customValidAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				// Higher than invalid auction's ID of 2
				amount: BigInt(3),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, customValidAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(customValidAuctionNFTUTXO, registryContract.unlock.call())
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
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: customValidAuctionNFTUTXO.satoshis,
				token: {
					category: customValidAuctionNFTUTXO.token!.category,
					amount: customValidAuctionNFTUTXO.token!.amount,
					nft: {
						capability: customValidAuctionNFTUTXO.token!.nft!.capability,
						commitment: customValidAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:57 Require statement failed at input 1 in contract ConflictResolver.cash at line 57 with the following message: Input 2: valid auction registration ID must be lower than input 3.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].tokenAmount < tx.inputs[3].tokenAmount, "Input 2: valid auction registration ID must be lower than input 3");');
	});

	it('should fail due to token amount mismatch', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
			.addInput(invalidAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					// Wrong amount
					amount: threadNFTUTXO.token!.amount + invalidAuctionNFTUTXO.token!.amount - 1n,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:61 Require statement failed at input 1 in contract ConflictResolver.cash at line 61 with the following message: Output 0: token amount must equal input 0 + input 3 amounts (accumulation).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[3].tokenAmount, "Output 0: token amount must equal input 0 + input 3 amounts (accumulation)");');
	});

	it('should fail due to reward not being pure BCH', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
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
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						capability: 'none',
						commitment: binToHex(alicePkh) + nameHex,
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('ConflictResolver.cash:64 Require statement failed at input 1 in contract ConflictResolver.cash at line 64 with the following message: Output 3: reward must be pure BCH (no token category).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[3].tokenCategory == 0x, "Output 3: reward must be pure BCH (no token category)");');
	});

	// Tests for valid conflict resolution scenarios
	it('should pass with valid conflict resolution', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
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
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionNFTUTXO.satoshis,
				token: {
					category: validAuctionNFTUTXO.token!.category,
					amount: validAuctionNFTUTXO.token!.amount,
					nft: {
						capability: validAuctionNFTUTXO.token!.nft!.capability,
						commitment: validAuctionNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(4);
	});

	it('should pass with valid conflict resolution for different names', async () =>
	{
		// Create auctions with different names but same registration ID pattern
		const name1 = 'domain1';
		const name1Hex = Buffer.from(name1).toString('hex');

		const validAuction1UTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: binToHex(alicePkh) + name1Hex,
					capability: 'mutable',
				},
			},
		};

		const invalidAuction1UTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(2),
				nft: {
					commitment: binToHex(alicePkh) + name1Hex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, validAuction1UTXO);
		provider.addUtxo(registryContract.address, invalidAuction1UTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuction1UTXO, registryContract.unlock.call())
			.addInput(invalidAuction1UTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + invalidAuction1UTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuction1UTXO.satoshis,
				token: {
					category: validAuction1UTXO.token!.category,
					amount: validAuction1UTXO.token!.amount,
					nft: {
						capability: validAuction1UTXO.token!.nft!.capability,
						commitment: validAuction1UTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuction1UTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(4);
	});

	it('should pass with valid conflict resolution for large registration ID difference', async () =>
	{
		// Create auctions with large registration ID difference
		const validAuctionLargeUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				// Very low registration ID
				amount: BigInt(1),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		const invalidAuctionLargeUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory,
				// Very high registration ID
				amount: BigInt(1000),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, validAuctionLargeUTXO);
		provider.addUtxo(registryContract.address, invalidAuctionLargeUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, conflictResolverContract.unlock.call())
			.addInput(validAuctionLargeUTXO, registryContract.unlock.call())
			.addInput(invalidAuctionLargeUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + invalidAuctionLargeUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: conflictResolverContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: validAuctionLargeUTXO.satoshis,
				token: {
					category: validAuctionLargeUTXO.token!.category,
					amount: validAuctionLargeUTXO.token!.amount,
					nft: {
						capability: validAuctionLargeUTXO.token!.nft!.capability,
						commitment: validAuctionLargeUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionLargeUTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(4);
	});

});