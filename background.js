var VERSION = "0.1";

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.action == "install"){
            install_notice();
            chrome.cookies.getAll({domain:"www.retailmenot.com",name:"wiz"},function(cookies){
                var wizcookie = cookies[0];
                if(wizcookie){
                    var u = decodeURIComponent(wizcookie.value);
                    chrome.tabs.update({url:u},function(tab){
                        console.log("running wiz after install");
                        runwizafterinstall();});
                    sendResponse({message: "Coupon Whiz installed"});
                }
            });
        }
        if (request.action == "run"){
            runwiz(sender.tab.id, request.url, request.codes);
            sendResponse({message:"Coupon Whiz running"});
        }
        if (request.action == "isinstalled"){
            localStorage.setItem('codes', JSON.stringify(request.codes));
            localStorage.setItem('url', JSON.stringify(request.url));
            var ins = localStorage.getItem('install_info') ? true : false;
            sendResponse({installed:ins});
        }
    });

var tabid = 0;
var ok2run = false;
function runwizafterinstall(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        tabid = tabs[0].id;
        ok2run = true;
    });
    console.log("Wiz running in background.js");
}

function runwiz(tabId, url, codes){
    console.log("sending trycodes action message to content script");
    //look for cart and id tab, if no cart found send "nocart" message
    //scrape all codes from current tab
    //try all codes in the cart, updating the content script each time

    chrome.tabs.query({ url:"http://www.forever21.com/CheckOut/*asket.aspx?*" },function(t){
        console.log(url);
        console.log(codes);
        console.log(t);
        if(t.length == 0){
            chrome.tabs.sendMessage(tabId, {action:"nocart"});
        }else{
            chrome.tabs.sendMessage(tabId, {action: "trycodes"});


            var tm = 0;
            codes = codes.slice(0,5);
            codes.forEach(function(c){
                setTimeout(function(){
                    var port = chrome.tabs.connect(t[0].id,{name:"coderunner"});
                    chrome.tabs.update(t[0].id, {selected: true});
                    port.postMessage({action:"trycartcodes", code:c});
                },tm);
                tm+=1500;
                setTimeout(function(){
                    var port = chrome.tabs.connect(t[0].id,{name:"coderunner"});
                    chrome.tabs.update(t[0].id, {selected: true});
                    port.postMessage({action:"removecode", code:c});
                },tm);
                tm+=1500;
            });
            setTimeout(function(){
                var port = chrome.tabs.connect(t[0].id,{name:"coderunner"});
                chrome.tabs.update(t[0].id, {selected: true});
                port.postMessage({action:"finalize1"});
            },tm);
            tm+=1500;
            setTimeout(function(){
                var port = chrome.tabs.connect(t[0].id,{name:"coderunner"});
                chrome.tabs.update(t[0].id, {selected: true});
                port.postMessage({action:"finalize2"});
            },tm);


        }
    });
}


chrome.tabs.onUpdated.addListener(function(tabId , info) {
    if (info.status == "complete" && tabId == tabid && ok2run === true) {
        console.log("Tab updated");
        console.log(localStorage.getItem('url'));
        console.log(localStorage.getItem('codes'));
        runwiz(tabId, localStorage.getItem('url'), JSON.parse(localStorage.getItem('codes')));
    }
});

function install_notice() {
    if (localStorage.getItem('install_info'))
        return;

    var now = new Date().getTime();
    var info = {version:VERSION,install_time:now};
    localStorage.setItem('install_info', JSON.stringify(info));
    //chrome.tabs.create({url: "index.htm"});
}
