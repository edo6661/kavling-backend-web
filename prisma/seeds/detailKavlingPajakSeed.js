"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDetailKavlingPajak = seedDetailKavlingPajak;
var client_1 = require("@prisma/client");
function seedDetailKavlingPajak(prisma) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.detailKavlingPajak.create({
                        data: {
                            penjualanId: 1,
                            notarisId: 1,
                            lantai: "1",
                            luasBangunan: "36",
                            lokasiStrategis: "Pojok / Hook",
                            tanggalAkadPpjb: new Date("2026-04-20"),
                            akadPpjb: "Notaris Budi Santoso",
                            tanggalAkadAjbPpat: new Date("2026-05-10"),
                            tanggalPembayaranPph: new Date("2026-05-01"),
                            tanggalPembayaranBphtb: new Date("2026-05-02"),
                            pembiayaan: "KPR BCA",
                            sp3r: client_1.SP3R.BANK,
                            lebihTanah: 0.0,
                            biayaStrategis: 5000000.0,
                            nrBiayaKprAsuransi: 15000000.0,
                            nrDiskonAngsuran: 0.0,
                            nrDiskonCash: 0.0,
                            nrBiayaBbn: 3500000.0,
                            nrBiayaNotarisAjb: 5000000.0,
                            nrBiayaAppraisal: 1500000.0,
                            nrBiayaBphtb: 12500000.0,
                            nrLainLain: 1000000.0,
                            nrPpn: 35000000.0,
                            nrBphtb: 12500000.0,
                            nrPph: 8750000.0,
                            pjBiayaKpr: 15000000.0,
                            pjBiayaAsuransi: 5000000.0,
                            pjDiskonAngsuran: 0.0,
                            pjBiayaBbn: 3500000.0,
                            pjBiayaAjb: 5000000.0,
                            pjBiayaAppraisal: 1500000.0,
                            pjBphtb: 12500000.0,
                            pjLainLain: 0.0,
                            pjPpn: 35000000.0,
                            pjBphtbPajak: 12500000.0,
                            pjPph: 8750000.0,
                            ajbNjopTanahPerMeter: 1500000.0,
                            ajbNjopTanah: 90000000.0,
                            ajbNjopBangunanPerMeter: 2000000.0,
                            ajbNjopBangunan: 72000000.0,
                            ajbPpn: 35000000.0,
                            ajbBphtb: 12500000.0,
                            ajbPph: 8750000.0,
                            ajbSelisihPajakPbb: 0.0,
                            ajbUping: 0.0,
                        },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
