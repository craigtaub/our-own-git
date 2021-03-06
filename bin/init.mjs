import fs from "fs";
import glob from "glob";
import { workingDir, hashFileStats, updateIndex } from "./util.mjs";

const init = () => {
  console.log("[init] - start");
  const workingDirectory = workingDir();
  const files = glob.sync("**/*.txt", { cwd: workingDirectory });

  console.log("[init] - build index data");
  const indexData = files.reduce((acc, curr) => {
    const hash = hashFileStats(curr);
    acc[curr] = {
      cwd: hash,
      staging: "",
      repository: "",
    };
    return acc;
  }, {});

  console.log("[init] - write .repo");
  fs.mkdirSync(`${workingDirectory}/.repo`);
  updateIndex(indexData);
  fs.writeFileSync(`${workingDirectory}/.repo/HEAD`);
  fs.mkdirSync(`${workingDirectory}/.repo/objects`);
};

init();
