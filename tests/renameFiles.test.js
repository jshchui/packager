const { sum } = require("./sum.js");

test("sum", () => {
  expect(sum(1, 2)).toBe(3);
});
