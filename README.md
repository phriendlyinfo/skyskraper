# skyskraper

A module to scrape and reformat data from the Phish.net API into a more usable JSON format.

## Obtainage

`npm install skyskraper`

## Module Interface

#### bulkScrape(options, callback) → undefined

#### scrape(date, options, callback) → undefined

## CLI Interface

```
sskr method [options]

sskr scrape -d 2013-10-31 -k 123 -o ~/Desktop/halloween-2013.json
sskr bulkScrape --from 2010-06 --to 2012-09 -k 123 -o ~/Desktop/halloween-2013.json

-k, --apikey            API key to be passed to the pnet client for the Phish.net API
-d, --date              The date to be used for the `scrape` method
--from                  The `from` date passed to npmjs.org/package/show-finder, for use
                        with the `bulkScrape` method
-o, --output            Output to a file instead of STDOUT
--to                    The `to` date passed to npmjs.org/package/show-finder, for use
                        with the `bulkScrape` method

--help                  Display this message and exit
```

## LICENSE

[MIT](https://github.com/phriendlyinfo/skyskraper/blob/master/LICENSE.txt)
