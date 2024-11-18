import { describe, expect, test } from '@jest/globals';

import { compareTraitStringsCanonically } from './types';

describe(compareTraitStringsCanonically.name, () => {
	test(`leaves random strings in their order`, () => {
		const input = ['a', 'b', 'y', 'x'];
		const output = input.toSorted(compareTraitStringsCanonically);
		expect(output).toEqual(input);
	});

	describe(`sorts "Don't care" before`, () => {
		test('traditions', () => {
			const output = ['Arcane', 'Divine', "Don't care", 'Primal', 'Occult'].toSorted(compareTraitStringsCanonically);
			expect(output).toEqual(["Don't care", 'Arcane', 'Divine', 'Occult', 'Primal']);
		});

		test('attributes', () => {
			const output = ['Strength', 'Wisdom', "Don't care", 'Dexterity', 'Charisma'].toSorted(compareTraitStringsCanonically);
			expect(output).toEqual(["Don't care", 'Strength', 'Dexterity', 'Wisdom', 'Charisma']);
		});

		test('attributes using dummy objects', () => {
			const input = [
				{ name: 'Charisma', value: [1, 2, 3] },
				{ name: "Don't care", value: [1, 2, 3] },
				{ name: 'Wisdom', value: [1, 2, 3] },
			];
			const output = input.sort(({ name: a }, { name: b }) => compareTraitStringsCanonically(a, b));
			expect(output).toEqual([
				{ name: "Don't care", value: [1, 2, 3] },
				{ name: 'Wisdom', value: [1, 2, 3] },
				{ name: 'Charisma', value: [1, 2, 3] },
			]);
		});

		test('random strings', () => {
			const output = ['a', 'b', "Don't care", 'y', 'x'].toSorted(compareTraitStringsCanonically);
			expect(output).toEqual(["Don't care", 'a', 'b', 'y', 'x']);
		});
	});
});
