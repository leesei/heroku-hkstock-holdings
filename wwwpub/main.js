// expose result so it can be accessed in console
var result = null;

$(document).ready(function () {
  var BACKEND_URL = '';

  function padZeros(num, len) {
    var s = parseInt(num)+'';
    while (s.length < len) s = '0' + s;
    return s;
  }

  function onSubmit(code) {
    // TODO: show loading
    $.get(
      BACKEND_URL + '/hkstock-holdings/' + code,
      {
        period: {
          days: $('#panel-stock-options input[name="period"]:checked').val()
        }
      },
      function( data ) {
        console.log('data ready');
        $('#panel-chart-options').toggleClass('hidden');
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

    // use sorting in DataTable
    // result.series = _.sortBy(result.series, function (record) {
    //   return -record.volume;
    // });
  }

  function initTable() {
    var $tbody = $('#participant-list');
    // detach tbody from DOM
    var $stub = $('<div/>', { 'id': 'op-stub' });
    $tbody.after($stub).detach();

    _(result.series).map(function (record) {
      $tbody.append(
        "<tr series-index="+ record.id + " cluster=\"" + record.cluster + "\">" +
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
    // convert it to DataTable
    $('#participant-list').parent().dataTable({
      "aaSorting": [ [ 4, "desc" ] ],
      "aoColumnDefs": [
        { "sSortDataType": "dom-checkbox", "aTargets": [ 0 ] }
      ],
      // these cause thead to detach from tbody
      // "sScrollY": "350px",
      // "bScrollCollapse": true,
      "sDom": "lift",
      "bPaginate": false
    });
    // $('#participant-list').dataTable( {
    //     "aaData": _.map(result.series, function (record) {
    //                 return [
    //                     record.id,
    //                     record.name,
    //                     record.sharesAvg,
    //                     record.sharesRatio,
    //                     record.volume,
    //                     record.volumeRatio,
    //                     record.volBuy,
    //                     record.volSell
    //                   ];
    //               })
    // } );
    $('#table-container').show();

    // install handlers
    $('#participant-list').on('click', 'tr', function (event) {
      // console.log('click row');
      // console.log(event);
      if ( !$(event.target).is('input:checkbox') ) {
        // click the checkbox in this row
        $(this).find('input:checkbox').click();
      }
    });

    $('#participant-list').on('click', 'input:checkbox', function (event) {
      // console.log('click checkbox');
      // console.log(event);
      var chart = $('#chart').highcharts();
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

    $('#chart').highcharts({
      chart: {
        type: 'line',
        showAxes: true,
        zoomType: 'x',
        spacingRight: 20
      },
      title: {
        text: result.code + ' - ' + result.name,
        x: -20 //center
      },

      subtitle: {
        text: 'Source: HKExnews.hk',
        floating: true,
        align: 'right',
        verticalAlign: 'bottom',
        y: 15
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
        tooltip: {
            formatter: function() {
                return '<b>'+ this.series.name +'</b><br/>'+
                    this.point.y +' '+ this.point.name.toLowerCase();
            }
        }
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
      credits: {
        enabled: false
      },
      series: []
    });
  }

  $('#submit').click(function (event) {
    var code = $('#stock-code').val();
    event.preventDefault();

    if (!code) return;
    code = padZeros(code, 5);
    $('#stock-code').val(code);
    $('#panel-stock-options input').prop('disabled', true);
    onSubmit(code);
  });

  $('#select-none').click(function (event) {
    event.preventDefault();
    // console.log($('#participant-list input:checked'));
    $('#participant-list input:checked').click();
  });

  $('#stock-code').focus();

  // debug
  if (0) {
    $.get(
      BACKEND_URL + '/hkstock-holdings/local/00001?period[days]=14',
      function( data ) {
        result = data;
        $('#panel-chart-options').toggleClass('hidden');
        initData();
        initTable();
        initChart();
      });
  }
  // debug
});
