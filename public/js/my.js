$(document).ready(function(){
    var modaltext = $('.modal-body').text();
    var alerttext = $('.alert').text();

    console.log('alerttext: ' + alerttext);

    function showmodal (){
        if (modaltext){
            $('#myModal').show(0).delay(2000).hide(0);
        }
    }

    $(function () {
        $("#datepicker").datepicker({
          dateFormat: 'yy-mm-dd',
            changeMonth: true,
            changeYear: true,
            yearRange: '1900:2018'
        });

        $("#packagedatepicker").datepicker({
            dateFormat: 'yy-mm-dd',
              changeMonth: true,
              changeYear: false
          });

        $('.accounttable').DataTable();

        showmodal();
    });
     
});