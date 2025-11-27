--
-- Run this file for resetting the whole database.
--

source setup.sql;
source ddl.sql;
source sp-logs-triggers.sql; --I moved triggers creation before dml.sql to capture the static insertion of the pre-designed labels designs.
source dml.sql;
source sp.sql;
