export default class Tuning {
  /**
   *
   * @param scale array of scale elements, each of which are either cents or ratios from tonic
   * @param tonic either a frequency for the first scale degree, or a tuple pinning a scale degree (zero index) to a frequency, e.g. [440, 9]
   */
  constructor(scale, tonic) {
    this.scale = scale || [];
    this.scaleRatios = Tuning.normalizeScale(scale);
    if (tonic && Array.isArray(tonic)) {
      this.pinFrequencyFrequency = tonic[0];
      this.pinFrequencyDegree = tonic[1];
      this.tonic = Tuning.tonicFromTuple(tonic, scale);
    } else if (tonic) {
      this.tonic = tonic;
    } else {
      this.tonic = 440;
    }
  }

  /**
   * Translate the scale to a normalized scale, as ratios.
   *
   * From the .scl format spec:
   * > After that come the pitch values, each on a separate line, either as a ratio or as a value in cents. If the value contains a period, it is a cents value, otherwise a ratio. Ratios are written with a slash, and only one. Integer values with no period or slash should be regarded as such, for example "2" should be taken as "2/1". Numerators and denominators should be supported to at least 231-1 = 2147483647. Anything after a valid pitch value should be ignored. Space or horizontal tab characters are allowed and should be ignored. Negative ratios are meaningless and should give a read error. For a description of cents, go here.
   */
  static normalizeScale(scale) {
    return scale.map(value => {
      const asString = String(value);
      if (asString.includes('.')) {
        // in cents
        const cents = Number(asString);
        return Math.pow(2, cents / 1200);
      } else {
        // as ratio
        return eval(value);
      }
    });
  }

  static tonicFromTuple([frequency, degree], scale) {
    const ratios = Tuning.normalizeScale(scale);
    const ratio = ratios[degree - 1];
    return frequency / ratio;
  }

  frequencies = () => {
    return this.scale.map((_, i) => this.frequency(i));
  };

  frequency = (scaleIndex, octaveOffset = 0) => {
    let octave = Math.floor(scaleIndex / this.scale.length);
    if (octaveOffset) {
      octave += octaveOffset;
    }
    const scaleDegree = scaleIndex % this.scale.length;
    const ratio = scaleDegree === 0 ? 1 : this.scaleRatios[scaleDegree - 1];
    let freq = this.tonic * ratio;
    freq = freq * Math.pow(2, octave);
    return freq;
  };
}
