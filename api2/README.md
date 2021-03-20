# CT REST API2 Documentation


## CT REST API2 software requirements

    NodeJS				        0.10.40
    npm                         1.4.28
	v8					        3.14.5.9
	PostgreSQL                  9.5
    - MongoDB                     2.4.9
    nemcached                   1.4.14
    rabbitMQ                    3.2.4-1

    nginx                       1.4.6
    nginx-extras                1.4.6
    passenger                   5.0.21-1
        or
    Apache2                     2.4.7
    libapache2-mod-passenger    5.0.21-1

    SSL certificate

## Operational description

This project operates as a REST API for the application website front-end, which basically handles all data used,
added, modified and deleted from front-end requests.  It will run using OAuth2 standard for authentication and
session management, which will require a simple username/password login that generates a token request that is
then exchanged for an access token that is then used in every subsequent request and included as the "bearer".

Node runs as it's own webserver using HTTP and the environment variable is set at the point of starting the service,
which then dictates which configuration to use for the operation of the code base.  The development / staging /
production server also have a proxy server acting as the entry point for access to the REST API which enforces an
SSL connection at that point.  On a local environment the proxy can be skipped in the setup process, and everything
just done directly using HTTP to port 8000, but the COM (application website) must be set to use HTTP in that case.
The code mainly uses PostgreSQL as it's primary data source, but also uses the MySQL database for Call Engine 3, as
well as uses 3 different DB's of MongoDB for some features, and performs some scheduled tasks using a RabbitMQ AMQP
stack.

## Pre-operation Setup

All of the configuration files can be found in the *config* directory, which should all be symlinked to a file in:
    /etc/lmc/restapi/
Each configuration file should have an example file that you can use as a template for setting your configurations.
In addition to setting the correct values in the config files, you will need to create the following directories
that are used by the code base, which should be changed to be owned by the user you intend you run the node script as:

    sudo mkdir -p /var/spool/restapi/uploads
    sudo mkdir -p /usr/local/sounds/clicktocall
    sudo mkdir /usr/local/sounds/whisper
    
    chown -R *username*:*group* /var/spool/restapi
    chown -R *username*:*group* /usr/local/sounds
    
Of course you'll need to substitute *username* with a valid user account on your computer and optionally :*group* with
a valid group (setting it to the group you web server runs as is always a good choice)

You'll notice that the config file are only a symlink to a directory completely outside the scope of the project.  This
is by design.  The config file located in:
    /etc/lmc/restapi
Should be owned by root, so that you will be unable to change them and they will not be included in the respository 
check-ins or pushes to the main repo.  These config files should be either to your local environment with local running
software to support what is needed, or you can also connect to either a staging or development version of that service, 
or any combination needed of the two.  Please insure that each of these config files is correct, or things will not be
able to start properly and will crash and shut down.  Key config files to pay special attention to are the config.yml and
the database.yml


### NodeJS and NPM

First NodeJS and NPM must be installed, which can be download from https://nodejs.org/download/ or any OS that you
are running.  Alternately you can use the binary distributions found at https://github.com/nodesource/distributions
On Debian based Linux distros you do the following:

NOTE:  Here is an improved way that will install the latest NodeJS release

    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
or for v5
    
    curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
Here is the original method:

    sudo apt-get install curl
    curl -sL https://deb.nodesource.com/setup | sudo bash -
    sudo apt-get install -y nodejs

or alternatively if you don't need the latest release

    sudo apt-get install nodejs npm

Once *npm* is installed you will need to load all of the modules the code uses, which you execute from the project
top directory or document root:

    npm install
    
This will read all of the modules defined in the package.json file and install them for use for the project. In addition
to the modules found in the package.json file, you will additionally need to install the 'forever' module globally.  The 
script stays in a continuous running state by using this module, and it will write debug output to a log file that you can
monitor to debug code.  First we create the required log files and then install the module (which you will probably need
to do as the root user)

touch /var/log/restapi.log
touch /var/log/callpage.log

