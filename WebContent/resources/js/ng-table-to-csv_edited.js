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

    var uri = {excel: 'data:application/vnd.ms-excel;base64,', csv: 'data:application/csv;base64,'};
    var template = {
    	     tmplWorkbookXML : '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
    	    	      + '{worksheets}</Workbook>'
    	    	    , tmplWorksheetXML : '<Worksheet ss:Name="{nameWS}"><Table>{rows}</Table></Worksheet>'
    	    	    , tmplCellXML : '<Cell><Data ss:Type="{nameType}">{data}</Data></Cell>'
    	    	    	};

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

    var tableToHTML = function(table, sheetName) {
  
    var ctx = "";
    var worksheetsXML = "";
    var rowsXML = "";
    	
  	var headerForTasks =  '<Row>'  
			+'<Cell ss:MergeAcross="4"><Data ss:Type="String">Task Description</Data></Cell>'
			+'<Cell><Data ss:Type="String">Resource Name</Data></Cell>'
			+'<Cell><Data ss:Type="String">Effort</Data></Cell>'
			+'<Cell><Data ss:Type="String">Start Date</Data></Cell>'
			+'<Cell><Data ss:Type="String">End Date</Data></Cell>'
			+'</Row>';
    	
  		rowsXML += headerForTasks;
	  for(var j = 1; j < table.rows.length; j++){
		  
          /**********added the ignoreThisElement criteria************/
          if(table.rows[j].className.indexOf('ng-table-filters' || 'ignoreThisElement') !== -1) {
				continue;
          }
		  
          rowsXML += '<Row>';
		  for (var k = 1; k < table.rows[j].cells.length; k++) {
            var dataType = table.rows[j].cells[k].getAttribute("data-type");
            var dataValue = "";
            if(table.rows[j].cells[k].getElementsByTagName("input").length === 1){
        		dataValue = table.rows[j].cells[k].getElementsByTagName("input")[0].value.trim();
        	}else if(table.rows[j].cells[k].getElementsByTagName("select").length === 1){
        		dataValue = table.rows[j].cells[k].getElementsByTagName("select")[0].value.trim();
        	}else{
        		dataValue = table.rows[j].cells[k].textContent.trim();
        	}
        	
            ctx = { 
                   nameType: (dataType=='Number' || dataType=='DateTime' || dataType=='Boolean' || dataType=='Error') ? dataType:'String',
                		   data: dataValue
                  };
            rowsXML += format(template.tmplCellXML, ctx);
          }          
		  rowsXML += '</Row>';
  	  }
	    ctx = {rows: rowsXML, nameWS: sheetName || 'Sheet1'};
        worksheetsXML += format(template.tmplWorksheetXML, ctx);
        return worksheetsXML;
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

    var convertResourceDetailsToHTML = function(resourceData, sheetName) {

    	var worksheetsXML = "";
    	//Remove "[{ ** }]" from the data :
    	var tmp = resourceData.value.replace(/\[\{(.*)\}\]/gi, '$1');
    	//Get the array of diff resources, split at "},{"
    	if(tmp !== ""){
    		tmp = tmp.split("},{");
    		//Get the attributes of individual elements of array
    		var arr = [];
    		for(var i = 0; i< tmp.length; i++){
    			var obj = [];
    			//get the attributes of each object
    			var attr = tmp[i].split(",");
    			for(var j=0; j<attr.length; j++){
    				obj.push(attr[j].split(":")[1]);
    			}
    			arr.push(obj);
    		}
    		var ctx = "";
    		var rowsXML = "";
    		
    		var headerForResources = '<Row>'  
    			+'<Cell><Data ss:Type="String">Resource Name</Data></Cell>'
    			+'<Cell><Data ss:Type="String">Joining Date</Data></Cell>'
    			+'<Cell><Data ss:Type="String">Holiday List</Data></Cell>'
    			+'</Row>';	
    		
    		rowsXML += headerForResources;
    		angular.forEach(arr, function(obj, index){
    			rowsXML += '<Row>';    
    			angular.forEach(obj, function(x,i){
    				var dataType = '';
    				var dataValue = x;
    				ctx = { 
    						nameType: (dataType=='Number' || dataType=='DateTime' || dataType=='Boolean' || dataType=='Error') ? dataType:'String',
    								data: dataValue
    				};
    				rowsXML += format(template.tmplCellXML, ctx);
    			});
    			rowsXML += '</Row>';
    		});
    		ctx = {rows: rowsXML, nameWS: sheetName || 'Sheet2'};
    		worksheetsXML += format(template.tmplWorksheetXML, ctx);
    	}
            return worksheetsXML; 	
    	
    };

    var ee = {
        /** @export */
        excel: function(anchor, table1, name1, table2, name2) {

            var worksheetsXML = "";
        	
            //getting resource allocation details.
            worksheetsXML += tableToHTML(get(table1), name1);

            worksheetsXML += convertResourceDetailsToHTML(get(table2), name2);
            
            var ctx = {worksheets: worksheetsXML};
            var b64 = base64(format(template.tmplWorkbookXML, ctx));
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

