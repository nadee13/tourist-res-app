$(document).ready(function(){
    $(function () {    
        $("#form-register").validate({
            // ...
            rules: {
                password: { 
                    required: true,
                    minlength: 5

                } , 

                confirmpassword: { 
                    equalTo: "#password"
                }

            },
            messages: {
                password: {
                    required: "Inserire una password",
                    minlength: "La password deve contenere almeno 5 caratteri"
                },
                confirmpassword: {
                    equalTo: "Le due password devono coincidere"
                }
            }

        });
    });
});