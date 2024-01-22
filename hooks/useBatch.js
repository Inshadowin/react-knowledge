import { useMemo, useRef } from "react";

const performBatch = (arr, size) => {
  const batches = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }

  return batches;
};

const areArraysEqual = (arr1, arr2) => {
  return arr1.every((item, index) => item === arr2[index]);
};

export const useBatch = (arr = [], size = 50) => {
  const batchesRef = useRef([]);

  const batches = useMemo(() => {
    const newBatches = performBatch(arr, size);

    const oldBatches = batchesRef.current ?? [];
    const result = newBatches.map((newBatch, index) => {
      const oldBatch = oldBatches[index] ?? [];

      return areArraysEqual(oldBatch, newBatch) ? oldBatch : newBatch;
    });

    batchesRef.current = result;

    return result;
  }, [arr, size]);

  return batches;
};
