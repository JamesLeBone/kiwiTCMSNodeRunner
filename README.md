# Kiwi TCMS Node-Runner
Executor and frontend for Kiwi TCMS

This is a combination of a frontend for bulk operations in Kiwi TCMS
as well as an executor for a testing platform to execute tests.

This project is based off a private project I also authored and is essentially a version 2
with generalised concepts and all sensitive features removed.

# Data model differences with base Kiwi

* `TestCase.arguments` are stored as a json-encoded string.
* `SecurityGroupId` added to arguments to specify a user-level access for the same script.
* `TestCase.script` is treated as a numeric reference to a "parent" test case.

## Development Roadmap

1. Migrate functionality to this project (done)
2. Refactor server-side libraries to Typescript (done)
3. Build out Install scripts (done) - app.setup
4. Verify UAC (User account control) functionality (done)
5. Verify Kiwi Pages (see below - mostly done!)

Checkpoint: <b>minimal functionality</b>

6. Integrate Jast
7. Utilize Jast and to execute tests on this project (self-testing)

Checkpoint <b>verified-minimal</b>

8. Self-test plans
9. Hook the Jast tests with the execution runner

Checkpoint <b>Stable</b>

10. Implement 404 pages

### Kiwi pages:

1. Test case (tags,components,comments) - done
2. Test plan - done
3. Execution
4. Execution Runner
5. Components

## Current status

I have verified the CRUD of the primary pages as above,
however I have been migrating this from our single-product, single-platform testing operation method,
to something universally applicable. This means implmenting functionality I had not done so before.

I have noted I'm executing things differently from different screens (test plan, test case, test run, execution)
and need to amlagomate these.  A portion of this has already been done, I need to update this method, then ensure
all the endpoints are using this method.

This works via:
ScriptExecution.tsx (frontend)
Where the user submits an API call off to the NextJs /api to do a test at the specified level.

ie: `/api/runs/{{testPlanId}}/{{testRunId}}` to re-run a test plan.

This file just organises the request back down to a singelton point in server/kiwi/PuppteerExec,
which is now being renamed to /server/Executor.ts - to be more generic.

Now for the tricky part:

I was using a hard-coded credentialTypeId = 1 for Puppeteer.  But I can see this needs to be mapped
to a Product.Category in Kiwi, so my credential types now becomes:

```
productId: number
categoryId: number
```

From there I can get the name of the product and cetegory to describe the credential type instead of the existing
name and description.

This does introduce a point of instability, however the credentials are still encoded per-user and if they don't 
work, they should be able to set them in UAC.

## Purpose

This is to be a folio peice to demonstrate my ability to work with APIs, NodeJs and React

### Features

* Bulk test case management for KIWI TCMS
* Execute tests from a web interface
* Multi user access
* Encrypted user credentials

## Kiwi TCMS

https://kiwitcms.org/
"The leading open source test management system"

### Modifications to Kiwi TCMS

1. Added a script prefix field so all test cases can inherit a prefixed string (`script_prefix = models.TextField(blank=True)`)
2. Added a product edit API endpoint to modify this prefix

## Author

James LeBone
2025

# Installation

Follow the Kiwi TCMS installation instructions and install via Docker.
This project will use the default settings, but has some extra options.

Your Kiwi User is managed via users in an sqlite database with encyrpted credentials.

If you get locked out of your own user account, you can delete the db.sqlite3 file and start again.

I intend to write an install script, however for now after first-run the sqlite file should be created.
You can then connect it to your SQL agent tool an run sql\sqlite\core.sql to build the required strucutre.

## Platform

This will require NodeJs version 24 or higher.
When satisfied with the general state, I'll prepare a docker file.


