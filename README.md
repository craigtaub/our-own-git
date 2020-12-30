# our-own-git

Git in <100 lines of code.

## Included

- repository
- working directory
- staging
- comitting
- status checks
- comparing change chunks

## Not included

- packfiles
- deltas
- branches
- tags
- merging

## Commands

- `npm run test` -> run integration tests
- `npm run repo:clean` -> clean repository
- `npm run repo:init` -> initialise repository
- `npm run repo:status` -> changes local vs staging vs comitted
- `npm run repo:add` -> add files to staging
- `npm run repo:commit` -> commit staged changes **TODO**
- `npm run repo:diff` -> show changes for file against that comitted **TODO**

## Files

- `/src` -> location of working directory / application
- `/bin` -> location of version control
