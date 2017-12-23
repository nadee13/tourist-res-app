$(document).ready(function(){
    var modaltext = $('.modal-body').text();
    var alerttext = $('.alert').text();

    console.log('modaltext: ' + modaltext);

    function showmodal (){
        if (modaltext){
            $('#myModal').show(0).delay(5000).hide(0);
        }
    }

    $(function () {
        $("#datepicker").datepicker({
          dateFormat: 'yy-mm-dd',
            changeMonth: true,
            changeYear: true,
            yearRange: '1900:2018'
        });
        $('.accounttable').DataTable();

        showmodal();
    });
     
});