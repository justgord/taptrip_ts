"use strict";
//
//  taptrip : src/app.ts
//
Object.defineProperty(exports, "__esModule", { value: true });
const csv_1 = require("./csv");
const proc_1 = require("./proc");
///
function process_taps() {
    let csv_read = new csv_1.CSVTapReader("taps.csv");
    let csv_write = new csv_1.CSVTripWriter("trips.csv");
    let costs = new proc_1.FixedTripCosts();
    let processor = new proc_1.TripProcessor(costs, csv_write);
    csv_read.read_into(processor);
}
process_taps();
//# sourceMappingURL=app.js.map