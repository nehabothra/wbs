/**
 * ngTableExcelExport 1.0.0
 * JavaScript export to Excel or CSV from HTML tables automatically in the browser and also compatible with all browsers.
 *
 * @author: Murugavel Ramachandran (blsrm@yahoo.com)
 * @url: https://github.com/blsrm/ngTableExcelExport
 *
 */
/*jslint browser: true, bitwise: true, vars: true, white: true */
/*global define, exports, module */

(function (global) {
    'use strict';

var ngTableExcelExport = (function() {

    function b64toBlob(b64Data, contentType, sliceSize) {
        // function taken from http://stackoverflow.com/a/16245768/2591950
        // author Jeremy Banks http://stackoverflow.com/users/1114/jeremy-banks
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = window.atob(b64Data);
        var byteArrays = [];

        var offset;
        for (offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            var i;
            for (i = 0; i < slice.length; i = i + 1) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new window.Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new window.Blob(byteArrays, {
            type: contentType
        });
        return blob;
    }

    var version = "1.5.0";
    var uri = {excel: 'data:application/vnd.ms-excel;base64,', csv: 'data:application/csv;base64,'};
    var template = {excel: '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta name=ProgId content=Excel.Sheet> <meta name=Generator content="Microsoft Excel 11"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">{table}</table></body></html>'};

    var csvDelimiter = ",";
    var csvNewLine = "\r\n";
    var base64 = function(s) {
        return window.btoa(window.unescape(encodeURIComponent(s)));
    };
    var format = function(s, c) {
        return s.replace(new RegExp("{(\\w+)}", "g"), function(m, p) {
            return c[p];
        });
    };

    var get = function(element) {
        if (!element.nodeType) {
            return document.getElementById(element);
        }
        return element;
    };

    var fixCSVField = function(value) {
        var fixedValue = value;
        var addQuotes = (value.indexOf(csvDelimiter) !== -1) || (value.indexOf('\r') !== -1) || (value.indexOf('\n') !== -1);
        var replaceDoubleQuotes = (value.indexOf('"') !== -1);

        if (replaceDoubleQuotes) {
            fixedValue = fixedValue.replace(/"/g, '""');
        }
        if (addQuotes || replaceDoubleQuotes) {
            fixedValue = '"' + fixedValue + '"';
        }

        return fixedValue;
    };

    var tableToCSV = function(table) {
        var data = "SEP="+csvDelimiter+csvNewLine;
        var i, j, row, col;
        var columnStart = 0;
        for (i = 0; i < table.rows.length; i=i+1) {
            row = table.rows[i];
            var rowData = '';
            
            //Checking ng table style for filters
            if(row.className.indexOf('ng-table-filters') !== -1) {
				continue;
            }
            
            //remove first column having check box in angular JS, in future will provide option from UI to control
            if(table.rows[0].cells[0].textContent.trim() === '') {
            	columnStart = 1;
            }else {
            	columnStart = 0;
            }

            for (j = columnStart; j < row.cells.length; j=j+1) {
                col = row.cells[j];
                rowData = rowData + fixCSVField(col.textContent.trim()) + (j ? csvDelimiter : ' ');
            }
            rowData = rowData.slice(0, rowData.length - 1); //remove last semicolon
            data += rowData + csvNewLine;
        }
        return data;
    };

    var tableToHTML = function(table) {
        var data = "";
        var i, j, row, col;
        var columnStart = 0;
        for (i = 0; i < table.rows.length; i=i+1) {
            row = table.rows[i];
            var rowData = '';
            
            //Checking ng table style for filters
            /**********added the ignoreThisElement criteria************/
            if(row.className.indexOf('ng-table-filters' || 'ignoreThisElement') !== -1) {
				continue;
            }
            
            //remove first column having check box in angular JS, in future will provide option from UI to control
            if(table.rows[0].cells[0].textContent.trim() === '') {
            	columnStart = 1;
            }else {
            	columnStart = 0;
            }

            for (j = columnStart; j < row.cells.length; j=j+1) {
                col = row.cells[j];
                if(col.className.indexOf('ignoreThisElement') !== -1){
                	continue;
                }
                if (i === 0) {
                	//Consider the attribute 'colspan'
                	var colspan = col.getAttribute("colspan");
                	if(colspan !== undefined && colspan !== null){
                		rowData += '<th colspan="' + colspan + '">' + col.textContent.trim() + '</th>';
                	}else{
                	rowData += '<th>' + col.textContent.trim() + '</th>';
                	}
                } else {
                	/********************added for other elements like input, select, list elements**********************/
                	if(col.getElementsByTagName("input").length === 1){
                		rowData += '<td>' + col.getElementsByTagName("input")[0].value.trim() + '</td>';
                	}else if(col.getElementsByTagName("select").length === 1){
                		rowData += '<td>' + col.getElementsByTagName("select")[0].value.trim() + '</td>';
                	}else if(col.getElementsByTagName("ul").length === 1){
                		rowData += '<td>' + col.getElementsByTagName("ul")[0].innerText.trim().split(" ").join() + '</td>';
                	}else{
                		rowData += '<td>' + col.textContent.trim() + '</td>';
                	}
                }
            }
            data += '<tr>' + rowData + '</tr>';
        }
        return data;
    };

    function createDownloadLink(anchor, base64data, exporttype, filename) {
        var blob;
        if (window.navigator.msSaveBlob) {
            blob = b64toBlob(base64data, exporttype);
            window.navigator.msSaveBlob(blob, filename);
            return false;
        } else if(window.URL.createObjectURL) {
            blob = b64toBlob(base64data, exporttype);
            var blobUrl = window.URL.createObjectURL(blob, exporttype, filename);
            anchor.href = blobUrl;
        } else {
            var hrefvalue = "data:" + exporttype + ";base64," + base64data;
            anchor.download = filename;
            anchor.href = hrefvalue;
        }

        // Return true to allow the link to work
        return true;
    }

    var ee = {
        /** @export */
        excel: function(anchor, table, name) {
            table = get(table);

            var htmlTableData = tableToHTML(table);
            
            var ctx = {worksheet: name || 'Worksheet1', table: htmlTableData};
            var b64 = base64(format(template.excel, ctx));
            return createDownloadLink(anchor, b64, 'application/vnd.ms-excel','wbs.xls');
        },
        /** @export */
        csv: function(anchor, table, name, delimiter, newLine) {
            if (delimiter !== undefined && delimiter) {
                csvDelimiter = delimiter;
            }
            if (newLine !== undefined && newLine) {
                csvNewLine = newLine;
            }

            table = get(table);
            var csvData = tableToCSV(table);
            var b64 = base64(csvData);
            return createDownloadLink(anchor,b64,'application/csv',name+'.csv');
        }
    };

    return ee;
}());

    // AMD support
    if (typeof define === 'function' && define.amd) {
        define(function () { return ngTableExcelExport; });
    // CommonJS and Node.js module support.
    } else if (typeof exports !== 'undefined') {
        // Support Node.js specific `module.exports` (which can be a function)
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = ngTableExcelExport;
        }
        // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
        exports.ngTableExcelExport = ngTableExcelExport;
    } else {
        global.ngTableExcelExport = ngTableExcelExport;
    }
})(this);