chown *user* /var/log/restapi.log
chown *user* /var/log/callpage.log

su - 
npm install -g forever

You will want to change the permissions of the log files to be the same user that you intend to run the web service as, 
which can be your own user, or any other that you like, although it is discouraged to do it as root.


### Nginx

The Nginx setup is the preferred setup and what is running in the production environment, but does require an extra 
couple of packages to be installed in order to work correctly.  On Linux the extra packages are called nginx-extras
and passenger. In order to load these packages you will need to ass the passenger repository doing the following:
[https://www.phusionpassenger.com/library/install/nginx/install/oss/]

    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 561F9B9CAC40B2F7
    sudo apt-get install -y apt-transport-https ca-certificates

    sudo sh -c 'echo deb https://oss-binaries.phusionpassenger.com/apt/passenger jessie main > /etc/apt/sources.list.d/passenger.list'
    sudo apt-get update
    
    sudo apt-get install -y nginx-extras passenger
    
This should install passenger and all the Nginx things you'll need to configure the virtual host.
Sample Nginx configuration for virtual host:

   server {
        listen 443;
        server_name api2.convirza.js;
    
        ssl on;
        ssl_certificate /etc/ssl/apache2/api2.convirza.js.crt;
        ssl_certificate_key /etc/ssl/apache2/api2.convirza.js.key;
    
        passenger_enabled on;
    
        location / {
            client_max_body_size       10m;
            client_body_buffer_size    32k;
    
            root /www/api2/public;
    
            passenger_app_root /www/api2;
            passenger_app_type node;
            passenger_startup_file bin/www;
            rails_env local;
    
            access_log /var/log/nginx/api2-ssl.access;
            error_log /var/log/nginx/api2-ssl.error error;
        }
    }
 


### Apache2 

In order for a configuration of Apache2 to work as a proxy server for the API2 application, it is necessary to activate
a few modules that will be used, which are: proxy, proxy_connect, proxy_html, proxy_http, xml2enc.  These modules can be
enabled from the command line using the following commands:

    a2enmod proxy
    a2enmod proxy_connect
    a2enmod proxy_html
    a2enmod proxy_http
    a2enmod xml2enc

Also you will want to make sure that you have these additional modules enabled: dir, env, expires, headers, ssl, rewrite

The following is an example Apache2 configuration for the virtual host;

    <VirtualHost *:443>
        ServerName api2.convirza.js
        ServerAdmin dwalbeck@convirza.com
    
        SSLEngine On
        SSLCertificateFile      /etc/ssl/apache2/api2.convirza.js.crt
        SSLCertificateKeyFile   /etc/ssl/apache2/api2.convirza.js.key
        SSLCertificateChainFile /etc/ssl/apache2/my-ca.crt

        DocumentRoot /www/api2/public
        ProxyPreserveHost On
        ProxyPass / http://api2.convirza.js:8000/
        ProxyPassReverse  / http://api2.convirza.js:8000/

        Header set Access-Control-Allow-Origin "*"
        Header set Access-Control-Allow-Methods "POST, GET, OPTIONS, DELETE, PUT"
        Header set Access-Control-Max-Age 3600
        Header set Access-Control-Allow-Headers "x-requested-with, Content-Type, origin, authorization, accept, client-security-token, X-access-token"

        RewriteEngine  On
        RewriteCond %{HTTP_HOST} !^$
        RewriteRule ^/?(.*) http://api2.convirza.js:8000/$1 [L,R,NE]
        
        ErrorLog /var/log/apache2/api2_error_log
        CustomLog /var/log/apache2/api2_access_log combined
    </VirtualHost>





### PostgreSQL Database

There are two databases which the code uses, the exact names of which can be found in the database.yml config file.
The first is the main DB used for most of the queries, which the default name is ct_dev (or on staging ct_stg).  This 
can however be named whatever you like on your local environment.  The second DB is the scheduling DB that acts as a 
centralized cron system of a sort, with the DB name of schedule_dev or schedule_stag - but again can be anything you like
on your local environment and only needs to match what is set in the database.yml config file.

The main data source used is PostgreSQL, which you will need to add access for a local configuration.  The values
for *username* *password* and *database* are all defined in the config/database.yml file, which sets everything for
the code to operate.  If you are running a local install, you'll need to create the default user the code uses.  It's
worth noting that it makes things much simpler if the DB is created using this same user as the owner.  So using the 
*psql* PostgreSQL console:

    CREATE ROLE interact LOGIN CREATEDB PASSWORD '1nt3r4ct';
    CREATE DATABASE ct_dev WITH OWNER=interact ENCODING=UTF8;

And will also need to allow connection to the DB in your PostgreSQL pg_hba.conf file, which is generally located at
/etc/postgresql/<ver>/main/ , but can also possibly be found in /var/lib/postgresql/data/ .  Either way, open the file 
and create an entry for the *interact* user and adjust the DB name accordingly (*ct_dev* is used below)

    local   ct_dev          interact                                trust
    host    all             interact        127.0.0.1/32            password
optionally also can add the IP or IP block for your computer (/32 is for single IP and /24 is for all 255 IP's in that block):
    host    ct_dev          interact        192.168.0.0/24          password

Restart the PostgreSQL service for the changes to take effect.The database has been broken down to SQL queries since it 
was first created, all of which can be found in the *sql* directory in chronological order.  Any change that is made to 
the DB should be done by adding a SQL entry in a file that is named the current year month and day and an underscore 
followed by either the version as a 4 digit number or alternately the hour and minutes can be used.  To get the database 
installed you will need to un-compress the first file, then execute each file found after it.

    cd sql/201503
    gunzip 20150306_0000.sql.gz
    psql -U interact -W ct_dev
    
        ct_dev=# \i 20150306_0000.sql
        ct_dev=# \i 20150306_1637.sql
        ct_dev=# \i 20150311_1437.sql
        ...

Continue on to execute each file.  Alternately here is bash script that you can save as an executable file and run:

    #!/bin/bash

    for f in *.sql;
    do
        psql ct_dev interact -f "$f"
    done
    
another method is to concatenate all the files and run them as one, like the following:

    cat 20150401_0000.sql 20150401_0001.sql 20150403_0000.sql 20150407_0000.sql 20150408_0000.sql | psql
    
Scheduling is executed from a separate PostgreSQL database hosted on a different server.  Again the same adding of user 
and access rights should be added for this database as well, which the details of which can be found in the database.yml

#### MySQL Foreign Data Wrapper

REVISION:  Found an easier way to install the foreign data wrapper on Debian based Linux machines, which is to just install
the package using apt-get.  Depending on the version of PostgreSQL your running, the packages that you should have installed 
are as follows:
    
    postgresql-9.5
    postgresql-client-9.5
    postgresql-contrib-9.5
    libmysqlclient-dev
    mysql-common
    postgresql-9.5-mysql-fdw

PostgreSQL has a feature called the foreign data wrapper, which allows various other storage systems, services, and 
data management services to be passively connected to through a normal front-end table within PostgreSQL.  The connection 
used to these other storage systems is optimized and automatically handled by the driver, once it is installed and configured.
There is however a pretty big difference between version made to work with 9.2 vs 9.3+, both in performance and functionality, 
as the earlier driver supports read-only and does not take advantage of connection pooling.  Using the FDW does however
require that it be installed on the server that the database is running on, the code for which can be found at the follow:

https://github.com/EnterpriseDB/mysql_fdw

We are currently running on release 2.1.2, so it is recommended to use this version or higher.  Once the driver is downloaded,
installation of it is pretty straight forward.  Unzip the package and cd into the directory of the package.  This driver is 
written in C and there will require that it be compiled.  This means that the system this is being installed on will need
to have the program 'make' installed and available, as well as the gcc+ library installed.  Depending on how PostgreSQL was
installed, you may or may not have the directory where the binaries are included in your default path, which the same goes 
for MySQL.  You'll want to insure that both directories are included in your path (which is likely the case if installed 
using Linux and a package manager), otherwise the path can be manually added as follows:

    export PATH=/usr/local/pgsql/bin/:$PATH
    export PATH=/usr/local/mysql/bin/:$PATH
    
You'll want to make sure the path is adjusted to whatever the path is on your system.  You should be able to see or find 'pg_config'
and 'mysql_config' in your current working $PATH.  Now you can compile the program with the following flags passed:

    make USE_PGXS=1
    
And then install it with:

    make USE_PGXS=1 install

And simple as that it is installed and ready for use with the database.  The next step involves activating and setting up the
tables that it will mimic from the foreign database.  In our case, we will be connecting to the Call Engine MySQL DB, and 
specifically setting up a table that consists of a few of the columns from the MySQL table call_flows.  Each of the following 
commands are SQL commands that can be run from the psql console or a client GUI, however the user that you execute the commands
as is important for is operational use.  The first couple of commands most likely will need to be executed as the admin or root 
user for the PostgreSQL database.  The first SQL will load the newly installed FDW extension and the second will create a 
server definition to use for connecting to the MySQL DB.  Make sure to adjust the host value to be the correct domain name or IP
address that is relavent for your setup and use case.

    psql ct_stg
    
    ct_stg=# CREATE EXTENSION mysql_fdw;
    
    ct_stg=# CREATE SERVER mysql_ce
             FOREIGN DATA WRAPPER mysql_fdw
             OPTIONS (host '127.0.0.1', port '3306');
             
Now these next two SQL statements will create a user mapping for use of the server created in the previous step, and lastly the
creation of the call_flows table that is linked to the FDW.  Keep in mind that if this is created as an admin user (which is likely
the case), the permissions must be granted to any user that will be using it.
             
    ct_stg=# CREATE USER MAPPING FOR interact
             SERVER mysql_ce
             OPTIONS (username 'interact', password '1nt3r4ct');

    ct_stg=# CREATE FOREIGN TABLE call_flows (
                  id 						   INT,
                  provisioned_route_id		   INT NOT NULL,
                  dnis                          VARCHAR(25),
                  message_enabled 			   BOOLEAN,
                  message                       VARCHAR(255),
                  default_ringto				   VARCHAR(128),
                  ouid                          INT,
                  caller_to_sms                 VARCHAR(255),
                  email_to_notify               VARCHAR(255),
                  play_disclaimer 			   VARCHAR(16),
                  created_at                    TIMESTAMP(0) WITHOUT TIME ZONE,
                  updated_at                    TIMESTAMP(0) WITHOUT TIME ZONE,
                  country_code                  VARCHAR(10),
                  tx_boost                      INT,
                  rx_boost                      INT,
                  vm_enabled                    SMALLINT,
                  routable_type                 routetype,
                  routable_id                   INT,
                  webhook_enabled               BOOLEAN,
                  status                        cestatus,
                  record_until 				   TIMESTAMP(0) WITHOUT TIME ZONE,
                  whisper_enabled 			   BOOLEAN,
                  spam_filter_key               CHAR(1),
                  app_id                        app,
                  dnis_as_cid                   BOOLEAN,
                  ring_delay                    BOOLEAN,
                  postcall_ivr_enabled          BOOLEAN,
                  wpapi_key                     CHAR(1),
                  spam_filter_enabled           BOOLEAN
             )
             SERVER mysql_ce
             OPTIONS (dbname 'ce3', table_name 'call_flows');
    
    ct_stg=# GRANT SELECT, UPDATE, INSERT ON call_flows TO interact;

