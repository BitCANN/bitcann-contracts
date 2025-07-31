import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode, hexToBin } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../lib/index.js';
import { aliceAddress, alicePkh, aliceTemplate, nameTokenCategory, mockOptions, reversedNameTokenCategory, invalidNameTokenCategory } from './common.js';
import { getAuctionPrice, getRegistrationIdCommitment } from './utils.js';
import artifacts from './artifacts.js';

describe('Registry', () =>
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
	let invalidThreadNFTUTXO: Utxo;
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

		invalidThreadNFTUTXO = {
			token: {
				category: invalidNameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: auctionLockingBytecodeHex,
					capability: 'none',
				},
			},
			...randomUtxo(),
		};

		// @ts-ignore
		provider.addUtxo(registryContract.address, invalidThreadNFTUTXO);

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
		// @ts-ignore
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

		// @ts-ignore
		provider.addUtxo(registryContract.address, mintingNFTUTXO);

		newRegistrationId = parseInt(registrationCounterUTXO.token!.nft!.commitment, 16) + 1;
		newRegistrationIdCommitment = getRegistrationIdCommitment(BigInt(newRegistrationId));

		auctionAmount = getAuctionPrice(BigInt(newRegistrationId), BigInt(mockOptions.minStartingBid));
	});

	it('should fail when sending authorizedThreadNFT to any other address than registry contract', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
			.addOutput({
				to: auctionContract.tokenAddress,
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
		await expect(txPromise).rejects.toThrow('Registry.cash:58 Require statement failed at input 0 in contract Registry.cash at line 58 with the following message: Locking bytecode mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[0].lockingBytecode == selfLockingBytecode, \"Locking bytecode mismatch\");');
	});

	it('should fail when using incorrect token category from registry contract', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(invalidThreadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: invalidThreadNFTUTXO.satoshis,
				token: {
					category: invalidThreadNFTUTXO.token!.category,
					amount: invalidThreadNFTUTXO.token!.amount,
					nft: {
						capability: invalidThreadNFTUTXO.token!.nft!.capability,
						commitment: invalidThreadNFTUTXO.token!.nft!.commitment,
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
		await expect(txPromise).rejects.toThrow('Registry.cash:63 Require statement failed at input 0 in contract Registry.cash at line 63 with the following message: Token category mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[0].tokenCategory == nameCategory, \"Token category mismatch\");');
	});

	it('should fail when sending incorrect amount to authorizedThreadNFT from registry contract', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
			.addInput(userUTXO, aliceTemplate.unlockP2PKH())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis + BigInt(1),
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
		await expect(txPromise).rejects.toThrow('Registry.cash:66 Require statement failed at input 0 in contract Registry.cash at line 66 with the following message: Satoshi value mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[0].value == tx.inputs[0].value, \"Satoshi value mismatch\");');
	});

	it('should fail when trying to change nft commitment of 0th output', async () =>
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
						commitment: binToHex(alicePkh),
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
		await expect(txPromise).rejects.toThrow('Registry.cash:70 Require statement failed at input 0 in contract Registry.cash at line 70 with the following message: NFT commitment mismatch.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[0].nftCommitment == tx.inputs[0].nftCommitment, \"NFT commitment mismatch\");');
	});


	it('should fail when different contract is used in input 1', async () =>
	{
		provider.addUtxo(testContract.address, authorizedContractUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, testContract.unlock.call())
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
		await expect(txPromise).rejects.toThrow('Registry.cash:76 Require statement failed at input 0 in contract Registry.cash at line 76 with the following message: Invalid contract.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[1].lockingBytecode == tx.inputs[0].nftCommitment, \"Invalid contract\");');
	});

	it('should fail with invalid active input index for auction contract', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(registrationCounterUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, auctionContract.unlock.call(nameBin))
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
		await expect(txPromise).rejects.toThrow('Registry.cash:76 Require statement failed at input 0 in contract Registry.cash at line 76 with the following message: Invalid contract.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[1].lockingBytecode == tx.inputs[0].nftCommitment, \"Invalid contract\");');
	});
});