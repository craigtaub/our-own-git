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

export const compressBlobContentsInFile = (file) => {
  const contents = fs.readFileSync(file, { encoding: "utf-8" });
  return zlib.deflateSync(contents);
};

// always same based on contents
export const hashBlobContentsInFile = (file) => {
  const contents = fs.readFileSync(file, { encoding: "utf-8" });
  return sha1({ type: "blob", contents });
};

// different based on midified time
// remove atime + atimeMs which are different each stat() call
export const hashFileStats = (file) => {
  const contents = fs.statSync(file);
  delete contents["atime"];
  delete contents["atimeMs"];
  return sha1(contents);
};

export const getIndexData = (workingDirectory) => {
  return JSON.parse(
    fs.readFileSync(`${workingDirectory}/.repo/index`, { encoding: "utf-8" })
  );
};

export const updateIndex = (workingDirectory, indexData) => {
  fs.writeFileSync(
    `${workingDirectory}/.repo/index`,
    JSON.stringify(indexData)
  );
};
