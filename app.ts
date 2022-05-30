import * as express from 'express'

import { autoFetch, manualMode, port } from './config'
import api from './src/api'
import { logError, logMessage } from './src/utils'

const app: express.Application = express()

const { enabled, cachedIds, cacheTime } = autoFetch

const cache = Object.assign({}, ...cachedIds.map(id => ({ [id]: null })))

if (enabled) {
	setInterval(async () => {
		for (const id of Object.keys(cache)) {
			const data = await api(id, manualMode).catch(logError)
			if (data?.status) {
				cache[id] = data
				logMessage(`${id} was cached`)
			} else {
				logMessage(`${id} failed to cache`)
				await api(id, true).catch(logError)
			}
		}
	}, cacheTime)
}

app.get('/character/:id', async (req, res) => {
	const { id } = req.params
	if (manualMode) {
		logMessage(`${id} was requested in manual mode`)
		const data = await api(id, manualMode).catch(logError)
		return res.send(data)
	}
	logMessage(`${id} was requested`)
	if (cache[id]) {
		logMessage(`${id} was taken from cache`)
		return res.send(cache[id])
	}
	const data = await api(id, manualMode).catch(logError)
	if (data?.status) {
		cache[id] = data
		logMessage(`${id} was freshly taken`)
	} else {
		logMessage(`${id} failed to be freshly taken`)
		await api(id, true).catch(logError)
	}
	return res.send(data)
})

app.listen(port, () => logMessage(`Connected to port: ${port}`))