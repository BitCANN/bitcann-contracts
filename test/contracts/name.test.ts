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
			// Create internal auth NFT with actual name for penaliseInvalidName tests
			const internalAuthNFTWithName: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + nameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(internalAuthNFTWithName, nameContract.unlock.penaliseInvalidName(BigInt(1)))
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
			// Create internal auth NFT with actual name for penaliseInvalidName tests
			const internalAuthNFTWithName: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + nameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(internalAuthNFTWithName, nameContract.unlock.penaliseInvalidName(BigInt(1)))
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

		it('should fail if input 0 locking bytecode does not match contract', async () =>
		{
			const specialName = 'test_ame';
			const specialNameHex = Buffer.from(specialName).toString('hex');
			const internalAuthNFTUTXOWithSpecial: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + specialNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			provider.addUtxo(testContract.address, internalAuthNFTUTXOWithSpecial);

			transaction = new TransactionBuilder({ provider })
				.addInput(internalAuthNFTUTXOWithSpecial, testContract.unlock.call())
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });

			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 0: external auth NFT locking bytecode must match name contract');
		});

		it('should fail if input 1 locking bytecode does not match contract', async () =>
		{
			const specialName = 'test_ame';
			const specialNameHex = Buffer.from(specialName).toString('hex');
			const internalAuthNFTUTXOWithSpecial: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + specialNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			provider.addUtxo(testContract.address, internalAuthNFTUTXOWithSpecial);

			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithSpecial, testContract.unlock.call())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });

			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 1: internal auth NFT locking bytecode must match name contract');
		});

		it('should fail if input 0 token category does not match name category', async () =>
		{
			const wrongCategoryUTXO: Utxo = {
				...externalAuthNFTUTXO,
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none' as const,
					},
				},
			};
			provider.addUtxo(aliceAddress, wrongCategoryUTXO);
			const internalAuthNFTUTXOWithName: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + nameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			provider.addUtxo(nameContract.address, internalAuthNFTUTXOWithName);
			transaction = new TransactionBuilder({ provider })
				.addInput(wrongCategoryUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(internalAuthNFTUTXOWithName, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: aliceAddress,
					amount: wrongCategoryUTXO.satoshis + internalAuthNFTUTXOWithName.satoshis + pureBCHUTXO.satoshis,
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 0: external auth NFT token category must match name category');
		});

		it('should fail if input 1 token category does not match name category', async () =>
		{
			const wrongCategoryUTXO: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					category: invalidNameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(1), 8),
						capability: 'none' as const,
					},
				},
			};
			provider.addUtxo(aliceAddress, wrongCategoryUTXO);
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(wrongCategoryUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: aliceAddress,
					amount: externalAuthNFTUTXO.satoshis + wrongCategoryUTXO.satoshis + pureBCHUTXO.satoshis,
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 1: internal auth NFT token category must match name category');
		});

		it('should fail if input 0 external auth NFT does not have empty commitment', async () =>
		{
			const wrongCommitmentUTXO: Utxo = {
				...externalAuthNFTUTXO,
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: 'abcd',
						capability: 'none' as const,
					},
				},
			};
			provider.addUtxo(aliceAddress, wrongCommitmentUTXO);
			const internalAuthNFTUTXOWithName: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + nameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			provider.addUtxo(nameContract.address, internalAuthNFTUTXOWithName);
			transaction = new TransactionBuilder({ provider })
				.addInput(wrongCommitmentUTXO, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(internalAuthNFTUTXOWithName, nameContract.unlock.penaliseInvalidName(BigInt(1)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: aliceAddress,
					amount: wrongCommitmentUTXO.satoshis + internalAuthNFTUTXOWithName.satoshis + pureBCHUTXO.satoshis,
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 0: external auth NFT must have empty commitment');
		});

		it('should fail when character is a hyphen', async () =>
		{
			const hyphenName = 'test-name';
			const hyphenNameHex = Buffer.from(hyphenName).toString('hex');
			const internalAuthNFTUTXOWithHyphen: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + hyphenNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithHyphen, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			await expect(transaction.send()).rejects.toThrow(FailedRequireError);
		});

		it('should fail when character is lowercase', async () =>
		{
			const lowerName = 'testname';
			const lowerNameHex = Buffer.from(lowerName).toString('hex');
			const internalAuthNFTUTXOWithLower: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + lowerNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithLower, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			await expect(transaction.send()).rejects.toThrow(FailedRequireError);
		});

		it('should fail when character is uppercase', async () =>
		{
			const upperName = 'testName';
			const upperNameHex = Buffer.from(upperName).toString('hex');
			const internalAuthNFTUTXOWithUpper: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + upperNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithUpper, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			await expect(transaction.send()).rejects.toThrow(FailedRequireError);
		});

		it('should fail when character is a digit', async () =>
		{
			const digitName = 'test1ame';
			const digitNameHex = Buffer.from(digitName).toString('hex');
			const internalAuthNFTUTXOWithDigit: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + digitNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithDigit, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			await expect(transaction.send()).rejects.toThrow(FailedRequireError);
		});

		it('should pass for special character @', async () =>
		{
			const specialName = 'test@ame';
			const specialNameHex = Buffer.from(specialName).toString('hex');
			const internalAuthNFTUTXOWithSpecial: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + specialNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithSpecial, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			await expect(transaction.send()).resolves.not.toThrow();
		});

		it('should pass for special character _', async () =>
		{
			const specialName = 'test_ame';
			const specialNameHex = Buffer.from(specialName).toString('hex');
			const internalAuthNFTUTXOWithSpecial: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + specialNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithSpecial, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			await expect(transaction.send()).resolves.not.toThrow();
		});

		it('should pass for special character .', async () =>
		{
			const specialName = 'test.ame';
			const specialNameHex = Buffer.from(specialName).toString('hex');
			const internalAuthNFTUTXOWithSpecial: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + specialNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithSpecial, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			await expect(transaction.send()).resolves.not.toThrow();
		});

		it('should pass for special character !', async () =>
		{
			const specialName = 'test!ame';
			const specialNameHex = Buffer.from(specialName).toString('hex');
			const internalAuthNFTUTXOWithSpecial: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + specialNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithSpecial, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			await expect(transaction.send()).resolves.not.toThrow();
		});

		it('should pass for special character $', async () =>
		{
			const specialName = 'test$ame';
			const specialNameHex = Buffer.from(specialName).toString('hex');
			const internalAuthNFTUTXOWithSpecial: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					...internalAuthNFTUTXO.token!,
					nft: {
						...internalAuthNFTUTXO.token!.nft!,
						commitment: padVmNumber(BigInt(1), 8) + specialNameHex + tldHex,
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(internalAuthNFTUTXOWithSpecial, nameContract.unlock.penaliseInvalidName(BigInt(5)))
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			await expect(transaction.send()).resolves.not.toThrow();
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
			await expect(txPromise).rejects.toThrow('Transaction: must have at most 3 outputs');
		});

		it('should fail if input 0 locking bytecode does not match contract', async () =>
		{
			const fakeContract = new Contract(artifacts, [], { provider });
			const fakeUtxo: Utxo = { ...externalAuthNFTUTXO };
			provider.addUtxo(fakeContract.address, fakeUtxo);
			transaction = new TransactionBuilder({ provider })
				.addInput(fakeUtxo, fakeContract.unlock.call())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: fakeUtxo.satoshis,
					token: {
						category: fakeUtxo.token!.category,
						amount: fakeUtxo.token!.amount,
						nft: {
							capability: fakeUtxo.token!.nft!.capability,
							commitment: fakeUtxo.token!.nft!.commitment,
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
			await expect(txPromise).rejects.toThrow('Input 0: valid external auth NFT locking bytecode must match name contract');
		});

		it('should fail if input 1 locking bytecode does not match contract', async () =>
		{
			const fakeContract = new Contract(artifacts, [], { provider });
			const fakeUtxo: Utxo = { ...internalAuthNFTUTXO };
			provider.addUtxo(fakeContract.address, fakeUtxo);
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(fakeUtxo, fakeContract.unlock.call())
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
					amount: fakeUtxo.satoshis,
					token: {
						category: fakeUtxo.token!.category,
						amount: fakeUtxo.token!.amount,
						nft: {
							capability: fakeUtxo.token!.nft!.capability,
							commitment: fakeUtxo.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: aliceAddress,
					amount: pureBCHUTXO.satoshis,
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 1: valid internal auth NFT locking bytecode must match name contract');
		});

		it('should fail if input 2 locking bytecode does not match contract', async () =>
		{
			const fakeContract = new Contract(artifacts, [], { provider });
			const fakeUtxo: Utxo = { ...newExternalAuthNFTUTXO };
			provider.addUtxo(fakeContract.address, fakeUtxo);
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(fakeUtxo, fakeContract.unlock.call())
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
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 2: invalid external auth NFT locking bytecode must match name contract');
		});

		it('should fail if input 3 locking bytecode does not match contract', async () =>
		{
			const fakeContract = new Contract(artifacts, [], { provider });
			const fakeUtxo: Utxo = { ...newInternalAuthNFTUTXO };
			provider.addUtxo(fakeContract.address, fakeUtxo);
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(fakeUtxo, fakeContract.unlock.call())
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
			await expect(txPromise).rejects.toThrow('Input 3: invalid internal auth NFT locking bytecode must match name contract');
		});

		it('should fail if output 0 locking bytecode does not match contract', async () =>
		{
			const fakeContract = new Contract(artifacts, [], { provider });
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: fakeContract.tokenAddress,
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
			await expect(txPromise).rejects.toThrow('Output 0: valid external auth NFT locking bytecode must match name contract');
		});

		it('should fail if output 1 locking bytecode does not match contract', async () =>
		{
			const fakeContract = new Contract(artifacts, [], { provider });
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
					to: fakeContract.tokenAddress,
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
			await expect(txPromise).rejects.toThrow('Output 1: valid internal auth NFT locking bytecode must match name contract');
		});

		it('should fail if input 0 nftCommitment does not match output 0 nftCommitment', async () =>
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
							commitment: padVmNumber(BigInt(1), 8),
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
					to: aliceAddress,
					amount: pureBCHUTXO.satoshis,
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Output 0: valid external auth NFT must have empty commitment');
		});

		it('should fail if input 2 nftCommitment does not match output 0 nftCommitment', async () =>
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
							commitment: padVmNumber(BigInt(3), 8),
						},
					},
				})
				.addOutput({
					to: aliceAddress,
					amount: pureBCHUTXO.satoshis,
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Output 1: valid internal auth NFT commitment must match input 1');
		});

		it('should fail if input 0 valid external auth NFT does not have empty commitment', async () =>
		{
			const wrongCommitmentUtxo: Utxo = {
				...externalAuthNFTUTXO,
				token: {
					category: externalAuthNFTUTXO.token!.category,
					amount: externalAuthNFTUTXO.token!.amount,
					nft: {
						capability: externalAuthNFTUTXO.token!.nft!.capability,
						commitment: 'abcd',
					},
				},
			};
			provider.addUtxo(nameContract.address, wrongCommitmentUtxo);
			transaction = new TransactionBuilder({ provider })
				.addInput(wrongCommitmentUtxo, nameContract.unlock.resolveOwnerConflict())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: wrongCommitmentUtxo.satoshis,
					token: {
						category: wrongCommitmentUtxo.token!.category,
						amount: wrongCommitmentUtxo.token!.amount,
						nft: {
							capability: wrongCommitmentUtxo.token!.nft!.capability,
							commitment: wrongCommitmentUtxo.token!.nft!.commitment,
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
			await expect(txPromise).rejects.toThrow('Input 0: valid external auth NFT must have empty commitment');
		});

		it('should fail if input 2 invalid external auth NFT does not have empty commitment', async () =>
		{
			const wrongCommitmentUtxo: Utxo = {
				...newExternalAuthNFTUTXO,
				token: {
					category: newExternalAuthNFTUTXO.token!.category,
					amount: newExternalAuthNFTUTXO.token!.amount,
					nft: {
						capability: newExternalAuthNFTUTXO.token!.nft!.capability,
						commitment: 'abcd',
					},
				},
			};
			provider.addUtxo(nameContract.address, wrongCommitmentUtxo);
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(wrongCommitmentUtxo, nameContract.unlock.resolveOwnerConflict())
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
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 2: invalid external auth NFT must have empty commitment');
		});

		it('should fail if output 0 valid external auth NFT does not have empty commitment', async () =>
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
							commitment: 'abcd',
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
			await expect(txPromise).rejects.toThrow('Output 0: valid external auth NFT must have empty commitment');
		});

		it('should fail if output 1 valid internal auth NFT must match input 1', async () =>
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
							commitment: 'abcd',
						},
					},
				})
				.addOutput({
					to: aliceAddress,
					amount: pureBCHUTXO.satoshis,
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Output 1: valid internal auth NFT commitment must match input 1');
		});

		it('should fail if output 2 valid external auth NFT does not have empty commitment', async () =>
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
					to: nameContract.tokenAddress,
					amount: newExternalAuthNFTUTXO.satoshis,
					token: {
						category: newExternalAuthNFTUTXO.token!.category,
						amount: newExternalAuthNFTUTXO.token!.amount,
						nft: {
							capability: newExternalAuthNFTUTXO.token!.nft!.capability,
							commitment: nameHex,
						},
					},
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Output 2: change must be pure BCH (no token category)');
		});

		it('should fail if input 1 registration ID is not lower than input 3', async () =>
		{
			const highRegInternalAuth: Utxo = {
				...randomUtxo(),
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: padVmNumber(BigInt(10), 8),
						capability: 'none' as const,
					},
				},
			};
			const lowRegNewInternalAuth: Utxo = {
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
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(highRegInternalAuth, nameContract.unlock.resolveOwnerConflict())
				.addInput(newExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(lowRegNewInternalAuth, nameContract.unlock.resolveOwnerConflict())
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
					amount: highRegInternalAuth.satoshis,
					token: {
						category: highRegInternalAuth.token!.category,
						amount: highRegInternalAuth.token!.amount,
						nft: {
							capability: highRegInternalAuth.token!.nft!.capability,
							commitment: highRegInternalAuth.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: aliceAddress,
					amount: pureBCHUTXO.satoshis,
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 1: valid internal auth NFT registration ID must be lower than input 3');
		});

		it('should pass with all correct inputs/outputs', async () =>
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
				});
			await expect(transaction.send()).resolves.toBeDefined();
		});

		test('should fail if input 4 is not pure BCH', async () =>
		{
			const fakeBchUtxo = {
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

			provider.addUtxo(nameContract.tokenAddress, fakeBchUtxo);

			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(newInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(fakeBchUtxo, testContract.unlock.call())
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
			await expect(txPromise).rejects.toThrow('Input 4: funding input must be pure BCH (no token category)');
		});

		test('should fail if output 2 is not pure BCH', async () =>
		{
			const fakeBchUtxo = {
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
			provider.addUtxo(nameContract.tokenAddress, fakeBchUtxo);

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
					to: aliceTokenAddress,
					amount: fakeBchUtxo.satoshis,
					token: {
						category: fakeBchUtxo.token!.category,
						amount: fakeBchUtxo.token!.amount,
						nft: {
							capability: fakeBchUtxo.token!.nft!.capability,
							commitment: fakeBchUtxo.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Output 2: change must be pure BCH (no token category)');
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
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis });
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
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis })
				.addOutput({ to: aliceAddress, amount: BigInt(1000) });
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Transaction: must have exactly 1 output');
		});

		it('should fail if sequence number is wrong for pure BCH', async () =>
		{
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn(), { sequence: 419405 })
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis });
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 1: internal auth NFT sequence number must equal inactivity expiry time');
		});

		it('should fail if input 2 token category is not nameCategory (owner burn)', async () =>
		{
			const ownershipWithDifferentCategory: Utxo = {
				...ownershipNFTUTXO,
				token: {
					category: invalidNameTokenCategory,
					amount: ownershipNFTUTXO.token!.amount,
					nft: {
						capability: ownershipNFTUTXO.token!.nft!.capability,
						commitment: ownershipNFTUTXO.token!.nft!.commitment,
					},
				},
			};
			provider.addUtxo(aliceAddress, ownershipWithDifferentCategory);

			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(ownershipWithDifferentCategory, aliceTemplate.unlockP2PKH())
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis });
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 2: name ownership NFT token category must match name category');
		});

		it('should fail if input 2 registration ID does not match input 0 (owner burn)', async () =>
		{
			const utxoWithDifferentRegId: Utxo = {
				...externalAuthNFTUTXO,
				token: {
					category: externalAuthNFTUTXO.token!.category,
					amount: externalAuthNFTUTXO.token!.amount,
					nft: {
						capability: externalAuthNFTUTXO.token!.nft!.capability,
						commitment: padVmNumber(BigInt(11), 8),
					},
				},
			};
			provider.addUtxo(nameContract.address, utxoWithDifferentRegId);

			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(utxoWithDifferentRegId, nameContract.unlock.burn())
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis });
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 2: name ownership NFT registration ID must match input 1 commitment');
		});

		it('should fail if input 0 locking bytecode does not match contract', async () =>
		{
			const utxoFromOtherContract: Utxo = {
				...externalAuthNFTUTXO,
				token: {
					category: externalAuthNFTUTXO.token!.category,
					amount: externalAuthNFTUTXO.token!.amount,
					nft: {
						capability: externalAuthNFTUTXO.token!.nft!.capability,
						commitment: externalAuthNFTUTXO.token!.nft!.commitment,
					},
				},
			};
			provider.addUtxo(testContract.address, utxoFromOtherContract);

			transaction = new TransactionBuilder({ provider })
				.addInput(utxoFromOtherContract, testContract.unlock.call())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis });
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 0: external auth NFT locking bytecode must match name contract');
		});

		it('should fail if input 1 locking bytecode does not match contract', async () =>
		{
			const utxoFromOtherContract: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					category: internalAuthNFTUTXO.token!.category,
					amount: internalAuthNFTUTXO.token!.amount,
					nft: {
						capability: internalAuthNFTUTXO.token!.nft!.capability,
						commitment: internalAuthNFTUTXO.token!.nft!.commitment,
					},
				},
			};
			provider.addUtxo(testContract.address, utxoFromOtherContract);

			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(utxoFromOtherContract, testContract.unlock.call())
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis });
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 1: internal auth NFT locking bytecode must match name contract');
		});

		it('should fail if input 0 external auth NFT does not have empty commitment', async () =>
		{
			const wrongCommitment: Utxo = {
				...externalAuthNFTUTXO,
				token: {
					category: externalAuthNFTUTXO.token!.category,
					amount: externalAuthNFTUTXO.token!.amount,
					nft: {
						capability: externalAuthNFTUTXO.token!.nft!.capability,
						commitment: padVmNumber(BigInt(1), 8),
					},
				},
			};
			provider.addUtxo(nameContract.address, wrongCommitment);
			transaction = new TransactionBuilder({ provider })
				.addInput(wrongCommitment, nameContract.unlock.burn())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis });
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 0: external auth NFT must have empty commitment');
		});

		it('should fail if input 0 token category does not match name category', async () =>
		{
			const wrongCategory: Utxo = {
				...externalAuthNFTUTXO,
				token: {
					category: invalidNameTokenCategory,
					amount: externalAuthNFTUTXO.token!.amount,
					nft: {
						commitment: externalAuthNFTUTXO.token!.nft!.commitment,
						capability: externalAuthNFTUTXO.token!.nft!.capability,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(wrongCategory, nameContract.unlock.burn())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis });
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 0: external auth NFT token category must match name category');
		});

		it('should fail if input 1 token category does not match name category', async () =>
		{
			const wrongCategory: Utxo = {
				...internalAuthNFTUTXO,
				token: {
					category: invalidNameTokenCategory,
					amount: internalAuthNFTUTXO.token!.amount,
					nft: {
						commitment: internalAuthNFTUTXO.token!.nft!.commitment,
						capability: internalAuthNFTUTXO.token!.nft!.capability,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(wrongCategory, nameContract.unlock.burn())
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({ to: aliceAddress, amount: pureBCHUTXO.satoshis });
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Input 1: internal auth NFT token category must match name category');
		});

		it('should fail if output 0 is not pure BCH', async () =>
		{
			const fakeBchUtxo: Utxo = {
				...pureBCHUTXO,
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						commitment: '',
						capability: 'none' as const,
					},
				},
			};
			transaction = new TransactionBuilder({ provider })
				.addInput(externalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(internalAuthNFTUTXO, nameContract.unlock.burn())
				.addInput(ownershipNFTUTXO, aliceTemplate.unlockP2PKH())
				.addOutput({
					to: aliceTokenAddress,
					amount: fakeBchUtxo.satoshis,
					token: {
						category: fakeBchUtxo.token!.category,
						amount: fakeBchUtxo.token!.amount,
						nft: {
							capability: fakeBchUtxo.token!.nft!.capability,
							commitment: fakeBchUtxo.token!.nft!.commitment,
						},
					},
				});
			const txPromise = transaction.send();
			await expect(txPromise).rejects.toThrow(FailedRequireError);
			await expect(txPromise).rejects.toThrow('Output 0: change must be pure BCH (no token category)');
		});
	});

});