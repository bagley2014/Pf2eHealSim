import { expect, test } from '@jest/globals';

import { compareTraitStrings } from './types';

// test(`"Don't care" comes before attributes when sorted`, ()=>{

// 	assert.deepStrictEqual()
// })

test(`random strings stay in order`, () => {
	const input = ['a', 'b', 'y', 'x'];
	const output = input.toSorted(compareTraitStrings);
	expect(output).toEqual(input);
});
