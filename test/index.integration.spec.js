const exec = require("child_process").exec;
const fs = require("fs");

describe("Integration tests", () => {
  afterAll(async (done) => {
    // clean up after
    await exec("npm run repo:clean", (err, _) => {
      done();
    });
  });
  describe("repo:init", () => {
    it("created index with current working directory files and cwd hash", async (done) => {
      const expectedIndex = {
        "one.txt": {
          cwd: "20edd9580b6dfe9ee477979b4aca59c44770063b",
          staging: "",
          repository: "",
        },
        "two/four.txt": {
          cwd: "3596117ef1e8dba38ceeabb2101192938b6313ad",
          staging: "",
          repository: "",
        },
        "two/three.txt": {
          cwd: "c3fbd8e016f0ba53befe9a3dbdadf06adab65ade",
          staging: "",
          repository: "",
        },
      };
      await exec("npm run repo:init", (err, _) => {
        const index = JSON.parse(
          fs.readFileSync("src/.repo/index", {
            encoding: "utf-8",
          })
        );
        expect(index).toEqual(expectedIndex);
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
    it("should create blob objects inside 2 char directories of content hash", async (done) => {
      await exec("npm run repo:add one.txt two/three.txt", (err, output) => {
        const a = fs.readFileSync(
          "src/.repo/objects/20/edd9580b6dfe9ee477979b4aca59c44770063b",
          {
            encoding: "utf-8",
          }
        );
        const b = fs.readFileSync(
          "src/.repo/objects/c3/fbd8e016f0ba53befe9a3dbdadf06adab65ade",
          {
            encoding: "utf-8",
          }
        );

        expect(a).toEqual("20edd9580b6dfe9ee477979b4aca59c44770063b");
        expect(b).toEqual("c3fbd8e016f0ba53befe9a3dbdadf06adab65ade");
        done();
      });
    });

    it("should update repo index, move items to staged", () => {
      const expectedIndex = {
        "one.txt": {
          cwd: "20edd9580b6dfe9ee477979b4aca59c44770063b",
          staging: "20edd9580b6dfe9ee477979b4aca59c44770063b",
          repository: "",
        },
        "two/four.txt": {
          cwd: "3596117ef1e8dba38ceeabb2101192938b6313ad",
          staging: "",
          repository: "",
        },
        "two/three.txt": {
          cwd: "c3fbd8e016f0ba53befe9a3dbdadf06adab65ade",
          staging: "c3fbd8e016f0ba53befe9a3dbdadf06adab65ade",
          repository: "",
        },
      };
      const index = JSON.parse(
        fs.readFileSync("src/.repo/index", {
          encoding: "utf-8",
        })
      );
      expect(index).toEqual(expectedIndex);
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

    it("if update one.txt locally flag as local change", async (done) => {
      const expectedStatusAfterOneUpdate =
        "Changed locally but not staged:\\n- one.txt\\n- two/four.txt\\n\\nStaged but not comitted:\\n- two/three.txt";

      fs.writeFileSync("src/one.txt", "updated content here");
      await exec("npm run repo:status", (err, output) => {
        expect(JSON.stringify(output)).toContain(expectedStatusAfterOneUpdate);
        fs.writeFileSync("src/one.txt", "first file\n");
        done();
      });
    });
  });
});
