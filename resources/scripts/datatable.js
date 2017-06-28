var columnNamesArray = [];
var fieldsArray = [];
var columnDataArray = [];
var columnIndexMap = new Map();
var table;
var globalData = {} ;

function success(json) {
	console.log( json );
}
function error(xhr, error, thrown) {
	console.log( xhr + error + thrown );
}

function escapeRegExp(str) {
	return str.replace(/[\"\'\\]/g, "\\jQuery&");
}

function drawDataTable(tableJson) {
    table = jQuery('#displayTable').DataTable({
        "iDisplayLength": 10,
        "aLengthMenu": tableJson.aLengthMenu,
        dom: "BlrtipZ",
        "colResize": {
            "tableWidthFixed": false
        },
        searching: true,
        scrollY:        "300px",
        scrollX:        true,
        scrollCollapse: true,
        pagingType: "full_numbers",
        fixedColumns:   {leftColumns: tableJson.fixedColumn},
        processing: true,
        //serverSide: true,
        bAutoWidth: false,
        ajax: {
            url: 'resources/dynamic/gridData.json',
            contentType: "application/json",
            dataSrc: 'reportData',
            type: "GET",
            beforeSend: function (request)
            {
            // request.setRequestHeader('Authorization', "Bearer " + accessToken);
            request.setRequestHeader('Accept', "application/json");
            request.setRequestHeader('Access-Control-Allow-Origin', '*');
            request.setRequestHeader('Access-Control-Allow-Methods', 'GET');
            },
            data: function(d){
                var jsonData = JSON.stringify(d);
                var obj = jQuery.parseJSON(jsonData );
                var filter="";
                jQuery.each(obj.columns, function( index, value ) {
                    if(value.data !== null && value.search.value.trim() !== ""){
                        var va = escapeRegExp(value.search.value.trim());
                        filter += ",\""+value.data+"\": \""+va+"\"";

                    }
                });
                return globalData.filters;
            },
            dataFilter: function (data) {
                var jsonData = jQuery.parseJSON(data);
                jsonData.recordsTotal = jsonData.recordsTotal;
                jsonData.recordsFiltered = jsonData.recordsFiltered;  //change the name per your service
                jsonData.data = jsonData.reportData;
                return JSON.stringify(jsonData); // return JSON string
            }
        },
        initComplete: function( settings, json ) {
            jQuery.each(tableJson.fieldGroup, function(index, val){
                if(val.hide){
                    table.column(columnIndexMap.get(val.id).index).visible( false );
                }
            });
            jQuery("#filter").show();

        },
        columns:columnDataArray,
        select: {
            // style: 'multi',
            style:    'os',
            selector: 'td:first-child'
        },
        buttons: [
            {
                text: 'Add Remove Columns',
                extend: 'colvis',
                columns: ':gt(1)'
            },
            {
                text: 'Show All Columns',
                action: function ( e, dt, node, config ) {
                    table.columns().visible(true);
                }
            },
            {
                text: 'Clear Filters',
                action: function ( e, dt, node, config ) {
                    jQuery("#filter th input").val("");
                    table.search( '' )
                        .columns().search( '' )
                        .draw();

                }
            }
        ],
        order: [[1, 'asc']],
        fade:true,
        columnDefs: [
            {
                targets: columnIndexMap.get('Id').index,
                width: "10px",
                searchable:false,
                orderable:false,
                className: 'select-checkbox',
                render: function (data, type, full, meta){
                    return '';
                }
            }
        ]
    });

    return table;
}

jQuery(document).ready(function() {

    jQuery.ajax({
		url: "resources/dynamic/gridMeta.json",
		type: "GET",
		async: false,
		dataType: "json",
		beforeSend: function (request)
		{
		  // request.setRequestHeader('Authorization', "Bearer " + accessToken);
		  request.setRequestHeader('Accept', "application/json");
		  request.setRequestHeader('Access-Control-Allow-Origin', '*');
		  request.setRequestHeader('Access-Control-Allow-Methods', 'GET');
		},
        context: document.body,
        success: function(tableJson) {
            var tableHeaders = '';
            jQuery.each(tableJson.fieldGroup, function(index, columnMeta){
                var cdEntry = {};

                columnNamesArray.push(columnMeta.id);
                columnMeta.index = index;
                columnIndexMap.set(columnMeta.id, columnMeta);

                if (index > 0) {
                    var cnEntry = {};
                    cnEntry.label = columnMeta.title;
                    cnEntry.name = columnMeta.id;
                    cnEntry.type = columnMeta.type;
                    cnEntry.options = columnMeta.options;
                    fieldsArray.push(cnEntry);

                    cdEntry.data = columnMeta.id;
                    cdEntry.title = columnMeta.id;
                    columnDataArray.push(cdEntry);
                    tableHeaders += "<th>" + columnMeta.id + "</th>";
                } else {
                    cdEntry.data = columnMeta.id;
                    cdEntry.defaultContent = '';
                    cdEntry.width = 0;
                    columnDataArray.push(cdEntry);
                    tableHeaders += "<th></th>";
                }

            });

            jQuery("#WorkbenchGrid").empty();
            jQuery("#WorkbenchGrid").append('<table id="displayTable" class="display" cellspacing="0" width="100%"><thead><tr id="filter" style="display: none;">' + tableHeaders + '</tr><tr id="sort">' + tableHeaders + '</tr></thead></table>');

            drawDataTable(tableJson);
        }
	});

    jQuery("#filter th").each( function () {
		if (this.cellIndex > 0) {
			var title = jQuery(this).text();
            jQuery(this).html('<input type="text" placeholder="Search '+title+'" />');
		}
    });

    // jQuery('.dataTables_scrollHeadInner thead, .DTFC_LeftHeadWrapper thead').append(jQuery("#filter"));

    jQuery(table.table().container()).on( 'keyup', '#filter input', function () {
        table
            .column( jQuery(this).parent().index()+':visible' )
            .search( this.value )
            .draw();
    });

    table.on( 'select', function ( e, dt, type, indexes ) {
		if ( type === 'row' ) {
			table.buttons( ['.rowEdit'] ).enable( true );
			table.columns().deselect();
		}
	});

	// table.on( 'xhr', function () {
	// 	var data = table.ajax.json();
	// 	console.log(data);
	// });

});

function openLink(event, url)
{
    window.open(url);
    event.preventDefault();
    event.stopPropagation();
}
