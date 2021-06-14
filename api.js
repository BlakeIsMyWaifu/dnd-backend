import cheerio from 'cheerio';
import puppeteer from 'puppeteer';

Object.prototype.inner = function() {
	return this.children[0].data;
}

Object.prototype.data = function() {
	return this.attribs['data-original-title'];
}

const statAbbreviation = {
	'STR': 'strength', 'DEX': 'dexterity', 'CON': 'consitution',
	'INT': 'intelligence', 'WIS': 'wisdom', 'CHA': 'charisma'
};

export default async id => {
	const instance = await puppeteer.launch({
		headless: true,
		args: ['--window-size=1920,1080']
	});
	const page = await instance.newPage();

	await page.setViewport({
		width: 1920,
		height: 1080
	});
	await page.goto(`https://www.dndbeyond.com/characters/${id}`);
	const wait = await page.waitForSelector('.ct-character-sheet-desktop', { timeout: 10000 }).catch(err => {
		console.error('\x1b[31m%s\x1b[0m', err);
		return false;
	});
	if (!wait) return ({ status: false });

	const html = await page.content();
	const $ = cheerio.load(html);
	var out = {
		status: true,
		armourclass: {
			modifier: []
		},
		character: {},
		conditions: [],
		defences: [],
		health: {},
		misc: {},
		proficiencies: {
			armour: [],
			weapons: [],
			tools: [],
			languages: []
		},
		savingThrows: {},
		senses: {},
		skills: [],
		stats: {}
	};
	
	out.character.name = $('.ddbc-character-name')[0].inner();
	out.character.gender = $('.ddbc-character-summary__gender')[0]?.inner() || null;
	out.character.race = $('.ddbc-character-summary__race')[0].inner();
	out.character.classes = $('.ddbc-character-summary__classes')[0].inner();
	out.character.level = +$('.ddbc-character-progression-summary__level')[0].inner().split(' ')[1];

	for await (const [i, stat] of Object.values(statAbbreviation).entries()) {
		await page.click(`.ct-quick-info__ability:nth-of-type(${i+1})`);
		await page.waitForSelector(`.ddbc-ability-score-manager--${Object.keys(statAbbreviation)[i].toLowerCase()}`);
		const _html = await page.content();
		const _$ = cheerio.load(_html);
		const scores = [];
		_$('.ddbc-ability-score-manager__component-value').each((i, element) => {
			if (element.children[0].type === 'text') {
				scores.push(+element.inner());
			} else {
				let sign = element.children[0].children[0].inner() === "-" ? -1 : 1;
				scores.push(+element.children[0].children[1].inner() * sign);
			}
		});
		const [total, modifier, base, racial, ability, misc, stacking, set] = scores;
		out.stats[stat] = { total, modifier, base, racial, ability, misc, stacking, set };
	}

	out.misc.proficiency = +$('.ct-proficiency-bonus-box__value')[0].children[0].children[1].inner();

	out.misc.speed = +$('.ddbc-distance-number__number')[0].inner();

	out.misc.inspiration = !$('.ct-inspiration__status')[0].attribs.class.includes('inactive');

	out.health.current = +$('.ct-health-summary__hp-number')[0]?.inner() || 0;
	out.health.max = +$('.ct-health-summary__hp-number')[1]?.inner() || 0;
	out.health.temp = +$('.ct-health-summary__hp-item--temp')[0]?.children[1].children[0].inner() || 0;

	out.savingThrows = { modifier: [] };
	$('.ddbc-saving-throws-summary__ability').each((i, element) => {
		const modifier = +element.children[3].children[0].children[1].inner();
		const proficiency = !element.children[1].children[0].children[0].attribs.class.includes('ddbc-no-proficiency-icon');
		out.savingThrows[Object.values(statAbbreviation)[i]] = { modifier, proficiency };
	});

	{
		await page.click('.ct-saving-throws-box__info');
		await page.waitForSelector('.ct-sidebar__pane');
		const _html = await page.content();
		const _$ = cheerio.load(_html);
		const savingTypes =  {
			Advantage: element => {
				const summaryType = element.children[1].attribs.class;
				if (summaryType.includes('ct-dice-adjustment-summary__restriction')) {
					return ['Effect', `${element.children[0].data()} ${element.children[1].inner()}`];
				} else if (summaryType.includes('ct-dice-adjustment-summary__description')) {
					const stat = element.children[1].children[1].inner();
					let ret = `${element.children[0].data()} on ${stat} `;
					ret += element.children.length === 3 ? element.children[2].inner() : '';
					return [stat, ret.trim()];
				}
				return ['Error?', 'If this text ever appears, shit.'];
			},
			Disadvantage: function (element) {
				return this.Advantage(element);
			},
			Bonus: element => {
				const num = element.children[1].inner();
				return [num, `+${num} Bonus ${element.children[2].inner()}`];
			}
		};
		_$('.ct-saving-throws-details')[0]?.children.forEach(element => {
			const type = element.children[0].data() || 'Bonus';
			const [subtype, modifier] = savingTypes[type](element);
			let source;
			if (element.children[element.children.length - 1].attribs.class.includes('data-origin')) {
				source = element.children[element.children.length - 1].children[1].children[0].inner()
			}
			out.savingThrows.modifier.push({ type, subtype, modifier, source });
		});
	}

	const senseList = ['perception', 'investigation', 'insight'];
	$('.ct-senses__callout-value').each((i, element) => {
		out.senses[senseList[i]] = +element.inner();
	});
	const senseAddition = $('.ct-senses__summary')[0];
	out.senses.addition = senseAddition.attribs.class.includes('empty') ? [] : (() => {
		return senseAddition.inner().split(', ').map(list => {
			const [sense, value] = list.split(' ');
			return ({ sense, value });
		});
	})();

	$('.ct-proficiency-groups__group-items').each((i, element) => {
		element.children.forEach(item => {
			if (!item.attribs) return;
			out.proficiencies[Object.keys(out.proficiencies)[i]].push({
				source: item.data(),
				item: item.children[0].inner().replace(', ', '')
			});
		});
	});

	$('.ct-skills__item').each((i, element) => {
		const modifier = element.children[element.children.length - 1].children[0];
		out.skills.push({
			proficiency: element.children[0].children[0].data().split(' ')[0],
			stat: statAbbreviation[element.children[1].inner()],
			skill: element.children[2].inner(),
			vantage: element.children.length === 5 ? element.children[3].children[0].data() : null,
			modifier: ((+modifier.children[1].inner()) * (modifier.children[0].inner() === '-' ? -1 : 1))
		});
	});

	out.misc.initiative = +$('.ct-initiative-box__value')[0].children[1].children[1].inner();

	// TODO sidebar armour
	out.armourclass.total = +$('.ddbc-armor-class-box__value')[0].inner();
	{
		await page.click('.ddbc-armor-class-box__value');
		await page.waitForSelector('.ct-sidebar__pane');
		const _html = await page.content();
		const _$ = cheerio.load(_html);
		_$('.ct-armor-manage-pane__item').each((i, element) => {
			if (!i) {
				const value = element.children[0].inner();
				const sourceRoot = element.children[1].children[1];
				const source = sourceRoot.inner() === '(None)' ? null : sourceRoot.children[1].inner();
				out.armourclass.base = { value, source };
			} else {
				const value = element.children[0].children[0].children[1].inner();
				const sourceRoot = element.children[1];
				const type = sourceRoot.children[0].inner();
				// const source = sourceRoot.children.length === 1 ? null : sourceRoot.children[1].children[1].inner();
				const source = sourceRoot?.children[1]?.children[1]?.inner();
				out.armourclass.modifier.push({ value, type, source });
			}
		});
	}

	$('.ct-defenses-summary__group').each((i, element) => {
		const type = element.children[0].children[0].data();
		element.children[1].children.forEach(defence => {
			out.defences.push({
				type,
				source: defence.children[0].data(),
				defence: defence.children[0].inner()
			});
		});
	});

	$('.ddbc-condition__name').each((i, element) => {
		let condition = element.inner();
		if (element.children.length === 2) condition += element.children[1].inner();
		out.conditions.push(condition);
	});

	await instance.close();
	return out;
	// return Object.keys(out).sort().reduce((acc, key) => ({ ...acc, [key]: out[key] }), {});
}