Again, make sure that you adjust the 'dbname' to match whatever the MySQL DB name is for Call Engine in your setup.
    
    
#### MongoDB FDW

For the MongoDB foreign data wrapper, it will be necessary to download the extension from the Github site, as there is no
package currently available for Debian based Linux systems.  The extension can be downloaded from the following URL:
    
    https://github.com/EnterpriseDB/mongo_fdw

Personally I like following the Unix standard for source compiled packages, and prefer installing the package in the directory:
/usr/local/src  but you can pick whichever directory you prefer for the installation.  This is a prerequisite that must be 
installed first, which is that you need the PostgreSQL server dev package.  This is available as a package for installation 
and the mongo libraries are needed for the legacy install, but I believe can be skipped for the master installation - although
won't hurt to have both installed.

    sudo apt-get install postgresql-server-dev-9.5
    sudo apt-get install libmongo-client-dev
    
    mv mongo_fdw-master.zip /usr/local/src/
    cd /usr/local/src
    unzip mongo_fdw-master.zip
    cd mongo_fdw_master
    
Now at this point you have a couple of options.  You can install it using the legacy drivers or install it using the master
branch, which will automatically download and install the libbson and libmongoc C libraries.  Both seem to work fine, 
although there does seem to be some improvements with the master install.

    sudo ./autogen.sh --with-legacy
