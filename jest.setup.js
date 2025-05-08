import { jest } from '@jest/globals';

// jest.setup.ts
beforeAll(() =>
{
	// Store the original console.log
	const originalConsoleLog = console.log;

	// Create a spy that calls the original console.log
	jest.spyOn(console, 'log').mockImplementation((...args) =>
	{
		originalConsoleLog(...args);
	});
});

afterAll(async () =>
{
	if(typeof (console.log).mockRestore === 'function')
	{
		(console.log).mockRestore();
	}
});
