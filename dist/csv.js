"use strict";
//
//  CSVTapReader   reads in CSV file, sends Taps to ITapSink
//  CSVTripWriter  is a ITripSink which writes Trips to CSV file
//
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVTripWriter = exports.CSVTapReader = void 0;
const fs = __importStar(require("fs"));
const csv_parse_1 = require("csv-parse");
const assert_ts_1 = __importDefault(require("assert-ts"));
const types_1 = require("./types");
class LogSink {
    constructor() {
        this.count = 0;
    }
    send(tap) {
        this.count++;
        console.error("tap : " + [tap.ts, tap.id, tap.tap, tap.stop].join(" "));
    }
    done() {
        console.error("done : " + this.count + " rows");
    }
}
function tap_from_csv(s) {
    let rec = s.split(",");
    if (rec.length < 4)
        return null;
    let ts = rec[0];
    let id = rec[1];
    let tap = rec[2];
    let stop = +rec[3];
    if (stop < types_1.Stop.S1 || stop > types_1.Stop.S3)
        return null;
    if (!ts.length || ts == "ts")
        return null;
    if (tap != types_1.TapON && tap != types_1.TapOFF)
        return null;
    return { ts, id, tap, stop };
}
let tapok = tap_from_csv("1003,4001,I,3");
let badh = tap_from_csv("ts,id,tap,stop");
let badb = tap_from_csv("");
(0, assert_ts_1.default)(tapok, "tapok should be valid, but isnt");
(0, assert_ts_1.default)(!badh, "header is not a valid tap");
(0, assert_ts_1.default)(!badb, "blank  is not a valid tap");
function csv_tap_reader(sfile, sink) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let parser = (0, csv_parse_1.parse)({ columns: true });
        fs.createReadStream(sfile).pipe(parser);
        try {
            for (var parser_1 = __asyncValues(parser), parser_1_1; parser_1_1 = yield parser_1.next(), !parser_1_1.done;) {
                const record = parser_1_1.value;
                // aahh.. we just want the csv line / values
                let srec = [];
                for (const k in record)
                    srec.push(record[k]);
                let tap = tap_from_csv(srec.join(','));
                if (tap)
                    sink.send(tap);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (parser_1_1 && !parser_1_1.done && (_a = parser_1.return)) yield _a.call(parser_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        sink.done();
    });
}
function test_log() {
    let tap_sink = new LogSink();
    csv_tap_reader("taps.csv", tap_sink);
}
//test_log();
class CSVTapReader {
    constructor(sfile) {
        this._file = sfile;
    }
    read_into(sink) {
        return __awaiter(this, void 0, void 0, function* () {
            csv_tap_reader(this._file, sink);
        });
    }
}
exports.CSVTapReader = CSVTapReader;
///
const CSV_OUT_HEADERS = ["id", "from_ts", "from_tap", "from_stop", "to_ts", "to_tap", "to_stop", "cost"];
class CSVTripWriter {
    constructor(sfile) {
        // open file, write headers
        this.csv = fs.createWriteStream(sfile);
        //this.csv.open();
        this.csv.write(CSV_OUT_HEADERS.join(",") + "\n");
    }
    // ITripSink impl
    send(t) {
        let lst = t.tap_on;
        let cur = t.tap_off;
        let rec = [cur.id, lst.ts, lst.tap, lst.stop, cur.ts, cur.tap, cur.stop, t.cost.toFixed(2)];
        this.csv.write(rec.join(",") + "\n");
    }
    done() {
        this.csv.close();
    }
}
exports.CSVTripWriter = CSVTripWriter;
//# sourceMappingURL=csv.js.map