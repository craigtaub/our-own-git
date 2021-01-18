import fs from "fs";
import crypto from "crypto";
import zlib from "zlib";

export const workingDir = () => {
  const cwd = process.cwd();
  return cwd + "/src";
};

export const sha1 = (object) => {
  const string = JSON.stringify(object);
  return crypto.createHash("sha1").update(string).digest("hex");
};

const getFilePath = (file) => {
  const workingDirectory = workingDir();
  return `${workingDirectory}/${file}`;
};
const getContentsInFile = (file) => {
  const path = getFilePath(file);
  return fs.readFileSync(path, { encoding: "utf-8" });
};

export const compressBlobContentsInFile = (file) => {
  const contents = getContentsInFile(file);
  return zlib.deflateSync(contents);
};

// always same based on contents
export const hashBlobContentsInFile = (file) => {
  const contents = getContentsInFile(file);
  return sha1({ type: "blob", contents });
};

// different based on midified time
// remove atime + atimeMs which are different each stat() call
export const hashFileStats = (file) => {
  const path = getFilePath(file);
  const contents = fs.statSync(path);
  delete contents["atime"];
  delete contents["atimeMs"];
  return sha1(contents);
};

export const getIndexData = () => {
  const workingDirectory = workingDir();
  return JSON.parse(
    fs.readFileSync(`${workingDirectory}/.repo/index`, { encoding: "utf-8" })
  );
};

export const updateIndex = (indexData) => {
  const workingDirectory = workingDir();
  fs.writeFileSync(
    `${workingDirectory}/.repo/index`,
    JSON.stringify(indexData)
  );
};

// hash contents, create tree, return hash
export const createTreeObject = (contents) => {
  const contentsClone = Object.assign([], contents);
  const flatContents = contentsClone.map((item) => {
    delete item.children; // dont need full children depth
    return item;
  });
  const workingDirectory = workingDir();
  const stringContents = JSON.stringify(flatContents);
  const treeHash = sha1(stringContents);
  const treeDir = treeHash.substring(0, 2);
  const treeObject = treeHash.substring(2);
  const treeCompressed = zlib.deflateSync(stringContents);
  // create tree object
  fs.mkdirSync(`${workingDirectory}/.repo/objects/${treeDir}`);
  fs.writeFileSync(
    `${workingDirectory}/.repo/objects/${treeDir}/${treeObject}`,
    treeCompressed
  );
  return treeHash;
};

export const createCommitObject = (contents) => {
  const workingDirectory = workingDir();
  const stringContents = JSON.stringify(contents);
  const commitHash = sha1(stringContents);
  const commitDir = commitHash.substring(0, 2);
  const commitObject = commitHash.substring(2);
  const commitCompressed = zlib.deflateSync(stringContents);
  // create commit object
  fs.mkdirSync(`${workingDirectory}/.repo/objects/${commitDir}`);
  fs.writeFileSync(
    `${workingDirectory}/.repo/objects/${commitDir}/${commitObject}`,
    commitCompressed
  );
  return commitHash;
};

export const getParentCommit = () => {
  const workingDirectory = workingDir();
  return fs.readFileSync(`${workingDirectory}/.repo/HEAD`, {
    encoding: "utf-8",
  });
};
