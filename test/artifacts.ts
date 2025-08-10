export default {
	'contractName': 'Test',
	'constructorInputs': [],
	'abi': [
		{
			'name': 'call',
			'inputs': [],
		},
	],
	'bytecode': 'OP_1 OP_2 OP_ADD OP_0 OP_NUMNOTEQUAL',
	'source': 'pragma cashscript ^0.11.0;\n\ncontract Test() {\n    function call() {\n        require(1 + 2 != 0);\n    }\n}',
	'debug': {
		'bytecode': '515293009e',
		'sourceMap': '5:16:5:17;:20::21;:16:::1;:25::26:0;:8::28:1',
		'logs': [],
		'requires': [
			{
				'ip': 5,
				'line': 5,
			},
		],
	},
	'compiler': {
		'name': 'cashc',
		'version': '0.11.4',
	},
	'updatedAt': '2025-08-09T20:20:24.674Z',
};