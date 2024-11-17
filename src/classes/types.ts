import { z } from 'zod';

type Arrayable<T> = T | T[];
function arrayArrayable<T>(val: Arrayable<T>) {
	if (Array.isArray(val)) return val;
	return [val];
}

const Armor = z.enum(['None', 'Light', 'Medium', 'Heavy']);
const Attribute = z.enum(['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']);
const CharacterKind = z.enum(['Class', 'Archetype']);
const SpellcastingTradition = z.enum(['Arcane', 'Divine', 'Occult', 'Primal']);

export const CanonicalOptionOrdering: string[] = ["Don't care", 'Yes', 'No']
	.concat(Armor.options)
	.concat(Attribute.options)
	.concat(CharacterKind.options)
	.concat(SpellcastingTradition.options);

// How characters are actually represented in JSON, transformed into a flat, easy to work with version
export const CharacterSource = z
	.object({
		name: z.string(),
		description: z.string().optional(),
		focusSpells: z
			.object({
				attribute: Attribute.or(Attribute.array()).transform(arrayArrayable),
				tradition: SpellcastingTradition.or(SpellcastingTradition.array()).transform(arrayArrayable),
			})
			.nullable(),
		mechanicalDeity: z.boolean(),
		spellcasting: z
			.object({
				attribute: Attribute.or(Attribute.array()).transform(arrayArrayable),
				repertoire: z.boolean(),
				full: z.boolean(),
				tradition: SpellcastingTradition.or(SpellcastingTradition.array()).transform(arrayArrayable),
			})
			.nullable(),
		martialWeaponTraining: z.boolean().or(z.string()),
		shieldBlock: z.boolean(),
		animalCompanion: z.boolean(),
		familiar: z.boolean(),
		kind: z.discriminatedUnion('name', [
			z.object({
				name: z.literal(CharacterKind.enum.Class),
				armor: Armor,
				classArchetype: z.boolean(),
				keyAttribute: Attribute.or(Attribute.array()).transform(arrayArrayable),
			}),
			z.object({
				name: z.literal(CharacterKind.enum.Archetype),
				isMulticlass: z.boolean(),
				has10OrMoreFeats: z.boolean(),
			}),
		]),
	})
	.transform(({ kind, focusSpells, spellcasting, ...rest }) => {
		const character: Character = {
			...rest,

			kind: kind.name,
			archetype_isMulticlass: kind.name == CharacterKind.enum.Archetype ? kind.isMulticlass : null,
			archetype_has10OrMoreFeats: kind.name == CharacterKind.enum.Archetype ? kind.has10OrMoreFeats : null,
			class_armor: kind.name == CharacterKind.enum.Class ? kind.armor : null,
			class_classArchetype: kind.name == CharacterKind.enum.Class ? kind.classArchetype : null,
			class_keyAttribute: kind.name == CharacterKind.enum.Class ? kind.keyAttribute : null,

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
	animalCompanion: z.boolean(),
	archetype_isMulticlass: z.boolean().nullable(),
	archetype_has10OrMoreFeats: z.boolean().nullable(),
	class_armor: Armor.nullable(),
	class_classArchetype: z.boolean().nullable(),
	class_keyAttribute: Attribute.array().nullable(),
	familiar: z.boolean(),
	focusSpells: z.boolean(),
	focusSpells_attribute: Attribute.array().nullable(),
	focusSpells_tradition: SpellcastingTradition.array().nullable(),
	kind: CharacterKind,
	martialWeaponTraining: z.boolean().or(z.string()),
	mechanicalDeity: z.boolean(),
	shieldBlock: z.boolean(),
	spellcasting: z.boolean(),
	spellcasting_attribute: Attribute.array().nullable(),
	spellcasting_repertoire: z.boolean().nullable(),
	spellcasting_full: z.boolean().nullable(),
	spellcasting_tradition: SpellcastingTradition.array().nullable(),
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
