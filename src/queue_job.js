// vim: ts=4:sw=4:expandtab
 
 /*
  * jobQueue manages multiple queues indexed by device to serialize
  * session io ops on the database.
  */
 'use strict';

 const withTimeout = require('async-mutex').withTimeout;
 const Mutex = require('async-mutex').Mutex;
 const map = {};
 module.exports = function(bucket, awaitable) {
     if(!map[bucket]) {
         map[bucket] = withTimeout(new Mutex(), 30 * 1000)
     }
     return map[bucket].runExclusive(awaitable)
 };
 