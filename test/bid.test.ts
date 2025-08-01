import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode, hexToBin } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../lib/index.js';
import { aliceAddress, alicePkh, aliceTemplate, nameTokenCategory, mockOptions, reversedNameTokenCategory, invalidNameTokenCategory, aliceTokenAddress } from './common.js';
import { getTxOutputs, getAuctionPrice, getRegistrationIdCommitment } from './utils.js';
import artifacts from './artifacts.js';

describe('Bid', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });
	const bidContract = new Contract(BitCANNArtifacts.Bid, [ BigInt(mockOptions.minBidIncreasePercentage) ], { provider });
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
		await expect(txPromise).rejects.toThrow('Bid.cash:34 Require statement failed at input 1 in contract Bid.cash at line 34 with the following message: Invalid number of inputs.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs.length == 4, "Invalid number of inputs");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:35 Require statement failed at input 1 in contract Bid.cash at line 35 with the following message: Invalid number of outputs.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs.length <= 5, "Invalid number of outputs");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:38 Require statement failed at input 0 in contract Bid.cash at line 38 with the following message: Active input index is not 1.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(this.activeInputIndex == 1, "Active input index is not 1");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:46 Require statement failed at input 1 in contract Bid.cash at line 46 with the following message: Locking bytecode mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, "Locking bytecode mismatch");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:47 Require statement failed at input 1 in contract Bid.cash at line 47 with the following message: Locking bytecode mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, "Locking bytecode mismatch");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:78 Require statement failed at input 1 in contract Bid.cash at line 78 with the following message: Bid amount is less than minimum increase.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[2].value * 100 >= tx.inputs[2].value * (100 + minBidIncreasePercentage), "Bid amount is less than minimum increase");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:61 Require statement failed at input 1 in contract Bid.cash at line 61 with the following message: Locking bytecode length is not 25.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[3].lockingBytecode.length == 25, "Locking bytecode length is not 25");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:87 Require statement failed at input 1 in contract Bid.cash at line 87 with the following message: Change is not pure BCH.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[4].tokenCategory == 0x, "Change is not pure BCH");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:50 Require statement failed at input 1 in contract Bid.cash at line 50 with the following message: Token category mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory, "Token category mismatch");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:50 Require statement failed at input 1 in contract Bid.cash at line 50 with the following message: Token category mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory, "Token category mismatch");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:50 Require statement failed at input 1 in contract Bid.cash at line 50 with the following message: Token category mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].tokenCategory == tx.outputs[2].tokenCategory, "Token category mismatch");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:72 Require statement failed at input 1 in contract Bid.cash at line 72 with the following message: NFT commitment does not match.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[2].nftCommitment == pkh + name, "NFT commitment does not match");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:75 Require statement failed at input 1 in contract Bid.cash at line 75 with the following message: Token amount mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].tokenAmount == tx.outputs[2].tokenAmount, "Token amount mismatch");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:81 Require statement failed at input 1 in contract Bid.cash at line 81 with the following message: Previous bidder locking bytecode mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[3].lockingBytecode == new LockingBytecodeP2PKH(previousPKH), "Previous bidder locking bytecode mismatch");');
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
		await expect(txPromise).rejects.toThrow('Bid.cash:83 Require statement failed at input 1 in contract Bid.cash at line 83 with the following message: Previous bidder refund amount mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[3].value == tx.inputs[2].value, "Previous bidder refund amount mismatch");');
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