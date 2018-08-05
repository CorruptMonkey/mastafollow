CREATE TABLE IF NOT EXISTS `network` (
  `uid` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `follow_sent` tinyint(1) NOT NULL DEFAULT '0',
  `follow_restrict` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
