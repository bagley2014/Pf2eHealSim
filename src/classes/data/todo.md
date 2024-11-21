## Add data

- Psychic
- Summoner
- Thaumaturge
- Miscellaneous archetypes

## Add properties

See this table for data: https://pf2easy.com/index.php?id=2507&name=classes
This table is kind of neat for saves/perception: https://docs.google.com/spreadsheets/d/1Kif7MyhmwOQsqL92x_5UmF_75vb79TOg9jqd36SdP_g/edit?gid=893826129#gid=893826129

- Add something like "deity's domain" to the focus spells object; it should be true on Cleric, Champion, Oracle, their archetypes, and eventually the Soul Warden archetype

### In consideration

- Something to note a class that places emphasis on Recalling Knowledge
- Some sort of theme property, probably an array, that would hold things like "Undead" or "Draconic" and perhaps unify things like "Undead Sorcerer" and "Bones Oracle"
  - But the value might not outweigh the cost if I have to separate out more subclasses
  - If I make it an array and put something like ["Undead", "Angelic", "Demonic", "Diabolic"] on the Divine Sorcerer and "Undead" on the Oracle, then that might work well enough for a questions like "What theme do you want?"
  - The issue with that being something like a Cleric or Champion of Urgathoa having something of an undead theme; how would I know where to draw the line?
- Extra skills? I'm not sure how I'd ask the question. Multiple choice with just numbers? Multiple choice with numbers+ (meaning "at least")?
  - Generally, it seems like all numeric properties kind of have this problem
- Perception/Saves? Hard to know how to ask a question someone might actually care to answer.

### Problems properties might solve

- Summoner needs help

  - An Eidolon isn't a companion...
  - The player kind of plays as the Eidolon, which is kind of a martial... Not sure how to represent that, or if it really means anything

- It's a bit tedious when adding new properties, because I have to support them on every existing entry
  - Maybe I should make a lot of these simple boolean properties true | undefined instead, so I don't have to explicitly define them everywhere
    - That would also allow me to add a bunch more of them, like expert weapon proficiency at level 1, without needing to edit every single entry
    - The issue is that I might forget that a property exists and not include it somewhere that I should, then I'd have no way of knowing I'd made that mistake
    - Alternatively, I could group properties into objects more liberally, like a "martial" object that includes more details on weapon, armor, and shield proficiencies, then some classes I could easily leave it null and not have to go back and update, while others I would be forced to update as I add new properties
- Martial support, like distinguishing ranged classes from melee classes, is lacking
- Certain class archetypes, like the Seneschal Witch and the Warrior of Legend, currently only serve to take up space and need something to distinguish them
  - I intentionally omitted class archetypes like Wellspring Mage and Elementalist on the assumption that they don't change enough to warrant mentioning, so there's a bit of a conflict; either I add those in, or I take the others out, or I find a way to make those two fit my rule, or I find a better rule
