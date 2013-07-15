#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var sys = require('util'),
    rest = require('restler');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var checkHtmlFile = function(htmlfile, checksfile, readFrom) {
	if (readFrom === 'URL') {
		var dom;
		rest.get(htmlfile).on('complete', function(result) {
			if (result instanceof Error) {
				sys.puts('Error: ' + result.message);
				process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
			} else {
				dom = cheerio.load(result);
				asyncCallback(checksfile, result);
			}
		});
	} else {
		fs.readFile(htmlfile, function (err, content) {
			if (err) throw err;
			asyncCallback(checksfile, content);
		});
	}
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var asyncCallback = function(checksfile, data)	{
	$ = cheerio.load(data);
	var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    processRawOutput(out);
}

var processRawOutput = function(rawOutput)	{
	var outJson = JSON.stringify(rawOutput, null, 4);
    console.log(outJson);
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
		.option('-u, --url <html_url>', 'URL to index.html')
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .parse(process.argv);
	if (program.url && (program.file !== HTMLFILE_DEFAULT)) {
		console.log('You may either read from a file or an url but not both.');
	} else if (program.url) {
		checkHtmlFile(program.url, program.checks, 'URL');
	} else if (program.file) {
		checkHtmlFile(program.file, program.checks, 'LOCAL_FILE');
	}
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
