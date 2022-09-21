import { randomBytes } from 'crypto';
import { client } from '$services/redis';
import type { Client } from '../../../worker/client';

export const withLock = async (key: string, cb: (client: Client, signal: any) => any) => {
	// Initialize a few variables to control retry behaviour
	const retryDelayMs = 100;
	const timeoutMs = 2000;
	let retries = 20;

	// Generate a random value to store at a lock key
	const token = randomBytes(6).toString('hex');
	// Create a lock key
	const lockKey = `lock:${key}`;

	// Set up a while loop to implement the retry behavior
	while (retries >= 0) {
		retries--;
		// Try to SET NX operation
		const acquired = await client.set(lockKey, token, {
			NX: true,
			PX: timeoutMs
		});
		if (!acquired) {
			// ELSE bries pause (retryDelayMs) and then retry
			await pause(retryDelayMs);
			continue;
		}
		// IF the set is successful, then run the callback
		try {
			const signal = { expired: false };
			setTimeout(() => {
				signal.expired = true;
			}, timeoutMs);
			const proxiedClient = buildClientProxy(timeoutMs);
			const result = await cb(proxiedClient, signal);
			return result;
		} finally {
			// Unset the locked key
			// await client.del(lockKey);
			await client.unlock(lockKey, token);
		}
	}
};

const buildClientProxy = (timeoutMs: number) => {
	const startTime = Date.now();

	const handler = {
		get(target: Client, prop: keyof Client) {
			if (Date.now() >= startTime + timeoutMs) {
				throw new Error('Lock has expired.');
			}

			const value = target[prop];
			return typeof value === 'function' ? value.bind(target) : value;
		}
	};

	return new Proxy(client, handler) as Client;
};

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};
