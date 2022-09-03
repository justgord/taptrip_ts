"use strict";
//
//  taptrip : src/test.ts
//
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const csv_1 = require("./csv");
const proc_1 = require("./proc");
const lerr = console.error;
///
function nrand(K) {
    return Math.floor(Math.random() * K);
}
function rand_elt(rg) {
    return rg[nrand(rg.length)];
}
function rand_taps_into(sink, N = 1000) {
    function rand_id() {
        return 1001 + nrand(50) + nrand(50);
    }
    let tm = 2001;
    function rand_ts() {
        let dt = nrand(10) + nrand(10); // monotonic clock
        tm += dt;
        return tm;
    }
    function rand_tap() {
        return rand_elt([types_1.TapON, types_1.TapOFF]);
    }
    function rand_stop() {
        return rand_elt([types_1.Stop.S1, types_1.Stop.S2, types_1.Stop.S3]);
    }
    function gen_rand_tap() {
        return { id: rand_id().toString(), ts: rand_ts().toString(), tap: rand_tap(), stop: rand_stop() };
    }
    // make lots of random taps
    lerr("generating taps : " + N);
    for (let i = 0; i < N; i++) {
        let tap = gen_rand_tap();
        //lerr(tap);
        sink.send(tap);
    }
    sink.done();
}
function process_taps() {
    let csv_write = new csv_1.CSVTripWriter("rand_trips.csv");
    let costs = new proc_1.FixedTripCosts();
    let processor = new proc_1.TripProcessor(costs, csv_write);
    rand_taps_into(processor);
}
process_taps();
//# sourceMappingURL=test.js.map