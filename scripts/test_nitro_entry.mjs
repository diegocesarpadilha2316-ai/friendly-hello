const mod = await import('../.output/server/index.mjs');
const handler = mod.default ?? mod;
const response = await handler.fetch(new Request('http://localhost/planner-v2?promobReference=1'), {}, { waitUntil() {} });
console.log(`status=${response.status}`);
console.log((await response.text()).slice(0, 240));
