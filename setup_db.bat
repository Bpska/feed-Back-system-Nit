@echo off
echo Setting up PostgreSQL database for Star Ratings College...
echo.

REM Change this path to your PostgreSQL bin directory
set PG_BIN="C:\Program Files\PostgreSQL\15\bin"

echo Creating database...
%PG_BIN%\psql -U postgres -c "CREATE DATABASE star_ratings_college;"

echo Creating user...
%PG_BIN%\psql -U postgres -c "CREATE USER app_user WITH PASSWORD 'strong_password';"

echo Granting privileges...
%PG_BIN%\psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE star_ratings_college TO app_user;"

echo.
echo Database setup complete! You can now run the migration.
echo.
pause