or

    sudo ./autogen.sh --with-master
    
This will update and install the JSON-C and mongo-c-driver libraries, which can then be used to compile the extension. There
is something in the docs about compiling the mongo-c-driver by first running `./configure --with-libbson=system` which may or
may not be required.  For me personally, I had to run a `make clean` before I could run the following command, but you should
probaby try to run it first and if it doesn't work, then you can try the `make clean` and then try the following again. Compile 
the extension by running:

    make -f Makefile.meta && make -f Makefile.meta install

Either way you will end up with the MongoDB FDW PostgreSQL extension installed into the PostgreSQL server.  This should install
the extension into /usr/share/postgresql/9.5/extension and /usr/lib/postgresql/9.5/lib with the files needed. Now you'll 
need to execute the SQL that will enable and create the foreign data wrapper and allow for the pass thru connection to MongoDB.  
This will need to be executed by a user that has sufficient rights to enable the extension and create the foreign servers. 
This can all be executed using the psql shell on the server itself.
    
    su - postgres
    psql ct_stg
    
    ct_stg=# CREATE EXTENSION mongo_fdw;
    ct_stg=# CREATE SERVER mongo_server FOREIGN DATA WRAPPER mongo_fdw
             OPTIONS (address '23.21.43.46', port '27017');
    ct_stg=# CREATE USER MAPPING FOR interact SERVER mongo_server;
    ct_stg=# CREATE FOREIGN TABLE dni_logs (
                 _id 									NAME,
                 "data.created_at" 						TIMESTAMP(0) WITH TIME ZONE,
                 "data.destination_url"					VARCHAR(2048),
                 "data.organizational_unit_id"			INT,
                 "data.location_details.country_code"	CHAR(2),
                 "data.location_details.country_name"	VARCHAR(128),
                 "data.location_details.region_code" 	VARCHAR(32),
                 "data.location_details.region_name" 	VARCHAR(128),
                 "data.location_details.city" 			VARCHAR(128),
                 "data.location_details.zipcode" 		VARCHAR(16),
                 "data.location_details.latitude" 		NUMERIC(15,12),
                 "data.location_details.longitude"		NUMERIC(15,12),
                 "data.location_details.metro_code" 		SMALLINT,
                 "data.location_details.area_code" 		SMALLINT,
                 "data.ref_param.gclid" 					VARCHAR(255),
                 "data.ref_param.gclsrc"					VARCHAR(128),
                 "data.ref_param.utm_campaign"			VARCHAR(255),
                 "data.ref_param.utm_medium"				VARCHAR(255),
                 "data.ref_parram.kw"					VARCHAR(255),
                 "data.referring" 						VARCHAR(2048),
                 "data.referring_type" 					VARCHAR(64),
                 "data.referring_url" 					VARCHAR(2048),
                 "data.search_words" 					VARCHAR(128),
                 "data.session_id" 						VARCHAR(48),
                 "data.first_page"						VARCHAR(2048),
                 "data.last_page"						VARCHAR(2048)
             )
             SERVER mongo_server
            OPTIONS (database 'big_data_api_staging', collection 'ct_dni_logs');
    ct_stg=# GRANT SELECT, UPDATE, INSERT ON dni_logs TO interact;
    ct_stg=# ANALYZE dni_logs;
    
    
