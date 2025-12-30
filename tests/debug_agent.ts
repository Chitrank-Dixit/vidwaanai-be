const url = 'http://host.docker.internal:8001/api/v1/agent/health';
console.log(`Fetching ${url}...`);
try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    console.log(await res.text());
} catch (err) {
    console.error('Fetch failed:', err);
}
