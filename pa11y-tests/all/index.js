'use strict';

var async = require('async');
var pa11y = require('../..');
var fs = require('fs');

removeExistingReports()
var executionSeries
var executionSeriesCounter=0

var testAfterLogin = pa11y({
    beforeScript: function(page, options, next) {
        var waitUntil = function(condition, retries, waitOver) {
            page.evaluate(condition, function(error, result) {
                if (result || retries < 1) {
                    waitOver();
                } else {
                    retries -= 1;
                    setTimeout(function() {
                        waitUntil(condition, retries, waitOver);
                    }, 200);
                }
            });
            page.render('reports/' + executionSeries[executionSeriesCounter++] + '.png');
        };

        page.evaluate(function() {
            var title = document.querySelector('#manuscript-title');
            var abstract = document.querySelector('#manuscript-body');
            var suggestButton = document.querySelector('#suggest');

            title.value = 'Geology';
            abstract.value = 'Geology of rocks';

            suggestButton.click(document.get);

        }, function() {

            waitUntil(function() {
                return window.location.href === 'http://transfers-portal-dev.dev.cf.private.springer.com/';
            }, 20, next);
        });

        console.log("################### TRANSFERS PORTAL ACCESSIBILITY CONSOLEE")
        // screenCapture(document.URL,"postsubmit")

    },

    wait: 3000,
    log: {
        debug: console.log.bind(console),
        error: console.error.bind(console),
        info: console.log.bind(console)
    }
});

var testWithoutLogin = pa11y({

    wait: 3000,
    log: {
        debug: console.log.bind(console),
        error: console.error.bind(console),
        info: console.log.bind(console)
    }
});

var urls = {
    home: "http://transfers-portal-dev.dev.cf.private.springer.com/",
    resubmit: "http://transfers-portal-dev.dev.cf.private.springer.com/select-journal?journalId=10532"
};

executionSeries = ['home','resubmit']
async.series({
    home: testAfterLogin.run.bind(testAfterLogin, urls.home),
    resubmit: testWithoutLogin.run.bind(testWithoutLogin, urls.resubmit)
}, function (error, results) {
    if (error) {
        return console.error(error.message);
    }

    var htmlReporter = require('../../reporter/html');

    //Writes individual reports
    writeReportToHTML(htmlReporter.process(results.home, urls.home), "home");
    writeReportToHTML(htmlReporter.process(results.resubmit, urls.resubmit), "resubmit");
    
    //Writes to all report
    writeReportToHTML(htmlReporter.process(results.home, urls.home), "all");
    writeReportToHTML(htmlReporter.process(results.resubmit, urls.resubmit), "all");
});

function writeReportToHTML(htmlText, fileName) {

    if (!fs.existsSync("reports/")) {
        fs.mkdirSync("reports/");
    }

    fs.appendFile("reports/" + fileName + "_results.html", htmlText, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Results added to reports/" + fileName + ".html");
    });
}

function removeExistingReports() {

    var path = "reports/"
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}