
module.exports = function (n, t) {
    var data = {
        left: n,
        queue: [],
        cancel: 0
    };

    data.cancel = setInterval(function () {
        while (data.left > 0 && data.queue.length > 0) {
            let first = data.queue.splice(0, 1);

            first();
            data.left--;
        }

        data.left = n;
    });

    return function (f) {
        if (data.left > 0) {
            f();
            data.left--;
        }
        else {
            data.queue.push(f);
        }
    };
};
