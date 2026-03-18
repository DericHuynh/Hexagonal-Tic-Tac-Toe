import { env } from 'cloudflare:test'
import { describe, it, expect } from 'vitest'
import { WS_COUNTER_PATTERN } from '../src/server'

describe('WS_COUNTER_PATTERN', () => {
	it('matches /counter/:id/ws and extracts the id', () => {
		const match = '/counter/default/ws'.match(WS_COUNTER_PATTERN)
		expect(match).not.toBeNull()
		expect(match![1]).toBe('default')
	})

	it('matches ids with special characters', () => {
		const match = '/counter/my-counter_123/ws'.match(WS_COUNTER_PATTERN)
		expect(match).not.toBeNull()
		expect(match![1]).toBe('my-counter_123')
	})

	it('rejects paths without /ws suffix', () => {
		expect('/counter/default'.match(WS_COUNTER_PATTERN)).toBeNull()
	})

	it('rejects paths with extra segments', () => {
		expect('/counter/default/ws/extra'.match(WS_COUNTER_PATTERN)).toBeNull()
	})

	it('rejects empty id segment', () => {
		expect('/counter//ws'.match(WS_COUNTER_PATTERN)).toBeNull()
	})
})

describe('MyDurableObject', () => {
	it('starts with a count of 0', async () => {
		const id = env.MY_DURABLE_OBJECT.idFromName('test')
		const stub = env.MY_DURABLE_OBJECT.get(id)
		const count = await stub.getCount()
		expect(count).toBe(0)
	})

	it('increments the counter', async () => {
		const id = env.MY_DURABLE_OBJECT.idFromName('test-inc')
		const stub = env.MY_DURABLE_OBJECT.get(id)

		const c1 = await stub.increment()
		expect(c1).toBe(1)

		const c2 = await stub.increment()
		expect(c2).toBe(2)
	})

	it('decrements the counter', async () => {
		const id = env.MY_DURABLE_OBJECT.idFromName('test-dec')
		const stub = env.MY_DURABLE_OBJECT.get(id)

		await stub.increment() // 1
		await stub.increment() // 2
		const count = await stub.decrement()
		expect(count).toBe(1)
	})

	it('isolates different instances', async () => {
		const stubA = env.MY_DURABLE_OBJECT.get(
			env.MY_DURABLE_OBJECT.idFromName('counter-a'),
		)
		const stubB = env.MY_DURABLE_OBJECT.get(
			env.MY_DURABLE_OBJECT.idFromName('counter-b'),
		)

		await stubA.increment()
		await stubA.increment()
		await stubB.increment()

		expect(await stubA.getCount()).toBe(2)
		expect(await stubB.getCount()).toBe(1)
	})
})
