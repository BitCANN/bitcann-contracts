import { describe, it, expect } from '@jest/globals';
import { BitCANNArtifacts } from '../lib/index.js';

describe('imports', () =>
{
	it('should import BitCANNArtifacts', () =>
	{
		expect(BitCANNArtifacts).toBeDefined();
	});
});
