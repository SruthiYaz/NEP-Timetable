import * as tf from "@tensorflow/tfjs";


export const model = tf.sequential({
  layers: [
    tf.layers.dense({ units: 64, activation: "relu", inputShape: [30] }),
    tf.layers.batchNormalization(),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: 32, activation: "relu" }),
    tf.layers.dense({ units: 16, activation: "relu" }),
    tf.layers.dropout({ rate: 0.1 }),
    tf.layers.dense({ units: 3, activation: "sigmoid" }) 
  ]
});

model.compile({
  optimizer: tf.train.adam(0.001),
  loss: "meanSquaredError",
  metrics: ["mae"]
});

const xs = tf.randomNormal([25, 30]);
const ys = tf.randomUniform([25, 3]);
await model.fit(xs, ys, { epochs: 8, batchSize: 5, verbose: 0 });

export async function analyzeTimetable(encodedData) {
  const input = tf.tensor2d([encodedData], [1, 30]);
  const prediction = model.predict(input);
  const [compliance, balance, stress] = Array.from(await prediction.data());

  return {
    complianceScore: (compliance * 100).toFixed(2),
    academicBalance: (balance * 100).toFixed(2),
    stressRisk: (stress * 100).toFixed(2),
  };
}
