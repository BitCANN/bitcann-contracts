import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, nameTokenCategory, reversedNameTokenCategory, mockOptions, aliceTemplate, aliceTokenAddress, invalidNameTokenCategory } from '../common.js';
import artifacts from '../artifacts.js';
import { padVmNumber } from '../utils.js';

describe('Name', () =>
{
	const provider = new MockNetworkProvider();

	const name = 'test';
	const nameHex = Buffer.from(name).toString('hex');

	const differentName = 'test2';
	const differentNameHex = Buffer.from(differentName).toString('hex');

	const tldHex = Buffer.from(mockOptions.tld).toString('hex');

	const nameContract = new Contract(BitCANNArtifacts.Name, [ nameHex, tldHex, reversedNameTokenCategory ], { provider });
	const differentNameContract = new Contract(BitCANNArtifacts.Name, [ differentNameHex, tldHex, reversedNameTokenCategory ], { provider });


	const testContract = new Contract(artifacts, [], { provider });

	let externalAuthNFTUTXO: Utxo;
	let internalAuthNFTUTXO: Utxo;
	let newExternalAuthNFTUTXO: Utxo;
	let newInternalAuthNFTUTXO: Utxo;
	let differentNameExternalAuthNFTUTXO: Utxo;
	let differentNameInternalAuthNFTUTXO: Utxo;

	let pureBCHUTXO: Utxo;
	let ownershipNFTUTXO: Utxo;
	let newOwnershipNFTUTXO: Utxo;
	let differentNameOwnershipNFTUTXO: Utxo;
	let transaction: TransactionBuilder;

	beforeAll(() =>
	{

		// Create external auth NFT UTXO
		externalAuthNFTUTXO =
		{
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: '',
					capability: 'none' as const,
				},
			},
		};

		// Create internal auth NFT UTXO
		internalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: padVmNumber(BigInt(1), 8),
					capability: 'none' as const,
				},
			},
		};

		// Create pure BCH UTXO
		pureBCHUTXO = {
			...randomUtxo({ satoshis: BigInt(500000) }),
		};

		// Create invalid external auth NFT UTXO (for resolveOwnerConflict)
		newExternalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: '',
					capability: 'none' as const,
				},
			},
		};

		// Create invalid internal auth NFT UTXO (for resolveOwnerConflict)
		newInternalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: padVmNumber(BigInt(2), 8),
					capability: 'none' as const,
				},
			},
		};

		differentNameExternalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: '',
					capability: 'none' as const,
				},
			},
		};

		differentNameInternalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: padVmNumber(BigInt(3), 8),
					capability: 'none' as const,
				},
			},
		};

		// Create valid ownership NFT UTXO (for resolveOwnerConflict)

		ownershipNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: padVmNumber(BigInt(1), 8) + nameHex + tldHex,
					capability: 'none' as const,
				},
			},
		};

		newOwnershipNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: padVmNumber(BigInt(2), 8) + nameHex + tldHex,
					capability: 'none' as const,
				},
			},
		};

		differentNameOwnershipNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: padVmNumber(BigInt(3), 8) + differentNameHex + tldHex,
					capability: 'none' as const,
				},
			},
		};

		// Create invalid ownership NFT UTXO (for resolveOwnerConflict)

		// Add UTXOs to provider
		provider.addUtxo(nameContract.address, externalAuthNFTUTXO);
		provider.addUtxo(nameContract.address, internalAuthNFTUTXO);

		provider.addUtxo(nameContract.address, newExternalAuthNFTUTXO);
		provider.addUtxo(nameContract.address, newInternalAuthNFTUTXO);

		provider.addUtxo(aliceAddress, pureBCHUTXO);
		provider.addUtxo(aliceAddress, ownershipNFTUTXO);
		provider.addUtxo(aliceAddress, newOwnershipNFTUTXO);

		provider.addUtxo(differentNameContract.address, differentNameExternalAuthNFTUTXO);
		provider.addUtxo(differentNameContract.address, differentNameInternalAuthNFTUTXO);

		provider.addUtxo(aliceAddress, pureBCHUTXO);
		provider.addUtxo(aliceAddress, differentNameOwnershipNFTUTXO);
		provider.addUtxo(aliceAddress, newOwnershipNFTUTXO);
	});

	// Tests for burn function
	describe('useAuth', () =>
	{
		// NOTE: useAuth value non 1 is already tested in the `ownership-guard.test.ts`.

		it('should pass with valid use of internal and external auth NFT', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXO, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXO.token!.category,
						amount: internalAuthNFTUTXO.token!.amount,
						nft: {
							capability: internalAuthNFTUTXO.token!.nft!.capability,
							commitment: internalAuthNFTUTXO.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: ownershipNFTUTXO.satoshis,
					token: {
						category: ownershipNFTUTXO.token!.category,
						amount: ownershipNFTUTXO.token!.amount,
						nft: {
							capability: ownershipNFTUTXO.token!.nft!.capability,
							commitment: ownershipNFTUTXO.token!.nft!.commitment,
						},
					},
				});

			const txPromise = transaction.send();

			await expect(txPromise).resolves.toBeDefined();
		});

		it('should fail due to incorrect lockingbytecode of internalauth output', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXO, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: testContract.tokenAddress,
					amount: internalAuthNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXO.token!.category,
						amount: internalAuthNFTUTXO.token!.amount,
						nft: {
							capability: internalAuthNFTUTXO.token!.nft!.capability,
							commitment: internalAuthNFTUTXO.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: ownershipNFTUTXO.satoshis,
					token: {
						category: ownershipNFTUTXO.token!.category,
						amount: ownershipNFTUTXO.token!.amount,
						nft: {
							capability: ownershipNFTUTXO.token!.nft!.capability,
							commitment: ownershipNFTUTXO.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Auth input: locking bytecode must match active output');
		});

		it('should fail due to incorrect token category of internalauth input', async () =>
		{
			const internalAuthNFTUTXOWithDIfferentCategory = {
				...randomUtxo(),
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none' as const,
					},
				},
			};

			provider.addUtxo(nameContract.address, internalAuthNFTUTXOWithDIfferentCategory);

			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXOWithDIfferentCategory, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXOWithDIfferentCategory.satoshis,
					token: {
						category: internalAuthNFTUTXOWithDIfferentCategory.token!.category,
						amount: internalAuthNFTUTXOWithDIfferentCategory.token!.amount,
						nft: {
							capability: internalAuthNFTUTXOWithDIfferentCategory.token!.nft!.capability,
							commitment: internalAuthNFTUTXOWithDIfferentCategory.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: ownershipNFTUTXO.satoshis,
					token: {
						category: ownershipNFTUTXO.token!.category,
						amount: ownershipNFTUTXO.token!.amount,
						nft: {
							capability: ownershipNFTUTXO.token!.nft!.capability,
							commitment: ownershipNFTUTXO.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Auth input: token category must match name category');
		});

		it('should fail due to incorrect token category of internalauth output', async () =>
		{
			const internalAuthNFTUTXOCloneWithDIfferentCategory: Utxo = {
				...randomUtxo(),
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'minting',
					},
				},
			};

			provider.addUtxo(testContract.address, internalAuthNFTUTXOCloneWithDIfferentCategory);

			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXOCloneWithDIfferentCategory, testContract.unlock.call())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: testContract.tokenAddress,
					amount: internalAuthNFTUTXOCloneWithDIfferentCategory.satoshis,
					token: {
						category: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.category,
						amount: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.amount,
						nft: {
							capability: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.nft!.capability,
							commitment: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXOCloneWithDIfferentCategory.satoshis,
					token: {
						category: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.category,
						amount: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.amount,
						nft: {
							capability: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.nft!.capability,
							commitment: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: ownershipNFTUTXO.satoshis,
					token: {
						category: ownershipNFTUTXO.token!.category,
						amount: ownershipNFTUTXO.token!.amount,
						nft: {
							capability: ownershipNFTUTXO.token!.nft!.capability,
							commitment: ownershipNFTUTXO.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Auth output: token category must match name category');
		});

		it('should fail due to incorrect nft commitment of internalauth output', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXO, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXO.token!.category,
						amount: internalAuthNFTUTXO.token!.amount,
						nft: {
							capability: internalAuthNFTUTXO.token!.nft!.capability,
							commitment: padVmNumber(BigInt(3), 8),
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: ownershipNFTUTXO.satoshis,
					token: {
						category: ownershipNFTUTXO.token!.category,
						amount: ownershipNFTUTXO.token!.amount,
						nft: {
							capability: ownershipNFTUTXO.token!.nft!.capability,
							commitment: ownershipNFTUTXO.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Auth input: NFT commitment must match active output');
		});

		it('should fail due to incorrect tokencategory of ownership input', async () =>
		{
			const ownershipNFTUTXOWithDIfferentCategory = {
				...randomUtxo(),
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};

			provider.addUtxo(nameContract.address, ownershipNFTUTXOWithDIfferentCategory);

			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXO, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(ownershipNFTUTXOWithDIfferentCategory, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXO.token!.category,
						amount: internalAuthNFTUTXO.token!.amount,
						nft: {
							capability: internalAuthNFTUTXO.token!.nft!.capability,
							commitment: padVmNumber(BigInt(1), 8),
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: ownershipNFTUTXOWithDIfferentCategory.satoshis,
					token: {
						category: ownershipNFTUTXOWithDIfferentCategory.token!.category,
						amount: ownershipNFTUTXOWithDIfferentCategory.token!.amount,
						nft: {
							capability: ownershipNFTUTXOWithDIfferentCategory.token!.nft!.capability,
							commitment: ownershipNFTUTXOWithDIfferentCategory.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Ownership input: ownership NFT token category must match name category');
		});

		it('should fail due to incorrect tokencategory of ownership output', async () =>
		{
			const internalAuthNFTUTXOCloneWithDIfferentCategory: Utxo = {
				...randomUtxo(),
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'minting',
					},
				},
			};

			provider.addUtxo(testContract.address, internalAuthNFTUTXOCloneWithDIfferentCategory);

			const ownershipNFTUTXOWithDIfferentCategory = {
				...randomUtxo(),
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8) + nameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};

			provider.addUtxo(nameContract.address, ownershipNFTUTXOWithDIfferentCategory);

			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXOCloneWithDIfferentCategory, testContract.unlock.call())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: testContract.tokenAddress,
					amount: internalAuthNFTUTXOCloneWithDIfferentCategory.satoshis,
					token: {
						category: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.category,
						amount: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.amount,
						nft: {
							capability: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.nft!.capability,
							commitment: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXO.token!.category,
						amount: internalAuthNFTUTXO.token!.amount,
						nft: {
							capability: internalAuthNFTUTXO.token!.nft!.capability,
							commitment: padVmNumber(BigInt(1), 8),
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: ownershipNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXOCloneWithDIfferentCategory.token!.category,
						amount: ownershipNFTUTXO.token!.amount,
						nft: {
							capability: ownershipNFTUTXO.token!.nft!.capability,
							commitment: ownershipNFTUTXO.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Ownership output: token category must match active input');
		});

		it('should fail due to incorrect commitment of ownership output', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXO, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(differentNameOwnershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXO.token!.category,
						amount: internalAuthNFTUTXO.token!.amount,
						nft: {
							capability: internalAuthNFTUTXO.token!.nft!.capability,
							commitment: internalAuthNFTUTXO.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: differentNameOwnershipNFTUTXO.satoshis,
					token: {
						category: differentNameOwnershipNFTUTXO.token!.category,
						amount: differentNameOwnershipNFTUTXO.token!.amount,
						nft: {
							capability: differentNameOwnershipNFTUTXO.token!.nft!.capability,
							commitment: differentNameOwnershipNFTUTXO.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Ownership input: ownership NFT name must match contract name + TLD');
		});

		it('should fail due to mismatching commitment of internal auth NFT and ownership NFT registration ID', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(newInternalAuthNFTUTXO, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: newInternalAuthNFTUTXO.satoshis,
					token: {
						category: newInternalAuthNFTUTXO.token!.category,
						amount: newInternalAuthNFTUTXO.token!.amount,
						nft: {
							capability: newInternalAuthNFTUTXO.token!.nft!.capability,
							commitment: newInternalAuthNFTUTXO.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: ownershipNFTUTXO.satoshis,
					token: {
						category: ownershipNFTUTXO.token!.category,
						amount: ownershipNFTUTXO.token!.amount,
						nft: {
							capability: ownershipNFTUTXO.token!.nft!.capability,
							commitment: ownershipNFTUTXO.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Auth input: internal auth NFT commitment must match ownership NFT registration ID');
		});

		it('should fail due to mismatching commitment of ownership nft output', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXO, nameContract.unlock.useAuth(BigInt(1)))
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXO.token!.category,
						amount: internalAuthNFTUTXO.token!.amount,
						nft: {
							capability: internalAuthNFTUTXO.token!.nft!.capability,
							commitment: internalAuthNFTUTXO.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: aliceTokenAddress,
					amount: ownershipNFTUTXO.satoshis,
					token: {
						category: ownershipNFTUTXO.token!.category,
						amount: ownershipNFTUTXO.token!.amount,
						nft: {
							capability: ownershipNFTUTXO.token!.nft!.capability,
							commitment: padVmNumber(BigInt(3), 8) + nameHex + tldHex,
						},
					},
				});
			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Ownership output: NFT commitment must match active input');
		});
	});


	// Tests for penaliseInvalidName function
	describe('penaliseInvalidName', () =>
	{
		it('should fail with invalid number of inputs', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(internalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: aliceAddress,
					amount: externalAuthNFTUTXO.satoshis + internalAuthNFTUTXO.satoshis + pureBCHUTXO.satoshis,
				});

			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Transaction: must have exactly 3 inputs');
		});

		it('should fail with invalid number of outputs', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(internalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: aliceAddress,
					amount: externalAuthNFTUTXO.satoshis + internalAuthNFTUTXO.satoshis + pureBCHUTXO.satoshis,
				})
				.addOutput({
					to: aliceAddress,
					amount: BigInt(1000),
				});

			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Transaction: must have exactly 1 output');
		});
	});

	// Tests for resolveOwnerConflict function
	describe('resolveOwnerConflict', () =>
	{
		it('should fail with invalid number of inputs', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addInput(pureBCHUTXO, testContract.unlock.call())
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
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXO.token!.category,
						amount: internalAuthNFTUTXO.token!.amount,
						nft: {
							capability: internalAuthNFTUTXO.token!.nft!.capability,
							commitment: internalAuthNFTUTXO.token!.nft!.commitment,
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
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(pureBCHUTXO, testContract.unlock.call())
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
					to: nameContract.tokenAddress,
					amount: internalAuthNFTUTXO.satoshis,
					token: {
						category: internalAuthNFTUTXO.token!.category,
						amount: internalAuthNFTUTXO.token!.amount,
						nft: {
							capability: internalAuthNFTUTXO.token!.nft!.capability,
							commitment: internalAuthNFTUTXO.token!.nft!.commitment,
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
			await expect(txPromise).rejects.toThrow('Transaction: must have exactly 3 outputs');
		});
	});

	// Tests for burn function
	describe('burn', () =>
	{
		it('should fail with invalid number of inputs', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: aliceAddress,
					amount: externalAuthNFTUTXO.satoshis + internalAuthNFTUTXO.satoshis + pureBCHUTXO.satoshis,
				});

			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Transaction: must have exactly 3 inputs');
		});

		it('should fail with invalid number of outputs', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: aliceAddress,
					amount: externalAuthNFTUTXO.satoshis + internalAuthNFTUTXO.satoshis + pureBCHUTXO.satoshis,
				})
				.addOutput({
					to: aliceAddress,
					amount: BigInt(1000),
				});

			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Transaction: must have exactly 1 output');
		});
	});

	describe('Add Records', () =>
	{
		it('should fail with invalid number of inputs', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: aliceAddress,
					amount: externalAuthNFTUTXO.satoshis + internalAuthNFTUTXO.satoshis + pureBCHUTXO.satoshis,
				});

			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Transaction: must have exactly 3 inputs');
		});

		it('should fail with invalid number of outputs', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: aliceAddress,
					amount: externalAuthNFTUTXO.satoshis + internalAuthNFTUTXO.satoshis + pureBCHUTXO.satoshis,
				})
				.addOutput({
					to: aliceAddress,
					amount: BigInt(1000),
				});

			const txPromise = transaction.send();

			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Transaction: must have exactly 1 output');
		});
	});
});