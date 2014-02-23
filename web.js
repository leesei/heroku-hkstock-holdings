var express = require('express');
var fs = require('fs');
var app = express();

var HkStockHoldings = require('hkstock-holdings');

app.enable('strict routing');
app.enable('case sensitive routing');
app.disable('x-powered-by');

app.use(express.logger());
app.use(express.compress());

// pad num to string representation of length len
function padZeros(num, len) {
  var s = parseInt(num)+'';
  while (s.length < len) s = '0' + s;
  return s;
}

app.get('/hkstock-holdings/:code', function(req, res){
  var today = new Date();
  today.setHours(0, 0, 0);

  var opts = {};
  opts.code = padZeros(req.params.code, 5);
  opts.timePeriod = {
    startDate: today.getPrevDay(29),
    endDate: today
  };
  console.log(opts);

  HkStockHoldings(opts, function (err, results) {
    if (err) {
      return res.json(500, { message: 'scrape error' });
    }

    // DEBUG: dump result
    // var f = fs.openSync(results.code+'.json', 'w');
    // fs.writeSync(f, JSON.stringify(results, null, 2));

    res.json(results);
  });
});

app.get('/hkstock-holdings/local/:code', function(req, res){
  console.log('requesting: ', req.params);
  fs.readFile(
    padZeros(req.params.code, 5) + '.json',
    function (err, data) {
      if (err) {
        return res.json(500, { message: 'file not found' });
      }

      data = JSON.parse(data);
      delete data.datePairs;
      delete data.flattened;
      res.json(data);
    });
});

app.use(express.static(__dirname + '/wwwpub'));
var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
