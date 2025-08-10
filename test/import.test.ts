import { describe, it, expect } from '@jest/globals';
import { BitCANNArtifacts } from '../lib/index.js';

interface ContractArtifact
{
	contractName: string;
	constructorInputs: Array<{ name: string; type: string }>;
	abi: Array<{ name: string; inputs: Array<{ name: string; type: string }> }>;
	bytecode: string;
}

describe('imports', () =>
{
	it('should import BitCANNArtifacts with all expected contracts', () =>
	{
		expect(BitCANNArtifacts).toBeDefined();

		// Check all expected contracts exist
		const expectedContracts = [
			'Registry',
			'Auction',
			'Bid',
			'Name',
			'Factory',
			'NameEnforcer',
			'OwnershipGuard',
			'ConflictResolver',
			'Accumulator',
		] as const;

		expectedContracts.forEach((contractName) =>
		{
			const contract = BitCANNArtifacts[contractName] as ContractArtifact;
			expect(contract).toBeDefined();
			expect(contract.contractName).toBe(contractName);
			expect(contract.constructorInputs).toBeDefined();
			expect(contract.abi).toBeDefined();
			expect(contract.bytecode).toBeDefined();
		});
	});
});