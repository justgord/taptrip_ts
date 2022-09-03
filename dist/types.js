"use strict";
//
// taptrip types
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.TapOFF = exports.TapON = exports.TapIO = exports.Stop = void 0;
var Stop;
(function (Stop) {
    Stop[Stop["S1"] = 1] = "S1";
    Stop[Stop["S2"] = 2] = "S2";
    Stop[Stop["S3"] = 3] = "S3";
})(Stop = exports.Stop || (exports.Stop = {}));
;
var TapIO;
(function (TapIO) {
    TapIO["I"] = "I";
    TapIO["O"] = "O";
})(TapIO = exports.TapIO || (exports.TapIO = {}));
;
exports.TapON = TapIO.I;
exports.TapOFF = TapIO.O;
//# sourceMappingURL=types.js.map