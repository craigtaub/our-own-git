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

  describe("repo:add then repo:status", () => {
    beforeAll(async (done) => {
      await exec("npm run repo:add one.txt two/three.txt", (err, _) => {
        done();
      });
    });
    it("flag 1 new local changes not staged and 2 changes not comitted", async (done) => {
      await exec("npm run repo:status", (err, output) => {
        const expectedStatusAfterAdd =
          "Changed locally but not staged:\\n- two/four.txt\\n\\nStaged but not comitted:\\n- one.txt\\n- two/three.txt";

        expect(JSON.stringify(output)).toContain(expectedStatusAfterAdd);
        done();
      });
    });

    it("if update one.txt flag as local change", async (done) => {
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
