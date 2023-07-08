// vim: ts=4:sw=4:expandtab
 
 /*
  * jobQueue manages multiple queues indexed by device to serialize
  * session io ops on the database.
  */
'use strict';

module.exports = function(bucket, awaitable) {
    return await awaitable()
};
