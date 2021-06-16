import express from 'express';

import api from './api.js';
import { cacheTime, cachedIds, port } from './config.js';

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
		cache[ids[i]] = data;
		log(`${ids[i]} was cached`);
	}
}, cacheTime);

app.get('/character/:id', async (req, res) => {
	if (cache[req.params.id]) {
		log(`${req.params.id} was taked from cache`);
		return res.send(cache[req.params.id]);
	} else {
		const data = await api(req.params.id);
		cache[req.params.id] = data;
		log(`${req.params.id} was freshly taken`);
		return res.send(data);
	}
});

app.listen(port, () => log(`Connected to port: ${port}`));