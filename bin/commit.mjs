import fs from "fs";
import {
  getIndexData,
  hashBlobContentsInFile,
  sha1,
  workingDir,
} from "./util.mjs";
import zlib from "zlib";

// array of dir (name) and files (children), ordered by bottom-up
const buildTree = (paths) => {
  let result = [];
  let level = { result };
  paths.forEach((path) => {
    path.split("/").reduce((r, name, i, a) => {
      if (!r[name]) {
        r[name] = { result: [] };
        r.result.push({ name, children: r[name].result });
      }

      return r[name];
    }, level);
  });
  return result.reverse();
};

const processTree = (tree, parent) => {
  console.log("[commit] - process tree: ", tree.name);
  const { name, children } = tree;

  // process from bottom up
  if (children && children.length > 0) {
    return children.map((child) => {
      return processTree(child, tree.name);
    });
  } else {
    // only dirs hold files, so therefore file
    if (parent) {
      return {
        type: "blob",
        file: `${parent}/${name}`,
        hash: hashBlobContentsInFile(`${parent}/${name}`),
      };
    } else {
      return { type: "blob", file: name, hash: hashBlobContentsInFile(name) };
    }
  }
};

const commit = () => {
  console.log("[commit] - start");
  const workingDirectory = workingDir();
  const indexData = getIndexData();
  // build tree for files in staging or comitted, excluded working dir only
  const paths = Object.keys(indexData).filter(
    (item) => indexData[item].staging || indexData[item].repository
  );

  const trees = buildTree(paths);

  trees.map((tree) => {
    const processed = processTree(tree);
    if (Array.isArray(processed)) {
      // array is tree (list of blob objects). create tree object from array
      // TIDY ----
      const stringContents = JSON.stringify(processed);
      const treeHash = sha1(stringContents);
      const treeDir = treeHash.substring(0, 2);
      const treeObject = treeHash.substring(2);
      const treeCompressed = zlib.deflateSync(stringContents);
      fs.mkdirSync(`${workingDirectory}/.repo/objects/${treeDir}`);
      fs.writeFileSync(
        `${workingDirectory}/.repo/objects/${treeDir}/${treeObject}`,
        treeCompressed
      );
      // TIDY ----
    } else {
      // object is blob. blobs objects already exist
    }
  });
};

commit();
