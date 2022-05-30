export const timestamp = () => {
	Number.prototype.pad = function () {
		return this.toString().length == 2 ? this.toString() : `0${this}`
	}
	const date = new Date(),
		hour = date.getHours().pad(),
		minute = date.getMinutes().pad(),
		second = date.getSeconds().pad()
	return `[${hour}:${minute}:${second}]`
}

export const logMessage = message => console.log(`${timestamp()} ${message}`)

export const logError = error => console.error('\x1b[31m%s\x1b[0m', error)

export const statAbbreviation = {
	'STR': 'strength', 'DEX': 'dexterity', 'CON': 'consitution',
	'INT': 'intelligence', 'WIS': 'wisdom', 'CHA': 'charisma'
}