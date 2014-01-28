var pnet = require('pnet')
  , keys = Object.keys;

var PNET_SETLIST_METHOD = 'shows.setlists.get';

exports.scrape = function(date, options, cb){
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
    setlistNotes: rawshow.setlistnotes,
    sets: formatSongs(rawshow.sets),
    encores: formatSongs(rawshow.encores),
    footnotes: rawshow.footnotes,
    meta: rawshow.meta,
    pnet: {
      artistId: +rawshow.artist,
      showId: +rawshow.showid,
      url: rawshow.url
    },
    venue: {
      name: rawshow.venue,
      notes: rawshow.venuenotes,
      location: {
        city: rawshow.city,
        country: rawshow.country,
        state: rawshow.state
      },
      pnet: {
        venueId: +rawshow.venueid
      }
    }
  }
}

function formatSongs(sets){
  return sets.map(function(set){
    return set.map(function(song){
      return keys(song).reduce(function(memo, key){
        'url' !== key ? memo[key] = song[key] : memo.pnet[key] = song[key];
        return memo;
      }, {pnet: {}});
    });
  });
}
