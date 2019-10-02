// @flow
import * as tf from '@tensorflow/tfjs';

function* coordinateGenerator(round: number, w: number, h: number) {
  let n = Math.pow(2, round);
  // cell width x
  let cwx = w / n;
  // cell width y
  let cwy = h / n;

  if (cwx % 1 != 0 || cwy % 1 != 0) {
    cwx = 1;
    cwy = 1;
  }

  var nx = w / cwx;
  var ny = h / cwy;

  yield [nx, ny, cwx, cwy];

  let ax = nx / 2;
  let ay = ny / 2;
  let cx = 0;
  let cy = 0;
  let axis = 0;
  let dir = -1;
  let m = 0;
  let z = 1;

  while (z <= Math.max(nx, ny)) {
    if (ay >= 0 && ax >= 0 && ax < nx && ay < ny) yield [ax * cwx, ay * cwy, ax, ay];

    if (axis == 0) cx += dir;
    else cy += dir;

    m += 1;
    ax = cx + nx / 2;
    ay = cy + ny / 2;

    if (axis == 0 && (m >= z || ax <= 0 || ax >= nx - 1)) {
      axis = 1;
      m = 0;
    } else if (axis == 1 && (m >= z || ay <= 0 || ay >= ny - 1)) {
      axis = 0;
      m = 0;
      dir *= -1;
      z += 1;
    }
  }
}

let batchSize = 2048;
let smoothTimeTaken = 0;
let lastBatchSizeCorrection = 128;
let iterations = 0;

function* generateProgressive(
  context: CanvasRenderingContext2D,
  model: tf.Model,
  time: number,
  w: number,
  h: number,
  stored?: RenderedImage
) {
  let round = stored ? stored.round : 1;
  let data: Float32Array = stored ? stored.image : null;

  const bw = model.output.shape[1] == 1;
  const N = 0.5 * w + 0.5 * h;
  const scale = 1.0;

  if (!!stored) {
    let [nx, ny, cwx, cwy] = coordinateGenerator(round, w, h).next().value;

    if (cwx == 1 && cwy == 1) {
      let imageData = context.createImageData(w, h);
      for (var cy = 0; cy < ny; ++cy) {
        for (var cx = 0; cx < nx; ++cx) {
          let r = data[(cy * nx + cx) * 3 + 0];
          let g = data[(cy * nx + cx) * 3 + 1];
          let b = data[(cy * nx + cx) * 3 + 2];

          imageData.data[(cy * nx + cx) * 4 + 0] = Math.round(r);
          imageData.data[(cy * nx + cx) * 4 + 1] = Math.round(g);
          imageData.data[(cy * nx + cx) * 4 + 2] = Math.round(b);
          imageData.data[(cy * nx + cx) * 4 + 3] = 255;
        }
      }

      context.putImageData(imageData, 0, 0);
    } else {
      for (var cy = 0; cy < ny; ++cy) {
        for (var cx = 0; cx < nx; ++cx) {
          let r = data[(cy * nx + cx) * 3 + 0];
          let g = data[(cy * nx + cx) * 3 + 1];
          let b = data[(cy * nx + cx) * 3 + 2];

          context.fillStyle =
            'rgb(' + r.toFixed(0) + ', ' + g.toFixed(0) + ', ' + b.toFixed(0) + ')';
          context.fillRect(cx * cwx, cy * cwy, cwx, cwy);
        }
      }
    }
  }

  let calcs = 0;
  while (nx < w || ny < h) {
    let prevdata = data;
    let prevnx = nx;
    let prevny = ny;

    let coordinates = coordinateGenerator(round, w, h);
    var [nx, ny, cwx, cwy] = coordinates.next().value;

    data = new Float32Array(nx * ny * 3);
    data.fill(-1);
    // context.clearRect(0, 0, w, h)

    if (prevdata) {
      var _cwx = nx / prevnx;
      var _cwy = ny / prevny;

      for (var cy = 0; cy < prevny; ++cy) {
        for (var cx = 0; cx < prevnx; ++cx) {
          let y = cy * _cwy; // + _cwy / 2
          let x = cx * _cwx; // + _cwx / 2

          data[(y * nx + x) * 3 + 0] = prevdata[(cy * prevnx + cx) * 3 + 0];
          data[(y * nx + x) * 3 + 1] = prevdata[(cy * prevnx + cx) * 3 + 1];
          data[(y * nx + x) * 3 + 2] = prevdata[(cy * prevnx + cx) * 3 + 2];
        }
      }
    }

    var ptr = null;

    while (!ptr || !ptr.done) {
      yield { progress: calcs / (w * h) };

      let startTime = window.performance.now();

      let inputs = [];
      let coords = [];

      while (inputs.length < batchSize && (ptr = coordinates.next()) && !ptr.done) {
        let [x, y, cx, cy] = ptr.value;

        if (data[(cy * nx + cx) * 3 + 0] != -1) {
          continue;
        }

        let in_x = ((((x / w) * 2 - 1) * w) / N) * scale;
        let in_y = ((((y / h) * 2 - 1) * h) / N) * scale;
        let in_r = Math.sqrt(in_x ** 2 + in_y ** 2);
        let in_a = Math.asin(in_y / in_r);

        data[(cy * nx + cx) * 3 + 0] = 0;

        inputs.push([in_x, in_y, in_r, time]);
        coords.push([cx, cy]);
      }

      if (coords.length == 0) continue;

      let input = tf.tensor2d(inputs);
      let output = tf.tidy(() =>
        model
          .predict(input)
          .mul(tf.scalar(0.5))
          .add(tf.scalar(0.5))
      );
      let outputd = output.dataSync();

      for (var k = 0; k < coords.length; ++k) {
        let [cx, cy] = coords[k];
        let r, g, b;
        if (bw) {
          r = outputd[k] * 255.0;
          g = outputd[k] * 255.0;
          b = outputd[k] * 255.0;
        } else {
          r = outputd[k * 3 + 0] * 255.0;
          g = outputd[k * 3 + 1] * 255.0;
          b = outputd[k * 3 + 2] * 255.0;
        }

        data[(cy * nx + cx) * 3 + 0] = r;
        data[(cy * nx + cx) * 3 + 1] = g;
        data[(cy * nx + cx) * 3 + 2] = b;

        context.fillStyle = 'rgb(' + r.toFixed(0) + ', ' + g.toFixed(0) + ', ' + b.toFixed(0) + ')';
        context.fillRect(cx * cwx, cy * cwy, cwx, cwy);
      }

      output.dispose();

      let endTime = window.performance.now();
      let timeTaken = endTime - startTime;
      // adjust batchSize
      if (coords.length == batchSize) {
        if (smoothTimeTaken == 0) smoothTimeTaken = timeTaken;

        smoothTimeTaken = smoothTimeTaken * 0.98 + 0.02 * timeTaken;

        if (iterations - lastBatchSizeCorrection > 32) {
          batchSize = Math.round(batchSize * (1 + (50 / smoothTimeTaken - 1) * 0.36));
          batchSize = Math.min(8192, Math.max(128, batchSize));

          lastBatchSizeCorrection = iterations;
          console.log(`batch size now ${batchSize} / ${smoothTimeTaken} ms`);
        }
      }

      calcs += coords.length;
      iterations += 1;
    }

    yield { image: { round, image: data } };
    round += 1;
  }

  yield { progress: 1 };

  console.log(`finished image with ${calcs} calculations, supposed to be ${w * h}`);
}

