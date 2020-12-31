import fs from "fs";
import {
  workingDir,
  getIndexData,
  updateIndex,
  hashBlobContentsInFile,
  compressBlobContentsInFile,
  hashFileStats,
} from "./util.mjs";

const add = () => {
  console.log("[add] - start");
  const workingDirectory = workingDir();

  // explicitly give files e.g. one.txt two/three.txt
  const files = process.argv.slice(2);

  const indexData = getIndexData(workingDirectory);

  console.log("[add] - write blob objects");
  const updatedFiles = files.map((file) => {
    // get contents SHA-1 and use for dir and filename
    const blobHash = hashBlobContentsInFile(`${workingDirectory}/${file}`);
    const blobDir = blobHash.substring(0, 2);
    const blobObject = blobHash.substring(2);
    fs.mkdirSync(`${workingDirectory}/.repo/objects/${blobDir}`);

    // get DEFLATED and use for content
    const blobCompressed = compressBlobContentsInFile(
      `${workingDirectory}/${file}`
    );
    fs.writeFileSync(
      `${workingDirectory}/.repo/objects/${blobDir}/${blobObject}`,
      blobCompressed
    );

    // get stat() SHA-1
    const hash = hashFileStats(`${workingDirectory}/${file}`);

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

  updateIndex(workingDirectory, updatedIndexData);
};

add();
