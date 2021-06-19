import express from 'express';

import api from './api.js';
import { cacheTime, cachedIds, manualMode, port } from './config.js';

const app = express();
const timestamp = () => {
	Number.prototype.pad = function() {
		return this.toString().length == 2 ? this.toString() : `0${this}`;
	}
	const date = new Date(),
		hour = date.getHours().pad(),
		minute = date.getMinutes().pad(),
		second = date.getSeconds().pad();
	return `[${hour}:${minute}:${second}]`;
};
const log = message => console.log(`${timestamp()} ${message}`);

var cache = Object.assign({}, ...cachedIds.map(id => ({[id]: null})));
setInterval(async () => {
	const ids = Object.keys(cache);
	for (let i = 0; i < ids.length; i++) {
		const data = await api(ids[i]);
		if (data.status) {
			cache[ids[i]] = data;
			log(`${ids[i]} was cached`);
		} else {
			log(`${ids[i]} failed to cache`);
		}
	}
}, cacheTime);

app.get('/character/:id', async (req, res) => {
	const { id } = req.params;
	if (manualMode) {
		log(`${id} was requested in manual mode`);
		const data = await api(id);
		return res.send(data);
	}
	log(`${id} was requested`);
	if (cache[id]) {
		log(`${id} was taked from cache`);
		return res.send(cache[id]);
	} else {
		const data = await api(id);
		if (data.status) {
			cache[id] = data;
			log(`${id} was freshly taken`);
		} else {
			log(`${id} failed to be freshly taken`);
		}
		return res.send(data);
	}
});

app.listen(port, () => log(`Connected to port: ${port}`));