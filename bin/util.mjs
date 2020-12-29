import fs from "fs";
import crypto from "crypto";

export const workingDir = () => {
  const cwd = process.cwd();
  return cwd + "/src";
};

export const sha1 = (object) => {
  const string = JSON.stringify(object);
  return crypto.createHash("sha1").update(string).digest("hex");
};

export const hashBlobContentsInFile = (file) => {
  const contents = fs.readFileSync(file, {
    encoding: "utf-8",
  });
  return sha1({ type: "blob", contents });
};