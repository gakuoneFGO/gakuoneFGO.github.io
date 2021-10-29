import { TransformFnParams } from "class-transformer";

export const SCALE = 1000;

export class ScaledInt {
    constructor(value: number) {
        //assumes scaling has already happened. callers should construct with s
        this._ = Math.round(value);
    }

    private _: number;

    plus(other: ScaledInt) {
        return new ScaledInt(this._ + other._);
    }

    minus(other: ScaledInt) {
        return new ScaledInt(this._ - other._);
    }

    times(other: number | Float) {
        return other instanceof Float ?
            new ScaledInt(Math.floor(this._ * other.value())) :
            new ScaledInt(Math.floor(this._ * other));
    }

    asMultiplier() {
        return f(1 + Math.fround(this._ / SCALE));
    }

    static max(...values: ScaledInt[]) {
        return new ScaledInt(Math.max(...values.map(v => v._)))
    }

    value() {
        return this._ / SCALE;
    }
}

export const s = (v: number) => new ScaledInt(v * SCALE);

export const transformScaledInt = (parms: TransformFnParams) => parms.value instanceof ScaledInt ? parms.value.value() : s(parms.value);

export class Float {
    constructor(value: number) {
        this._ = Math.fround(value);
    }

    private _: number;

    times(other: Float | number) {
        return other instanceof Float ?
            f(this._ * other._) :
            f(this._ * Math.fround(other));
    }

    plus(other: Float | number) {
        return other instanceof Float ?
            f(this._ + other._) :
            f(this._ + Math.fround(other));
    }

    floor() {
        return Math.floor(this._);
    }

    value() {
        return this._;
    }
}

export const f = (v: number) => new Float(v);

//https://github.com/atlasacademy/fgo-docs/blob/master/deeper/battle/misc.md
function testArithmetic(perhit: number, cardUp: number, gainUp: number, cardBase: number, critBonus: number) {
    const
        cardBonus = s(cardUp).asMultiplier().times(cardBase).plus(1),
        gainBonus = s(gainUp).asMultiplier(),
        base_gain_no_round = cardBonus.times(perhit).times(gainBonus).times(critBonus);
    console.log(base_gain_no_round.floor());
    console.log(base_gain_no_round);
}

//testArithmetic(25, .8, .3, 6, 2);