type RenderedImage = { round: number, image: Float32Array };

export function getScaledImageURL(c: HTMLCanvasElement, scale: number) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = Math.floor(scale * c.width);
  canvas.height = Math.floor(scale * c.height);

  context.scale(scale, scale);
  context.drawImage(c, 0, 0);

  return canvas.toDataURL();
}

export function* render(
  model: tf.Model,
  stored: Map<number, RenderedImage>,
  canvas: HTMLCanvasElement,
  time?: number,
  progress?: (round: number, percentage: number) => void
) {
  time = time == null ? randn() : time;

  const context = canvas.getContext('2d');
  const processor = generateProgressive(
    context,
    model,
    time,
    canvas.width,
    canvas.height,
    stored.get(time)
  );

  let round = 1;

  while (true) {
    yield;

    let ptr = processor.next();
    if (ptr.done) return;

    if (ptr.value && ptr.value.progress && progress) {
      progress(round, ptr.value.progress);
    }

    if (ptr.value && ptr.value.image) {
      stored.set(time, ptr.value.image);
      round += 1;
    }
  }
}

var _U2 = null;
function randn(): number {
  var U1,
    U2 = _U2,
    W,
    mult;
  if (U2) {
    _U2 = null; // deactivate for next time
    return U2;
  }

  do {
    U1 = -1 + Math.random() * 2;
    U2 = -1 + Math.random() * 2;
    W = U1 * U1 + U2 * U2;
  } while (W >= 1 || W === 0);

  mult = Math.sqrt((-2 * Math.log(W)) / W);
  _U2 = U2 * mult;

  return U1 * mult;
}
