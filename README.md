# Kiwi TCMS Node-Runner
Executor and frontend for Kiwi TCMS

This is a combination of a frontend for bulk operations in Kiwi TCMS
as well as an executor for a testing platform to execute tests.

This project is based off a private project I also authored and is essentially a version 2
with generalised concepts and all sensitive features removed.

## Development Roadmap

1. Migrate functionality to this project (done)
2. Refactor server-side libraries to Typescript (done)
3. Build out Install scripts (done) - app.setup
4. Verify UAC (User account control) functionality (in progress)
5. Verify Kiwi Pages (see below)
6. Integrate Jast
7. Utilize Jast and to execute tests on this project (self-testing)
8. Self-test plans
9. Hook the Jast tests with the execution runner
10. Success

### Kiwi pages:

1. Test case
2. Test plan
3. Execution
4. Execution Runner (non-running)
5. Components

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


