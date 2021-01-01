import fs from "fs";
import {
  workingDir,
  hashFileStats,
  getIndexData,
  updateIndex,
} from "./util.mjs";

const status = () => {
  console.log("[status] - start");

  const indexData = getIndexData();

  console.log("[status] - process updated index data");
  const notStaged = [];
  const notComitted = [];
  const updatedIndexData = Object.keys(indexData).reduce((acc, curr) => {
    const hash = hashFileStats(curr);
    if (hash !== indexData[curr].cwd) {
      acc[curr] = {
        cwd: hash,
        staging: indexData[curr].staging,
        repository: indexData[curr].repository,
      };
      notStaged.push(curr);
    } else {
      if (indexData[curr].cwd !== indexData[curr].staging) {
        notStaged.push(curr);
        // THIS OK??
      } else if (indexData[curr].staging !== indexData[curr].repository) {
        notComitted.push(curr);
      }
      acc[curr] = indexData[curr];
    }

    return acc;
  }, {});

  console.log("[status] - update index");
  updateIndex(updatedIndexData);

  console.log("\nChanged locally but not staged:");
  notStaged.map((message) => console.log(`- ${message}`));
  console.log("\nStaged but not comitted:");
  notComitted.map((message) => console.log(`- ${message}`));
  console.log("\n");
};

status();
