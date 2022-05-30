# D&D Beyond web scraper

## About the project

What is it?
: It's the backend API for my [minecraft DnD plugin](https://github.com/BlakeIsMyWaifu/dnd-plugin)

How does it work?
: It uses a combination of [puppeteer](https://github.com/puppeteer/puppeteer) and [cheerio](https://github.com/cheeriojs/cheerio) to scrap and parse [D&D Beyond](https://www.dndbeyond.com/) characters
  The data is then served via an [expressjs server](https://github.com/expressjs/express) on port 3000

What else could it be used for?
: It should be quite easy to adapt to use with anything else

Can it only get my characters?
: No it can get any public characters

How do i get a D&D Beyond character id?
: It's the numbers on the end of the url
  `https://www.dndbeyond.com/characters/123456789`
  Here the character id is 123456789

## Getting Started

Requires Node 14+ installed

1. Clone repo

    ```sh
    git clone https://github.com/BlakeIsMyWaifu/dnd-backend.git
    ```

2. Install NPM packages

    ```sh
    npm install
    ```

3. (Optional) Add D&D Beyond ids in `config.js`

    ```JS
    const config = {
        port: 3000,
        autoFetch: {
            enabled: false, // <-- set this to true
            cachedIds: [123456789, 98754321], // <-- add ids here
            cacheTime: 60e3
        },
        manualMode: false
    }
    ```

4. Run

    ```sh
    npm start
    ```

## Usage

Since the latest update to D&D Beyond you must be logged in to view characters.
To get around this you must launch in manual mode so you can login with Twitch.
To change to manual mode change `manualMode` to `true` in `config.js`
You must login with Twitch because the other two don't allow login to browsers that are automated.
The session data will be saved automatically meaning it will log in to your Twitch account each time.
If you link your Twitch to your normal Google or Apple account then it will be the same account.
This also allows you to view otherwise private characters that you otherwise wouldn't have been able to do.

It will scrap the data every 90 seconds by default, but this can be changed in `config.js`.

If you change the interval timer make sure not to make it too short as to get temporarily get blocked by D&D Beyond.
The same issue may arise if you have too many characters.

The Minecraft plugin to go with it will do the rest of the work

## Contact

Discord: `Blake Belladonna#1608` (id: 166641492113358848)

## Returned Data

The data can be obtained from [localhost:3000/character/:id](localhost:3000/character/) with the id being changed for the D&D Beyond character id you would like

It doesn't have any typescript support but here are some types so you can see what the data it returns looks like or if you want to add your own support

```TS
type CharacterData = {
    status: boolean;
    armourclass: ArmourClass;
    character: Character;
    conditions: string[];
    defences: Defence[];
    health: Health;
    misc: Misc;
    proficiencies: Proficiencies;
    savingThrows: SavingThrows;
    senses: Senses;
    skills: skill[];
    stats: Record<Stats, Stat>
}

type Stats = 'strength' | 'dexterity' | 'consitution' | 'intelligence' | 'wisdom' | 'charisma';

type ArmourClass = {
    modifier: ArmourClassModifier[]
    total: number;
    base: {
        value: string;
        source: string;
    }
}

type ArmourClassModifier = {
    value: string;
    type: string;
    source: string;
}

type Character = {
    name: string;
    gender: string;
    race: string;
    classes: string;
    level: number;
}

type Defence = {
    type: string;
    source: string;
    defense: string;
}

type Health = {
    current: number;
    max: number;
    temp: number;
}

type Misc = {
    proficiency: number;
    speed: number;
    inspiration: boolean;
    initiative: number;
}

type Proficiencies = {
    armour: Proficiency[];
    weapons: Proficiency[];
    tools: Proficiency[];
    languages: Proficiency[];
}

type Proficiency = {
    source: string;
    item: string;
}

type SavingThrows = {
    modifier: string;
} & Record<Stats, SavingThrowStat>

type SavingThrowModifer = {
    type: string;
    subtype: string;
    modifer: string;
}

type SavingThrowStat = {
    modifier: number;
    proficiency: boolean;
}

type AdditionalSense = {
    sense: string;
    value: string;
}

type Senses = {
    perception: number;
    investigation: number;
    insight: number;
    additional: AdditionalSense[];
}

type Skill = {
    proficiency: 'Expertise' | 'Proficiency' | 'Half' | 'Not';
    stat: Stats;
    skill: string;
    vantage: 'Advantage' | 'Disadvantage' | null;
    modifier: number;
}

type Stat = {
    total: number;
    modifier: number;
    base: number;
    racial: number;
    ability: number;
    misc: number;
    stacking: number;
    set: number;
}
```
