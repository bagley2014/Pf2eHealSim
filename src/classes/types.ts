import { z } from 'zod';

type Arrayable<T> = T | T[];
function arrayArrayable<T>(val: Arrayable<T>) {
	if (Array.isArray(val)) return val;
	return [val];
}

export const Armor = z.enum(['Unarmored', 'Light', 'Medium', 'Heavy']);
export const Attribute = z.enum(['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']);
const CharacterKind = z.enum(['Class', 'Archetype']);
const CompanionKind = z.enum(['Animal', 'Construct']);
export const MartialWeapon = z.enum([
	'All',
	'Alchemical Bombs',
	'Crossbows and Firearms',
	'Polearms',
	'The favored weapon of your deity',
	'None',
]);
export const Rarity = z.enum(['Unique', 'Rare', 'Uncommon', 'Common']);
export const SpellcastingTradition = z.enum(['Arcane', 'Divine', 'Occult', 'Primal']);
const SpellcastingKind = z.enum(['Prepared', 'Spontaneous', 'Innate']);
const SpellLikeAbility = z.enum(['Impulses', 'Quick Alchemy']);
export const Answer = z.enum(["Don't care", 'Yes', 'No']);

const CanonicalOptionOrdering: string[] = ([] as string[])
	.concat(Answer.exclude([Answer.enum.No]).options)
	.concat(Armor.options)
	.concat(Attribute.options)
	.concat(CharacterKind.options)
	.concat(CompanionKind.options)
	.concat(MartialWeapon.options)
	.concat(Rarity.options)
	.concat(SpellcastingKind.options)
	.concat(SpellcastingTradition.options)
	.concat(SpellLikeAbility.options)
	.concat(Answer.extract([Answer.enum.No]).options);
export const compareTraitStringsCanonically = (answerA: string, answerB: string) =>
	(CanonicalOptionOrdering.indexOf(answerA) + 1 || 10000) - (CanonicalOptionOrdering.indexOf(answerB) + 1 || 10000); // Using 10000 instead of Infinity because Infinity - Infinity == NaN

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
				kind: SpellcastingKind.or(SpellcastingKind.array()).transform(arrayArrayable),
				full: z.boolean(),
				tradition: SpellcastingTradition.or(SpellcastingTradition.array()).transform(arrayArrayable),
			})
			.nullable(),
		martialWeaponTraining: z.boolean().or(MartialWeapon),
		shieldBlock: z.boolean(),
		companion: CompanionKind.or(z.literal(false)),
		familiar: z.boolean(),
		precisionDamage: z.boolean(),
		spellLikeAbility: SpellLikeAbility.or(z.literal(false)),
		rarity: Rarity,
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
	.transform(({ kind, focusSpells, martialWeaponTraining, spellcasting, ...rest }) => {
		const character: Character = {
			...rest,

			martialWeaponTraining:
				martialWeaponTraining === true
					? MartialWeapon.enum.All
					: martialWeaponTraining === false
						? MartialWeapon.enum.None
						: martialWeaponTraining,

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
			spellcasting_kind: spellcasting && spellcasting.kind,
			spellcasting_tradition: spellcasting && spellcasting.tradition,
		};
		return character;
	});

// Flat, easy to work with representation of a Character
const Character = z.object({
	name: z.string(),
	description: z.string().optional(),
	archetype_armorTraining: z.boolean().nullable(),
	archetype_multiclass: z.boolean().nullable(),
	archetype_tenPlusFeats: z.boolean().nullable(),
	class_armor: Armor.nullable(),
	class_classArchetype: z.boolean().nullable(),
	class_keyAttribute: Attribute.array().nullable(),
	companion: CompanionKind.or(z.literal(false)),
	familiar: z.boolean(),
	focusSpells: z.boolean(),
	focusSpells_attribute: Attribute.array().nullable(),
	focusSpells_tradition: SpellcastingTradition.array().nullable(),
	kind: CharacterKind,
	martialWeaponTraining: MartialWeapon,
	mechanicalDeity: z.boolean(),
	precisionDamage: z.boolean(),
	rarity: Rarity,
	shieldBlock: z.boolean(),
	spellcasting: z.boolean(),
	spellcasting_attribute: Attribute.array().nullable(),
	spellcasting_kind: SpellcastingKind.array().nullable(),
	spellcasting_full: z.boolean().nullable(),
	spellcasting_tradition: SpellcastingTradition.array().nullable(),
	spellLikeAbility: SpellLikeAbility.or(z.literal(false)),
});
export type Character = z.infer<typeof Character>;

export const Trait = Character.keyof();
export type Trait = z.infer<typeof Trait>;

const AnswerMap = z.map(z.string(), Character.array());
export type AnswerMap = z.infer<typeof AnswerMap>;

const Question = z.object({
	text: z.string(),
	answers: AnswerMap,
	useless: z.boolean(),
	score: z.number(), // Lower is better
});
export type Question = z.infer<typeof Question>;
