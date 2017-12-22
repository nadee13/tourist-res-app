$(document).ready(function(){
    $(function () {
        $("#datepicker").datepicker({
          dateFormat: 'yy-mm-dd',
            changeMonth: true,
            changeYear: true,
            yearRange: '1900:2018'
        });

        $('.accounttable').DataTable();
    });
     
});