### MySQL Database

The code base needs to talk directly to the Call Engine MySQL database for some things like call flow and geo-location, 
so access will need to be granted on the Call Engine MySQL server.


    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`ivr_routes` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`call_flows` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`geo_options` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`geo_routes` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`ivr_options` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`blacklist` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`percentage_route` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`percentage_route_options` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`ivr_routes2` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`ivr_options2` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`schedule_routes` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    GRANT SELECT, INSERT, UPDATE, DELETE ON `newcallengine_stag`.`schedule_options` TO 'restapi'@'%' IDENTIFIED BY '<password>';
    
Apparently it also needs to connect to the MySQL LMC2 database as well, so appropriate access should be set for that as well.


### MS SQL - Call Miner

Call Miner uses a Microsoft SQL DB that is accessed via the Call Miner API, the details of which can be found in the config
file callMiner.yml.  Basically a user account must be created and shared key set on Call Miner.

### MongoDB

MongoDB is used for e-mail digest for storage and data used in that process.  It can be set to use either a local running 
service or a remote sharded install.  Just make sure that access is allowed and the correct databases are created prior to 
use.  Two defined databases are required for operation.
    
    emaildigest     // used for the e-mail digest system for notifications and summaries
    
**UPDATE:** the system no longer uses MongoDB for session management.  Memcached is being used instead, so disregard the rest
of this section as it is no longer needed.

    oauth2          // used for authentication and session management

