// vim: ts=4:sw=4:expandtab
 
 /*
  * jobQueue manages multiple queues indexed by device to serialize
  * session io ops on the database.
  */
 'use strict';

 const withTimeout = require('async-mutex').withTimeout;
 const Mutex = require('async-mutex').Mutex;
 const TTLCache = require('@isaacs/ttlcache')
 const cache = new TTLCache({ ttl: 60 * 1000, updateAgeOnGet: true })
 module.exports = function(bucket, awaitable) {
     if(!cache.has(bucket)) {
         cache.set(bucket, withTimeout(new Mutex(), 30 * 1000))
     }
     return cache.get(bucket).runExclusive(awaitable)
 };
 