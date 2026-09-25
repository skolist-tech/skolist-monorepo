# Assessment e2e

Browser tests for the assessments app (`--project=assessments`). Seed emails and paper titles: `seed.ts`. Parent: [../TESTING.md](../TESTING.md).

| Folder or file | Inventory |
| --- | --- |
| `auth.spec.ts` | Guest sees email, password, and organisation-code sign-in. Teacher 1 lands on the test list. Student 1 lands on assigned tests. |
| [teachers/](./teachers/TESTING.md) | Teacher cards, blueprint create, explicit access, paper editor, publish, close, and delete |
| [students/](./students/TESTING.md) | Assigned list, NTA attempt UI, and sitting a paper |
