interface Config {
	port: number;
	autoFetch: {
		enabled: boolean;
		cachedIds: number[];
		cacheTime: number;
	},
	manualMode: boolean;
}

const config: Config = {
	port: 3000,
	autoFetch: {
		enabled: false,
		cachedIds: [],
		cacheTime: 60e3
	},
	manualMode: false
}

export const { port, autoFetch, manualMode } = config

export default config