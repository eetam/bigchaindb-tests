import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 200, // Number of virtual users
    duration: '30s', // Duration of the test
};

export default function () {
    const url = 'http://host.docker.internal:3000/create-transaction';

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(url, {}, params);

    check(res, {
        'is status 200': (r) => r.status === 200,
    });

    sleep(1);
}