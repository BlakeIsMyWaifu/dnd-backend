const config = {
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