// vim: ts=4:sw=4:expandtab
 
 /*
  * jobQueue manages multiple queues indexed by device to serialize
  * session io ops on the database.
  */
'use strict';

const Mutex = require('async-mutex').Mutex;
const map = {};

module.exports = function(bucket, awaitable) {
    if(!map[bucket]) {
        map[bucket] = new Mutex()
    }

    return map[bucket].runExclusive(
        async () => {
            try {
                return Promise.resolve(await awaitable())
            } catch (error) {
                return Promise.reject(error)
            }
        }
    )
}