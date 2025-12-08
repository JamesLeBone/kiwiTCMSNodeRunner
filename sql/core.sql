DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS logins;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS credentials;
DROP TABLE IF EXISTS credential_types;

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY
    , username TEXT UNIQUE NOT NULL
    , first_name TEXT
    , last_name TEXT
    , email TEXT UNIQUE NOT NULL
    , secret TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS logins (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id)
    , username TEXT UNIQUE
    , password TEXT
    , prompt_password_reset NUMERIC DEFAULT 0
    , password_reset_token TEXT
);
-- I would use datetime, but it stores it as text,
-- so I use TEXT instead and store the timestamp.
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY
    , user_id INTEGER REFERENCES users(user_id) NOT NULL
    , session_type_id TEXT NOT NULL
    , secret TEXT UNIQUE NOT NULL
    , created_at TEXT
    , expires_at TEXT
);

CREATE TABLE IF NOT EXISTS credential_types (
    credential_type_id INTEGER PRIMARY KEY
    , description TEXT UNIQUE NOT NULL
    , fields TEXT
);

INSERT INTO credential_types (credential_type_id, description, fields)
VALUES (1, 'Kiwi Login', '{"username":{"type":"text"}, "password":{"type":"password"}}');

CREATE TABLE IF NOT EXISTS credentials (
    user_credential_id INTEGER PRIMARY KEY
    , user_id INTEGER REFERENCES users(user_id)
    , credential_type_id INTEGER REFERENCES credential_types(credential_type_id)
    , credential TEXT
);
