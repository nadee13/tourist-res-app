$(document).ready(function(){
    var modaltext = $('.modal-body').text();
    var alerttext = $('.alert').text();
    var lat;
    var lon;

            var max_fields      = 9; //maximum input boxes allowed
            var wrapper         = $(".input_fields_wrap"); //Fields wrapper
            var add_button      = $(".add_location_button"); //Add button ID
            var flag = false;
            var x = 1; //initlal text box count
            $(add_button).off('click');
            $(add_button).click(function(e){ //on add input button click
                e.preventDefault();
                if(x < max_fields && !flag){ //max input box allowed
                    x++; //text box increment
                    $(wrapper).append('<div>Lat.: <input type="text" name="lat' + x + '" value="' + $('#us2-lat').val() +  '"/> Long.: <input type="text" name="long' + x + '" value="' + $('#us2-lon').val() +  '"/><a href="#" class="remove_field">Remove</a></div>'); //add input box
                }
            });

            $(wrapper).on("click",".remove_field", function(e){ //user click on remove text
                e.preventDefault(); $(this).parent('div').remove(); x--;
            })

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

        lat = $('#viewus2-lat').val();


    });

    $('.seat').click(function() {
        var number = $(this).text();
        var inputid = '#inputseat' + number;
        var inputvalue = $(inputid).val();
        if(inputvalue == ""){
          $(inputid).val("" + number + "");
          $(this).addClass('activated')
        }else{
          $(inputid).val("");
          $(this).removeClass('activated')
        }
      });

            $('#us2').locationpicker({
                enableAutocomplete: true,
                enableReverseGeocode: true,
                radius: 0,
                inputBinding: {
                    latitudeInput: $('#us2-lat'),
                    longitudeInput: $('#us2-lon'),
                    radiusInput: $('#us2-radius'),
                    locationNameInput: $('#us2-address')
                },
                onchanged: function (currentLocation, radius, isMarkerDropped) {
                    var addressComponents = $(this).locationpicker('map').location.addressComponents;
                    console.log(currentLocation);  //latlon  
                    updateControls(addressComponents); //Data
                }
            });
            
            
            function updateControls(addressComponents) {
                var lat = $('#us2-lat').val();
                console.log(addressComponents);
                console.log('Latitude' + lat);
            }   

            $('#viewus2').locationpicker({
                enableAutocomplete: false,
                enableReverseGeocode: false,
                radius: 0,
                inputBinding: {
                    latitudeInput: $('#viewus2-lat'),
                    longitudeInput: $('#viewus2-lon'),
                    radiusInput: $('#viewus2-radius'),
                    locationNameInput: ''
                },
                onchanged: function (currentLocation, radius, isMarkerDropped) {
                    var addressComponents = $(this).locationpicker('map').location.addressComponents;
                    console.log(currentLocation);  //latlon  
                    updateControls(addressComponents); //Data
                }
            });
            
            
            function updateControls(addressComponents) {
                var lat = $('#viewus2-lat').val();
                console.log(addressComponents);
                console.log('Latitude' + lat);
            }    

});
