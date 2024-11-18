import { expect, test } from '@jest/globals';

import { compareTraitStrings } from './types';

test(`random strings stay in order`, () => {
	const input = ['a', 'b', 'y', 'x'];
	const output = input.toSorted(compareTraitStrings);
	expect(output).toEqual(input);
});

test(`"Don't care" comes before traditions when sorted`, () => {
	const output = ['Arcane', 'Divine', "Don't care", 'Primal', 'Occult'].toSorted(compareTraitStrings);
	expect(output).toEqual(["Don't care", 'Arcane', 'Divine', 'Occult', 'Primal']);
});

test(`"Don't care" comes before attributes when sorted`, () => {
	const output = ['Strength', 'Wisdom', "Don't care", 'Dexterity', 'Charisma'].toSorted(compareTraitStrings);
	expect(output).toEqual(["Don't care", 'Strength', 'Dexterity', 'Wisdom', 'Charisma']);
});

test(`"Don't care" comes before random strings when sorted`, () => {
	const output = ['a', 'b', "Don't care", 'y', 'x'].toSorted(compareTraitStrings);
	expect(output).toEqual(["Don't care", 'a', 'b', 'y', 'x']);
});
