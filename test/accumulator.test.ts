import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../lib/index.js';
import { aliceAddress, nameTokenCategory, reversedNameTokenCategory } from './common.js';
import artifacts from './artifacts.js';

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
				category: nameTokenCategory + '02',
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
});