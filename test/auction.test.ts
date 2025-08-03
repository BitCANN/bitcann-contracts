import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode, hexToBin } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../lib/index.js';
import { aliceAddress, alicePkh, aliceTemplate, nameTokenCategory, mockOptions, reversedNameTokenCategory, invalidNameTokenCategory, aliceTokenAddress } from './common.js';
import { getTxOutputs, getAuctionPrice, getRegistrationIdCommitment } from './utils.js';
import artifacts from './artifacts.js';

describe('Auction', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });
	const auctionContract = new Contract(BitCANNArtifacts.Auction, [ BigInt(mockOptions.minStartingBid) ], { provider });
	const testContract = new Contract(artifacts, [], { provider });
	const auctionLockingBytecode = cashAddressToLockingBytecode(auctionContract.address);
	// @ts-ignore
	const auctionLockingBytecodeHex = binToHex(auctionLockingBytecode.bytecode);

	const name = 'test';
	const nameHex = Buffer.from(name).toString('hex');
	const nameBin = hexToBin(nameHex);

	let threadNFTUTXO: Utxo;
	let registrationCounterUTXO: Utxo;
	let mintingNFTUTXO: Utxo;
	let authorizedContractUTXO: Utxo;
	let userUTXO: Utxo;
	let userUTXOA: Utxo;
	let transaction: TransactionBuilder;
	let auctionAmount: bigint;
	let newRegistrationId: number;
	let newRegistrationIdCommitment: string;

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

		provider.addUtxo(auctionContract.address, authorizedContractUTXO);

		threadNFTUTXO = {
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: auctionLockingBytecodeHex,
					capability: 'none',
				},
			},
			...randomUtxo(),
		};

		provider.addUtxo(registryContract.address, threadNFTUTXO);

		registrationCounterUTXO = {
			token: {
				category: nameTokenCategory,
				amount: BigInt('9223372036854775807'),
				nft: {
					commitment: '00',
					capability: 'minting',
				},
			},
			...randomUtxo(),
		};

		// Create the counterNFT and the minting NFT for the registry contract
		provider.addUtxo(registryContract.address, registrationCounterUTXO);

		mintingNFTUTXO = {
			token: {
				amount: BigInt(0),
				category: nameTokenCategory,
				nft: {
					commitment: '',
					capability: 'minting',
				},
			},
			...randomUtxo(),
		};

		provider.addUtxo(registryContract.address, mintingNFTUTXO);

		newRegistrationId = parseInt(registrationCounterUTXO.token!.nft!.commitment, 16) + 1;
		newRegistrationIdCommitment = getRegistrationIdCommitment(BigInt(newRegistrationId));

		auctionAmount = getAuctionPrice(BigInt(newRegistrationId), BigInt(mockOptions.minStartingBid));
	});

	it('should fail with invalid number of inputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:34 Require statement failed at input 1 in contract Auction.cash at line 34 with the following message: Transaction: must have exactly 4 inputs.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs.length == 4, "Transaction: must have exactly 4 inputs");');
	});

	it('should fail with invalid number of outputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
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
		await expect(txPromise).rejects.toThrow('Auction.cash:35 Require statement failed at input 1 in contract Auction.cash at line 35 with the following message: Transaction: must have at most 5 outputs.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs.length <= 5, "Transaction: must have at most 5 outputs");');
	});

	it('should fail when contract is not used at input index 1', async () =>
	{
		// Construct the transaction using the TransactionBuilder with contract at input 0 instead of 1
		transaction = new TransactionBuilder({ provider })
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
			.addOutput({
				to: auctionContract.tokenAddress,
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
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:38 Require statement failed at input 0 in contract Auction.cash at line 38 with the following message: Input 1: auction contract UTXO must be at this index.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(this.activeInputIndex == 1, "Input 1: auction contract UTXO must be at this index");');
	});

	it('should fail when attaching a token to the auction output', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:41 Require statement failed at input 1 in contract Auction.cash at line 41 with the following message: Output 1: must not have any token category (pure BCH only).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[this.activeInputIndex].tokenCategory == 0x, "Output 1: must not have any token category (pure BCH only)");');
	});

	it('should fail when using a non registry contract in input 2', async () =>
	{
		provider.addUtxo(testContract.address, registrationCounterUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, testContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:48 Require statement failed at input 1 in contract Auction.cash at line 48 with the following message: Input 2: locking bytecode does not match registry input\'s locking bytecode.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, "Input 2: locking bytecode does not match registry input\'s locking bytecode");');
	});

	it('should fail when using a non registry contract in output 2', async () =>
	{

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: testContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:49 Require statement failed at input 1 in contract Auction.cash at line 49 with the following message: Output 2: locking bytecode does not match registry input\'s locking bytecode.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[2].lockingBytecode == registryInputLockingBytecode, "Output 2: locking bytecode does not match registry input\'s locking bytecode");');
	});

	it('should fail when using a non registry contract in output 3', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: testContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:50 Require statement failed at input 1 in contract Auction.cash at line 50 with the following message: Output 3: locking bytecode does not match registry input\'s locking bytecode.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[3].lockingBytecode == registryInputLockingBytecode, "Output 3: locking bytecode does not match registry input\'s locking bytecode");');
	});

	it('should fail due to incorrect new registration id', async () =>
	{
		const customRegistrationIdCommitment = getRegistrationIdCommitment(BigInt(newRegistrationId) + 2n);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: customRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:55 Require statement failed at input 1 in contract Auction.cash at line 55 with the following message: Output 2: registration ID must increase by 1.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(nextRegistrationId == prevRegistrationId + 1, "Output 2: registration ID must increase by 1");');
	});

	it('should fail due to incorrect new registration tokenAmount deducted from counterNFT', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId + 1),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:58 Require statement failed at input 1 in contract Auction.cash at line 58 with the following message: Output 2: counter NFT token amount must decrease by registration ID.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[2].tokenAmount == tx.inputs[2].tokenAmount - nextRegistrationId, "Output 2: counter NFT token amount must decrease by registration ID");');
	});

	it('should fail due to incorrect token amount in auctionNFT', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId + 1),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:60 Require statement failed at input 1 in contract Auction.cash at line 60 with the following message: Output 3: auction NFT token amount must equal registration ID.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[3].tokenAmount == nextRegistrationId, "Output 3: auction NFT token amount must equal registration ID");');
	});

	it('should fail due to invalid auction amount, value less than minimum', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount - BigInt(1)),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:77 Require statement failed at input 1 in contract Auction.cash at line 77 with the following message: Output 3: auction price must be at least minimum calculated price.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[3].value >= currentAuctionPrice, "Output 3: auction price must be at least minimum calculated price");');
	});

	it('should pass due to correct auction amount, value greater than minimum ', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount + BigInt(1)),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: userUTXO.satoshis,
			});

		const transactionSize = transaction.build().length;
		const changeAmount = userUTXO.satoshis - (auctionAmount + BigInt(transactionSize));
		transaction.outputs[transaction.outputs.length - 1].amount = changeAmount;

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs).toEqual(expect.arrayContaining([{ to: aliceAddress, amount: changeAmount, token: undefined }]));
	});

	it('should pass for registrationID 120001', async () =>
	{
		const customRegistrationId = 120000n;
		const customRegistrationIdCommitment = getRegistrationIdCommitment(customRegistrationId);

		const customPlusOneRegistrationIdCommitment = getRegistrationIdCommitment(customRegistrationId + 1n);

		const tempRegistrationCounterUTXO: Utxo = {
			token: {
				category: nameTokenCategory,
				amount: BigInt('9223372036854775807'),
				nft: {
					commitment: customRegistrationIdCommitment,
					capability: 'minting',
				},
			},
			...randomUtxo(),
		};

		// Create the counterNFT and the minting NFT for the registry contract
		// @ts-ignore
		provider.addUtxo(registryContract.address, tempRegistrationCounterUTXO);

		const currentAuctionAmount = getAuctionPrice(customRegistrationId + 1n, BigInt(mockOptions.minStartingBid));

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(tempRegistrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: tempRegistrationCounterUTXO.satoshis,
				token: {
					category: tempRegistrationCounterUTXO.token!.category,
					amount: tempRegistrationCounterUTXO.token!.amount - (customRegistrationId + 1n),
					nft: {
						capability: tempRegistrationCounterUTXO.token!.nft!.capability,
						commitment: customPlusOneRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: currentAuctionAmount + 1n,
				token: {
					category: tempRegistrationCounterUTXO.token!.category,
					amount: customRegistrationId + 1n,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: userUTXO.satoshis,
			});

		const transactionSize = transaction.build().length;
		const changeAmount = userUTXO.satoshis - (currentAuctionAmount + BigInt(transactionSize));
		transaction.outputs[transaction.outputs.length - 1].amount = changeAmount;

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs).toEqual(expect.arrayContaining([{ to: aliceAddress, amount: changeAmount, token: undefined }]));
	});

	it('should pass for registrationID 1000001', async () =>
	{
		const customRegistrationId = 1000000n;
		const customRegistrationIdCommitment = getRegistrationIdCommitment(customRegistrationId);

		const customPlusOneRegistrationIdCommitment = getRegistrationIdCommitment(customRegistrationId + 1n);

		const tempRegistrationCounterUTXO: Utxo = {
			token: {
				category: nameTokenCategory,
				amount: BigInt('9223372036854775807'),
				nft: {
					commitment: customRegistrationIdCommitment,
					capability: 'minting',
				},
			},
			...randomUtxo(),
		};

		// Create the counterNFT and the minting NFT for the registry contract
		// @ts-ignore
		provider.addUtxo(registryContract.address, tempRegistrationCounterUTXO);

		const currentAuctionAmount = getAuctionPrice(customRegistrationId + 1n, BigInt(mockOptions.minStartingBid));

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(tempRegistrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: tempRegistrationCounterUTXO.satoshis,
				token: {
					category: tempRegistrationCounterUTXO.token!.category,
					amount: tempRegistrationCounterUTXO.token!.amount - (customRegistrationId + 1n),
					nft: {
						capability: tempRegistrationCounterUTXO.token!.nft!.capability,
						commitment: customPlusOneRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: currentAuctionAmount,
				token: {
					category: tempRegistrationCounterUTXO.token!.category,
					amount: customRegistrationId + 1n,
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: userUTXO.satoshis,
			});

		const transactionSize = transaction.build().length;
		const changeAmount = userUTXO.satoshis - (currentAuctionAmount + BigInt(transactionSize));
		transaction.outputs[transaction.outputs.length - 1].amount = changeAmount;

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs).toEqual(expect.arrayContaining([{ to: aliceAddress, amount: changeAmount, token: undefined }]));
	});

	it('should fail for overflow registrationID 9223372036854775807n', async () =>
	{
		const customRegistrationId = 9223372036854775807n;
		const customRegistrationIdCommitment = getRegistrationIdCommitment(customRegistrationId);

		const customPlusOneRegistrationIdCommitment = getRegistrationIdCommitment(customRegistrationId + 1n);

		const tempRegistrationCounterUTXO: Utxo = {
			token: {
				category: nameTokenCategory,
				amount: 9223372036854775807n,
				nft: {
					commitment: customRegistrationIdCommitment,
					capability: 'minting',
				},
			},
			...randomUtxo(),
		};

		// Create the counterNFT and the minting NFT for the registry contract
		// @ts-ignore
		provider.addUtxo(registryContract.address, tempRegistrationCounterUTXO);

		const currentAuctionAmount = getAuctionPrice(customRegistrationId + 1n, BigInt(mockOptions.minStartingBid));

		try
		{
		// Construct the transaction using the TransactionBuilder
			transaction = new TransactionBuilder({ provider })
				.addInput(threadNFTUTXO, registryContract.unlock.call())
				.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
				.addInput(tempRegistrationCounterUTXO, registryContract.unlock.call())
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
					to: auctionContract.tokenAddress,
					amount: authorizedContractUTXO.satoshis,
				})
				.addOutput({
					to: registryContract.tokenAddress,
					amount: tempRegistrationCounterUTXO.satoshis,
					token: {
						category: tempRegistrationCounterUTXO.token!.category,
						amount: tempRegistrationCounterUTXO.token!.amount - (customRegistrationId + 1n),
						nft: {
							capability: tempRegistrationCounterUTXO.token!.nft!.capability,
							commitment: customPlusOneRegistrationIdCommitment,
						},
					},
				})
				.addOutput({
					to: registryContract.tokenAddress,
					amount: currentAuctionAmount,
					token: {
						category: tempRegistrationCounterUTXO.token!.category,
						amount: customRegistrationId + 1n,
						nft: {
							capability: 'mutable',
							commitment: binToHex(alicePkh) + binToHex(nameBin),
						},
					},
				})
				.addOutput({
					to: aliceAddress,
					amount: userUTXO.satoshis,
				});

		}
		catch(error)
		{
			await expect(Promise.reject(error)).rejects.toThrow('Tried to add an output with -1 tokens, which is invalid');
		}
	});

	it('should fail due to non p2pkh user input', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:83 Require statement failed at input 1 in contract Auction.cash at line 83 with the following message: Input 3: locking bytecode must be 25 bytes (P2PKH).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[3].lockingBytecode.length == 25, "Input 3: locking bytecode must be 25 bytes (P2PKH)");');
	});

	it('should fail due to nft commitment mismatch in auction NFT output', async () =>
	{
		const differentName = '123';
		const differentNameHex = Buffer.from(differentName).toString('hex');
		const differentNameBin = hexToBin(differentNameHex);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(differentNameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:91 Require statement failed at input 1 in contract Auction.cash at line 91 with the following message: Output 3: NFT commitment must match bidder PKH + name.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[3].nftCommitment == pkh + name, "Output 3: NFT commitment must match bidder PKH + name");');
	});

	it('should fail due to long name', async () =>
	{
		const longName = '123456789123456789';
		const longNameHex = Buffer.from(longName).toString('hex');
		const longNameBin = hexToBin(longNameHex);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(longNameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(longNameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:95 Require statement failed at input 1 in contract Auction.cash at line 95 with the following message: Name: length must be at most 16 characters.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(name.length <= 16, "Name: length must be at most 16 characters");');
	});

	it('should fail due to change in token category of counter nft', async () =>
	{
		const differentRegistrationCounterUTXO: Utxo = {
			token: {
				category: invalidNameTokenCategory,
				amount: BigInt('9223372036854775807'),
				nft: {
					commitment: '00',
					capability: 'minting',
				},
			},
			...randomUtxo(),
		};

		// Create the counterNFT and the minting NFT for the registry contract
		provider.addUtxo(registryContract.address, differentRegistrationCounterUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(differentRegistrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: 'none',
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:98 Require statement failed at input 1 in contract Auction.cash at line 98 with the following message: Output 2: counter NFT token category must match input 2.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[2].tokenCategory == tx.inputs[2].tokenCategory, "Output 2: counter NFT token category must match input 2");');
	});

	it('should fail due to invalid capability in token category of counter nft', async () =>
	{
		const differentRegistrationCounterUTXO: Utxo = {
			token: {
				category: nameTokenCategory,
				amount: BigInt('9223372036854775807'),
				nft: {
					commitment: '00',
					capability: 'none',
				},
			},
			...randomUtxo(),
		};

		// Create the counterNFT and the minting NFT for the registry contract
		provider.addUtxo(registryContract.address, differentRegistrationCounterUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(differentRegistrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: 'none',
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:107 Require statement failed at input 1 in contract Auction.cash at line 107 with the following message: Output 2: counter NFT capability must be minting (0x02).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(counterCapability == 0x02, "Output 2: counter NFT capability must be minting (0x02)");');
	});

	it('should fail due to invalid capability in token category of counter nft', async () =>
	{
		const differentRegistrationCounterUTXO: Utxo = {
			token: {
				category: nameTokenCategory,
				amount: BigInt('9223372036854775807'),
				nft: {
					commitment: '00',
					capability: 'none',
				},
			},
			...randomUtxo(),
		};

		// Create the counterNFT and the minting NFT for the registry contract
		provider.addUtxo(registryContract.address, differentRegistrationCounterUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(differentRegistrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: 'none',
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:107 Require statement failed at input 1 in contract Auction.cash at line 107 with the following message: Output 2: counter NFT capability must be minting (0x02).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(counterCapability == 0x02, "Output 2: counter NFT capability must be minting (0x02)");');
	});

	it('should fail due to invalid capability in token category of auction nft', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'none',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:113 Require statement failed at input 1 in contract Auction.cash at line 113 with the following message: Output 3: auction NFT capability must be mutable (0x01).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(auctionCapability == 0x01, "Output 3: auction NFT capability must be mutable (0x01)");');
	});

	it('should fail due to token attached to change output', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: BigInt(1000),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(0),
					nft: {
						capability: 'none',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = transaction.send();
		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Auction.cash:117 Require statement failed at input 1 in contract Auction.cash at line 117 with the following message: Output 4: change must be pure BCH (no token category).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[4].tokenCategory == 0x, "Output 4: change must be pure BCH (no token category)");');
	});

	it('should pass without change output', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(4);
	});

	it('should pass auction without fail', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
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
				to: auctionContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: registrationCounterUTXO.satoshis,
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: registrationCounterUTXO.token!.amount - BigInt(newRegistrationId),
					nft: {
						capability: registrationCounterUTXO.token!.nft!.capability,
						commitment: newRegistrationIdCommitment,
					},
				},
			})
			.addOutput({
				to: registryContract.tokenAddress,
				amount: BigInt(auctionAmount),
				token: {
					category: registrationCounterUTXO.token!.category,
					amount: BigInt(newRegistrationId),
					nft: {
						capability: 'mutable',
						commitment: binToHex(alicePkh) + binToHex(nameBin),
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: userUTXO.satoshis,
			});

		const transactionSize = transaction.build().length;
		const changeAmount = userUTXO.satoshis - (auctionAmount + BigInt(transactionSize));
		transaction.outputs[transaction.outputs.length - 1].amount = changeAmount;

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs).toEqual(expect.arrayContaining([{ to: aliceAddress, amount: changeAmount, token: undefined }]));
	});
});