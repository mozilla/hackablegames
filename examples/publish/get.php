<?php

  /**
   *
   *  Custome friendlycode page retrieval from sqlite db
   *  for the hackable games session at MozFest.
   *
   *  See https://github.com/hackasaurus/hackpub#using-the-api
   *  for the actual API that is supported =)
   *
   *  - Pomax
   */

  // database handler
  $dbh = null;

  // not-so-random reversible hashing for page ids
  include("pseudonite.php");
  function fromURL($url) { return reverse_hash($url); }

  // on success, the hackasaurus API expects a "200 OK"
  function success($html) {
    global $dbh;
    header("HTTP/1.0 200 OK");
    echo $html;
    $dbh = null;
    exit(0);
  }

  // on failure, we report what went wrong
  function fail($reason) {
    global $dbh;
    header("HTTP/1.0 500 $reason");
    $dbh = null;
    exit(1);
  }

  // which page should we fetch?
  $page = $_GET["page"];
  $rowid = fromURL($page);

  // open database handle
  $dbh = new PDO('sqlite:pages.db');
  $statement = $dbh->prepare("SELECT * FROM pages WHERE rowid = " . $rowid);

  // attempt to get the page code
  $success = $statement->execute();
  if(!$success) { fail("could not get page from database"); }
  else {
    $row = $statement->fetch();
    if($row) { success(str_replace("&#39;", "'", $row["html"])); }
    else { fail("page not in database"); }
  }

  // how did we get here?
  fail("Unreachable point reached");
?>