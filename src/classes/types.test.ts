import { Answer, Attribute, SpellcastingTradition, compareTraitStringsCanonically } from './types';
import { describe, expect, test } from '@jest/globals';

describe(compareTraitStringsCanonically.name, () => {
	test(`leaves random strings in their order`, () => {
		const input = ['a', 'b', 'y', 'x'];
		const output = input.toSorted(compareTraitStringsCanonically);
		expect(output).toEqual(input);
	});

	describe(`sorts Answer.enum["Don't care"] before`, () => {
		test('traditions', () => {
			const output = [
				SpellcastingTradition.Enum.Arcane,
				SpellcastingTradition.Enum.Divine,
				Answer.enum["Don't care"],
				SpellcastingTradition.Enum.Primal,
				SpellcastingTradition.Enum.Occult,
			].toSorted(compareTraitStringsCanonically);
			expect(output).toEqual([
				Answer.enum["Don't care"],
				SpellcastingTradition.Enum.Arcane,
				SpellcastingTradition.Enum.Divine,
				SpellcastingTradition.Enum.Occult,
				SpellcastingTradition.Enum.Primal,
			]);
		});

		test('attributes', () => {
			const output = [
				Attribute.enum.Strength,
				Attribute.enum.Wisdom,
				Answer.enum["Don't care"],
				Attribute.enum.Dexterity,
				Attribute.enum.Charisma,
			].toSorted(compareTraitStringsCanonically);
			expect(output).toEqual([
				Answer.enum["Don't care"],
				Attribute.enum.Strength,
				Attribute.enum.Dexterity,
				Attribute.enum.Wisdom,
				Attribute.enum.Charisma,
			]);
		});

		test('attributes using dummy objects', () => {
			const input = [
				{ name: Attribute.enum.Charisma, value: [1, 2, 3] },
				{ name: Answer.enum["Don't care"], value: [1, 2, 3] },
				{ name: Attribute.enum.Wisdom, value: [1, 2, 3] },
			];
			const output = input.sort(({ name: a }, { name: b }) => compareTraitStringsCanonically(a, b));
			expect(output).toEqual([
				{ name: Answer.enum["Don't care"], value: [1, 2, 3] },
				{ name: Attribute.enum.Wisdom, value: [1, 2, 3] },
				{ name: Attribute.enum.Charisma, value: [1, 2, 3] },
			]);
		});

		test('random strings', () => {
			const output = ['a', 'b', Answer.enum["Don't care"], 'y', 'x'].toSorted(compareTraitStringsCanonically);
			expect(output).toEqual([Answer.enum["Don't care"], 'a', 'b', 'y', 'x']);
		});
	});
});
