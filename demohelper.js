$(function(){
    $("#install").click(function(){$(this).fadeOut(
        function(){
            setTimeout(function(){
                chrome.runtime.sendMessage({action: "install"}, function(response) {
                    console.log(response.message);
                });
            }, 1000)
        }
    );});
});
