import express from 'express';

import api from './api.js';
import { cacheTime, cachedIds, manualMode, port } from './config.js';

const app = express();
const timestamp = () => {
	Number.prototype.pad = function () {
		return this.toString().length == 2 ? this.toString() : `0${this}`;
	}
	const date = new Date(),
		hour = date.getHours().pad(),
		minute = date.getMinutes().pad(),
		second = date.getSeconds().pad();
	return `[${hour}:${minute}:${second}]`;
};
const log = message => console.log(`${timestamp()} ${message}`);
const err = error => console.error(error)

const cache = Object.assign({}, ...cachedIds.map(id => ({ [id]: null })));
setInterval(async () => {
	const ids = Object.keys(cache);
	for (const id of ids) {
		const data = await api(id, manualMode).catch(err);
		if (data?.status) {
			cache[id] = data;
			log(`${id} was cached`);
		} else {
			log(`${id} failed to cache`);
			await api(id, true).catch(err);
		}
	}
}, cacheTime);

app.get('/character/:id', async (req, res) => {
	const { id } = req.params;
	if (manualMode) {
		log(`${id} was requested in manual mode`);
		const data = await api(id, manualMode).catch(err);
		return res.send(data);
	}
	log(`${id} was requested`);
	if (cache[id]) {
		log(`${id} was taken from cache`);
		return res.send(cache[id]);
	} else {
		const data = await api(id, manualMode).catch(err);
		if (data?.status) {
			cache[id] = data;
			log(`${id} was freshly taken`);
		} else {
			log(`${id} failed to be freshly taken`);
			await api(id, true).catch(err);
		}
		return res.send(data);
	}
});

app.listen(port, () => log(`Connected to port: ${port}`));