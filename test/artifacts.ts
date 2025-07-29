export default {
	contractName: 'Test',
	constructorInputs: [],
	abi: [
		{
			name: 'call',
			inputs: [],
		},
	],
	bytecode: 'OP_1 OP_UTXOTOKENCATEGORY OP_0 OP_NOTEQUAL',
	source: 'contract Test() {\n    function call() {\n        require(tx.inputs[1].tokenCategory != 0x);\n    }\n}\n',
	debug: {
		bytecode: '51ce0087',
		sourceMap: '3:26:3:27;:16::42:1;:46::48:0;:8::50:1',
		logs: [],
		requires: [
			{
				ip: 4,
				line: 3,
			},
		],
	},
	compiler: {
		name: 'cashc',
		version: '0.11.0',
	},
	updatedAt: '2025-06-16T15:05:57.354Z',
} as const;