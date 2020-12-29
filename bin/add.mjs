import fs from "fs";
import { workingDir } from "./util.mjs";

const add = () => {
  console.log("[add] - start");
  const workingDirectory = workingDir();

  // explicitly give files e.g. one.txt two/three.txt
  const files = process.argv.slice(2);

  const indexData = JSON.parse(
    fs.readFileSync(`${workingDirectory}/.repo/index`, {
      encoding: "utf-8",
    })
  );

  console.log("[add] - write blob objects");
  const updatedFiles = files.map((file) => {
    const hash = indexData[file].cwd;
    const blobDir = hash.substring(0, 2);
    const blobObject = hash.substring(2);
    fs.mkdirSync(`${workingDirectory}/.repo/objects/${blobDir}`);
    fs.writeFileSync(
      `${workingDirectory}/.repo/objects/${blobDir}/${blobObject}`,
      hash
    );
    return {
      file,
      hash,
    };
  });

  console.log("[add] - update index");
  const updatedIndexData = Object.keys(indexData).reduce((acc, curr) => {
    // file wasnt touched
    if (!updatedFiles.find((item) => item.file === curr)) {
      acc[curr] = {
        cwd: indexData[curr].cwd,
        staging: indexData[curr].staging,
        repository: indexData[curr].repository,
      };
      return acc;
    }
    // update staging for file
    acc[curr] = {
      cwd: indexData[curr].cwd,
      staging: updatedFiles.find((item) => item.file === curr).hash,
      repository: indexData[curr].repository,
    };
    return acc;
  }, {});

  fs.writeFileSync(
    `${workingDirectory}/.repo/index`,
    JSON.stringify(updatedIndexData)
  );
};

add();
