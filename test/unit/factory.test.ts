import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, alicePkh, aliceTokenAddress, nameTokenCategory, reversedNameTokenCategory, mockOptions } from '../common.js';
import { getDomainPartialBytecode } from '../utils.js';

describe('Factory', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });

	// Get the domain partial bytecode for the Factory contract
	const domainPartialBytecode = getDomainPartialBytecode(nameTokenCategory, {
		provider,
		addressType: 'p2sh32',
	});

	const factoryContract = new Contract(BitCANNArtifacts.Factory, [ domainPartialBytecode, BigInt(mockOptions.minWaitTime), alicePkh, mockOptions.tld ], { provider });

	const name = 'test';
	const nameHex = Buffer.from(name).toString('hex');

	let threadNFTUTXO: Utxo;
	let factoryUTXO: Utxo;
	let nameMintingNFTUTXO: Utxo;
	let auctionNFTUTXO: Utxo;
	let transaction: TransactionBuilder;

	beforeAll(() =>
	{
		// Get the factory contract locking bytecode
		const factoryLockingBytecode = cashAddressToLockingBytecode(factoryContract.address);
		if(typeof factoryLockingBytecode === 'string')
		{
			throw new Error(`Failed to get locking bytecode: ${factoryLockingBytecode}`);
		}

		// Create thread NFT UTXO
		threadNFTUTXO =
		{
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

		// Create name minting NFT UTXO
		nameMintingNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory + '02',
				amount: BigInt(0),
				nft: {
					commitment: '',
					capability: 'minting',
				},
			},
		};

		// Create auction NFT UTXO
		auctionNFTUTXO = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory + '01',
				amount: BigInt(1),
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
						commitment: '0000000000000001',
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
						commitment: '0000000000000001' + nameHex,
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
						commitment: '0000000000000001',
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
						commitment: '0000000000000001' + nameHex,
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
});