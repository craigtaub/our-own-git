import fs, { access } from "fs";
import {
  getIndexData,
  hashBlobContentsInFile,
  sha1,
  workingDir,
  createTreeObject,
  getParentCommit,
  createCommitObject,
  updateIndex,
} from "./util.mjs";
import zlib from "zlib";
import { type } from "os";

// array of dir (name) and files (children), ordered by bottom-up
const buildTree = (paths) => {
  return paths.reduce( (parent, path, key) => {
      path.split("/").reduce((r, name, i, { length }) => {
        if (!r.children) {
          r.children = [];
        }
        let temp = r.children.find((q) => q.name === name);
        if (!temp) {
          temp = { name };
          if (i + 1 === length) {
            temp.type = "blob";
            temp.hash = hashBlobContentsInFile(path);
          } else {
            temp.type = "tree";
          }
          r.children.push(temp);
        }
        return temp;
      }, parent);

      return parent;
    },
    { children: [] }
  ).children;
};

const commit = () => {
  console.log("[commit] - start");
  const workingDirectory = workingDir();
  const indexData = getIndexData();
  // build tree for files in staging or comitted, excluded working dir only
  // TODO - if comitted already then dont recreate tree?? PROB chek first
  const paths = Object.keys(indexData).filter(
    (item) => indexData[item].staging || indexData[item].repository
  );

  // console.log(`[commit] - paths`, paths);
  const rootTrees = buildTree(paths);
  console.log(rootTrees);
  // console.log(`[commit] - rootTrees`, rootTrees);

  const flattenedTrees = rootTrees.reverse().reduce((acc, curr, key) => {
    if (curr.children) {
      // tree
      const hash = createTreeObject(curr.children);
      // console.log("[commit] create tree for children", hash);
      const clone = Object.assign({}, curr);
      delete clone.children;
      clone.hash = hash;
      acc.push(curr.children); // add children to flattened
      acc.push([clone]);
    } else {
      // key so pushed with any previous tree
      // TODO clean
      acc.push(curr);
    }
    return acc;
  }, []);
  // console.log(`[commit] - flattenedTrees`, flattenedTrees);

  // create tree object for root
  const rootTree = flattenedTrees.reverse()[0];
  // console.log("[commit] - rootTree", rootTree);
  const treeForCommit = createTreeObject(rootTree);
  // console.log("[commit] - treeForCommit", treeForCommit);

  const parent = getParentCommit();
  // console.log("[commit] - parent", parent);

  const commit = {
    tree: treeForCommit,
    parent: parent === "undefined" ? null : parent,
    author: "CRAIG",
    committor: "CRAIG",
    message: "Hardcoded message",
  };

  // create commit
  const commitHash = createCommitObject(commit);
  // console.log("[commit] - commitHash", commitHash);

  // update index
  // - if new files, nothing in repo
  // - if old file but updated - staging wont match repo
  // - cwd->staging is optional. staging->repo is not.
  const updatedIndexData = Object.keys(indexData).reduce((acc, curr) => {
    const { cwd, staging, repository } = indexData[curr];
    let updatedRepo = repository;
    if (staging !== repository) {
      updatedRepo = staging;
    }
    acc[curr] = {
      cwd: indexData[curr].cwd,
      staging: indexData[curr].staging,
      repository: updatedRepo,
    };
    return acc;
  }, {});
  updateIndex(updatedIndexData);

  // update head, latest commit
  fs.writeFileSync(`${workingDirectory}/.repo/HEAD`, commitHash);
};

commit();
