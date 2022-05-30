export const timestamp = () => {
	const pad = (num: number): string => {
		return num.toString().length == 2 ? num.toString() : `0${num}`
	}

	const date = new Date(),
		hour = pad(date.getHours()),
		minute = pad(date.getMinutes()),
		second = pad(date.getSeconds())
	return `[${hour}:${minute}:${second}]`
}

export const logMessage = (message: string) => console.log(`${timestamp()} ${message}`)

export const logError = (error: string) => console.error('\x1b[31m%s\x1b[0m', error)

export const statAbbreviation = {
	'STR': 'strength', 'DEX': 'dexterity', 'CON': 'consitution',
	'INT': 'intelligence', 'WIS': 'wisdom', 'CHA': 'charisma'
}