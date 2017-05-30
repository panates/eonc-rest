/*
 * Tests for app.listen (extended from connect)
 * Original file ([connect]/test/app.listen.js)
 */

const rest = require('..');
const request = require('supertest');

describe('app.listen()', function(){
    it('should wrap in an http.Server', function(done){
        let app = rest.handler();

        app.use(function(req, res){
            res.end();
        });

        app.listen(0, function(){
            request(app)
                .get('/')
                .expect(200, done);
        });
    });
});