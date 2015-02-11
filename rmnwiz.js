var wizTemplate = '<div class="wiz offer" style="background-color:#E6F4F9; border:1px solid #000">'
                    + '<div class="offer-top clearfix" >'
                    + '<div class="anchor"><img style="width:110px;" src="http://www.mycyberwizard.com/images/cyberWizard.png"/></div>'
                    + '<div class="info"><h3 class="title h1 js-title">'
                    + 'Already at checkout? Try all the codes with the Coupon Wizard!</h3>'
                    + '<p class="additional-info">'
                    + 'The Wiz will try every code on this page '
                    + 'to maximize your savings'
                    + '</p></div>'
                    + '<div class="actions"><button class="wiz smokey-button">Try \'em All</button></div>'
                + '</div></div>';

$("div.popular").prepend(wizTemplate);
$("button.wiz").click(function(){
    $.cookie("wiz",window.location.href);
    var codes = $(".code .code-text").map(function(){ return $(this).text();}).get();
    var url = "http://www.forever21.com/CheckOut/*asket.aspx?*"; //hard code for POC
    chrome.runtime.sendMessage({action: "isinstalled", codes:codes, url:url},function(response){
        if(response.installed){


            chrome.runtime.sendMessage(
                {action:"run",url:url,codes:codes},
                function(response){
                    console.log(response);
                    $(".wiz .additional-info").html(response.html);
                }
            );
        }else{
            window.location.href ="http://www.retailmenot.local/whiz.htm";
        }
    });

});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.action == "trycodes"){
            console.log("got trycodes message");
            $(".wiz h3").html("Trying Codes");
            $(".code-cover").hide();$('body').addClass("ctc");
            $(".wiz button").hide();
        }
});

chrome.runtime.onConnect.addListener(function(port){
   console.log(port);
   port.onMessage.addListener(function(msg){
       console.log(msg);
       if(msg.action == "removecode"){
           var res = results.get();
           var currTotalStr = $(".summary_subtotal").text();
           var currTotal = currTotalStr.substr(currTotalStr.indexOf("$")+1);
           var lowest = res.lowest || 99999;
           if (currTotal < lowest){
               res.lowest = currTotal;
               res.code = res.lastCode || msg.code;
               results.save(res);
           }
           $("#promodcode_remove").find(".btn_small").click();
       }
       if(msg.action == "trycartcodes"){
           var res = results.get();
           console.log(currTotal);
           $(".PromoCode").css("display","block");
           $("#ctl00_MainContent_promo_value").val(msg.code);
           res.lastCode = msg.code;
           results.save(res);
           $("#ctl00_MainContent_imgDiscount").click();
       }

       if(msg.action == "finalize1"){
           var res = results.get();
           $("#ctl00_MainContent_promo_value").val(res.code);
           $("#ctl00_MainContent_imgDiscount").click();
       }
       if(msg.action == "finalize2"){
           var res = results.get();
           alert("You pay $" + res.lowest + " with the best discount.  Already applied!  Thanks for using RetailMeNot!" );
           results.save({});
       }
   })
});


var results = {
    _key:'wizresult',
    get:function(){
        return JSON.parse(localStorage.getItem(this._key)) || {};
    },
    save:function(obj){
        localStorage.setItem(this._key, JSON.stringify(obj));
    }
}







