var expect = require('chai').expect
  , halloweenShow = require('./stubs/2013-10-31')
  , pnet = require('pnet')
  , sinon = require('sinon')
  , skyskraper = require('../');

describe('skyskraper', function(){
  describe('scrape', function(){
    it('queries a given show and returns a formatted response', function(done){
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
});
