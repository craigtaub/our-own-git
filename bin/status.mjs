import fs from "fs";
import {
  workingDir,
  hashBlobContentsInFile,
  getIndexData,
  updateIndex,
} from "./util.mjs";

const status = () => {
  console.log("[status] - start");

  const workingDirectory = workingDir();
  const indexData = getIndexData(workingDirectory);

  const notStaged = [];
  const notComitted = [];
  const updatedIndexData = Object.keys(indexData).reduce((acc, curr) => {
    const hash = hashBlobContentsInFile(`${workingDirectory}/${curr}`);
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

  updateIndex(workingDirectory, updatedIndexData);

  console.log("\nChanged locally but not staged:");
  notStaged.map((message) => console.log(`- ${message}`));
  console.log("\nStaged but not comitted:");
  notComitted.map((message) => console.log(`- ${message}`));
  console.log("\n");
};

status();
