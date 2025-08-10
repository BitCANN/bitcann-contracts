import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode, hexToBin } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, alicePkh, aliceTemplate, nameTokenCategory, mockOptions, reversedNameTokenCategory, invalidNameTokenCategory, aliceTokenAddress } from '../common.js';
import { getTxOutputs, getAuctionPrice } from '../utils.js';
import artifacts from '../artifacts.js';

describe('Bid', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });
	const bidContract = new Contract(BitCANNArtifacts.Bid, [ ], { provider });
	const testContract = new Contract(artifacts, [], { provider });
	const bidLockingBytecode = cashAddressToLockingBytecode(bidContract.address);
	// @ts-ignore
	const bidLockingBytecodeHex = binToHex(bidLockingBytecode.bytecode);

	const name = 'test';
	const nameHex = Buffer.from(name).toString('hex');
	const nameBin = hexToBin(nameHex);

	let threadNFTUTXO: Utxo;
	let auctionNFTUTXO: Utxo;
	let authorizedContractUTXO: Utxo;
	let userUTXO: Utxo;
	let userUTXOA: Utxo;
	let transaction: TransactionBuilder;
	let previousBidAmount: bigint;
	let newBidAmount: bigint;
	let registrationId: number;

	beforeAll(() =>
	{
		userUTXO = {
			...randomUtxo({ satoshis: BigInt(1000000000) }),
		};
		userUTXOA = {
			...randomUtxo(),
		};

		provider.addUtxo(aliceAddress, userUTXO);
		provider.addUtxo(aliceAddress, userUTXOA);

		authorizedContractUTXO = {
			...randomUtxo(),
		};

		provider.addUtxo(bidContract.address, authorizedContractUTXO);

		threadNFTUTXO = {
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: bidLockingBytecodeHex,
					capability: 'none',
				},
			},
			...randomUtxo(),
		};

		provider.addUtxo(registryContract.address, threadNFTUTXO);

		registrationId = 1;
		previousBidAmount = getAuctionPrice(BigInt(registrationId), BigInt(mockOptions.minStartingBid));
		newBidAmount = previousBidAmount + (previousBidAmount * BigInt(mockOptions.minBidIncreasePercentage) / 100n) + 1n;

		// Create auctionNFT with previous bidder's PKH
		auctionNFTUTXO = {
			...randomUtxo({ satoshis: previousBidAmount }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + binToHex(nameBin),
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, auctionNFTUTXO);
	});

	it('should fail with invalid number of inputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 5 inputs instead of 4
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
			.addInput(userUTXOA, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Transaction: must have exactly 4 inputs');
	});

	it('should fail with invalid number of outputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 6 outputs instead of max 5
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			})
			.addOutput({
				to: aliceAddress,
				amount: 1000n,
			})
			.addOutput({
				to: aliceAddress,
				amount: 1000n,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Transaction: must have at most 5 outputs');
	});

	it('should fail when contract is not used at input index 1', async () =>
	{
		// Construct the transaction using the TransactionBuilder with contract at input 0 instead of 1
		transaction = new TransactionBuilder({ provider })
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
			.addOutput({
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
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
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 1: bid contract UTXO must be at this index');
	});

	it('should fail when using a non registry contract in input 2', async () =>
	{
		provider.addUtxo(testContract.address, auctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, testContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: auction NFT locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail when using a non registry contract in output 2', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: testContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: auction NFT locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail due to invalid bid amount, less than minimum increase', async () =>
	{
		const insufficientBidAmount = previousBidAmount + (previousBidAmount * BigInt(mockOptions.minBidIncreasePercentage) / 100n) - 1n;

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: insufficientBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: bid amount must be at least 5 percentage higher');
	});

	it('should fail due to non p2pkh funding input', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: locking bytecode must be 25 bytes (P2PKH)');
	});

	it('should fail due to token attached to change output', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: 1000n,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: 'none',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 4: change must be pure BCH (no token category)');
	});

	it('should fail due to token category mismatch in auctionNFT', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: invalidNameTokenCategory,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: auction NFT token category must match input 2');
	});

	it('should fail due to invalid auction category', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: invalidNameTokenCategory,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: auction NFT token category must match input 2');
	});

	it('should fail due to invalid auction capability', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'none',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: auction NFT token category must match input 2');
	});



	it('should fail due to NFT commitment mismatch', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + '646966666572656e746e616d65',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: auction NFT commitment must match new bidder PKH + name');
	});

	it('should fail due to token amount mismatch', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount + 1n,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: auction NFT token amount must match input 2');
	});

	it('should fail due to previous bidder locking bytecode mismatch', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: testContract.tokenAddress,
				amount: previousBidAmount,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 3: previous bidder locking bytecode must match previous PKH');
	});

	it('should fail due to previous bidder refund amount mismatch', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount + 1n,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 3: previous bidder refund amount must match previous bid amount');
	});

	it('should pass with valid bid transaction', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			})
			.addOutput({
				to: aliceAddress,
				amount: userUTXO.satoshis - newBidAmount - previousBidAmount - 1000n,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(5);
	});

	it('should pass without change output', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, bidContract.unlock.call())
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
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
				to: bidContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: newBidAmount,
				token: {
					category: auctionNFTUTXO.token!.category,
					amount: auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: previousBidAmount,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(4);
	});

});