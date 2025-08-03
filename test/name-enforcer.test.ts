import { MockNetworkProvider, randomUtxo, TransactionBuilder, Contract, type Utxo, FailedRequireError } from 'cashscript';
import { binToHex, cashAddressToLockingBytecode } from '@bitauth/libauth';
import { BitCANNArtifacts } from '../lib/index.js';
import { aliceAddress, alicePkh, aliceTokenAddress, nameTokenCategory, reversedNameTokenCategory, invalidNameTokenCategory } from './common.js';
import { getTxOutputs } from './utils.js';
import artifacts from './artifacts.js';

describe('NameEnforcer', () =>
{
	const provider = new MockNetworkProvider();
	const registryContract = new Contract(BitCANNArtifacts.Registry, [ reversedNameTokenCategory ], { provider });
	const nameEnforcerContract = new Contract(BitCANNArtifacts.NameEnforcer, [], { provider });
	const testContract = new Contract(artifacts, [], { provider });
	const nameEnforcerLockingBytecode = cashAddressToLockingBytecode(nameEnforcerContract.address);
	// @ts-ignore
	const nameEnforcerLockingBytecodeHex = binToHex(nameEnforcerLockingBytecode.bytecode);

	const validName = 'test';
	const validNameHex = Buffer.from(validName).toString('hex');

	const invalidNameWithSpecialChar = 'test@';
	const invalidNameWithSpecialCharHex = Buffer.from(invalidNameWithSpecialChar).toString('hex');

	const invalidNameWithSpace = 'test name';
	const invalidNameWithSpaceHex = Buffer.from(invalidNameWithSpace).toString('hex');

	let threadNFTUTXO: Utxo;
	let validAuctionNFTUTXO: Utxo;
	let invalidAuctionNFTUTXO: Utxo;
	let authorizedContractUTXO: Utxo;
	let transaction: TransactionBuilder;
	let registrationId: number;

	beforeAll(() =>
	{
		authorizedContractUTXO = {
			...randomUtxo(),
		};

		provider.addUtxo(nameEnforcerContract.address, authorizedContractUTXO);

		threadNFTUTXO = {
			token: {
				category: nameTokenCategory,
				amount: BigInt(0),
				nft: {
					commitment: nameEnforcerLockingBytecodeHex,
					capability: 'none',
				},
			},
			...randomUtxo(),
		};

		provider.addUtxo(registryContract.address, threadNFTUTXO);

		registrationId = 1;

		// Create auctionNFT with valid name
		validAuctionNFTUTXO = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + validNameHex,
					capability: 'mutable',
				},
			},
		};

		// Create auctionNFT with invalid name
		invalidAuctionNFTUTXO = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + invalidNameWithSpecialCharHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, validAuctionNFTUTXO);
		provider.addUtxo(registryContract.address, invalidAuctionNFTUTXO);
	});

	it('should fail with invalid number of inputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 4 inputs instead of 3
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(1n))
			.addInput(invalidAuctionNFTUTXO, registryContract.unlock.call())
			.addInput(validAuctionNFTUTXO, registryContract.unlock.call())
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
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:28 Require statement failed at input 1 in contract NameEnforcer.cash at line 28 with the following message: Transaction: must have exactly 3 inputs.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs.length == 3, \"Transaction: must have exactly 3 inputs\");');
	});

	it('should fail with invalid number of outputs', async () =>
	{
		// Construct the transaction using the TransactionBuilder with 4 outputs instead of 3
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
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
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: 1000n,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:29 Require statement failed at input 1 in contract NameEnforcer.cash at line 29 with the following message: Transaction: must have exactly 3 outputs.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs.length == 3, \"Transaction: must have exactly 3 outputs\");');
	});

	it('should fail when contract is not used at input index 1', async () =>
	{
		// Construct the transaction using the TransactionBuilder with contract at input 0 instead of 1
		transaction = new TransactionBuilder({ provider })
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(1n))
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(invalidAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
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
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:32 Require statement failed at input 0 in contract NameEnforcer.cash at line 32 with the following message: Input 1: name enforcer contract UTXO must be at this index.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(this.activeInputIndex == 1, \"Input 1: name enforcer contract UTXO must be at this index\");');
	});

	it('should fail when using a non registry contract in input 2', async () =>
	{
		provider.addUtxo(testContract.address, invalidAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(invalidAuctionNFTUTXO, testContract.unlock.call())
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
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:37 Require statement failed at input 1 in contract NameEnforcer.cash at line 37 with the following message: Input 2: locking bytecode does not match registry input\'s locking bytecode.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.inputs[2].lockingBytecode == registryInputLockingBytecode, \"Input 2: locking bytecode does not match registry input\'s locking bytecode\");');
	});

	it('should fail due to invalid auction category', async () =>
	{
		// Create auctionNFT with invalid category
		const customInvalidAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: invalidNameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + invalidNameWithSpecialCharHex,
					capability: 'mutable',
				},
			},
		} as any;

		provider.addUtxo(registryContract.address, customInvalidAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(1n))
			.addInput(customInvalidAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + customInvalidAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: customInvalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:44 Require statement failed at input 1 in contract NameEnforcer.cash at line 44 with the following message: Input 2: auction token category does not match registry.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(auctionCategory == registryInputCategory, \"Input 2: auction token category does not match registry\");');
	});

	it('should fail due to invalid auction capability', async () =>
	{
		// Create auctionNFT with invalid capability
		const customInvalidAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + invalidNameWithSpecialCharHex,
					capability: 'none',
				},
			},
		};

		provider.addUtxo(registryContract.address, customInvalidAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(customInvalidAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + customInvalidAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: customInvalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:46 Require statement failed at input 1 in contract NameEnforcer.cash at line 46 with the following message: Input 2: auction capability must be mutable (0x01).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(auctionCapability == 0x01, \"Input 2: auction capability must be mutable (0x01)\");');
	});

	it('should fail when character is a hyphen', async () =>
	{
		// Create auctionNFT with name containing hyphen
		const hyphenName = 'test-name';
		const hyphenNameHex = Buffer.from(hyphenName).toString('hex');

		const hyphenAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + hyphenNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, hyphenAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		// Character at position 5 is '-'
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(hyphenAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + hyphenAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: hyphenAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:55 Require statement failed at input 1 in contract NameEnforcer.cash at line 55 with the following message: Character is a hyphen.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(charVal != 45, \"Character is a hyphen\");');
	});

	it('should fail when character is a lowercase letter', async () =>
	{
		// Create auctionNFT with name containing lowercase letter
		const lowercaseName = 'testname';
		const lowercaseNameHex = Buffer.from(lowercaseName).toString('hex');

		const lowercaseAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + lowercaseNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, lowercaseAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		// Character at position 1 is 'e'
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(1n))
			.addInput(lowercaseAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + lowercaseAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: lowercaseAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:57 Require statement failed at input 1 in contract NameEnforcer.cash at line 57 with the following message: Character is lowercase letter.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(!within(charVal, 97, 123), \"Character is lowercase letter\");');
	});

	it('should fail when character is an uppercase letter', async () =>
	{
		// Create auctionNFT with name containing uppercase letter
		const uppercaseName = 'TestName';
		const uppercaseNameHex = Buffer.from(uppercaseName).toString('hex');

		const uppercaseAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + uppercaseNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, uppercaseAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		// Character at position 1 is 'T'
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(1n))
			.addInput(uppercaseAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + uppercaseAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: uppercaseAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:59 Require statement failed at input 1 in contract NameEnforcer.cash at line 59 with the following message: Character is uppercase letter.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(!within(charVal, 65, 91), \"Character is uppercase letter\");');
	});

	it('should fail when character is a digit', async () =>
	{
		// Create auctionNFT with name containing digit
		const digitName = 'test123';
		const digitNameHex = Buffer.from(digitName).toString('hex');

		const digitAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + digitNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, digitAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		// Character at position 5 is '1'
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(digitAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + digitAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: digitAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:61 Require statement failed at input 1 in contract NameEnforcer.cash at line 61 with the following message: Character is a digit.');
		await expect(txPromise).rejects.toThrow('Failing statement: require(!within(charVal, 48, 58), \"Character is a digit\");');
	});

	it('should fail due to token amount mismatch', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(invalidAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + invalidAuctionNFTUTXO.token!.amount - 1n,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:65 Require statement failed at input 1 in contract NameEnforcer.cash at line 65 with the following message: Output 0: token amount must equal input 0 + input 2 amounts (accumulation).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[0].tokenAmount == tx.inputs[0].tokenAmount + tx.inputs[2].tokenAmount, \"Output 0: token amount must equal input 0 + input 2 amounts (accumulation)\");');
	});

	it('should fail due to reward not being pure BCH', async () =>
	{
		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
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
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceTokenAddress,
				amount: invalidAuctionNFTUTXO.satoshis,
				token: {
					category: nameTokenCategory,
					amount: BigInt(0),
					nft: {
						capability: 'none',
						commitment: binToHex(alicePkh) + validNameHex,
					},
				},
			});

		const txPromise = transaction.send();

		await expect(txPromise).rejects.toThrow(FailedRequireError);
		await expect(txPromise).rejects.toThrow('NameEnforcer.cash:68 Require statement failed at input 1 in contract NameEnforcer.cash at line 68 with the following message: Output 2: reward must be pure BCH (no token category).');
		await expect(txPromise).rejects.toThrow('Failing statement: require(tx.outputs[2].tokenCategory == 0x, \"Output 2: reward must be pure BCH (no token category)\");');
	});

	it('should pass with valid invalid character detection', async () =>
	{
		// Create auctionNFT with name containing special character
		const specialCharName = 'test@name';
		const specialCharNameHex = Buffer.from(specialCharName).toString('hex');

		const specialCharAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + specialCharNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, specialCharAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(specialCharAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + specialCharAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: specialCharAuctionNFTUTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(3);
	});

	it('should pass with space character detection', async () =>
	{
		// Create auctionNFT with name containing space
		const spaceCharAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + invalidNameWithSpaceHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, spaceCharAuctionNFTUTXO);

		// Construct the transaction using the TransactionBuilder
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(spaceCharAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + spaceCharAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: spaceCharAuctionNFTUTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(3);
	});

	// Tests for valid names that should fail when trying to enforce them
	it('should fail when trying to enforce valid name with only letters', async () =>
	{
		// Create auctionNFT with valid name containing only letters
		const validLetterName = 'testname';
		const validLetterNameHex = Buffer.from(validLetterName).toString('hex');

		const validLetterAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + validLetterNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, validLetterAuctionNFTUTXO);

		// Try to enforce a valid character (should fail)
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(1n))
			.addInput(validLetterAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + validLetterAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: validLetterAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();
		await expect(txPromise).rejects.toThrow(FailedRequireError);
	});

	it('should fail when trying to enforce valid name with letters and numbers', async () =>
	{
		// Create auctionNFT with valid name containing letters and numbers
		const validMixedName = 'test123';
		const validMixedNameHex = Buffer.from(validMixedName).toString('hex');

		const validMixedAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + validMixedNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, validMixedAuctionNFTUTXO);

		// Try to enforce a valid character (should fail)
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(1n))
			.addInput(validMixedAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + validMixedAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: validMixedAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();
		await expect(txPromise).rejects.toThrow(FailedRequireError);
	});

	it('should fail when trying to enforce valid name with letters, numbers, and hyphens', async () =>
	{
		// Create auctionNFT with valid name containing letters, numbers, and hyphens
		const validHyphenName = 'test-name123';
		const validHyphenNameHex = Buffer.from(validHyphenName).toString('hex');

		const validHyphenAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + validHyphenNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, validHyphenAuctionNFTUTXO);

		// Try to enforce a valid character (should fail)
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(1n))
			.addInput(validHyphenAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + validHyphenAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: validHyphenAuctionNFTUTXO.satoshis,
			});

		const txPromise = transaction.send();
		await expect(txPromise).rejects.toThrow(FailedRequireError);
	});

	// Tests for invalid names that should pass when enforcing them
	it('should pass when enforcing name with special character @', async () =>
	{
		// Create auctionNFT with name containing @ symbol
		const atSymbolName = 'test@name';
		const atSymbolNameHex = Buffer.from(atSymbolName).toString('hex');

		const atSymbolAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + atSymbolNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, atSymbolAuctionNFTUTXO);

		// Enforce the invalid character (should pass)
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(atSymbolAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + atSymbolAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: atSymbolAuctionNFTUTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(3);
	});

	it('should pass when enforcing name with underscore', async () =>
	{
		// Create auctionNFT with name containing underscore
		const underscoreName = 'test_name';
		const underscoreNameHex = Buffer.from(underscoreName).toString('hex');

		const underscoreAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + underscoreNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, underscoreAuctionNFTUTXO);

		// Enforce the invalid character (should pass)
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(underscoreAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + underscoreAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: underscoreAuctionNFTUTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(3);
	});

	it('should pass when enforcing name with period', async () =>
	{
		// Create auctionNFT with name containing period
		const periodName = 'test.name';
		const periodNameHex = Buffer.from(periodName).toString('hex');

		const periodAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + periodNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, periodAuctionNFTUTXO);

		// Enforce the invalid character (should pass)
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(periodAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + periodAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: periodAuctionNFTUTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(3);
	});

	it('should pass when enforcing name with exclamation mark', async () =>
	{
		// Create auctionNFT with name containing exclamation mark
		const exclamationName = 'test!name';
		const exclamationNameHex = Buffer.from(exclamationName).toString('hex');

		const exclamationAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + exclamationNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, exclamationAuctionNFTUTXO);

		// Enforce the invalid character (should pass)
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(exclamationAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + exclamationAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: exclamationAuctionNFTUTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(3);
	});

	it('should pass when enforcing name with dollar sign', async () =>
	{
		// Create auctionNFT with name containing dollar sign
		const dollarName = 'test$name';
		const dollarNameHex = Buffer.from(dollarName).toString('hex');

		const dollarAuctionNFTUTXO: Utxo = {
			...randomUtxo({ satoshis: BigInt(1000000) }),
			token: {
				category: nameTokenCategory,
				amount: BigInt(registrationId),
				nft: {
					commitment: binToHex(alicePkh) + dollarNameHex,
					capability: 'mutable',
				},
			},
		};

		provider.addUtxo(registryContract.address, dollarAuctionNFTUTXO);

		// Enforce the invalid character (should pass)
		transaction = new TransactionBuilder({ provider })
			.addInput(threadNFTUTXO, registryContract.unlock.call())
			.addInput(authorizedContractUTXO, nameEnforcerContract.unlock.call(5n))
			.addInput(dollarAuctionNFTUTXO, registryContract.unlock.call())
			.addOutput({
				to: registryContract.tokenAddress,
				amount: threadNFTUTXO.satoshis,
				token: {
					category: threadNFTUTXO.token!.category,
					amount: threadNFTUTXO.token!.amount + dollarAuctionNFTUTXO.token!.amount,
					nft: {
						capability: threadNFTUTXO.token!.nft!.capability,
						commitment: threadNFTUTXO.token!.nft!.commitment,
					},
				},
			})
			.addOutput({
				to: nameEnforcerContract.tokenAddress,
				amount: authorizedContractUTXO.satoshis,
			})
			.addOutput({
				to: aliceAddress,
				amount: dollarAuctionNFTUTXO.satoshis,
			});

		const txPromise = await transaction.send();
		// @ts-ignore
		const txOutputs = getTxOutputs(txPromise);
		expect(txOutputs.length).toBe(3);
	});

});
