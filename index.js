var async = require('async')
  , keys = Object.keys
  , pnet = require('pnet')
  , showFinder = require('show-finder');

var PNET_SETLIST_METHOD = 'shows.setlists.get';

var Skyskraper = module.exports = {};

Skyskraper.bulkScrape = function(options, cb){
  var apikey = options.pnetApikey;

  if (null == apikey) {
    process.nextTick(cb.bind(null, new Error('pnetApikey option is required')));
    return
  }

  showFinder.find(options, function(err, shows){
    if (null != err)
      return cb(err);

    var years = Object.keys(shows);

    if (years.length === 0)
      return cb(null, {});

    var requests = years.reduce(function(memo, year){
      shows[year].forEach(function(show){
        memo[show.showdate] = function(cb) {
          Skyskraper.scrape(show.showdate, {pnetApikey: apikey}, cb);
        }
      });
      return memo;
    }, {});

    async.parallel(requests, function(err, results){
      if (null != err)
        return cb(err);

      var groupedByYear = Object.keys(results).reduce(function(memo, showDate){
        var year = showDate.slice(0, 4);
        memo[year] = (memo[year] || []).concat(results[showDate]);
        return memo;
      }, {});

      var sorted = Object.keys(groupedByYear).reduce(function(memo, year){
        memo[year] = groupedByYear[year].sort(function(show1, show2){
          return makeDate(show1.date) > makeDate(show2.date);
        });
        return memo;
      }, {});

      cb(null, sorted);
    });
  });
}

Skyskraper.scrape = function(date, options, cb){
  var apikey = options.pnetApikey;

  if (null == apikey) {
    process.nextTick(cb.bind(null, new Error('pnetApikey option is required')));
    return
  }

  getShowsForDate(date, apikey, cb);
}

function getShowsForDate(date, apikey, cb){
  var options = {showdate: date, apikey: apikey};

  pnet.get(PNET_SETLIST_METHOD, options, function(err, _, shows){
    if (null != err)
      cb(err);
    else
      cb(null, shows.map(formatShow));
  });
}

function makeDate(date) {
  var parts = date.split('-')
    , year = +parts[0]
    , month = +parts[1]
    , day = +parts[2];
  return new Date(year, month - 1, day);
}

/**
 * Shuffle around attributes from the Phish.net API setlist response.
 *
 * It returns a number of attributes specific to its own API as well
 * as a number of attributes that are generic. The idea is to group
 * the Phish.net specific attributes (i.e. venue id, artist id, show id)
 * under `pnet` properties and leave the generic attributes (i.e. date,
 * location, songs) as is.
 *
 * Further, we rename and reformat/regroup some of these attributes to make
 * a bit more sense (i.e. putting venue info into an object titled `venue`
 * rather than leaving it mixed in top-level).
 */

function formatShow(rawshow){
  return {
    artist: rawshow['artist-name'],
    date: rawshow.showdate,
    year: +rawshow.showyear,
    humanDate: rawshow.nicedate,
    friendlyDate: rawshow.mmddyy,
    sets: formatSongs(rawshow.sets),
    encores: formatSongs(rawshow.encores),
    footnotes: rawshow.footnotes,
    pnet: {
      artistId: +rawshow.artist,
      meta: nullIfEmptyString(rawshow.meta),
      setlistNotes: nullIfEmptyString(rawshow.setlistnotes),
      showId: +rawshow.showid,
      url: rawshow.url
    },
    venue: {
      name: rawshow.venue,
      location: {
        city: rawshow.city,
        country: rawshow.country,
        state: rawshow.state
      },
      pnet: {
        notes: nullIfEmptyString(rawshow.venuenotes),
        venueId: +rawshow.venueid
      }
    }
  }
}

function formatSongs(sets){
  return sets.map(function(set){
    return set.map(function(song){
      return keys(song).reduce(function(memo, key){
        ('url' !== key ? memo : memo.pnet)[key] = song[key];
        return memo;
      }, {pnet: {}});
    });
  });
}

function nullIfEmptyString(str){
  return isBlank(str) ? null : str;
}

function isBlank(str){
  return null == str || !/\S+/.test(str);
}
