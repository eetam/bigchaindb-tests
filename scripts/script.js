import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 200, // Number of virtual users
    duration: '60s', // Duration of the test
};

export default function () {
    const url = 'http://host.docker.internal:3000/create-transaction';

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: '120s', // Increase the timeout to 120 seconds
    };

    const res = http.post(url, {}, params);

    let success = check(res, {
        'is status 200': (r) => r.status === 200,
    });

    if (!success) {
        console.log(`Request failed. Status: ${res.status}, Body: ${res.body}`);
    }

    sleep(1);
}