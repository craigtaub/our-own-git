import fs from "fs";
import glob from "glob";
import { workingDir, hashFileStats, updateIndex } from "./util.mjs";

const init = () => {
  console.log("[init] - start");
  const workingDirectory = workingDir();
  const files = glob.sync("**/*.txt", { cwd: workingDirectory });

  console.log("[init] - build index data");
  const indexData = files.reduce((acc, curr) => {  //acc is the accumulator whreas curr is the current elemnet
    const hash = hashFileStats(curr);
    acc[curr] = {
      cwd: hash,
      staging: "",
      repository: "",
    };
    return acc;
  }, {});

  let data = {
    title: "",
};
  console.log("[init] - write .repo");
  console.log(workingDirectory);
  fs.mkdirSync(`${workingDirectory}/.repo`);
  updateIndex(indexData);
  console.log(workingDirectory);
  fs.writeFileSync(`${workingDirectory}/.repo/HEAD`,JSON.stringify(data));
  console.log(workingDirectory);
  fs.mkdirSync(`${workingDirectory}/.repo/objects`);
  console.log(workingDirectory);
};

init();
