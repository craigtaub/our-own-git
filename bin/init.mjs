import fs from "fs";
import glob from "glob";
import crypto from "crypto";

function sha1(object) {
  const string = JSON.stringify(object);
  return crypto.createHash("sha1").update(string).digest("hex");
}

const init = () => {
  console.log("[init] - start");
  const cwd = process.cwd();
  const workingDirectory = cwd + "/src";
  const files = glob.sync("**/*.txt", { cwd: workingDirectory });
  const indexData = files.reduce((acc, curr) => {
    const contents = fs.readFileSync(`${workingDirectory}/${curr}`, {
      encoding: "utf-8",
    });
    const hash = sha1({ type: "blob", contents });
    acc[curr] = {
      cwd: sha1({ type: "blob", contents }),
      staging: "",
      repository: "",
    };
    return acc;
  }, {});
  console.log("[init] - write .repo");
  fs.mkdirSync(`${workingDirectory}/.repo`);
  fs.writeFileSync(
    `${workingDirectory}/.repo/index`,
    JSON.stringify(indexData)
  );
  fs.writeFileSync(`${workingDirectory}/.repo/HEAD`);
  fs.mkdirSync(`${workingDirectory}/.repo/objects`);
};

init();
