-- phpMyAdmin SQL Dump
-- version 4.0.10deb1
-- http://www.phpmyadmin.net
--
-- Host: dev.lmc-db.logmycalls.com
-- Generation Time: Feb 23, 2015 at 02:26 PM
-- Server version: 5.6.21-70.1-56
-- PHP Version: 5.5.9-1ubuntu4.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: ct_dev
--
CREATE DATABASE IF NOT EXISTS ct_dev DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
USE ct_dev;

-- --------------------------------------------------------

--
-- Table structure for table campaign
--

CREATE TABLE IF NOT EXISTS campaign (
  campaign_id           int(11) unsigned NOT NULL AUTO_INCREMENT,
  campaign_ou_id        int(11) DEFAULT NULL,
  campaign_ext_id       varchar(128) DEFAULT NULL,
  campaign_name         varchar(128) DEFAULT NULL,
  campaign_status       varchar(32) DEFAULT NULL,
  campaign_created      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  campaign_modified     timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (campaign_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=162 ;

-- --------------------------------------------------------

--
-- Table structure for table campaign_channel
--

CREATE TABLE IF NOT EXISTS campaign_channel (
  campaign_id           int(11) unsigned NOT NULL,
  channel_id            int(11) unsigned NOT NULL,
  PRIMARY KEY (campaign_id,channel_id),
  KEY channel_id (channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table campaign_ct_user
--

CREATE TABLE IF NOT EXISTS campaign_ct_user (
  campaign_id           int(11) unsigned NOT NULL,
  ct_user_id            int(11) unsigned NOT NULL,
  PRIMARY KEY (campaign_id,ct_user_id),
  KEY campaign_id (campaign_id),
  KEY ct_user_id (ct_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table campaign_provisioned_route
--

CREATE TABLE IF NOT EXISTS campaign_provisioned_route (
  campaign_id           int(11) unsigned NOT NULL,
  provisioned_route_id  int(11) unsigned NOT NULL,
  KEY campaign_id (campaign_id),
  KEY provisioned_route_id (provisioned_route_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table channel
--

CREATE TABLE IF NOT EXISTS channel (
  channel_id            int(11) unsigned NOT NULL AUTO_INCREMENT,
  category              varchar(32) NOT NULL DEFAULT '',
  sub_category          varchar(32) NOT NULL DEFAULT '',
  channel_created       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  channel_modified      timestamp DEFAULT NULL,
  channel_status        varchar(32) NOT NULL DEFAULT 'active',
  PRIMARY KEY (channel_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=19 ;

-- --------------------------------------------------------

--
-- Table structure for table component
--

CREATE TABLE IF NOT EXISTS component (
  component_id          int(11) unsigned NOT NULL AUTO_INCREMENT,
  component_parent_id   int(11) unsigned DEFAULT NULL,
  component_external_id int(11) unsigned DEFAULT NULL,
  component_name        varchar(64) NOT NULL,
  component_desc        varchar(255) DEFAULT NULL,
  component_table       varchar(96) DEFAULT NULL COMMENT 'Defining this indicates access to be enforce per record to supplied table',
  table_primary_key     varchar(96) DEFAULT NULL COMMENT 'This is the primary key for the per record table',
  threshold_max         smallint(6) NOT NULL DEFAULT '0' COMMENT 'Any value enforces a limit to be enforced',
  threshold_call        varchar(128) DEFAULT NULL COMMENT 'TBD - but will be a method to call to get the current value for threshold count',
  component_active      tinyint(1) NOT NULL DEFAULT '1',
  component_created     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (component_id),
  KEY component_parent_id (component_parent_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=10 ;

-- --------------------------------------------------------

--
-- Table structure for table component_access
--

CREATE TABLE IF NOT EXISTS component_access (
  component_id          int(11) unsigned NOT NULL,
  scope_id              int(11) unsigned NOT NULL,
  component_permission  smallint(6) NOT NULL DEFAULT '4',
  PRIMARY KEY (component_id,scope_id),
  KEY scope_id (scope_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table ct_log
--

CREATE TABLE IF NOT EXISTS ct_log (
  ct_log_id             int(11) unsigned NOT NULL AUTO_INCREMENT,
  ct_log_ou_id          int(11) DEFAULT NULL,
  actor_type            varchar(16) DEFAULT NULL,
  actor                 varchar(255) DEFAULT NULL,
  action                varchar(16) DEFAULT NULL,
  object                varchar(32) DEFAULT NULL,
  object_attribute      varchar(32) DEFAULT NULL,
  object_event          varchar(255) DEFAULT NULL,
  created               timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ct_log_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=562 ;

-- --------------------------------------------------------

--
-- Table structure for table ct_user
--

CREATE TABLE IF NOT EXISTS ct_user (
  ct_user_id            int(11) unsigned NOT NULL AUTO_INCREMENT,
  user_ext_id           varchar(20) DEFAULT NULL,
  username              varchar(255) NOT NULL,
  password              char(40) NOT NULL,
  has_changed_pw        int(11) DEFAULT NULL,
  first_name            varchar(45) DEFAULT NULL,
  last_name             varchar(45) DEFAULT NULL,
  user_title            varchar(50) DEFAULT NULL,
  role_id               int(11) unsigned NOT NULL,
  ct_user_ou_id         int(11) unsigned NOT NULL,
  primary_phone         varchar(45) DEFAULT NULL,
  mobile_phone          varchar(100) DEFAULT NULL,
  mobile_provider_id    int(11) DEFAULT NULL,
  user_modified         timestamp DEFAULT NULL,
  user_created          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_status           varchar(20) NOT NULL DEFAULT 'active',
  user_img              varchar(255) DEFAULT NULL,
  PRIMARY KEY (ct_user_id),
  UNIQUE KEY username (username),
  KEY organizational_unit_id (ct_user_ou_id),
  KEY group_id (role_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=15 ;

-- --------------------------------------------------------

--
-- Table structure for table geo_lookup
--

CREATE TABLE IF NOT EXISTS geo_lookup (
  id                    int(11) NOT NULL AUTO_INCREMENT,
  npa                   char(3) NOT NULL,
  nxx                   char(3) NOT NULL,
  npanxx                char(6) NOT NULL,
  zipcode               char(5) NOT NULL,
  state                 char(2) NOT NULL,
  city                  varchar(128) NOT NULL,
  county                varchar(100) DEFAULT NULL,
  RC                    char(10) NOT NULL,
  LATITUDE double NOT NULL,
  LONGITUDE double NOT NULL,
  PRIMARY KEY (id),
  KEY geo_lookup_idx0 (npa,nxx),
  KEY geo_lookup_idx1 (city),
  KEY npanxxidx (npanxx) USING BTREE
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3557467 ;

-- --------------------------------------------------------

--
-- Table structure for table industry
--

CREATE TABLE IF NOT EXISTS industry (
  industry_id           int(11) unsigned NOT NULL AUTO_INCREMENT,
  industry_name         varchar(64) NOT NULL,
  PRIMARY KEY (industry_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=28 ;

-- --------------------------------------------------------

--
-- Table structure for table org_account
--

CREATE TABLE IF NOT EXISTS org_account (
  account_id            int(10) unsigned NOT NULL AUTO_INCREMENT,
  org_unit_id           int(10) unsigned NOT NULL,
  subscription_id       int(11) unsigned DEFAULT NULL,
  element_quantity      smallint(6) NOT NULL DEFAULT '1',
  component_id          int(11) unsigned DEFAULT NULL,
  account_created       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id),
  KEY component_id (component_id),
  KEY subscription_id (subscription_id),
  KEY org_unit_id (org_unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table org_unit
--

CREATE TABLE IF NOT EXISTS org_unit (
  org_unit_id           int(11) unsigned NOT NULL AUTO_INCREMENT,
  org_unit_ext_id       varchar(64) DEFAULT NULL,
  org_unit_name         varchar(255) DEFAULT NULL,
  org_unit_parent_id    int(11) unsigned DEFAULT NULL,
  top_ou_id             int(11) unsigned DEFAULT NULL,
  org_unit_status       varchar(16) NOT NULL DEFAULT 'active',
  PRIMARY KEY (org_unit_id),
  KEY top_ou_id (top_ou_id),
  KEY org_unit_parent_id (org_unit_parent_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=76 ;

-- --------------------------------------------------------

--
-- Table structure for table org_unit_detail
--

CREATE TABLE IF NOT EXISTS org_unit_detail (
  org_unit_id           int(11) unsigned NOT NULL,
  address               varchar(255) DEFAULT NULL,
  city                  varchar(45) DEFAULT NULL,
  state                 varchar(45) DEFAULT NULL,
  zip                   varchar(45) DEFAULT NULL,
  phone_number          varchar(45) DEFAULT NULL,
  latitude              float DEFAULT NULL,
  longitude             float DEFAULT NULL,
  is_store              int(11) NOT NULL DEFAULT '0',
  industry_id           int(11) unsigned DEFAULT NULL,
  custom_layout         tinyint(4) NOT NULL DEFAULT '0',
  org_unit_created      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  org_unit_modified     timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (org_unit_id),
  KEY industry_id (industry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table phone_number
--

CREATE TABLE IF NOT EXISTS phone_number (
  phone_number_id       int(11) unsigned NOT NULL AUTO_INCREMENT,
  phone_number_ou_id    int(11) unsigned DEFAULT NULL,
  phone_number_pool_id  int(11) unsigned DEFAULT NULL,
  `number`              varchar(45) DEFAULT NULL,
  number_type           int(11) unsigned DEFAULT NULL,
  phone_number_created  timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  phone_number_modified timestamp DEFAULT NULL,
  phone_number_status   varchar(20) NOT NULL DEFAULT 'active',
  provisioned_route_id  int(11) unsigned DEFAULT NULL,
  lock_expires          datetime DEFAULT NULL,
  carrier               varchar(255) DEFAULT NULL,
  PRIMARY KEY (phone_number_id),
  KEY number (number),
  KEY idx_1 (number,provisioned_route_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

-- --------------------------------------------------------

--
-- Table structure for table provisioned_route
--

CREATE TABLE IF NOT EXISTS provisioned_route (
  provisioned_route_id      int(11) unsigned NOT NULL AUTO_INCREMENT,
  provisioned_route_ou_id   int(11) DEFAULT NULL,
  route_type                varchar(50) NOT NULL DEFAULT 'Simple',
  provisioned_route_name    varchar(45) CHARACTER SET utf8 COLLATE utf8_bin DEFAULT NULL,
  description               varchar(45) DEFAULT NULL,
  provider_id               int(11) DEFAULT NULL,
  product_id                int(11) DEFAULT NULL,
  provisioned_route_created timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  provisioned_route_modified timestamp DEFAULT NULL,
  provisioned_route_status  varchar(20) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL DEFAULT 'active',
  play_disclaimer           tinyint(1) NOT NULL DEFAULT '1',
  mine                      int(10) DEFAULT '0',
  repeat_interval           smallint(6) NOT NULL DEFAULT '72',
  call_value                int(11) DEFAULT NULL,
  PRIMARY KEY (provisioned_route_id),
  KEY organ_unit_id (provisioned_route_ou_id),
  KEY provider_id (provider_id),
  KEY product_id (product_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=205 ;

-- --------------------------------------------------------

--
-- Table structure for table provisioned_route_channel
--

CREATE TABLE IF NOT EXISTS provisioned_route_channel (
  provisioned_route_id      int(11) NOT NULL,
  channel_id                int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table role
--

CREATE TABLE IF NOT EXISTS role (
  role_id                   int(11) unsigned NOT NULL AUTO_INCREMENT,
  role_name                 varchar(64) NOT NULL,
  role_created              timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

-- --------------------------------------------------------

--
-- Table structure for table role_access
--

CREATE TABLE IF NOT EXISTS role_access (
  access_id               int(11) unsigned NOT NULL AUTO_INCREMENT,
  role_id                 int(11) unsigned NOT NULL,
  scope_id                int(11) unsigned NOT NULL,
  component_id            int(11) unsigned NOT NULL,
  record_req              tinyint(1) NOT NULL DEFAULT '0',
  limit_set               tinyint(1) NOT NULL DEFAULT '0',
  permission              smallint(6) NOT NULL DEFAULT '4',
  access_created          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (access_id),
  KEY role_access_role_id_idx (role_id),
  KEY scope_id (scope_id),
  KEY component_id (component_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=17 ;

-- --------------------------------------------------------

--
-- Table structure for table scope
--

CREATE TABLE IF NOT EXISTS scope (
  scope_id                int(11) unsigned NOT NULL AUTO_INCREMENT,
  scope_code              varchar(32) NOT NULL,
  scope_display           varchar(64) NOT NULL,
  scope_desc              varchar(128) DEFAULT NULL,
  scope_active            tinyint(1) NOT NULL DEFAULT '1',
  scope_url_path          varchar(255) DEFAULT NULL,
  nav_menu_display        varchar(64) DEFAULT NULL,
  scope_public            tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (scope_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=18 ;

-- --------------------------------------------------------

--
-- Table structure for table subscription
--

CREATE TABLE IF NOT EXISTS subscription (
  subscription_id         int(11) unsigned NOT NULL AUTO_INCREMENT,
  subscription_name       varchar(64) NOT NULL,
  subscription_desc       varchar(255) DEFAULT NULL,
  subscription_external_id int(11) NOT NULL,
  subscription_active     tinyint(1) NOT NULL DEFAULT '1',
  subscription_created    timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscription_id),
  UNIQUE KEY subscription_external_id (subscription_external_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

-- --------------------------------------------------------

--
-- Table structure for table subscription_component
--

CREATE TABLE IF NOT EXISTS subscription_component (
  subscription_id         int(11) unsigned NOT NULL,
  component_id            int(11) unsigned NOT NULL,
  component_quantity      smallint(6) NOT NULL DEFAULT '1',
  date_created            timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscription_id,component_id),
  KEY component_id (component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table user_access
--

CREATE TABLE IF NOT EXISTS user_access (
  ct_user_id              int(11) unsigned NOT NULL,
  record_id               int(11) unsigned NOT NULL,
  access_id               int(11) unsigned DEFAULT NULL,
  table_name              varchar(96) DEFAULT NULL,
  PRIMARY KEY (ct_user_id,record_id),
  KEY ct_user_id (ct_user_id),
  KEY access_id (access_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table campaign_channel
--
ALTER TABLE campaign_channel
  ADD CONSTRAINT campaign_channel_ibfk_1 FOREIGN KEY (campaign_id) REFERENCES campaign (campaign_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT campaign_channel_ibfk_2 FOREIGN KEY (channel_id) REFERENCES channel (channel_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table campaign_ct_user
--
ALTER TABLE campaign_ct_user
  ADD CONSTRAINT campaign_ct_user_ibfk_1 FOREIGN KEY (campaign_id) REFERENCES campaign (campaign_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT campaign_ct_user_ibfk_2 FOREIGN KEY (ct_user_id) REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table campaign_provisioned_route
--
ALTER TABLE campaign_provisioned_route
  ADD CONSTRAINT campaign_provisioned_route_ibfk_1 FOREIGN KEY (provisioned_route_id) REFERENCES provisioned_route (provisioned_route_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT campaign_provisioned_route_ibfk_2 FOREIGN KEY (campaign_id) REFERENCES campaign (campaign_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table component
--
ALTER TABLE component
  ADD CONSTRAINT component_ibfk_1 FOREIGN KEY (component_parent_id) REFERENCES component (component_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table component_access
--
ALTER TABLE component_access
  ADD CONSTRAINT component_access_ibfk_1 FOREIGN KEY (component_id) REFERENCES component (component_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT component_access_ibfk_2 FOREIGN KEY (scope_id) REFERENCES scope (scope_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table ct_user
--
ALTER TABLE ct_user
  ADD CONSTRAINT ct_user_ibfk_1 FOREIGN KEY (role_id) REFERENCES role (role_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT ct_user_ibfk_2 FOREIGN KEY (ct_user_ou_id) REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table org_account
--
ALTER TABLE org_account
  ADD CONSTRAINT org_account_ibfk_1 FOREIGN KEY (org_unit_id) REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT org_account_ibfk_2 FOREIGN KEY (subscription_id) REFERENCES subscription (subscription_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT org_account_ibfk_3 FOREIGN KEY (component_id) REFERENCES component (component_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
--
-- Constraints for table org_unit
--
ALTER TABLE org_unit
  ADD CONSTRAINT org_unit_ibfk_1 FOREIGN KEY (top_ou_id) REFERENCES org_unit (org_unit_id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT org_unit_ibfk_2 FOREIGN KEY (org_unit_parent_id) REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table org_unit_detail
--
ALTER TABLE org_unit_detail
  ADD CONSTRAINT org_unit_detail_ibfk_1 FOREIGN KEY (org_unit_id) REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT org_unit_detail_ibfk_2 FOREIGN KEY (industry_id) REFERENCES industry (industry_id) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table role_access
--
ALTER TABLE role_access
  ADD CONSTRAINT role_access_ibfk_1 FOREIGN KEY (role_id) REFERENCES role (role_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT role_access_ibfk_2 FOREIGN KEY (scope_id) REFERENCES scope (scope_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT role_access_ibfk_3 FOREIGN KEY (component_id) REFERENCES component (component_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table subscription_component
--
ALTER TABLE subscription_component
  ADD CONSTRAINT subscription_component_ibfk_1 FOREIGN KEY (component_id) REFERENCES component (component_id) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table user_access
--
ALTER TABLE user_access
  ADD CONSTRAINT user_access_ibfk_1 FOREIGN KEY (access_id) REFERENCES role_access (access_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT user_access_ibfk_2 FOREIGN KEY (ct_user_id) REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
