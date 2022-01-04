window.util = {};

util.appendJQuery = function() {
    const script=document.createElement("script");
    script.type="text/javascript";
    script.src="https://code.jquery.com/jquery-1.12.4.min.js";
    script.onload = function() {
        let imgShow = localStorage.getItem("imgShow");

        pageTitle = $('html title').text().trim().replace(/[ ]|[\r\n]|-/g,"");

        if(imgShow) {
            $('img').css('display', 'block');
            $('iframe').css('display', 'block');
            $('.vjs-poster').css({ 'display': 'block' });
            $('video').css({ 'visibility': 'initial' });
            $('#webview-img-show').css({ 'display': 'block' });
        } else {
            $('img').css('display', 'none');
            $('iframe').css('display', 'none');
            $('.vjs-poster').css({ 'display': 'none' });
            $('video').css({ 'visibility': 'hidden' });
            $('#webview-img-show').css({ 'display': 'none' });
        }
    };
    $('head').append(script);
}