The setup for the 'oauth2' DB is a bit more involved, as it requires at least one record in one of the collections in order to 
work for the login process.  So you'll need to create the DB of 'oauth' in your MongoDB source, that path to which will need 
to match your setup in the config/config.yml file, which uses a bit different syntax to set.  So it will help to add the three
'collections' (recommended to use 'robomongo') to the oauth DB called:
    - accesstokens
    - refreshtokens
    - clients
In the "clients" collection you will need one record for Convirza that we login clients on behave as.  Here is the record you
will want to add to clients:

{
    "name" : "Convirza",
    "clientId" : "system",
    "clientSecret" : "f558ba166258089b2ef322c340554c",
    "_id" : ObjectId("5589d4b287caf2991e91b431"),
    "__v" : 0
}

This record will match the settings in the config.yml file for "client_id" and "client_secret"

acce
## Amazon AWS

The code uses Amazon's S3 storage on AWS for phone recordings and other large files.  This uses credentials established with
our AWS account, so it is not advisable to change the settings for this.

=====================================================================================================================================

## Script start-up and Debugging

The script can be started at from the console, but it is important to set the correct values and paths for your environment.
First you will want to create a log file and change the owner to be the same as the user you will be running node as:

    touch /var/log/restapi.log
    chown *username* /var/log/restapi.log
    
The the script has two processes that it runs, both of which use the module *forever*, which will automatically pick up any 
change made to any file and plug that into the running version of the code.  To start the node server execute:

    touch //var/www/restapi/run/restapi.pid && cd //var/www/restapi && NODE_ENV=development forever -w --watchDirectory /var/www/restapi \
        --pidFile /var/www/restapi/run/restapi.pid -a -l /var/log/restapi.log --minUptime 5000 --spinSleepTime 2000 start bin/www
    
    touch /var/www/restapi/callpage/run/callpage.pid && cd /var/www/restapi/callpage && NODE_ENV=development forever -w --watchDirectory /var/www/restapi/callpage \
        --pidFile /var/www/restapi/callpage/run/callpage.pid -a -l /var/log/callpage.log --minUptime 5000 --spinSleepTime 2000 start bin/www
        
        
Note that you will want the value for NODE_ENV set to whatever environment your using and corresponding config settings are set for.
Debugging is best accomplished by leaving a running tail on the log file, so you can see the output of the script executing, like this:

    tail -f /var/log/restapi.log
