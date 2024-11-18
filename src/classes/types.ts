import { z } from 'zod';

type Arrayable<T> = T | T[];
function arrayArrayable<T>(val: Arrayable<T>) {
	if (Array.isArray(val)) return val;
	return [val];
}

export const Armor = z.enum(['Unarmored', 'Light', 'Medium', 'Heavy']);
const Attribute = z.enum(['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']);
const CharacterKind = z.enum(['Class', 'Archetype']);
const SpellcastingTradition = z.enum(['Arcane', 'Divine', 'Occult', 'Primal']);

const CanonicalOptionOrdering: string[] = ["Don't care", 'Yes', 'No']
	.concat(Armor.options)
	.concat(Attribute.options)
	.concat(CharacterKind.options)
	.concat(SpellcastingTradition.options);

export const compareTraitStrings = (answerA: string, answerB: string) =>
	(CanonicalOptionOrdering.indexOf(answerA) + 1 || Infinity) - (CanonicalOptionOrdering.indexOf(answerB) + 1 || Infinity);

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
		// Maybe I should make a pseudospellcasting property for impulses and quick alchemy
		// Maybe I should make a lot of these simple boolean properties true | undefined instead, so I don't have to explicitly define them everywhere
		// 		That would also allow me to add a bunch more of them, like expert weapon proficiency at level 1, without needing to edit every single entry
		//		The issue is that I might forget that a property exists and not include it somewhere that I should, then I'd have no way of knowing I'd made that mistake
		//		Alternatively, I could group properties into objects more liberally, like a "martial" object that includes more details on weapon, armor, and shield proficiencies, then some classes I could easily leave it null and not have to go back and update, while others I would be forced to update as I add new properties
		martialWeaponTraining: z.boolean().or(z.string()),
		shieldBlock: z.boolean(),
		animalCompanion: z.boolean(),
		familiar: z.boolean(),
		precisionDamage: z.boolean(),
		kind: z.discriminatedUnion('name', [
			z.object({
				name: z.literal(CharacterKind.enum.Class),
				armor: Armor,
				classArchetype: z.boolean(),
				keyAttribute: Attribute.or(Attribute.array()).transform(arrayArrayable),
			}),
			z.object({
				name: z.literal(CharacterKind.enum.Archetype),
				multiclass: z.boolean(),
				tenPlusFeats: z.boolean(),
				armorTraining: z.boolean(),
			}),
		]),
	})
	.transform(({ kind, focusSpells, spellcasting, ...rest }) => {
		const character: Character = {
			...rest,

			kind: kind.name,
			archetype_armorTraining: kind.name == CharacterKind.enum.Archetype ? kind.armorTraining : null,
			archetype_multiclass: kind.name == CharacterKind.enum.Archetype ? kind.multiclass : null,
			archetype_tenPlusFeats: kind.name == CharacterKind.enum.Archetype ? kind.tenPlusFeats : null,
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
	archetype_armorTraining: z.boolean().nullable(),
	archetype_multiclass: z.boolean().nullable(),
	archetype_tenPlusFeats: z.boolean().nullable(),
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
	precisionDamage: z.boolean(),
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
