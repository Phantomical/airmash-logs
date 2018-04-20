
export function createThrottle(interval: number, n: number, limit: number) {
    var queue: (() => void)[] = []
    var cnt = n;

    setInterval(function () {
        while (cnt > 0) {
            let fn = queue.shift();
            fn();
            cnt -= 1;
        }

        cnt = n;
    });

    return function (fn: () => void) {
        if (cnt <= 0) {
            if (queue.length < limit) {
                queue.push(fn);
            }
        }
        else {
            fn();
            cnt -= 1;
        }
    };
}