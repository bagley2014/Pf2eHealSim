import { z } from 'zod';

type Arrayable<T> = T | T[];
function arrayArrayable<T>(val: Arrayable<T>) {
	if (Array.isArray(val)) return val;
	return [val];
}

const Armor = z.enum(['None', 'Light', 'Medium', 'Heavy']);
const Attribute = z.enum(['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']);
const CharacterType = z.enum(['Class', 'Archetype']);
const SpellcastingTradition = z.enum(['Arcane', 'Divine', 'Occult', 'Primal']);

export const CanonicalOptionOrdering: string[] = ["Don't care", 'Yes', 'No']
	.concat(Armor.options)
	.concat(Attribute.options)
	.concat(CharacterType.options)
	.concat(SpellcastingTradition.options);

// How characters are actually represented in JSON, transformed into a flat, easy to work with version
export const CharacterSource = z
	.object({
		name: z.string(),
		description: z.string().optional(),
		armor: Armor,
		classArchetype: z.boolean(),
		focusSpells: z
			.object({
				attribute: Attribute.or(Attribute.array()).transform(arrayArrayable),
				tradition: SpellcastingTradition.or(SpellcastingTradition.array()).transform(arrayArrayable),
			})
			.nullable(),
		keyAttribute: Attribute.or(Attribute.array()).transform(arrayArrayable),
		mechanicalDeity: z.boolean(),
		spellcasting: z
			.object({
				attribute: Attribute.or(Attribute.array()).transform(arrayArrayable),
				repertoire: z.boolean(),
				full: z.boolean(),
				tradition: SpellcastingTradition.or(SpellcastingTradition.array()).transform(arrayArrayable),
			})
			.nullable(),
		type: CharacterType,
	})
	.transform(({ focusSpells, spellcasting, ...rest }) => {
		const character: Character = {
			...rest,

			focusSpells: focusSpells ? true : false,
			focusSpells_attribute: focusSpells && focusSpells.attribute,
			focusSpells_tradition: focusSpells && focusSpells.tradition,

			spellcasting: spellcasting ? true : false,
			spellcasting_attribute: spellcasting && spellcasting.attribute,
			spellcasting_full: spellcasting && spellcasting.full,
			spellcasting_repertoire: spellcasting && spellcasting.repertoire,
			spellcasting_tradition: spellcasting && spellcasting.tradition,
		};
		return character;
	});

// Flat, easy to work with representation of a Character
const Character = z.object({
	name: z.string(),
	description: z.string().optional(),
	armor: Armor,
	classArchetype: z.boolean(),
	focusSpells: z.boolean(),
	focusSpells_attribute: Attribute.array().nullable(),
	focusSpells_tradition: SpellcastingTradition.array().nullable(),
	keyAttribute: Attribute.array(),
	mechanicalDeity: z.boolean(),
	spellcasting: z.boolean(),
	spellcasting_attribute: Attribute.array().nullable(),
	spellcasting_repertoire: z.boolean().nullable(),
	spellcasting_full: z.boolean().nullable(),
	spellcasting_tradition: SpellcastingTradition.array().nullable(),
	type: CharacterType,
});
export type Character = z.infer<typeof Character>;

export const Trait = Character.keyof();
export type Trait = z.infer<typeof Trait>;

const AnswerMap = z.map(z.string(), Character.array());
export type AnswerMap = z.infer<typeof AnswerMap>;

const Question = z.object({
	text: z.string(),
	answers: AnswerMap,
	score: z.number(), // Lower is better
});
export type Question = z.infer<typeof Question>;
