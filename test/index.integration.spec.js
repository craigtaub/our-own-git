const exec = require("child_process").exec;
const fs = require("fs");
const zlib = require("zlib");

const sha1Regex = /^[a-zA-Z0-9\-_]{0,40}$/;

describe("Integration tests", () => {
  afterAll(async (done) => {
    // clean up after
    await exec("npm run repo:clean", (err, _) => {
      done();
    });
  });
  describe("repo:init", () => {
    it("created index with current working directory files and cwd stat() hash", async (done) => {
      await exec("npm run repo:init", (err, _) => {
        const index = JSON.parse(
          fs.readFileSync("src/.repo/index", {
            encoding: "utf-8",
          })
        );
        const keys = Object.keys(index);
        expect(keys).toEqual(["one.txt", "two/four.txt", "two/three.txt"]);
        expect(index["one.txt"].cwd).toMatch(sha1Regex);
        expect(index["one.txt"].staging).toEqual("");
        expect(index["one.txt"].repository).toEqual("");
        expect(index["two/three.txt"].cwd).toMatch(sha1Regex);
        expect(index["two/three.txt"].staging).toEqual("");
        expect(index["two/three.txt"].repository).toEqual("");
        expect(index["two/four.txt"].cwd).toMatch(sha1Regex);
        expect(index["two/four.txt"].staging).toEqual("");
        expect(index["two/four.txt"].repository).toEqual("");
        done();
      });
    });
  });
  describe("repo:status", () => {
    it("flag 3 new local changes not staged", async (done) => {
      const expectedStatusAfterInit =
        "Changed locally but not staged:\\n- one.txt\\n- two/four.txt\\n- two/three.txt\\n\\nStaged but not comitted:";

      await exec("npm run repo:status", (err, output) => {
        expect(JSON.stringify(output)).toContain(expectedStatusAfterInit);
        done();
      });
    });
  });

  describe("repo:add", () => {
    it("should create blob objects, inside 2 char directories, with content compressed", async (done) => {
      await exec("npm run repo:add one.txt two/three.txt", (err, output) => {
        const rawA = fs.readFileSync(
          "src/.repo/objects/20/edd9580b6dfe9ee477979b4aca59c44770063b"
        );
        const rawB = fs.readFileSync(
          "src/.repo/objects/c3/fbd8e016f0ba53befe9a3dbdadf06adab65ade"
        );

        // compressed via DEFLATE, test via uncompress
        const a = zlib.inflateSync(new Buffer(rawA)).toString();
        const b = zlib.inflateSync(new Buffer(rawB)).toString();

        expect(a).toEqual("first file\n");
        expect(b).toEqual("third file\n");
        done();
      });
    });

    it("should update repo index, move items to staged", () => {
      const index = JSON.parse(
        fs.readFileSync("src/.repo/index", {
          encoding: "utf-8",
        })
      );
      const keys = Object.keys(index);
      expect(keys).toEqual(["one.txt", "two/four.txt", "two/three.txt"]);
      expect(index["one.txt"].cwd).toMatch(sha1Regex);
      expect(index["one.txt"].staging).toMatch(sha1Regex);
      expect(index["one.txt"].repository).toEqual("");
      expect(index["two/three.txt"].cwd).toMatch(sha1Regex);
      expect(index["two/three.txt"].staging).toMatch(sha1Regex);
      expect(index["two/three.txt"].repository).toEqual("");
      expect(index["two/four.txt"].cwd).toMatch(sha1Regex);
      expect(index["two/four.txt"].staging).toEqual("");
      expect(index["two/four.txt"].repository).toEqual("");
    });
  });

  describe("add then repo:status", () => {
    it("flag 1 new local changes not staged and 2 changes not comitted", async (done) => {
      await exec("npm run repo:status", (err, output) => {
        const expectedStatusAfterAdd =
          "Changed locally but not staged:\\n- two/four.txt\\n\\nStaged but not comitted:\\n- one.txt\\n- two/three.txt";

        expect(JSON.stringify(output)).toContain(expectedStatusAfterAdd);
        done();
      });
    });
  });
  describe("update file status and add", () => {
    afterAll(() => {
      fs.writeFileSync("src/one.txt", "first file\n"); // put file back. repo  is nuked
    });

    it("if update one.txt locally flag as local change", async (done) => {
      const expectedStatusAfterOneUpdate =
        "Changed locally but not staged:\\n- one.txt\\n- two/four.txt\\n\\nStaged but not comitted:\\n- two/three.txt";

      fs.writeFileSync("src/one.txt", "updated content here\n");
      await exec("npm run repo:status", (err, output) => {
        expect(JSON.stringify(output)).toContain(expectedStatusAfterOneUpdate);

        done();
      });
    });

    it("if re-add updated file one.txt should update object", async (done) => {
      await exec("npm run repo:add one.txt", async (err, _) => {
        const rawA = fs.readFileSync(
          "src/.repo/objects/4d/642272c78bb0d9b3861e4b04295c1aaba65dc2"
        );

        // compressed via DEFLATE, test via uncompress
        const a = zlib.inflateSync(new Buffer(rawA)).toString();

        expect(a).toEqual("updated content here\n");
        done();
      });
    });

    it("re-added file should show in status with old added file", async (done) => {
      const expectedStatusAfterAdd =
        "Changed locally but not staged:\\n- two/four.txt\\n\\nStaged but not comitted:\\n- one.txt\\n- two/three.txt";

      await exec("npm run repo:status", (err, output) => {
        expect(JSON.stringify(output)).toContain(expectedStatusAfterAdd);
        done();
      });
    });
  });

  describe("repo:commit", () => {
    beforeAll(async (done) => {
      // add two/four.txt so 2 items in tree object
      await exec("npm run repo:add two/four.txt", (err, output) => {
        done();
      });
    });

    it("should create tree and commit object and update HEAD and index", async (done) => {
      // dont need to put index and HEAD back. cleans at end
      await exec("npm run repo:commit", (err, output) => {
        // console.log("output", output);

        // commit object
        const commitObject = fs.readFileSync(
          "src/.repo/objects/2d/6332ee18e26deda1658e6e463c6d09f5782f0c"
        );
        // compressed via DEFLATE, test via uncompress
        const a = zlib.inflateSync(new Buffer(commitObject)).toString();
        expect(a).toEqual(
          JSON.stringify({
            tree: "de1ce49887d601e20f1f39e43440805b41adae88",
            parent: null,
            author: "CRAIG",
            committor: "CRAIG",
            message: "Hardcoded message",
          })
        );

        // root tree object
        const rootTreeObject = fs.readFileSync(
          "src/.repo/objects/de/1ce49887d601e20f1f39e43440805b41adae88"
        );
        const b = zlib.inflateSync(new Buffer(rootTreeObject)).toString();
        console.log("rootTreeObject", b);
        expect(b).toEqual(
          JSON.stringify([
            {
              name: "two",
              type: "tree",
              hash: "e09bf38c8f2087c42fc178be46514c86f6bf6f0f", // points at tree /two below
            },
            {
              name: "one.txt",
              type: "blob",
              hash: "20edd9580b6dfe9ee477979b4aca59c44770063b",
            },
          ])
        );

        // fs.readdir("src/.repo/objects", (err, files) => {
        //   files.forEach((top) => {
        //     fs.readdir("src/.repo/objects/" + top, (err, files) => {
        //       files.forEach((bottom) => {
        //         console.log("files:", top, bottom);
        //       });
        //     });
        //   });
        // });

        // 'two' tree object
        const folderTreeObject = fs.readFileSync(
          "src/.repo/objects/e0/9bf38c8f2087c42fc178be46514c86f6bf6f0f"
        );
        const c = zlib.inflateSync(new Buffer(folderTreeObject)).toString();
        expect(c).toEqual(
          JSON.stringify([
            {
              name: "four.txt",
              type: "blob",
              hash: "3596117ef1e8dba38ceeabb2101192938b6313ad",
            },
            {
              name: "three.txt",
              type: "blob",
              hash: "c3fbd8e016f0ba53befe9a3dbdadf06adab65ade",
            },
          ])
        );

        // check HEAD for commit hash
        const head = fs.readFileSync("src/.repo/HEAD", {
          encoding: "utf-8",
        });
        expect(head).toEqual("2d6332ee18e26deda1658e6e463c6d09f5782f0c");

        // check index
        const index = JSON.parse(
          fs.readFileSync("src/.repo/index", {
            encoding: "utf-8",
          })
        );
        const keys = Object.keys(index);
        expect(keys).toEqual(["one.txt", "two/four.txt", "two/three.txt"]);
        expect(index["one.txt"].cwd).toMatch(sha1Regex);
        expect(index["one.txt"].staging).toMatch(sha1Regex);
        expect(index["one.txt"].repository).toMatch(sha1Regex);
        expect(index["two/three.txt"].cwd).toMatch(sha1Regex);
        expect(index["two/three.txt"].staging).toMatch(sha1Regex);
        expect(index["two/three.txt"].repository).toMatch(sha1Regex);
        expect(index["two/four.txt"].cwd).toMatch(sha1Regex);
        expect(index["two/four.txt"].staging).toMatch(sha1Regex);
        expect(index["two/four.txt"].repository).toMatch(sha1Regex);

        done();
      });
    });
  });
});
