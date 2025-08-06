import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { BitCANNArtifacts } from '../../lib/index.js';
import { aliceAddress, nameTokenCategory, reversedNameTokenCategory, mockOptions } from '../common.js';
import artifacts from '../artifacts.js';

describe('Name', () =>
{
	const provider = new MockNetworkProvider();

	const name = 'test';
	const nameHex = Buffer.from(name).toString('hex');

	const nameContract = new Contract(BitCANNArtifacts.Name, [ nameHex, mockOptions.tld, reversedNameTokenCategory ], { provider });
	const testContract = new Contract(artifacts, [], { provider });

	let externalAuthNFTUTXO: Utxo;
	let internalAuthNFTUTXO: Utxo;
	let pureBCHUTXO: Utxo;
	let validExternalAuthNFTUTXO: Utxo;
	let validInternalAuthNFTUTXO: Utxo;
	let invalidExternalAuthNFTUTXO: Utxo;
	let invalidInternalAuthNFTUTXO: Utxo;
	let transaction: TransactionBuilder;

	beforeAll(() =>
	{

		// Create external auth NFT UTXO
		externalAuthNFTUTXO =
		{
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
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
				amount: BigInt(1),
				nft: {
					commitment: '0000000000000001' + nameHex + Buffer.from(mockOptions.tld).toString('hex'),
					capability: 'none' as const,
				},
			},
		};

		// Create pure BCH UTXO
		pureBCHUTXO = {
			...randomUtxo({ satoshis: BigInt(500000) }),
		};

		// Create valid external auth NFT UTXO (for resolveOwnerConflict)
		validExternalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: '',
					capability: 'none' as const,
				},
			},
		};

		// Create valid internal auth NFT UTXO (for resolveOwnerConflict)
		validInternalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: '0000000000000001' + nameHex + Buffer.from(mockOptions.tld).toString('hex'),
					capability: 'none' as const,
				},
			},
		};

		// Create invalid external auth NFT UTXO (for resolveOwnerConflict)
		invalidExternalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: '',
					capability: 'none' as const,
				},
			},
		};

		// Create invalid internal auth NFT UTXO (for resolveOwnerConflict)
		invalidInternalAuthNFTUTXO = {
			...randomUtxo(),
			token: {
				category: nameTokenCategory,
				amount: BigInt(1),
				nft: {
					commitment: '0000000000000002' + nameHex + Buffer.from(mockOptions.tld).toString('hex'),
					capability: 'none' as const,
				},
			},
		};

		// Add UTXOs to provider
		provider.addUtxo(nameContract.address, externalAuthNFTUTXO);
		provider.addUtxo(nameContract.address, internalAuthNFTUTXO);
		provider.addUtxo(aliceAddress, pureBCHUTXO);
		provider.addUtxo(nameContract.address, validExternalAuthNFTUTXO);
		provider.addUtxo(nameContract.address, validInternalAuthNFTUTXO);
		provider.addUtxo(nameContract.address, invalidExternalAuthNFTUTXO);
		provider.addUtxo(nameContract.address, invalidInternalAuthNFTUTXO);
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
				.addInput(validExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(validInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(invalidExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(invalidInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: validExternalAuthNFTUTXO.satoshis,
					token: {
						category: validExternalAuthNFTUTXO.token!.category,
						amount: validExternalAuthNFTUTXO.token!.amount,
						nft: {
							capability: validExternalAuthNFTUTXO.token!.nft!.capability,
							commitment: validExternalAuthNFTUTXO.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: nameContract.tokenAddress,
					amount: validInternalAuthNFTUTXO.satoshis,
					token: {
						category: validInternalAuthNFTUTXO.token!.category,
						amount: validInternalAuthNFTUTXO.token!.amount,
						nft: {
							capability: validInternalAuthNFTUTXO.token!.nft!.capability,
							commitment: validInternalAuthNFTUTXO.token!.nft!.commitment,
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
				.addInput(validExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(validInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(invalidExternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(invalidInternalAuthNFTUTXO, nameContract.unlock.resolveOwnerConflict())
				.addInput(pureBCHUTXO, testContract.unlock.call())
				.addOutput({
					to: nameContract.tokenAddress,
					amount: validExternalAuthNFTUTXO.satoshis,
					token: {
						category: validExternalAuthNFTUTXO.token!.category,
						amount: validExternalAuthNFTUTXO.token!.amount,
						nft: {
							capability: validExternalAuthNFTUTXO.token!.nft!.capability,
							commitment: validExternalAuthNFTUTXO.token!.nft!.commitment,
						},
					},
				})
				.addOutput({
					to: nameContract.tokenAddress,
					amount: validInternalAuthNFTUTXO.satoshis,
					token: {
						category: validInternalAuthNFTUTXO.token!.category,
						amount: validInternalAuthNFTUTXO.token!.amount,
						nft: {
							capability: validInternalAuthNFTUTXO.token!.nft!.capability,
							commitment: validInternalAuthNFTUTXO.token!.nft!.commitment,
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
});