// Web Worker for generating timetables
self.onmessage = function (e: MessageEvent<number>) {
  console.log("Worker received:", e.data);

  // Simulate heavy computation
  const result = pi(e.data);

  // Send result back to main thread
  self.postMessage(result);
};

function pi(n: number) {
  console.log("Called");
  let v = 0;
  for (let i = 1; i <= n; i += 4) {
    // increment by 4
    v += 1 / i - 1 / (i + 2); // add the value of the series
  }
  return 4 * v; // apply the factor at last
}
