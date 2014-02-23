// expose result so we can access it in console
var result = null;

$(function () {
  var BACKEND_URL = '';

  function padZeros(num, len) {
    var s = parseInt(num)+'';
    while (s.length < len) s = '0' + s;
    return s;
  }

  function onSubmit(code) {
    $.get(
      BACKEND_URL + '/hkstock-holdings/' + code,
      function( data ) {
        console.log('data ready');
        result = data;
        initData();
        initTable();
        initChart();
      });
  }

  function initData() {
    // format period
    var regex = /(\d+)-(\d+)-(\d+)/;
    result.period = result.period.map(function (date) {
      var match = date.match(regex);
      return '' + match[3] + '/' + match[2];
    });

    // assign cluster, id and some statistic fields
    var clusters = kmeans(_.pluck(result.series, 'sharesAvg'), 5) ;
    _.forEach(result.series, function (record, index) {
      record.cluster = clusters.assignment[index];
      record.id = String(index);
      record.sharesRatio = (record.sharesSD / record.sharesAvg).toFixed(2);
      record.volumeRatio = (record.volume / record.sharesAvg).toFixed(2);
    });

    result.series = _.sortBy(result.series, function (record) {
      return -record.volume;
    });
  }

  function initTable() {
    var $tbody = $('#participant-list tbody');
    // detach tbody from DOM
    var $stub = $('<div/>', { 'id': 'op-stub' });
    $tbody.after($stub).detach();

    _(result.series).map(function (record) {
      $tbody.append(
        "<tr cluster=\"" + record.cluster + "\">" +
          "<td><input type=\"checkbox\" value=\"" + record.id + "\"></td>" +
          "<td>" + record.name + "</td>" +
          "<td>" + record.sharesAvg + "</td>" +
          "<td>" + record.sharesRatio + "</td>" +
          "<td>" + record.volume + "</td>" +
          "<td>" + record.volumeRatio + "</td>" +
          "<td>" + record.volBuy + "</td>" +
          "<td>" + record.volSell + "</td>" +
        "</tr>");
    });
    //  re-attach $tbody to DOM
    $stub.after($tbody).detach();
    $('#participant-list').show();

    // install selection handler
    $('#participant-list').delegate('input:checkbox', 'click', function(event) {
      var chart = $('#container').highcharts();
      var id = $(this).val();
      if (this.checked) {
        var record = _.find(result.series, { id : id });
        if (!record) {
          return;
        }

        chart.addSeries({
          name: record.name,
          data: record.shares,
          id: record.id
        });
      } else {
        var series = chart.get(id);
        if (series){
          series.remove();
        }
      }
    });
  }

  function initChart() {
    // refer to Highcharts API for this dynamic behavior:
    // http://api.highcharts.com/highcharts

    $('#container').highcharts({
      title: {
        text: result.code + ' - ' + result.name,
        x: -20 //center
      },
      subtitle: {
        text: 'Source: HKExnews.hk',
        x: -20
      },
      xAxis: {
        categories: result.period
      },
      yAxis: {
        title: {
          text: 'Holdings'
        },
        plotLines: [{
          value: 0,
          width: 1,
          color: '#808080'
        }]
      },
      tooltip: {
        valueSuffix: ''
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'middle',
        borderWidth: 0
      },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: false
          }
        }
      },
      series: []
    });
  }

  $('#submit').click(function(event) {
    var code = $('#stock-code').val();
    event.preventDefault();

    if (!code) return;
    code = padZeros(code, 5);
    $('#stock-code').val(code);
    onSubmit(code);
  });

  $('#reset').click(function(event) {
    $('#stock-code').val('');
  });

});
