import fs from "fs";
import { workingDir } from "./util.mjs";

const status = () => {
  console.log("[status] - start");

  const workingDirectory = workingDir();
  const indexData = JSON.parse(
    fs.readFileSync(`${workingDirectory}/.repo/index`, {
      encoding: "utf-8",
    })
  );

  Object.keys(indexData).map((file) => {
    const item = indexData[file];
    if (item.cwd !== item.staging) {
      console.log(`[status] - local changes to "${file}" not staged`);
      return;
    }
    if (item.staging !== item.repository) {
      console.log(`[status] - local changes to "${file}" not committed`);
      return;
    }
  });
};

status();
