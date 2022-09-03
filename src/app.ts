//
//  taptrip : src/app.ts
//

import { CSVTapReader, CSVTripWriter } from "./csv";
import { FixedTripCosts, TripProcessor } from "./proc";

///

function process_taps()
{
    let csv_read    = new CSVTapReader("taps.csv");
    let csv_write   = new CSVTripWriter("trips.csv");

    let costs       = new FixedTripCosts();

    let processor   = new TripProcessor(costs, csv_write);

    csv_read.read_into(processor);
}

process_taps();


