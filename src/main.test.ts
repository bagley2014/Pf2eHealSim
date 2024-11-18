import { describe, expect, test } from '@jest/globals';

describe('Jest is setup', () => {
	test('two plus two is four', () => {
		expect(2 + 2).toBe(4);
	});
});
