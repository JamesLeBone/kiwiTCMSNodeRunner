# Structure

The files directly under /server reflect the entry barrier from the frontend.
They must start with 'use server' and only export asychrnonous functions that return plain data.

Class instances cannot be returned, and it won't try to JSON-Encode them.

## lib

These file don't require the 'use server' barrier directive.
As such they're free to return as they like.

## Connectors to remote sources

* db
* kiwi
