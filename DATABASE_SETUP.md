# Todo Database Setup

This guide explains how to set up the todo database using the provided SQL schema.

## Prerequisites

- PostgreSQL installed and running
- `psql` command-line tool installed

## Steps to Create the Database

### Method 1: Using psql command line

1. Connect to PostgreSQL as a superuser:
   ```bash
   psql -U postgres
   ```

2. Create the database:
   ```sql
   CREATE DATABASE todo;
   ```

3. Connect to the newly created database:
   ```sql
   \c todo
   ```

4. Run the SQL script from the command line:
   ```bash
   psql -U postgres -d todo -f create_todo_database.sql
   ```

### Method 2: Using psql interactive mode

1. Connect to PostgreSQL:
   ```bash
   psql -U postgres
   ```

2. Create the database:
   ```sql
   CREATE DATABASE todo;
   ```

3. Connect to the todo database and run the script:
   ```sql
   \c todo
   \i create_todo_database.sql
   ```

### Method 3: Using pgAdmin or other GUI tools

1. Connect to your PostgreSQL server
2. Create a new database named `todo`
3. Open the SQL query tool for the new database
4. Copy and paste the contents of `create_todo_database.sql` into the query window
5. Execute the script

## Connection String

If you're connecting to the database from an application, you'll use a connection string similar to:
```
postgresql://username:password@localhost:5432/todo
```

## Database Schema

The todo database contains:

1. `user` table - stores user information
2. `todo` table - stores todo items linked to users
3. Functions, triggers, and views as defined in the schema

## Troubleshooting

If you encounter issues:

1. Make sure PostgreSQL is running
2. Verify your user has privileges to create databases
3. Check that the `uuid-ossp` extension is available:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

## Verification

After setup, you can verify the database was created correctly:

1. Connect to the database:
   ```bash
   psql -U postgres -d todo
   ```

2. List the tables:
   ```sql
   \dt
   ```

3. Check the schema:
   ```sql
   \d user
   \d todo
   ```

## Next Steps

After setting up the database, you can:

- Configure your application to connect to the todo database
- Set up Prisma or your preferred ORM
- Run migrations if needed