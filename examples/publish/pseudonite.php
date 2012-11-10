<?php
  // Extremely simple, reversible hashing
  function reversible_hash($n) { return ((0xFFFF & $n)<<16) + ((0xFFFF0000 & $n)>>16); }
  function forward_hash($n) { $h = reversible_hash($n); return base64_encode($h); }
  function reverse_hash($h) { $n = base64_decode($h); return reversible_hash($n); }
?>