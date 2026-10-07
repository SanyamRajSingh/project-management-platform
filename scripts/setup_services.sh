#!/bin/bash
set -e
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'taskforge'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE taskforge;"

# Allow md5/scram-sha-256 connections from all
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/18/main/postgresql.conf
echo "host all all all scram-sha-256" >> /etc/postgresql/18/main/pg_hba.conf
echo "host all all all trust" >> /etc/postgresql/18/main/pg_hba.conf

/etc/init.d/postgresql restart
/etc/init.d/redis-server restart
echo "DB and Redis setup complete!"
