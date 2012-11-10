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
  function toURL($n) { return forward_hash($n); }

  // on success, the hackasaurus API expects a "200 OK"
  function success($url) {
    global $dbh;
    header("HTTP/1.0 200 Page saved");
    echo '{"published-url": "http://pomax.nihongoresources.com/downloads/temp/friendlypublish/get.php?page='.$url.'"}';
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

  // get the post data and see if we can get it into our databse
  $html = str_replace("'", "&#39;", $_POST["html"]);
  $original_url = $_POST["original-url"];

  // open database handle
  $dbh = new PDO('sqlite:pages.db');

  // does the page table exist? If not, build it.
  $statement = $dbh->prepare("SELECT 1 FROM pages");
  if(!$statement) {
    $statement = $dbh->prepare("CREATE TABLE pages (html TEXT, originalURL TEXT, timestamp TEXT)");
    $success = $statement->execute();
    if(!$success) { fail("could not create page table"); }
  }

  // try to insert the row
  $timestamp = time();
  $statement = $dbh->prepare("INSERT INTO pages VALUES ('$html', '$original_url', '$timestamp')");
  if(!$statement) { fail("could not initialise page save"); }
  else {
    $success = $statement->execute();
    if(!$success) { fail("could not save page to database"); }
    else {
      // insertion succeeded; what is its ID?
      $query = $dbh->prepare("SELECT rowid AS count FROM pages WHERE ".
                             "html = '$html' AND originalURL = '$original_url' AND timestamp = '$timestamp'");
      $success = $query->execute();
      $count = $query->fetch();
      $count = $count["count"];
      // hash the ID and succeed
      $hashed = toURL($count);
      success($hashed);
    }
  }

  // how did we get here?
  fail("Unreachable point reached");
?>