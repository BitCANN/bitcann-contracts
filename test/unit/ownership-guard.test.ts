import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, alicePkh, aliceTokenAddress, nameTokenCategory, reversedNameTokenCategory, invalidNameTokenCategory, mockOptions } from '../common.js';
import { getDomainPartialBytecode } from '../utils.js';
import artifacts from '../artifacts.js';

describe('OwnershipGuard', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });

	// Get the domain partial bytecode for the OwnershipGuard contract
	let domainPartialBytecode = getDomainPartialBytecode(nameTokenCategory, {
		provider,
		addressType: 'p2sh32',
	});
	// OwnershipGuard expects the partial AFTER both name and TLD pushes.
	// The util returns the partial after the name push; remove the initial TLD push.
	const tldHex = Buffer.from(mockOptions.tld).toString('hex');

	const ownershipGuardContract = new Contract(BitCANNArtifacts.OwnershipGuard, [ domainPartialBytecode ], { provider });
	const testContract = new Contract(artifacts, [], { provider });

	const name = 'test';
	const nameHex = Buffer.from(name).toString('hex');

	// Create name contract for the external auth NFT
	// Use the same TLD that OwnershipGuard expects (".bch") so the locking bytecode matches
	const nameContract = new Contract(BitCANNArtifacts.Name, [ nameHex, tldHex, reversedNameTokenCategory ], { provider });

	const lockingBytecode = cashAddressToLockingBytecode(nameContract.address);
	// @ts-ignore
	console.log('lockingBytecode: ', binToHex(lockingBytecode.bytecode));

	let threadNFTUTXO: Utxo;
	let ownershipGuardUTXO: Utxo;
	let externalAuthNFTUTXO: Utxo;
	let internalAuthNFTUTXO: Utxo;
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

		// Create external auth NFT UTXO from the name contract (empty commitment)

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

		// Create internal auth NFT UTXO from the name contract (with registration ID and name)
		// 8 bytes registration ID
		const registrationId = '0000000000000001';
		// name + '.bch' in hex
		const fullName = nameHex + '2e626368';
		internalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: registrationId + fullName,
					capability: 'none',
				},
			},
		};

		// Create auction NFT UTXO for the same name (this is the invalid auction)
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
		provider.addUtxo(nameContract.address, externalAuthNFTUTXO);
		provider.addUtxo(nameContract.address, internalAuthNFTUTXO);
		provider.addUtxo(registryContract.address, auctionNFTUTXO);
	});

	it('should fail with invalid number of inputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 5 inputs instead of 4
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: nameContract.tokenAddress,
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
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: nameContract.tokenAddress,
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

	it('should fail when contract is not used at input index 1', async () =>
	{
		// Construct the transaction using the TransactionBuilder with contract at input 0 instead of 1
		transaction = new TransactionBuilder({ provider })
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: ownershipGuardContract.tokenAddress,
				amount: ownershipGuardUTXO.satoshis,
			})
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
				to: nameContract.tokenAddress,
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
		await expect(txPromise).rejects.toThrow('Input 1: ownership guard contract UTXO must be at this index');
	});

	it('should fail when output 1 has token category', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: nameContract.tokenAddress,
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
		await expect(txPromise).rejects.toThrow('Output 1: must not have any token category (pure BCH only)');
	});

	it('should fail when output 1 locking bytecode does not match input 1', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: testContract.tokenAddress,
				amount: ownershipGuardUTXO.satoshis,
			})
			.addOutput({
				to: nameContract.tokenAddress,
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
		await expect(txPromise).rejects.toThrow('Input 1: locking bytecode must match output 1');
	});

	it('should fail when auction NFT locking bytecode does not match registry', async () =>
	{
		// Create auction NFT with different locking bytecode
		const differentAuctionNFTUTXO: Utxo = {
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

		provider.addUtxo(testContract.address, differentAuctionNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(differentAuctionNFTUTXO, testContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + differentAuctionNFTUTXO.token!.amount,
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
				to: nameContract.tokenAddress,
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
				amount: differentAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: auction NFT locking bytecode does not match registry input\'s locking bytecode');
	});

	it('should fail when external auth NFT token category does not match registry', async () =>
	{
		// Create external auth NFT with invalid category
		const invalidExternalAuthNFTUTXO: Utxo = {
			...randomUtxo(),
			token: {
				category: invalidNameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: '',
					capability: 'none',
				},
			},
		};

		provider.addUtxo(nameContract.address, invalidExternalAuthNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(invalidExternalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: nameContract.tokenAddress,
				amount: invalidExternalAuthNFTUTXO.satoshis,
				token: {
					category: invalidExternalAuthNFTUTXO.token!.category,
					amount: invalidExternalAuthNFTUTXO.token!.amount,
					nft: {
						capability: invalidExternalAuthNFTUTXO.token!.nft!.capability,
						commitment: invalidExternalAuthNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: auctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: external auth NFT token category prefix must match registry');
	});

	it('should fail when output 2 token category does not match registry', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: nameContract.tokenAddress,
				amount: externalAuthNFTUTXO.satoshis,
				token: {
					category: invalidNameTokenCategory,
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
		await expect(txPromise).rejects.toThrow('Output 2: external auth NFT token category prefix must match registry');
	});

	it('should fail when auction NFT token category does not match registry', async () =>
	{
		// Create auction NFT with invalid category
		const invalidAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: invalidNameTokenCategory + '01',
				amount: BigInt(1),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, invalidAuctionNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: ownershipGuardContract.tokenAddress,
				amount: ownershipGuardUTXO.satoshis,
			})
			.addOutput({
				to: nameContract.tokenAddress,
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
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: auction NFT token category prefix must match registry');
	});

	it('should fail when auction NFT capability is not mutable', async () =>
	{
		// Create auction NFT with invalid capability
		const invalidCapabilityAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: binToHex(alicePkh) + nameHex,
					capability: 'none',
				},
			},
		};

		provider.addUtxo(registryContract.address, invalidCapabilityAuctionNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(invalidCapabilityAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + invalidCapabilityAuctionNFTUTXO.token!.amount,
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
				to: nameContract.tokenAddress,
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
				amount: invalidCapabilityAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 3: auction NFT capability must be mutable (0x01)');
	});

	it('should fail when external auth NFT commitment does not match output', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: nameContract.tokenAddress,
				amount: externalAuthNFTUTXO.satoshis,
				token: {
					category: externalAuthNFTUTXO.token!.category,
					amount: externalAuthNFTUTXO.token!.amount,
					nft: {
						capability: externalAuthNFTUTXO.token!.nft!.capability,
						// 'different' in hex
						commitment: '646966666572656e74',
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: auctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 2: external auth NFT commitment must match input 2');
	});

	it('should fail when external auth NFT has non-empty commitment', async () =>
	{
		// Create external auth NFT with non-empty commitment
		const nonEmptyCommitmentExternalAuthNFTUTXO: Utxo = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					// 'notempty' in hex
					commitment: '6e6f74656d707479',
					capability: 'none',
				},
			},
		};

		provider.addUtxo(nameContract.address, nonEmptyCommitmentExternalAuthNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(nonEmptyCommitmentExternalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: nameContract.tokenAddress,
				amount: nonEmptyCommitmentExternalAuthNFTUTXO.satoshis,
				token: {
					category: nonEmptyCommitmentExternalAuthNFTUTXO.token!.category,
					amount: nonEmptyCommitmentExternalAuthNFTUTXO.token!.amount,
					nft: {
						capability: nonEmptyCommitmentExternalAuthNFTUTXO.token!.nft!.capability,
						commitment: nonEmptyCommitmentExternalAuthNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: auctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: external auth NFT must have empty commitment');
	});

	it('should fail when external auth NFT locking bytecode does not match name contract', async () =>
	{
		// Create external auth NFT with different locking bytecode
		const differentLockingBytecodeExternalAuthNFTUTXO: Utxo = {
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

		provider.addUtxo(testContract.address, differentLockingBytecodeExternalAuthNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(differentLockingBytecodeExternalAuthNFTUTXO, testContract.unlock.call())
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
				to: testContract.tokenAddress,
				amount: differentLockingBytecodeExternalAuthNFTUTXO.satoshis,
				token: {
					category: differentLockingBytecodeExternalAuthNFTUTXO.token!.category,
					amount: differentLockingBytecodeExternalAuthNFTUTXO.token!.amount,
					nft: {
						capability: differentLockingBytecodeExternalAuthNFTUTXO.token!.nft!.capability,
						commitment: differentLockingBytecodeExternalAuthNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: aliceAddress,
				amount: auctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Input 2: external auth NFT locking bytecode must match name contract');
	});

	it('should fail when token amount accumulation does not match', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount - 1n,
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
				to: nameContract.tokenAddress,
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
		await expect(txPromise).rejects.toThrow('Output 0: token amount must equal input 0 + input 3 amounts (accumulation)');
	});

	it('should fail when reward output has token category', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: nameContract.tokenAddress,
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
				to: aliceTokenAddress,
				amount: auctionNFTUTXO.satoshis,
				token: {
					category: nameTokenCategory,
					amount: BigInt(1),
					nft: {
						commitment: '',
						capability: 'none',
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('Output 3: reward must be pure BCH (no token category)');
	});

	it('should successfully penalize invalid registration when all conditions are met', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
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
				to: nameContract.tokenAddress,
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

		// This should succeed
		await expect(txPromise).resolves.toBeDefined();
	});

	it('should fail when thread NFT commitment does not match ownership guard locking bytecode', async () =>
	{
		// Create thread NFT with wrong commitment
		const wrongThreadNFTUTXO: Utxo = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					// 'wrongcommitment' in hex
					commitment: '77726f6e67636f6d6d69746d656e74',
					capability: 'none',
				},
			},
		};

		provider.addUtxo(registryContract.address, wrongThreadNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(wrongThreadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: wrongThreadNFTUTXO.satoshis,
				token: {
					category: wrongThreadNFTUTXO.token!.category,
					amount: wrongThreadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: wrongThreadNFTUTXO.token!.nft!.capability,
						commitment: wrongThreadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: ownershipGuardContract.tokenAddress,
				amount: ownershipGuardUTXO.satoshis,
			})
			.addOutput({
				to: nameContract.tokenAddress,
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

		// This should fail because the thread NFT commitment doesn't match the ownership guard locking bytecode
		await expect(txPromise).rejects.toThrow(FailedRequireError);
	});

	it('should fail when auction NFT name does not match external auth NFT name', async () =>
	{
		// Create auction NFT with different name
		const differentNameAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(2000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: binToHex(alicePkh) + Buffer.from('different').toString('hex'),
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, differentNameAuctionNFTUTXO);

		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(differentNameAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + differentNameAuctionNFTUTXO.token!.amount,
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
				to: nameContract.tokenAddress,
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
				amount: differentNameAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		// This should fail because the auction NFT name doesn't match the external auth NFT name
		await expect(txPromise).rejects.toThrow(FailedRequireError);
	});

	it('should fail when output 0 locking bytecode does not match registry', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: testContract.tokenAddress,
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
				to: nameContract.tokenAddress,
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
	});

	it('should fail when output 0 token category does not match registry', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: invalidNameTokenCategory,
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
				to: nameContract.tokenAddress,
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
	});

	it('should fail when output 0 token capability does not match input 0', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: 'mutable',
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: ownershipGuardContract.tokenAddress,
				amount: ownershipGuardUTXO.satoshis,
			})
			.addOutput({
				to: nameContract.tokenAddress,
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
	});

	it('should fail when output 0 token commitment does not match input 0', async () =>
	{
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(ownershipGuardUTXO, ownershipGuardContract.unlock.call())
			.addInput(externalAuthNFTUTXO, nameContract.unlock.useAuth(2n))
			.addInput(auctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + auctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						// 'differentcommitment' in hex
						commitment: '646966666572656e74636f6d6d69746d656e74',
					},
				},
			})
			.addOutput({
				to: ownershipGuardContract.tokenAddress,
				amount: ownershipGuardUTXO.satoshis,
			})
			.addOutput({
				to: nameContract.tokenAddress,
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
	});
});
