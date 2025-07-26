import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode, hexToBin } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, alicePkh, aliceTemplate, nameTokenCategory, mockOptions, reversedNameTokenCategory } from '../common.js';
import {  intToBytesToHex, getTxOutputs } from '../utils.js';

describe('Auction', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });
	const auctionContract = new Contract(BitCANNArtifacts.Auction, [ BigInt(mockOptions.minStartingBid) ], { provider });
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
	let transaction: TransactionBuilder;
	let auctionAmount: bigint;
	let newRegistrationId: number;
	let newRegistrationIdCommitment: string;

	beforeAll(() =>
	{
		userUTXO = {
			...randomUtxo(),
		};

		provider.addUtxo(aliceAddress, userUTXO);

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

		// @ts-ignore
		provider.addUtxo(registryContract.address, threadNFTUTXO);

		registrationCounterUTXO = {
			token: {
				category: nameTokenCategory,
				amount: BigInt('9223372036854775807'),
				nft: {
					commitment: intToBytesToHex({ value: 0, length: 8 }),
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
		newRegistrationIdCommitment = newRegistrationId.toString(16).padStart(16, '0');

		auctionAmount = BigInt(mockOptions.minStartingBid);
	});

	it('should start an auction without fail', async () =>
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
			.addOpReturnOutput([ name ])
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
			})
			.addOpReturnOutput([ name ]);

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(5);
	});

	it('should fail without op return output', async () =>
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

		const txPromise = transaction.send();
		await expect(txPromise).rejects.toThrow('Auction.cash:93 Error in transaction at input 1 in contract Auction.cash at line 93.');
		await expect(txPromise).rejects.toThrow('Failing statement: tx.outputs[4].lockingBytecode');
	});

	it('should fail setting auction capability to none', async () =>
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
			})
			.addOpReturnOutput([ name ]);

		const txPromise = transaction.send();
		await expect(txPromise).rejects.toThrow('Auction.cash:90 Require statement failed at input 1 in contract Auction.cash at line 90.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(auctionCapability == 0x01);');
	});
});