var expect = require('chai').expect
  , pnet = require('pnet')
  , showFinder = require('show-finder')
  , sinon = require('sinon')
  , skyskraper = require('../');

var stubs = {
  '2012-12-29-skyskraped': require('./stubs/2012-12-29-skyskraped'),
  '2012-12-30-skyskraped': require('./stubs/2012-12-30-skyskraped'),
  '2013-10-31-skyskraped': require('./stubs/2013-10-31-skyskraped'),
  '2013-10-31': require('./stubs/2013-10-31')
}

describe('skyskraper', function(){
  afterEach(function(){
    'function' === typeof pnet.get.restore && pnet.get.restore()
    'function' === typeof showFinder.find.restore && showFinder.find.restore()
    'function' === typeof skyskraper.scrape.restore && skyskraper.scrape.restore()
  });

  describe('.scrape', function(){
    it('errors out if a pnetApikey option is not provided', function(done){
      sinon.stub(pnet, 'get');

      skyskraper.scrape('2013-10-31', {}, function(err, shows){
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.equal('pnetApikey option is required');
        expect(pnet.get.called).to.be.false;
        done();
      });
    });

    it('queries a given show and returns a formatted response', function(done){
      var halloweenShow = stubs['2013-10-31'];

      sinon.stub(pnet, 'get', function(method, options, cb){
        expect(method).to.equal('shows.setlists.get');
        expect(options.apikey).to.equal(123);
        expect(options.showdate).to.equal('2013-10-31');
        cb(null, "https://api.phish.net/api.js?api=2.0&format=json&apikey=123&showdate=2013-10-31&method=pnet.shows.setlists.get", halloweenShow);
      });

      skyskraper.scrape('2013-10-31', {pnetApikey: 123}, function(err, shows){
        expect(err).to.be.null
        expect(shows.length).to.equal(1);

        show = shows[0];

        expect(show.artist).to.equal('Phish');
        expect(show.date).to.equal('2013-10-31');
        expect(show.year).to.equal(2013);
        expect(show.humanDate).to.equal('October 31, 2013');
        expect(show.friendlyDate).to.equal('10/31/2013');

        expect(show.pnet.artistId).to.equal(1);
        expect(show.pnet.meta).to.equal(null);
        expect(show.pnet.setlistNotes).to.equal(halloweenShow[0].setlistnotes);
        expect(show.pnet.showId).to.equal(1374684620);
        expect(show.pnet.url).to.equal('http://phish.net/setlists/?d=2013-10-31');

        expect(show.venue.name).to.equal('Boardwalk Hall');
        expect(show.venue.location).to.deep.equal({city: 'Atlantic City', country: 'USA', state: 'NJ'});
        expect(show.venue.pnet).to.deep.equal({notes: null, venueId: 777});

        expect(show.footnotes).to.deep.equal([
          '[1] Debut. Ended with Mike on power drill.',
          '[2] Debut.',
          '[3] Debut; Acoustic.',
          '[4] Debut; with Abe Vigoda and the Abe Vigoda Dancers.',
          '[5] Phish debut.',
          '[6] Abe Vigoda Dancers reference.'
        ]);

        expect(show.encores).to.deep.equal([
          [
            {
              id: 'quinn-the-eskimo',
              title: 'Quinn the Eskimo',
              pnet: {url: 'http://phish.net/song/quinn-the-eskimo'}
            }
          ]
        ]);

        show.sets.forEach(function(set){
          set.forEach(function(song){
            expect(song.id).to.be.a('string');
            expect(song.title).to.be.a('string');
            expect(song.pnet.url).to.be.a('string');
          });
        });

        done()
      });
    });
  });

  describe('.bulkScrape', function(){
    var show1 = {
      "showid": "1349228977",
      "showdate": "2012-12-29",
      "showyear": "2012",
      "artist": "Phish",
      "venue": "Madison Square Garden",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "venueid": "157",
      "meta": "",
      "nicedate": "December 29, 2012",
      "relativetime": "1 year ago",
      "link": "http://phish.net/setlists/?d=2012-12-29"
    };

    var show2 = {
      "showid": "1349228977",
      "showdate": "2012-12-30",
      "showyear": "2012",
      "artist": "Phish",
      "venue": "Madison Square Garden",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "venueid": "157",
      "meta": "",
      "nicedate": "December 30, 2012",
      "relativetime": "1 year ago",
      "link": "http://phish.net/setlists/?d=2012-12-30"
    };

    var show3 = {
      "showid": "1349228993",
      "showdate": "2013-10-31",
      "showyear": "2012",
      "artist": "Phish",
      "venue": "Boardwalk Hall",
      "city": "Atlantic City",
      "state": "NJ",
      "country": "USA",
      "venueid": "157",
      "meta": "",
      "nicedate": "October 31, 2013",
      "relativetime": "4 months ago",
      "link": "http://phish.net/setlists/?d=2013-10-31"
    };

    it('errors out if a pnetApikey option is not provided', function(done){
      sinon.stub(showFinder, 'find');

      skyskraper.scrape('2013-10-31', {}, function(err, shows){
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.equal('pnetApikey option is required');
        expect(showFinder.find.called).to.be.false;
        done();
      });
    });

    it('scrapes multiple shows based on a date range', function(done){
      sinon.stub(showFinder, 'find', function(options, cb){
        expect(options.from).to.equal('2012-12-29');
        expect(options.to).to.equal(2013);
        expect(options.pnetApikey).to.equal(456);
        process.nextTick(cb.bind(null, null, {'2012': [show1, show2], '2013': [show3]}))
      });

      sinon.stub(skyskraper, 'scrape', function(date, options, cb){
        expect(options.pnetApikey).to.equal(456);

        var stub = (function(){
          switch(date) {
            case '2012-12-29':
              return stubs['2012-12-29-skyskraped'];
            case '2012-12-30':
              return stubs['2012-12-30-skyskraped'];
            case '2013-10-31':
              return stubs['2013-10-31-skyskraped'];
          }
        }.call());

        process.nextTick(cb.bind(null, null, stub));
      });

      var options = {pnetApikey: 456, from: '2012-12-29', to: 2013}
      skyskraper.bulkScrape(options, function(err, shows){
        expect(shows['2012'].length).to.equal(2);
        expect(shows['2013'].length).to.equal(1);

        expect(shows['2012'][0].date).to.equal('2012-12-29');
        expect(shows['2012'][1].date).to.equal('2012-12-30');
        expect(shows['2013'][0].date).to.equal('2013-10-31');

        done()
      });
    });
  });
});
