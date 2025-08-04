import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, alicePkh, aliceTokenAddress, nameTokenCategory, reversedNameTokenCategory, mockOptions } from '../common.js';
import { getDomainPartialBytecode } from '../utils.js';
import artifacts from '../artifacts.js';

describe('OwnershipGuard', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });

	// Get the domain partial bytecode for the OwnershipGuard contract
	const domainPartialBytecode = getDomainPartialBytecode(nameTokenCategory, {
		provider,
		addressType: 'p2sh32',
	});

	const ownershipGuardContract = new Contract(BitCANNArtifacts.OwnershipGuard, [ domainPartialBytecode, mockOptions.tld ], { provider });
	const testContract = new Contract(artifacts, [], { provider });

	const name = 'test';
	const nameHex = Buffer.from(name).toString('hex');

	let threadNFTUTXO: Utxo;
	let ownershipGuardUTXO: Utxo;
	let externalAuthNFTUTXO: Utxo;
	let auctionNFTUTXO: Utxo;
	let transaction: TransactionBuilder;

	beforeAll(() =>
	{
		// Get the ownership guard contract locking bytecode
		const ownershipGuardLockingBytecode = cashAddressToLockingBytecode(ownershipGuardContract.address);
		if(typeof ownershipGuardLockingBytecode === 'string')
		{
			throw new Error(`Failed to get locking bytecode: ${ownershipGuardLockingBytecode}`);
		}

		// Create thread NFT UTXO
		threadNFTUTXO =
		{
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: binToHex(ownershipGuardLockingBytecode.bytecode),
					capability: 'none',
				},
			},
		};

		// Create ownership guard contract UTXO
		ownershipGuardUTXO = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
		};

		// Create external auth NFT UTXO
		externalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: '',
					capability: 'none',
				},
			},
		};

		// Create auction NFT UTXO
		auctionNFTUTXO = {
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

		// Add UTXOs to provider
		provider.addUtxo(registryContract.address, threadNFTUTXO);
		provider.addUtxo(ownershipGuardContract.address, ownershipGuardUTXO);
		provider.addUtxo(aliceTokenAddress, externalAuthNFTUTXO);
		provider.addUtxo(registryContract.address, auctionNFTUTXO);
	});

	it('should fail with invalid number of inputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 5 inputs instead of 4
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, testContract.unlock.call())
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
				to: ownershipGuardContract.tokenAddress,
				amount: ownershipGuardUTXO.satoshis,
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: externalAuthNFTUTXO.satoshis,
				token: {
					category: externalAuthNFTUTXO.token!.category,
					amount: externalAuthNFTUTXO.token!.amount,
					nft: {
						capability: externalAuthNFTUTXO.token!.nft!.capability,
						commitment: externalAuthNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: auctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Transaction: must have exactly 4 inputs');
	});

	it('should fail with invalid number of outputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 5 outputs instead of 4
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, testContract.unlock.call())
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
				to: ownershipGuardContract.tokenAddress,
				amount: ownershipGuardUTXO.satoshis,
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: externalAuthNFTUTXO.satoshis,
				token: {
					category: externalAuthNFTUTXO.token!.category,
					amount: externalAuthNFTUTXO.token!.amount,
					nft: {
						capability: externalAuthNFTUTXO.token!.nft!.capability,
						commitment: externalAuthNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: auctionNFTUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: 1000n,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Transaction: must have exactly 4 outputs');
	});
});
